import { NextRequest, NextResponse } from "next/server";
import { isNeo4jAvailable } from "@/lib/neo4j";
import { listViews, createView } from "@/lib/graph-queries";
import { requireRole } from "@/lib/auth-guard";
import type { SavedView } from "@/lib/graph-data";

export async function GET() {
  try {
    if (!isNeo4jAvailable()) {
      return NextResponse.json({ views: [], source: "static" });
    }

    const views = await listViews();
    return NextResponse.json({ views, source: "neo4j" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to list views", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { error: authError } = await requireRole("user");
  if (authError) return authError;

  try {
    if (!isNeo4jAvailable()) {
      return NextResponse.json(
        { error: "Neo4j not available. Views require a live database." },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.slug || !body.name || !body.query) {
      return NextResponse.json(
        { error: "slug, name, and query are required" },
        { status: 400 }
      );
    }

    // Sanitize slug
    const slug = String(body.slug)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const view: SavedView = {
      slug,
      name: String(body.name),
      description: body.description ? String(body.description) : undefined,
      query: body.query,
      created_at: new Date().toISOString(),
      author: body.author ? String(body.author) : undefined,
    };

    const created = await createView(view);
    return NextResponse.json({ view: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create view", detail: String(error) },
      { status: 500 }
    );
  }
}
