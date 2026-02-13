#!/usr/bin/env python3
"""
Epstein Network Graph — ETL pipeline and visualization generator.

Usage:
    python graph.py init                         # Load seed data + generate HTML
    python graph.py viz                          # Regenerate HTML from current DB
    python graph.py query "MATCH (n) RETURN n"   # Run ad-hoc Cypher query
    python graph.py add-person <id> <name> <role> # Add a person node
    python graph.py stats                        # Show node/edge counts
    python graph.py export-json                  # Export graph as Cytoscape JSON

Requires: Memgraph running on MEMGRAPH_URI (default bolt://localhost:7687)
"""

import json
import os
import sys
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from neo4j import GraphDatabase

MEMGRAPH_URI = os.environ.get("MEMGRAPH_URI", "bolt://localhost:7687")
MEMGRAPH_USER = os.environ.get("MEMGRAPH_USER", "")
MEMGRAPH_PASS = os.environ.get("MEMGRAPH_PASS", "")

ROOT = Path(__file__).parent
TEMPLATE_DIR = ROOT / "templates"
OUTPUT_DIR = ROOT / "output"


def get_driver():
    auth = (MEMGRAPH_USER, MEMGRAPH_PASS) if MEMGRAPH_USER else None
    return GraphDatabase.driver(MEMGRAPH_URI, auth=auth)


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

def create_schema(session):
    """Create indexes for fast lookups."""
    for label in ("Person", "Organization", "Location"):
        try:
            session.run(f"CREATE INDEX ON :{label}(id);")
        except Exception:
            pass  # index may already exist


# ---------------------------------------------------------------------------
# Load seed data
# ---------------------------------------------------------------------------

def load_seed(session):
    """Merge all seed nodes and create edges."""
    from data.seed import PERSONS, ORGANIZATIONS, LOCATIONS, EDGES

    # --- Persons ---
    for p in PERSONS:
        session.run(
            """
            MERGE (n:Person {id: $id})
            SET n.name = $name,
                n.role = $role,
                n.network = $network,
                n.doc_count = $doc_count,
                n.status = $status,
                n.section = $section,
                n.notes = $notes
            """,
            **p,
        )
    print(f"  Loaded {len(PERSONS)} persons")

    # --- Organizations ---
    for o in ORGANIZATIONS:
        session.run(
            """
            MERGE (n:Organization {id: $id})
            SET n.name = $name,
                n.org_type = $org_type,
                n.network = $network,
                n.doc_count = $doc_count,
                n.status = $status,
                n.notes = $notes
            """,
            **o,
        )
    print(f"  Loaded {len(ORGANIZATIONS)} organizations")

    # --- Locations ---
    for loc in LOCATIONS:
        session.run(
            """
            MERGE (n:Location {id: $id})
            SET n.name = $name,
                n.location_type = $location_type,
                n.network = $network,
                n.doc_count = $doc_count,
                n.status = $status,
                n.notes = $notes
            """,
            **loc,
        )
    print(f"  Loaded {len(LOCATIONS)} locations")

    # --- Edges ---
    edge_count = 0
    for e in EDGES:
        edge_type = e["type"]
        props = e.get("props", {})
        props_str = ", ".join(f"r.{k} = ${k}" for k in props)

        # Determine source type
        if "source_org" in e:
            src_label = "Organization"
            src_id = e["source_org"]
        elif "source_loc" in e:
            src_label = "Location"
            src_id = e["source_loc"]
        else:
            src_label = "Person"
            src_id = e["source"]

        # Determine target type
        if "target_org" in e:
            tgt_label = "Organization"
            tgt_id = e["target_org"]
        elif "target_loc" in e:
            tgt_label = "Location"
            tgt_id = e["target_loc"]
        else:
            tgt_label = "Person"
            tgt_id = e["target"]

        query = (
            f"MATCH (a:{src_label} {{id: $src_id}}), (b:{tgt_label} {{id: $tgt_id}}) "
            f"CREATE (a)-[r:{edge_type}]->(b) "
        )
        if props_str:
            query += f"SET {props_str}"

        params = {"src_id": src_id, "tgt_id": tgt_id, **props}
        session.run(query, **params)
        edge_count += 1

    print(f"  Created {edge_count} edges")


# ---------------------------------------------------------------------------
# Export graph data for visualization
# ---------------------------------------------------------------------------

def export_cytoscape_json(session):
    """Query all nodes and edges, return Cytoscape.js elements JSON."""
    elements = []

    # --- Nodes: Person ---
    result = session.run("MATCH (n:Person) RETURN n, id(n) AS mid")
    for record in result:
        node = record["n"]
        elements.append({
            "group": "nodes",
            "data": {
                "id": node["id"],
                "label": node["name"],
                "node_type": "Person",
                "role": node.get("role", ""),
                "network": node.get("network", ""),
                "doc_count": node.get("doc_count", 0),
                "status": node.get("status", ""),
                "section": node.get("section", 0),
                "notes": node.get("notes", ""),
            },
        })

    # --- Nodes: Organization ---
    result = session.run("MATCH (n:Organization) RETURN n, id(n) AS mid")
    for record in result:
        node = record["n"]
        elements.append({
            "group": "nodes",
            "data": {
                "id": node["id"],
                "label": node["name"],
                "node_type": "Organization",
                "org_type": node.get("org_type", ""),
                "network": node.get("network", ""),
                "doc_count": node.get("doc_count", 0),
                "status": node.get("status", ""),
                "notes": node.get("notes", ""),
            },
        })

    # --- Nodes: Location ---
    result = session.run("MATCH (n:Location) RETURN n, id(n) AS mid")
    for record in result:
        node = record["n"]
        elements.append({
            "group": "nodes",
            "data": {
                "id": node["id"],
                "label": node["name"],
                "node_type": "Location",
                "location_type": node.get("location_type", ""),
                "network": node.get("network", ""),
                "doc_count": node.get("doc_count", 0),
                "status": node.get("status", ""),
                "notes": node.get("notes", ""),
            },
        })

    # --- Edges ---
    result = session.run(
        """
        MATCH (a)-[r]->(b)
        RETURN a.id AS source, b.id AS target, type(r) AS edge_type,
               properties(r) AS props
        """
    )
    for i, record in enumerate(result):
        data = {
            "id": f"e{i}",
            "source": record["source"],
            "target": record["target"],
            "edge_type": record["edge_type"],
        }
        props = record["props"]
        if props:
            for k, v in props.items():
                data[k] = v
        elements.append({"group": "edges", "data": data})

    return elements


