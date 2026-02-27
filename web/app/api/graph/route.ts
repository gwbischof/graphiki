import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { isNeo4jAvailable } from "@/lib/neo4j";
import { getAllNodes } from "@/lib/graph-queries";

export async function GET() {
  try {
    if (isNeo4jAvailable()) {
      const elements = await getAllNodes();
      return NextResponse.json({ elements });
    }

    // Static fallback when Neo4j is not configured
    const filePath = join(process.cwd(), "public", "data", "graph.json");
    const data = readFileSync(filePath, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json(
      { error: "Failed to load graph data" },
      { status: 500 }
    );
  }
}
