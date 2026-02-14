import { NextRequest, NextResponse } from "next/server";
import { isNeo4jAvailable } from "@/lib/neo4j";
import { getCommunities } from "@/lib/graph-queries";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = parseInt(searchParams.get("level") || "0");
  const limit = Math.min(parseInt(searchParams.get("limit") || "200"), 500);

  try {
    if (!isNeo4jAvailable()) {
      return NextResponse.json(
        { elements: [], source: "static", message: "Neo4j not available. Communities require a live database." }
      );
    }

    const elements = await getCommunities(level, limit);
    return NextResponse.json(
      {
        elements,
        count: {
          nodes: elements.filter((e) => e.group === "nodes").length,
          edges: elements.filter((e) => e.group === "edges").length,
        },
        source: "neo4j",
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get communities", detail: String(error) },
      { status: 500 }
    );
  }
}
