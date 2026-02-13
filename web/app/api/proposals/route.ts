import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { proposals, users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-guard";
import {
  applyProposal,
  getNodeState,
  getEdgeState,
} from "@/lib/graph-mutations";
import { auditLog } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const { error } = await requireRole("user");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

  const conditions = [];
  if (status) {
    conditions.push(eq(proposals.status, status as typeof proposals.status.enumValues[number]));
  }

  const rows = await db
    .select({
      id: proposals.id,
      type: proposals.type,
      status: proposals.status,
      targetNodeId: proposals.targetNodeId,
      targetEdgeId: proposals.targetEdgeId,
      dataBefore: proposals.dataBefore,
      dataAfter: proposals.dataAfter,
      reason: proposals.reason,
      authorId: proposals.authorId,
      authorName: users.name,
      reviewComment: proposals.reviewComment,
      createdAt: proposals.createdAt,
      reviewedAt: proposals.reviewedAt,
      appliedAt: proposals.appliedAt,
      errorMessage: proposals.errorMessage,
    })
    .from(proposals)
    .leftJoin(users, eq(proposals.authorId, users.id))
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(desc(proposals.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ proposals: rows });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireRole("user");
  if (error) return error;

  const body = await request.json();
  const {
    type,
    targetNodeId,
    targetEdgeId,
    dataAfter,
    reason,
    directApply,
  } = body;

  if (!type || !reason) {
    return NextResponse.json(
      { error: "type and reason are required" },
      { status: 400 }
    );
  }

  // Fetch current state for dataBefore
  let dataBefore: Record<string, unknown> | null = null;
  if (targetNodeId && type.includes("node")) {
    dataBefore = await getNodeState(targetNodeId);
  } else if (targetEdgeId && type.includes("edge")) {
    dataBefore = await getEdgeState(targetEdgeId);
  }

  // Admin direct apply
  if (directApply && user!.role === "admin") {
    const [row] = await db
      .insert(proposals)
      .values({
        type,
        status: "approved",
        targetNodeId: targetNodeId || null,
        targetEdgeId: targetEdgeId || null,
        dataBefore,
        dataAfter: dataAfter || {},
        reason,
        authorId: user!.id,
        reviewerId: user!.id,
        reviewedAt: new Date(),
      })
      .returning();

    const result = await applyProposal(row, user!.id);

    return NextResponse.json({ proposal: row, applied: result }, { status: 201 });
  }

  // Normal proposal
  const [row] = await db
    .insert(proposals)
    .values({
      type,
      status: "pending",
      targetNodeId: targetNodeId || null,
      targetEdgeId: targetEdgeId || null,
      dataBefore,
      dataAfter: dataAfter || {},
      reason,
      authorId: user!.id,
    })
    .returning();

  // Audit entry
  await db.insert(auditLog).values({
    action: "proposal_created",
    proposalId: row.id,
    userId: user!.id,
    targetNodeId: row.targetNodeId,
    targetEdgeId: row.targetEdgeId,
    dataAfter: row.dataAfter,
  });

  return NextResponse.json({ proposal: row }, { status: 201 });
}
