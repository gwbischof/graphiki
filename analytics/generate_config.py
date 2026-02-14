"""
Auto-generate graph-config.json from Neo4j schema.

Scans Neo4j to discover:
- Node types (labels) and their property distributions
- Edge types (relationship types)
- Auto-assigns colors and shapes

Usage:
    python generate_config.py [--uri bolt://localhost:7687] [--output ../web/public/data/graph-config.json]
"""

import argparse
import json
import sys
from collections import Counter

from neo4j import GraphDatabase


# Color palettes for auto-assignment
NODE_COLORS = [
    "#ff4444", "#7aa2f7", "#e0af68", "#9ece6a", "#89ddff",
    "#737aa2", "#f7768e", "#bb9af7", "#ff9e64", "#2ac3de",
    "#73daca", "#c0caf5", "#565f89", "#ff7a93", "#b4f9f8",
]

EDGE_COLORS = [
    "#9ece6a", "#7aa2f7", "#c0caf5", "#e0af68", "#737aa2",
    "#bb9af7", "#ff9e64", "#89ddff", "#f7768e", "#73daca",
]

SHAPES = ["ellipse", "diamond", "hexagon", "rectangle", "triangle", "star"]

STATUS_STYLES = {
    "convicted": {"color": "red", "label": "Convicted"},
    "charged": {"color": "orange", "label": "Charged"},
    "under-investigation": {"color": "yellow", "label": "Under Investigation"},
    "not-charged": {"color": "zinc", "label": "Not Charged"},
    "deceased": {"color": "purple", "label": "Deceased"},
    "dissolved": {"color": "zinc", "label": "Dissolved"},
    "seized": {"color": "red", "label": "Seized"},
    "active": {"color": "green", "label": "Active"},
}


def get_driver(uri: str):
    return GraphDatabase.driver(uri, auth=("", ""))


def discover_schema(driver):
    """Discover node types, edge types, and property distributions."""
    with driver.session() as session:
        # Get node labels and counts
        node_types = {}
        result = session.run("""
            MATCH (n)
            WHERE n.node_type IS NOT NULL
            RETURN n.node_type AS type, count(n) AS count
            ORDER BY count DESC
        """)
        for record in result:
            node_types[record["type"]] = record["count"]

        # Get edge types and counts
        edge_types = {}
        result = session.run("""
            MATCH ()-[r]->()
            RETURN type(r) AS type, count(r) AS count
            ORDER BY count DESC
        """)
        for record in result:
            t = record["type"]
            if t not in ("BELONGS_TO", "INTER_COMMUNITY"):
                edge_types[t] = record["count"]

        # For each node type, discover subtypes
        subtype_info = {}
        for nt in node_types:
            # Try common subtype fields
            for field in ["role", "org_type", "location_type", "category", "type", "subtype"]:
                result = session.run(f"""
                    MATCH (n {{node_type: $nt}})
                    WHERE n.{field} IS NOT NULL
                    RETURN n.{field} AS subtype, count(n) AS count
                    ORDER BY count DESC
                    LIMIT 20
                """, {"nt": nt})
                subtypes = {r["subtype"]: r["count"] for r in result}
                if subtypes:
                    subtype_info[nt] = {"field": field, "values": subtypes}
                    break

        # Get status values
        result = session.run("""
            MATCH (n) WHERE n.status IS NOT NULL
            RETURN DISTINCT n.status AS status
        """)
        statuses = [r["status"] for r in result]

        # Total counts
        total_nodes = session.run("MATCH (n) RETURN count(n) as c").single()["c"]
        total_edges = session.run("MATCH ()-[r]->() RETURN count(r) as c").single()["c"]

    return {
        "node_types": node_types,
        "edge_types": edge_types,
        "subtype_info": subtype_info,
        "statuses": statuses,
        "total_nodes": total_nodes,
        "total_edges": total_edges,
    }


def generate_config(schema):
    """Generate graph-config.json from discovered schema."""
    config = {
        "nodeTypes": {},
        "edgeTypes": {},
        "statusStyles": STATUS_STYLES,
        "defaultEdgeColor": "#565f89",
        "metadata": {
            "nodeCount": schema["total_nodes"],
            "edgeCount": schema["total_edges"],
            "generated": True,
        },
    }

    # Generate node type configs
    for i, (nt, count) in enumerate(schema["node_types"].items()):
        shape = SHAPES[i % len(SHAPES)]
        default_color = NODE_COLORS[i % len(NODE_COLORS)]

        subtypes = {}
        subtype_field = "role"  # default

        if nt in schema["subtype_info"]:
            info = schema["subtype_info"][nt]
            subtype_field = info["field"]
            for j, (st, st_count) in enumerate(info["values"].items()):
                color_idx = (i * 3 + j) % len(NODE_COLORS)
                subtypes[st] = {
                    "color": NODE_COLORS[color_idx],
                    "label": st.replace("_", " ").replace("-", " ").title(),
                }

        config["nodeTypes"][nt] = {
            "shape": shape,
            "sizeMultiplier": 1.0 if i == 0 else max(0.7, 1.0 - i * 0.05),
            "subtypeField": subtype_field,
            "subtypes": subtypes,
            "defaultColor": default_color,
        }

    # Generate edge type configs
    for i, (et, count) in enumerate(schema["edge_types"].items()):
        config["edgeTypes"][et] = {
            "color": EDGE_COLORS[i % len(EDGE_COLORS)],
            "label": et.replace("_", " ").title(),
        }

    # Status styles from discovered statuses
    for status in schema["statuses"]:
        if status not in config["statusStyles"]:
            config["statusStyles"][status] = {
                "color": "zinc",
                "label": status.replace("_", " ").replace("-", " ").title(),
            }

    return config


def main():
    parser = argparse.ArgumentParser(description="Generate graph config from Neo4j schema")
    parser.add_argument("--uri", default="bolt://localhost:7687", help="Neo4j URI")
    parser.add_argument("--output", default="../web/public/data/graph-config.json", help="Output path")
    args = parser.parse_args()

    driver = get_driver(args.uri)

    try:
        print("Discovering schema...")
        schema = discover_schema(driver)

        print(f"  Node types: {list(schema['node_types'].keys())}")
        print(f"  Edge types: {list(schema['edge_types'].keys())}")
        print(f"  Total: {schema['total_nodes']} nodes, {schema['total_edges']} edges")

        config = generate_config(schema)

        with open(args.output, "w") as f:
            json.dump(config, f, indent=2)

        print(f"\nConfig written to {args.output}")

    finally:
        driver.close()


if __name__ == "__main__":
    main()
