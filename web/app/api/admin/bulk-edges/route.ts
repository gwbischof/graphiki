import { NextRequest, NextResponse } from "next/server";
import { writeQuery } from "@/lib/neo4j";
import { requireAdmin } from "@/lib/admin-auth";

const LABEL_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const { edge_type, source_label, target_label, edges, source_key, target_key } = body;

  if (!edge_type || !source_label || !target_label || !Array.isArray(edges) || !source_key || !target_key) {
    return NextResponse.json(
      { error: "edge_type, source_label, target_label, edges (array), source_key, and target_key are required" },
      { status: 400 }
    );
  }

  if (edges.length === 0) {
    return NextResponse.json({ created: 0 });
  }

  if (edges.length > 1000) {
    return NextResponse.json(
      { error: "Maximum 1000 edges per request" },
      { status: 400 }
    );
  }

  // Sanitize labels and edge type
  for (const val of [edge_type, source_label, target_label]) {
    if (!LABEL_RE.test(val)) {
      return NextResponse.json(
        { error: `Invalid identifier "${val}": must be alphanumeric/underscore` },
        { status: 400 }
      );
    }
  }

  // Validate source/target exist in every edge
  for (const edge of edges) {
    if (!("source" in edge) || !("target" in edge)) {
      return NextResponse.json(
        { error: "Each edge must have 'source' and 'target' fields" },
        { status: 400 }
      );
    }
  }

  // Build props map excluding source/target (those are for matching, not stored on edge)
  const cypher = `
    UNWIND $edges AS e
    MATCH (s:${source_label} {${source_key}: e.source})
    MATCH (t:${target_label} {${target_key}: e.target})
    MERGE (s)-[r:${edge_type}]->(t)
    SET r += e.props
    RETURN count(r) AS created
  `;

  // Pre-process edges to separate props from source/target
  const processedEdges = edges.map((edge: Record<string, unknown>) => {
    const { source, target, ...props } = edge;
    return { source, target, props };
  });

  try {
    const result = await writeQuery(cypher, { edges: processedEdges }, 120000);
    const created = result[0]?.get("created")?.toNumber?.() ?? result[0]?.get("created") ?? edges.length;
    return NextResponse.json({ created });
  } catch (error) {
    return NextResponse.json(
      { error: "Cypher execution failed", detail: String(error) },
      { status: 500 }
    );
  }
}
