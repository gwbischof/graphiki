import { NextRequest, NextResponse } from "next/server";
import { desc, eq, and, gte, lte, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const { error } = await requireRole("mod");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");
  const targetNodeId = searchParams.get("targetNodeId");
  const action = searchParams.get("action");
  const userId = searchParams.get("userId");
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");
  const includeSquashed = searchParams.get("includeSquashed") === "true";

  const conditions = [];
  if (targetNodeId) conditions.push(eq(auditLog.targetNodeId, targetNodeId));
  if (action) conditions.push(eq(auditLog.action, action as typeof auditLog.$inferInsert.action));
  if (userId) conditions.push(eq(auditLog.userId, userId));
  if (fromDate) conditions.push(gte(auditLog.createdAt, new Date(fromDate)));
  if (toDate) conditions.push(lte(auditLog.createdAt, new Date(toDate)));
  if (!includeSquashed) conditions.push(isNull(auditLog.squashedIntoId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      proposalId: auditLog.proposalId,
      userId: auditLog.userId,
      userName: users.name,
      targetNodeId: auditLog.targetNodeId,
      targetEdgeId: auditLog.targetEdgeId,
      dataBefore: auditLog.dataBefore,
      dataAfter: auditLog.dataAfter,
      cypherExecuted: auditLog.cypherExecuted,
      squashSummary: auditLog.squashSummary,
      squashedCount: auditLog.squashedCount,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.userId, users.id))
    .where(where)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ entries: rows });
}
