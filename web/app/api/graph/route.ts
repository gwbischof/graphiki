import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
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
