import { NextRequest, NextResponse } from "next/server";
import { isMemgraphAvailable } from "@/lib/memgraph";
import { searchNodes } from "@/lib/graph-queries";
import { readFileSync } from "fs";
import { join } from "path";
import type { CytoscapeElement, NodeData } from "@/lib/graph-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const types = searchParams.get("types")?.split(",").filter(Boolean);

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  try {
    if (isMemgraphAvailable()) {
      const results = await searchNodes(q, limit, types);
      return NextResponse.json({ results, source: "memgraph" });
    }

    // Fallback: search static JSON
    const filePath = join(process.cwd(), "public", "data", "graph.json");
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    const elements: CytoscapeElement[] = data.elements || [];
    const query = q.toLowerCase();

    const results = elements
      .filter((e): e is CytoscapeElement & { data: NodeData } => {
        if (e.group !== "nodes") return false;
        const d = e.data as NodeData;
        if (types && types.length > 0 && !types.includes(d.node_type)) return false;
        const label = (d.label || "").toLowerCase();
        const id = (d.id || "").toLowerCase();
        const notes = (d.notes || "").toLowerCase();
        return label.includes(query) || id.includes(query) || notes.includes(query);
      })
      .slice(0, limit);

    return NextResponse.json({ results, source: "static" });
  } catch (error) {
    return NextResponse.json(
      { error: "Search failed", detail: String(error) },
      { status: 500 }
    );
  }
}
