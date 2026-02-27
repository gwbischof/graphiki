import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { proposals, auditLog } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { requireAdmin } from "@/lib/admin-auth";
import {
  applyProposal,
  getNodeState,
  getEdgeState,
} from "@/lib/graph-mutations";

export async function POST(request: NextRequest) {
  // Direct-edit needs a user identity for audit trail.
  // Allow admin key to bypass role check, but still try to resolve user.
  const { user, error } = await requireRole("admin");
  if (error) {
    // No valid session/Bearer — check admin key as fallback
    const { error: adminError } = await requireAdmin(request);
    if (adminError) return error;
  }

  const body = await request.json();
  const { type, targetNodeId, targetEdgeId, dataAfter, reason } = body;

  if (!type || !reason) {
    return NextResponse.json(
      { error: "type and reason are required" },
      { status: 400 }
    );
  }

  // Fetch current state
  let dataBefore: Record<string, unknown> | null = null;
  if (targetNodeId && type.includes("node")) {
    dataBefore = await getNodeState(targetNodeId);
  } else if (targetEdgeId && type.includes("edge")) {
    dataBefore = await getEdgeState(targetEdgeId);
  }

  const userId = user?.id ?? "admin-key";

  // Create auto-approved proposal
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
      authorId: userId,
      reviewerId: userId,
      reviewedAt: new Date(),
    })
    .returning();

  // Apply immediately
  const result = await applyProposal(row, userId);

  // Write direct-edit audit entry
  const actionMap: Record<string, string> = {
    "add-node": "direct_add_node",
    "edit-node": "direct_edit_node",
    "delete-node": "direct_delete_node",
    "add-edge": "direct_add_edge",
    "edit-edge": "direct_edit_edge",
    "delete-edge": "direct_delete_edge",
  };

  await db.insert(auditLog).values({
    action: (actionMap[type] || "direct_edit_node") as typeof auditLog.$inferInsert.action,
    proposalId: row.id,
    userId,
    targetNodeId: row.targetNodeId,
    targetEdgeId: row.targetEdgeId,
    dataBefore,
    dataAfter: row.dataAfter,
    cypherExecuted: result.cypher,
  });

  return NextResponse.json({ proposal: row, applied: result }, { status: 201 });
}
