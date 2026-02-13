import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-guard";

export async function POST(request: NextRequest) {
  const { user, error } = await requireRole("admin");
  if (error) return error;

  const body = await request.json();
  const { targetNodeId, targetEdgeId, from, to, summary } = body;

  if (!summary) {
    return NextResponse.json(
      { error: "summary is required" },
      { status: 400 }
    );
  }

  // Build conditions for entries to squash
  const conditions = [];
  if (targetNodeId) conditions.push(eq(auditLog.targetNodeId, targetNodeId));
  if (targetEdgeId) conditions.push(eq(auditLog.targetEdgeId, targetEdgeId));
  if (from) conditions.push(gte(auditLog.createdAt, new Date(from)));
  if (to) conditions.push(lte(auditLog.createdAt, new Date(to)));
  // Only squash entries that aren't already squashed
  conditions.push(isNull(auditLog.squashedIntoId));

  if (conditions.length < 2) {
    // Need at least one filter besides the isNull check
    return NextResponse.json(
      { error: "Provide targetNodeId, targetEdgeId, or date range to scope the squash" },
      { status: 400 }
    );
  }

  const where = and(...conditions);

  // Count entries to squash
  const entriesToSquash = await db
    .select({ id: auditLog.id })
    .from(auditLog)
    .where(where);

  if (entriesToSquash.length === 0) {
    return NextResponse.json(
      { error: "No entries match the squash criteria" },
      { status: 404 }
    );
  }

  // Create summary entry
  const [summaryEntry] = await db
    .insert(auditLog)
    .values({
      action: "squash",
      userId: user!.id,
      targetNodeId: targetNodeId || null,
      targetEdgeId: targetEdgeId || null,
      squashSummary: summary,
      squashedCount: entriesToSquash.length,
    })
    .returning();

  // Mark all matched entries as squashed
  await db
    .update(auditLog)
    .set({ squashedIntoId: summaryEntry.id })
    .where(where);

  return NextResponse.json({
    squashEntry: summaryEntry,
    squashedCount: entriesToSquash.length,
  });
}
