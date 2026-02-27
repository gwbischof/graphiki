import { NextRequest, NextResponse } from "next/server";
import { writeQuery } from "@/lib/neo4j";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const { label, nodes, merge_key } = body;

  if (!label || !Array.isArray(nodes) || !merge_key) {
    return NextResponse.json(
      { error: "label, nodes (array), and merge_key are required" },
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

  // Validate merge_key exists in every node
  for (const node of nodes) {
    if (!(merge_key in node)) {
      return NextResponse.json(
        { error: `merge_key "${merge_key}" missing in node: ${JSON.stringify(node)}` },
        { status: 400 }
      );
    }
  }

  // Sanitize label to prevent injection (alphanumeric + underscore only)
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(label)) {
    return NextResponse.json(
      { error: "Invalid label: must be alphanumeric/underscore" },
      { status: 400 }
    );
  }

  const cypher = `
    UNWIND $nodes AS n
    MERGE (d:${label} {${merge_key}: n.${merge_key}})
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
