import { NextResponse } from "next/server";
import { isNeo4jAvailable } from "@/lib/neo4j";
import { getGraphStats } from "@/lib/graph-queries";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    if (isNeo4jAvailable()) {
      const stats = await getGraphStats();
      return NextResponse.json(stats);
    }

    // Fallback: count from static JSON
    const filePath = join(process.cwd(), "public", "data", "graph.json");
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    const elements = data.elements || [];
    const nodes = elements.filter((e: { group: string }) => e.group === "nodes");
    const edges = elements.filter((e: { group: string }) => e.group === "edges");

    return NextResponse.json({
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodeTypes: {},
      edgeTypes: {},
      source: "static",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get graph stats", detail: String(error) },
      { status: 500 }
    );
  }
}
