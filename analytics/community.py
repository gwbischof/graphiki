"""
Community detection pipeline for Memgraph.

Runs Louvain community detection, creates Community nodes with hierarchy,
and stores results back in Memgraph.

Usage:
    python community.py [--uri bolt://localhost:7687] [--levels 2] [--resolution 1.0]
"""

import argparse
import json
import sys
import time
from collections import Counter

from neo4j import GraphDatabase


def get_driver(uri: str) -> GraphDatabase:
    return GraphDatabase.driver(uri, auth=("", ""))


def clear_communities(driver):
    """Remove existing community data."""
    with driver.session() as session:
        session.run("MATCH (c:Community) DETACH DELETE c")
        session.run("MATCH (n) REMOVE n.community_id, n.community_level_0, n.community_level_1")
    print("Cleared existing community data.")


def run_louvain_mage(driver):
    """Run MAGE Louvain community detection inside Memgraph."""
    with driver.session() as session:
        # Try MAGE Louvain first
        try:
            result = session.run("""
                CALL community_detection.louvain()
                YIELD node, community_id
                SET node.community_level_0 = community_id
                RETURN count(node) as assigned
            """)
            record = result.single()
            count = record["assigned"]
            print(f"MAGE Louvain assigned {count} nodes to communities.")
            return True
        except Exception as e:
            print(f"MAGE Louvain not available: {e}")
            return False


def run_louvain_igraph(driver):
    """Fallback: export graph to igraph, run Louvain, write back."""
    import igraph as ig

    print("Falling back to python-igraph Louvain...")

    with driver.session() as session:
        # Export nodes
        node_result = session.run("MATCH (n) RETURN n.id AS id")
        node_ids = [r["id"] for r in node_result]
        id_to_idx = {nid: i for i, nid in enumerate(node_ids)}

        # Export edges
        edge_result = session.run(
            "MATCH (a)-[r]->(b) RETURN a.id AS source, b.id AS target"
        )
        edges = []
        for r in edge_result:
            src = id_to_idx.get(r["source"])
            tgt = id_to_idx.get(r["target"])
            if src is not None and tgt is not None:
                edges.append((src, tgt))

    print(f"Exported {len(node_ids)} nodes, {len(edges)} edges to igraph.")

    # Build igraph graph
    g = ig.Graph(n=len(node_ids), edges=edges, directed=True)
    g.vs["node_id"] = node_ids

    # Run Louvain (on undirected version)
    g_undirected = g.as_undirected()
    partition = g_undirected.community_multilevel()

    # Write back
    membership = partition.membership
    with driver.session() as session:
        for idx, comm_id in enumerate(membership):
            session.run(
                "MATCH (n {id: $id}) SET n.community_level_0 = $comm",
                {"id": node_ids[idx], "comm": comm_id},
            )

    num_communities = len(set(membership))
    print(f"igraph Louvain: {num_communities} communities, {len(node_ids)} nodes assigned.")
    return True


def create_community_nodes(driver, level: int = 0):
    """Create (:Community) nodes from community assignments."""
    with driver.session() as session:
        # Get community stats
        result = session.run(f"""
            MATCH (n) WHERE n.community_level_{level} IS NOT NULL
            WITH n.community_level_{level} AS comm_id, collect(n) AS members
            RETURN comm_id, size(members) AS member_count, members
        """)

        communities = []
        for record in result:
            comm_id = record["comm_id"]
            member_count = record["member_count"]
            members = record["members"]

            # Compute type distribution
            type_dist = Counter()
            top_nodes = []
            for m in members:
                props = dict(m)
                type_dist[props.get("node_type", "Unknown")] += 1
                top_nodes.append({
                    "id": props.get("id", ""),
                    "label": props.get("label", props.get("name", "")),
                    "doc_count": props.get("doc_count", 0),
                })

            # Sort by doc_count for top nodes
            top_nodes.sort(key=lambda x: x.get("doc_count", 0), reverse=True)
            top_nodes = top_nodes[:5]

            communities.append({
                "id": f"community_{level}_{comm_id}",
                "level": level,
                "community_id": comm_id,
                "member_count": member_count,
                "type_distribution": dict(type_dist),
                "top_nodes": top_nodes,
            })

        # Create community nodes
        for comm in communities:
            session.run("""
                CREATE (c:Community {
                    id: $id,
                    level: $level,
                    community_id: $community_id,
                    member_count: $member_count,
                    type_distribution: $type_distribution,
                    top_nodes: $top_nodes,
                    node_type: '_community'
                })
            """, {
                "id": comm["id"],
                "level": comm["level"],
                "community_id": comm["community_id"],
                "member_count": comm["member_count"],
                "type_distribution": json.dumps(comm["type_distribution"]),
                "top_nodes": json.dumps(comm["top_nodes"]),
            })

            # Link members to community
            session.run(f"""
                MATCH (n) WHERE n.community_level_{level} = $comm_id
                MATCH (c:Community {{id: $id}})
                CREATE (n)-[:BELONGS_TO]->(c)
            """, {"comm_id": comm["community_id"], "id": comm["id"]})

        # Create inter-community edges
        session.run(f"""
            MATCH (a)-[r]->(b)
            WHERE a.community_level_{level} IS NOT NULL
              AND b.community_level_{level} IS NOT NULL
              AND a.community_level_{level} <> b.community_level_{level}
            WITH 'community_{level}_' + toString(a.community_level_{level}) AS src,
                 'community_{level}_' + toString(b.community_level_{level}) AS tgt,
                 count(r) AS edge_count
            MATCH (c1:Community {{id: src}})
            MATCH (c2:Community {{id: tgt}})
            CREATE (c1)-[:INTER_COMMUNITY {{edge_count: edge_count, edge_type: '_inter_community'}}]->(c2)
        """)

        print(f"Created {len(communities)} community nodes at level {level}.")
        return communities


