"""
Pre-compute ForceAtlas2-style layout positions for nodes in Neo4j.

Can compute layout for:
- All nodes (full graph, for small graphs)
- Individual communities (subgraph layout)
- Community hierarchy nodes (overview layout)

Usage:
    python layout.py [--uri bolt://localhost:7687] [--target all|communities|community_<id>]
"""

import argparse
import sys
import time

import igraph as ig
from neo4j import GraphDatabase


def get_driver(uri: str):
    return GraphDatabase.driver(uri, auth=("", ""))


def layout_all_nodes(driver, max_nodes: int = 50000):
    """Compute layout for all nodes in the graph."""
    with driver.session() as session:
        result = session.run("MATCH (n) RETURN count(n) as count")
        count = result.single()["count"]

        if count > max_nodes:
            print(f"Graph has {count} nodes, exceeding max {max_nodes}. Use community layout instead.")
            return

        # Export
        node_result = session.run("MATCH (n) RETURN n.id AS id")
        node_ids = [r["id"] for r in node_result]
        id_to_idx = {nid: i for i, nid in enumerate(node_ids)}

        edge_result = session.run("MATCH (a)-[r]->(b) RETURN a.id AS source, b.id AS target")
        edges = []
        for r in edge_result:
            src = id_to_idx.get(r["source"])
            tgt = id_to_idx.get(r["target"])
            if src is not None and tgt is not None:
                edges.append((src, tgt))

    print(f"Computing layout for {len(node_ids)} nodes, {len(edges)} edges...")

    g = ig.Graph(n=len(node_ids), edges=edges, directed=True)
    g_undirected = g.as_undirected()

    # Use Fruchterman-Reingold for medium graphs, DrL for large
    if len(node_ids) > 10000:
        layout = g_undirected.layout_drl(dim=2)
    else:
        layout = g_undirected.layout_fruchterman_reingold(niter=500)

    # Write positions back
    with driver.session() as session:
        for idx, (x, y) in enumerate(layout.coords):
            session.run(
                "MATCH (n {id: $id}) SET n.x = $x, n.y = $y",
                {"id": node_ids[idx], "x": float(x) * 100, "y": float(y) * 100},
            )

    print(f"Layout written for {len(node_ids)} nodes.")


def layout_community(driver, community_id: str):
    """Compute layout for a single community's members."""
    with driver.session() as session:
        result = session.run("""
            MATCH (n)-[:BELONGS_TO]->(c:Community {id: $cid})
            RETURN n.id AS id
        """, {"cid": community_id})
        node_ids = [r["id"] for r in result]
        id_to_idx = {nid: i for i, nid in enumerate(node_ids)}

        edge_result = session.run("""
            MATCH (a)-[r]->(b)
            WHERE a.id IN $ids AND b.id IN $ids
            RETURN a.id AS source, b.id AS target
        """, {"ids": node_ids})
        edges = []
        for r in edge_result:
            src = id_to_idx.get(r["source"])
            tgt = id_to_idx.get(r["target"])
            if src is not None and tgt is not None:
                edges.append((src, tgt))

    if not node_ids:
        print(f"Community {community_id} has no members.")
        return

    print(f"Computing layout for community {community_id}: {len(node_ids)} nodes, {len(edges)} edges...")

    g = ig.Graph(n=len(node_ids), edges=edges, directed=True)
    g_undirected = g.as_undirected()
    layout = g_undirected.layout_fruchterman_reingold(niter=500)

    with driver.session() as session:
        for idx, (x, y) in enumerate(layout.coords):
            session.run(
                "MATCH (n {id: $id}) SET n.x = $x, n.y = $y",
                {"id": node_ids[idx], "x": float(x) * 100, "y": float(y) * 100},
            )

    print(f"Layout written for community {community_id}.")


def layout_all_communities(driver):
    """Compute layout for every community's members."""
    with driver.session() as session:
        result = session.run("MATCH (c:Community) RETURN c.id AS id ORDER BY c.member_count DESC")
        community_ids = [r["id"] for r in result]

    print(f"Computing layout for {len(community_ids)} communities...")
    for cid in community_ids:
        layout_community(driver, cid)


def main():
    parser = argparse.ArgumentParser(description="Graph layout computation")
    parser.add_argument("--uri", default="bolt://localhost:7687", help="Neo4j URI")
    parser.add_argument("--target", default="all", help="Layout target: all, communities, or community_<id>")
    parser.add_argument("--max-nodes", type=int, default=50000, help="Max nodes for full graph layout")
    args = parser.parse_args()

    driver = get_driver(args.uri)

    try:
        start = time.time()

        if args.target == "all":
            layout_all_nodes(driver, args.max_nodes)
        elif args.target == "communities":
            layout_all_communities(driver)
        elif args.target.startswith("community_"):
            layout_community(driver, args.target)
        else:
            print(f"Unknown target: {args.target}")
            sys.exit(1)

        elapsed = time.time() - start
        print(f"Layout complete in {elapsed:.1f}s.")

    finally:
        driver.close()


if __name__ == "__main__":
    main()