# ---------------------------------------------------------------------------
# Generate HTML visualization
# ---------------------------------------------------------------------------

def generate_html(elements):
    """Render Cytoscape.js HTML from template + data."""
    OUTPUT_DIR.mkdir(exist_ok=True)
    env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))
    template = env.get_template("index.html")

    html = template.render(elements_json=json.dumps(elements, default=str))

    out_path = OUTPUT_DIR / "epstein-network.html"
    out_path.write_text(html)
    print(f"  Wrote {out_path} ({len(elements)} elements)")
    return out_path


# ---------------------------------------------------------------------------
# CLI commands
# ---------------------------------------------------------------------------

def cmd_init():
    """Create schema, load seed data, generate visualization."""
    print("Connecting to Memgraph...")
    driver = get_driver()
    with driver.session() as session:
        print("Creating schema...")
        create_schema(session)
        print("Loading seed data...")
        load_seed(session)
        print("Exporting visualization...")
        elements = export_cytoscape_json(session)
        path = generate_html(elements)
        print(f"\nDone! Open {path}")
    driver.close()


def cmd_viz():
    """Regenerate HTML from current DB state."""
    print("Connecting to Memgraph...")
    driver = get_driver()
    with driver.session() as session:
        print("Exporting visualization...")
        elements = export_cytoscape_json(session)
        path = generate_html(elements)
        print(f"\nDone! Open {path}")
    driver.close()


def cmd_query(cypher):
    """Run an ad-hoc Cypher query."""
    driver = get_driver()
    with driver.session() as session:
        result = session.run(cypher)
        records = list(result)
        if not records:
            print("(no results)")
            return
        # Print column headers
        keys = records[0].keys()
        print("\t".join(keys))
        print("-" * 80)
        for record in records:
            print("\t".join(str(record[k]) for k in keys))
        print(f"\n({len(records)} rows)")
    driver.close()


def cmd_add_person(person_id, name, role):
    """Add a person node."""
    driver = get_driver()
    with driver.session() as session:
        session.run(
            """
            MERGE (n:Person {id: $id})
            SET n.name = $name, n.role = $role, n.network = 'epstein'
            """,
            id=person_id,
            name=name,
            role=role,
        )
        print(f"Added/updated: {name} ({person_id}, {role})")
    driver.close()


def cmd_export_json():
    """Export full graph as Cytoscape.js JSON to data/graph.json."""
    print("Connecting to Memgraph...")
    driver = get_driver()
    with driver.session() as session:
        print("Exporting graph data...")
        elements = export_cytoscape_json(session)
        data = {"elements": elements}

        # Write to data/graph.json
        data_path = ROOT / "data" / "graph.json"
        data_path.write_text(json.dumps(data, indent=2, default=str))
        print(f"  Wrote {data_path} ({len(elements)} elements)")

        # Copy to web/public/data/ if it exists
        web_data_dir = ROOT / "web" / "public" / "data"
        if web_data_dir.exists():
            web_path = web_data_dir / "graph.json"
            web_path.write_text(json.dumps(data, indent=2, default=str))
            print(f"  Copied to {web_path}")
        else:
            print(f"  (web/public/data/ not found, skipping copy)")

    driver.close()
    print("Done!")


def cmd_stats():
    """Show node and edge counts."""
    driver = get_driver()
    with driver.session() as session:
        # Node counts
        for label in ("Person", "Organization", "Location"):
            result = session.run(f"MATCH (n:{label}) RETURN count(n) AS c")
            count = result.single()["c"]
            print(f"  {label}: {count}")
        # Edge counts by type
        result = session.run(
            "MATCH ()-[r]->() RETURN type(r) AS t, count(r) AS c ORDER BY c DESC"
        )
        print("  Edges:")
        for record in result:
            print(f"    {record['t']}: {record['c']}")
    driver.close()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "init":
        cmd_init()
    elif cmd == "viz":
        cmd_viz()
    elif cmd == "query":
        if len(sys.argv) < 3:
            print("Usage: python graph.py query \"MATCH ...\"")
            sys.exit(1)
        cmd_query(sys.argv[2])
    elif cmd == "add-person":
        if len(sys.argv) < 5:
            print("Usage: python graph.py add-person <id> <name> <role>")
            sys.exit(1)
        cmd_add_person(sys.argv[2], sys.argv[3], sys.argv[4])
    elif cmd == "stats":
        cmd_stats()
    elif cmd == "export-json":
        cmd_export_json()
    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
