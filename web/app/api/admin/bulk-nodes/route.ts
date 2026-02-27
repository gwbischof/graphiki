import { NextRequest, NextResponse } from "next/server";
import { writeQuery } from "@/lib/neo4j";
import { requireAdmin } from "@/lib/admin-auth";

const LABEL_RE = /^[a-z_][a-z0-9_]*$/;

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const { labels, nodes, merge_key } = body;

  if (!labels || !Array.isArray(labels) || labels.length === 0 || !Array.isArray(nodes) || !merge_key) {
    return NextResponse.json(
      { error: "labels (string array), nodes (array), and merge_key are required" },
      { status: 400 }
    );
  }

  if (nodes.length === 0) {
    return NextResponse.json({ merged: 0 });
  }

  if (nodes.length > 1000) {
    return NextResponse.json(
      { error: "Maximum 1000 nodes per request" },
      { status: 400 }
    );
  }

  // Sanitize all labels
  for (const l of labels) {
    if (typeof l !== "string" || !LABEL_RE.test(l)) {
      return NextResponse.json(
        { error: `Invalid label "${l}": must be lowercase alphanumeric/underscore` },
        { status: 400 }
      );
    }
  }

  // Validate merge_key exists in every node
  for (const node of nodes) {
    if (!(merge_key in node)) {
      return NextResponse.json(
        { error: `merge_key "${merge_key}" missing in node: ${JSON.stringify(node)}` },
        { status: 400 }
      );
    }
  }

  // First label is the type label used for MERGE (stable identity).
  // Remaining labels are SET after (e.g. document, available/missing).
  const mergeLabel = labels[0];
  const setLabels = labels.slice(1);
  const setLabelStr = setLabels.length > 0
    ? `SET d${setLabels.map((l: string) => `:${l}`).join("")}`
    : "";

  const cypher = `
    UNWIND $nodes AS n
    MERGE (d:${mergeLabel} {${merge_key}: n.${merge_key}})
    ${setLabelStr}
    SET d += n
    RETURN count(d) AS merged
  `;

  try {
    const result = await writeQuery(cypher, { nodes }, 120000);
    const merged = result[0]?.get("merged")?.toNumber?.() ?? result[0]?.get("merged") ?? nodes.length;
    return NextResponse.json({ merged });
  } catch (error) {
    return NextResponse.json(
      { error: "Cypher execution failed", detail: String(error) },
      { status: 500 }
    );
  }
}
