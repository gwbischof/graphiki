import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { proposals, auditLog } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-guard";
import {
  applyProposal,
  getNodeState,
  getEdgeState,
} from "@/lib/graph-mutations";

export async function POST(request: NextRequest) {
  const { user, error } = await requireRole("admin");
  if (error) return error;

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
      authorId: user!.id,
      reviewerId: user!.id,
      reviewedAt: new Date(),
    })
    .returning();

  // Apply immediately
  const result = await applyProposal(row, user!.id);

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
    userId: user!.id,
    targetNodeId: row.targetNodeId,
    targetEdgeId: row.targetEdgeId,
    dataBefore,
    dataAfter: row.dataAfter,
    cypherExecuted: result.cypher,
  });

  return NextResponse.json({ proposal: row, applied: result }, { status: 201 });
}
