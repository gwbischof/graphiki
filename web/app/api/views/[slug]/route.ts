import { NextRequest, NextResponse } from "next/server";
import { isNeo4jAvailable } from "@/lib/neo4j";
import { getView, deleteView, executeViewQuery } from "@/lib/graph-queries";
import { requireRole } from "@/lib/auth-guard";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    if (!isNeo4jAvailable()) {
      return NextResponse.json(
        { error: "Neo4j not available" },
        { status: 503 }
      );
    }

    const view = await getView(slug);
    if (!view) {
      return NextResponse.json({ error: "View not found" }, { status: 404 });
    }

    // Optionally execute the query and return results
    const { searchParams } = new URL(request.url);
    const includeResults = searchParams.get("results") !== "false";

    if (includeResults) {
      const limit = Math.min(parseInt(searchParams.get("limit") || "5000"), 10000);
      const elements = await executeViewQuery(view.query, limit);
      return NextResponse.json({
        view,
        elements,
        count: {
          nodes: elements.filter((e) => e.group === "nodes").length,
          edges: elements.filter((e) => e.group === "edges").length,
        },
      });
    }

    return NextResponse.json({ view });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get view", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { error: authError } = await requireRole("mod");
  if (authError) return authError;

  const { slug } = await params;

  try {
    if (!isNeo4jAvailable()) {
      return NextResponse.json(
        { error: "Neo4j not available" },
        { status: 503 }
      );
    }

    const deleted = await deleteView(slug);
    if (!deleted) {
      return NextResponse.json({ error: "View not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete view", detail: String(error) },
      { status: 500 }
    );
  }
}
