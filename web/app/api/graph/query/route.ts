import { NextRequest, NextResponse } from "next/server";
import { isNeo4jAvailable } from "@/lib/neo4j";
import { executeViewQuery } from "@/lib/graph-queries";
import { requireRole } from "@/lib/auth-guard";
import type { ViewQuery } from "@/lib/graph-data";

export async function POST(request: NextRequest) {
  const { error: authError } = await requireRole("mod");
  if (authError) return authError;

  try {
    if (!isNeo4jAvailable()) {
      return NextResponse.json(
        { error: "Neo4j not available. Query endpoint requires a live database." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const query = body as ViewQuery;

    // Validate query shape
    if (!query.type) {
      return NextResponse.json(
        { error: "Query must have a 'type' field (structured, cypher, search, community)" },
        { status: 400 }
      );
    }

    const limit = Math.min(body.limit || 5000, 10000);
    const elements = await executeViewQuery(query, limit);

    return NextResponse.json({
      elements,
      count: {
        nodes: elements.filter((e) => e.group === "nodes").length,
        edges: elements.filter((e) => e.group === "edges").length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Query execution failed", detail: String(error) },
      { status: 500 }
    );
  }
}
