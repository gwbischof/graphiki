"""
Performance benchmark for graph operations at various scales.

Usage:
    python benchmark.py [--uri bolt://localhost:7687]
"""

import argparse
import time
from neo4j import GraphDatabase


def get_driver(uri: str):
    return GraphDatabase.driver(uri, auth=("", ""))


def benchmark(driver, name: str, cypher: str, params: dict = None, iterations: int = 10):
    """Run a query multiple times and report timing stats."""
    times = []
    with driver.session() as session:
        for _ in range(iterations):
            start = time.perf_counter()
            result = session.run(cypher, params or {})
            records = list(result)
            elapsed = (time.perf_counter() - start) * 1000  # ms
            times.append(elapsed)

    avg = sum(times) / len(times)
    p50 = sorted(times)[len(times) // 2]
    p99 = sorted(times)[int(len(times) * 0.99)]
    count = len(records) if records else 0

    print(f"  {name}:")
    print(f"    avg={avg:.1f}ms  p50={p50:.1f}ms  p99={p99:.1f}ms  rows={count}")
    return avg


def main():
    parser = argparse.ArgumentParser(description="Graph benchmark")
    parser.add_argument("--uri", default="bolt://localhost:7687", help="Memgraph URI")
    parser.add_argument("--iterations", type=int, default=10, help="Iterations per query")
    args = parser.parse_args()

    driver = get_driver(args.uri)

    try:
        # Get graph size
        with driver.session() as session:
            node_count = session.run("MATCH (n) RETURN count(n) as c").single()["c"]
            edge_count = session.run("MATCH ()-[r]->() RETURN count(r) as c").single()["c"]

        print(f"\nBenchmark: {node_count:,} nodes, {edge_count:,} edges")
        print(f"Iterations: {args.iterations}\n")

        results = {}

        # Stats
        results["stats"] = benchmark(
            driver, "Graph stats",
            "MATCH (n) RETURN count(n) as nodes",
            iterations=args.iterations
        )

        # Community overview
        results["communities"] = benchmark(
            driver, "Community overview (level 0)",
            "MATCH (c:Community {level: 0}) RETURN c ORDER BY c.member_count DESC LIMIT 200",
            iterations=args.iterations
        )

        # Community expansion
        results["community_expand"] = benchmark(
            driver, "Community expansion",
            """MATCH (n)-[:BELONGS_TO]->(c:Community {level: 0})
               WITH c, collect(n) AS members LIMIT 1
               UNWIND members AS m RETURN m LIMIT 5000""",
            iterations=args.iterations
        )

        # Node search
        results["search"] = benchmark(
            driver, "Node search (regex)",
            "MATCH (n) WHERE n.label =~ '(?i).*epstein.*' RETURN n LIMIT 20",
            iterations=args.iterations
        )

        # k-hop neighborhood (k=2)
        results["2hop"] = benchmark(
            driver, "2-hop neighborhood",
            """MATCH (center) WHERE center.id IS NOT NULL
               WITH center LIMIT 1
               MATCH (center)-[*1..2]-(neighbor)
               RETURN DISTINCT neighbor LIMIT 100""",
            iterations=args.iterations
        )

        # Shortest path
        results["path"] = benchmark(
            driver, "Shortest path",
            """MATCH (a), (b)
               WHERE a.id IS NOT NULL AND b.id IS NOT NULL
               WITH a, b LIMIT 1
               MATCH p = shortestPath((a)-[*..6]-(b))
               RETURN nodes(p)""",
            iterations=args.iterations
        )

        # Summary
        print("\n--- Performance Summary ---")
        targets = {
            "stats": 5,
            "communities": 5,
            "community_expand": 50,
            "search": 100,
            "2hop": 200,
            "path": 200,
        }
        for key, target in targets.items():
            avg = results.get(key, 0)
            status = "PASS" if avg <= target else "FAIL"
            print(f"  [{status}] {key}: {avg:.1f}ms (target: <{target}ms)")

    finally:
        driver.close()


if __name__ == "__main__":
    main()
