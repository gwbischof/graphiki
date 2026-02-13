import { NextRequest, NextResponse } from "next/server";
import { isMemgraphAvailable } from "@/lib/memgraph";
import { getNodeWithNeighborhood } from "@/lib/graph-queries";
import { readFileSync } from "fs";
import { join } from "path";
import type { CytoscapeElement, NodeData, EdgeData } from "@/lib/graph-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const hops = Math.min(parseInt(searchParams.get("hops") || "1"), 3);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

  try {
    if (isMemgraphAvailable()) {
      const elements = await getNodeWithNeighborhood(id, hops, limit);
      if (elements.length === 0) {
        return NextResponse.json({ error: "Node not found" }, { status: 404 });
      }
      return NextResponse.json({ elements, source: "memgraph" });
    }

    // Fallback: filter static JSON
    const filePath = join(process.cwd(), "public", "data", "graph.json");
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    const allElements: CytoscapeElement[] = data.elements || [];

    const centerNode = allElements.find(
      (e) => e.group === "nodes" && (e.data as NodeData).id === id
    );
    if (!centerNode) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    // Get connected edges and neighbor nodes
    const connectedEdges = allElements.filter(
      (e) =>
        e.group === "edges" &&
        ((e.data as EdgeData).source === id || (e.data as EdgeData).target === id)
    );
    const neighborIds = new Set<string>();
    for (const e of connectedEdges) {
      const ed = e.data as EdgeData;
      neighborIds.add(ed.source === id ? ed.target : ed.source);
    }
    const neighborNodes = allElements.filter(
      (e) => e.group === "nodes" && neighborIds.has((e.data as NodeData).id)
    );

    const elements = [centerNode, ...neighborNodes, ...connectedEdges].slice(0, limit);
    return NextResponse.json({ elements, source: "static" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get node", detail: String(error) },
      { status: 500 }
    );
  }
}