def run_layout(driver, level: int = 0):
    """Compute ForceAtlas2 layout positions for community nodes using igraph."""
    import igraph as ig

    with driver.session() as session:
        # Get community nodes
        result = session.run(
            "MATCH (c:Community {level: $level}) RETURN c.id AS id",
            {"level": level},
        )
        comm_ids = [r["id"] for r in result]
        id_to_idx = {cid: i for i, cid in enumerate(comm_ids)}

        # Get inter-community edges
        result = session.run("""
            MATCH (c1:Community {level: $level})-[r:INTER_COMMUNITY]->(c2:Community {level: $level})
            RETURN c1.id AS source, c2.id AS target, r.edge_count AS weight
        """, {"level": level})

        edges = []
        weights = []
        for r in result:
            src = id_to_idx.get(r["source"])
            tgt = id_to_idx.get(r["target"])
            if src is not None and tgt is not None:
                edges.append((src, tgt))
                weights.append(r["weight"] or 1)

    if len(comm_ids) == 0:
        print("No community nodes to layout.")
        return

    # Build igraph and compute layout
    g = ig.Graph(n=len(comm_ids), edges=edges, directed=True)
    g.vs["comm_id"] = comm_ids

    # Use Fruchterman-Reingold (similar to ForceAtlas2, available in igraph)
    layout = g.layout_fruchterman_reingold(weights=weights if weights else None, niter=500)

    # Write positions back
    with driver.session() as session:
        for idx, (x, y) in enumerate(layout.coords):
            session.run(
                "MATCH (c:Community {id: $id}) SET c.x = $x, c.y = $y",
                {"id": comm_ids[idx], "x": float(x) * 100, "y": float(y) * 100},
            )

    print(f"Layout computed for {len(comm_ids)} community nodes at level {level}.")


def main():
    parser = argparse.ArgumentParser(description="Community detection pipeline")
    parser.add_argument("--uri", default="bolt://localhost:7687", help="Memgraph URI")
    parser.add_argument("--levels", type=int, default=1, help="Number of hierarchy levels")
    parser.add_argument("--clear", action="store_true", help="Clear existing communities first")
    args = parser.parse_args()

    driver = get_driver(args.uri)

    try:
        # Verify connection
        with driver.session() as session:
            result = session.run("MATCH (n) RETURN count(n) as count")
            count = result.single()["count"]
            print(f"Connected to Memgraph. {count} nodes in database.")

        if count == 0:
            print("No nodes in database. Skipping community detection.")
            sys.exit(0)

        if args.clear:
            clear_communities(driver)

        start = time.time()

        # Run community detection
        if not run_louvain_mage(driver):
            run_louvain_igraph(driver)

        # Create community nodes
        for level in range(args.levels):
            communities = create_community_nodes(driver, level)
            run_layout(driver, level)

        elapsed = time.time() - start
        print(f"Community detection complete in {elapsed:.1f}s.")

    finally:
        driver.close()


if __name__ == "__main__":
    main()
