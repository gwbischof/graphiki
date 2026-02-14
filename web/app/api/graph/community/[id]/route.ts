import { NextRequest, NextResponse } from "next/server";
import { isNeo4jAvailable } from "@/lib/neo4j";
import { getCommunityMembers } from "@/lib/graph-queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "5000"), 10000);

  try {
    if (!isNeo4jAvailable()) {
      return NextResponse.json(
        { error: "Neo4j not available. Communities require a live database." },
        { status: 503 }
      );
    }

    const elements = await getCommunityMembers(id, limit);
    if (elements.length === 0) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    return NextResponse.json({
      elements,
      count: {
        nodes: elements.filter((e) => e.group === "nodes").length,
        edges: elements.filter((e) => e.group === "edges").length,
      },
      source: "neo4j",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get community members", detail: String(error) },
      { status: 500 }
    );
  }
}
