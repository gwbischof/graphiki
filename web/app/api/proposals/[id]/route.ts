import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { proposals, users, auditLog } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { applyProposal } from "@/lib/graph-mutations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireRole("user");
  if (error) return error;

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
    .where(eq(proposals.id, id))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  return NextResponse.json({ proposal: rows[0] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, error } = await requireRole("mod");
  if (error) return error;

  const body = await request.json();
  const { status, reviewComment } = body;

  if (!status || !["approved", "rejected"].includes(status)) {
    return NextResponse.json(
      { error: 'status must be "approved" or "rejected"' },
      { status: 400 }
    );
  }

  // Fetch proposal
  const [proposal] = await db
    .select()
    .from(proposals)
    .where(eq(proposals.id, id))
    .limit(1);

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (proposal.status !== "pending") {
    return NextResponse.json(
      { error: `Proposal is already ${proposal.status}` },
      { status: 409 }
    );
  }

  // Update proposal
  const [updated] = await db
    .update(proposals)
    .set({
      status,
      reviewerId: user!.id,
      reviewedAt: new Date(),
      reviewComment: reviewComment || null,
    })
    .where(eq(proposals.id, id))
    .returning();

  // Write audit entry
  const auditAction =
    status === "approved" ? "proposal_approved" : "proposal_rejected";
  await db.insert(auditLog).values({
    action: auditAction as typeof auditLog.$inferInsert.action,
    proposalId: id,
    userId: user!.id,
    targetNodeId: proposal.targetNodeId,
    targetEdgeId: proposal.targetEdgeId,
  });

  // Auto-apply on approval
  let applyResult = null;
  if (status === "approved") {
    applyResult = await applyProposal(updated, user!.id);
  }

  return NextResponse.json({
    proposal: updated,
    applied: applyResult,
  });
}
