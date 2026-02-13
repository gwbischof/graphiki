import { NextRequest, NextResponse } from "next/server";
import { isMemgraphAvailable } from "@/lib/memgraph";
import { runQuery } from "@/lib/memgraph";
import { Record as Neo4jRecord } from "neo4j-driver";
import type { CytoscapeElement, NodeData, EdgeData } from "@/lib/graph-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const maxLength = Math.min(parseInt(searchParams.get("maxLength") || "6"), 10);

  if (!from || !to) {
    return NextResponse.json(
      { error: "Both 'from' and 'to' parameters are required" },
      { status: 400 }
    );
  }

  try {
    if (!isMemgraphAvailable()) {
      return NextResponse.json(
        { error: "Memgraph not available. Path finding requires a live database." },
        { status: 503 }
      );
    }

    const records = await runQuery(
      `MATCH p = shortestPath((a {id: $from})-[*..${maxLength}]-(b {id: $to}))
       RETURN nodes(p) AS nodes, relationships(p) AS rels`,
      { from, to }
    );

    if (records.length === 0) {
      return NextResponse.json({
        path: null,
        message: `No path found between ${from} and ${to} within ${maxLength} hops`,
      });
    }

    const r = records[0] as unknown as Neo4jRecord;
    const nodes = r.get("nodes") || [];
    const rels = r.get("rels") || [];

    const elements: CytoscapeElement[] = [];

    for (const node of nodes) {
      const props = node.properties;
      elements.push({
        group: "nodes",
        data: {
          id: String(props.id),
          label: String(props.label || props.name || props.id),
          node_type: String(props.node_type || "Unknown"),
          doc_count: 0,
          ...props,
        } as NodeData,
      });
    }

    for (const rel of rels) {
      const startId = String(rel.start.properties?.id || rel.startNodeElementId);
      const endId = String(rel.end.properties?.id || rel.endNodeElementId);
      elements.push({
        group: "edges",
        data: {
          id: `${startId}-${rel.type}-${endId}`,
          source: startId,
          target: endId,
          edge_type: rel.type,
          ...rel.properties,
        } as EdgeData,
      });
    }

    return NextResponse.json({
      elements,
      pathLength: nodes.length - 1,
      count: {
        nodes: nodes.length,
        edges: rels.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Path finding failed", detail: String(error) },
      { status: 500 }
    );
  }
}
