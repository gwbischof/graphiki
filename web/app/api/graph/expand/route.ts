import { NextRequest, NextResponse } from "next/server";
import { isMemgraphAvailable } from "@/lib/memgraph";
import { getNodeWithNeighborhood } from "@/lib/graph-queries";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nodeId = searchParams.get("nodeId");
  const hops = Math.min(parseInt(searchParams.get("hops") || "1"), 3);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

  if (!nodeId) {
    return NextResponse.json(
      { error: "nodeId parameter is required" },
      { status: 400 }
    );
  }

  try {
    if (!isMemgraphAvailable()) {
      return NextResponse.json(
        { error: "Memgraph not available. Expand requires a live database." },
        { status: 503 }
      );
    }

    const elements = await getNodeWithNeighborhood(nodeId, hops, limit);
    return NextResponse.json({
      elements,
      count: {
        nodes: elements.filter((e) => e.group === "nodes").length,
        edges: elements.filter((e) => e.group === "edges").length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Expand failed", detail: String(error) },
      { status: 500 }
    );
  }
}
