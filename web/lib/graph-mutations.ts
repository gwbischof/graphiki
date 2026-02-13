import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { proposals, auditLog } from "@/lib/db/schema";
import { writeQuery, runQuery } from "@/lib/memgraph";

type ProposalRow = typeof proposals.$inferSelect;

/** Fetch current node state from Memgraph */
export async function getNodeState(
  nodeId: string
): Promise<Record<string, unknown> | null> {
  const records = await runQuery(
    `MATCH (n) WHERE n.id = $id RETURN properties(n) AS props`,
    { id: nodeId }
  );
  if (records.length === 0) return null;
  const rec = records[0] as unknown as { get(key: string): unknown };
  return rec.get("props") as Record<string, unknown>;
}

/** Fetch current edge state from Memgraph */
export async function getEdgeState(
  edgeId: string
): Promise<Record<string, unknown> | null> {
  const records = await runQuery(
    `MATCH ()-[r]->() WHERE r.id = $id RETURN properties(r) AS props, startNode(r).id AS src, endNode(r).id AS tgt`,
    { id: edgeId }
  );
  if (records.length === 0) return null;
  const rec = records[0] as unknown as { get(key: string): unknown };
  return {
    ...(rec.get("props") as Record<string, unknown>),
    source: rec.get("src"),
    target: rec.get("tgt"),
  };
}

/** Build and execute Cypher for a proposal, update status, write audit log */
export async function applyProposal(
  proposal: ProposalRow,
  userId: string
): Promise<{ success: boolean; cypher: string; error?: string }> {
  let cypher = "";
  const params: Record<string, unknown> = {};
  const dataAfter = (proposal.dataAfter ?? {}) as Record<string, unknown>;

  try {
    switch (proposal.type) {
      case "add-node": {
        const label = (dataAfter.label as string) || "Unknown";
        const nodeType = (dataAfter.node_type as string) || "ENTITY";
        // Build property map excluding meta fields
        const props = { ...dataAfter };
        if (!props.id) props.id = proposal.targetNodeId || label.replace(/\s+/g, "_");
        cypher = `CREATE (n:${nodeType} $props) RETURN n`;
        params.props = props;
        break;
      }
      case "edit-node": {
        const setEntries = Object.entries(dataAfter)
          .filter(([k]) => k !== "id" && k !== "node_type")
          .map(([k]) => `n.${k} = $props.${k}`)
          .join(", ");
        if (!setEntries) {
          return { success: false, cypher: "", error: "No properties to update" };
        }
        cypher = `MATCH (n) WHERE n.id = $nodeId SET ${setEntries} RETURN n`;
        params.nodeId = proposal.targetNodeId;
        params.props = dataAfter;
        break;
      }
      case "delete-node": {
        cypher = `MATCH (n) WHERE n.id = $nodeId DETACH DELETE n`;
        params.nodeId = proposal.targetNodeId;
        break;
      }
      case "add-edge": {
        const edgeType = (dataAfter.edge_type as string) || "CONNECTED_TO";
        const source = dataAfter.source as string;
        const target = dataAfter.target as string;
        const edgeProps = { ...dataAfter };
        delete edgeProps.source;
        delete edgeProps.target;
        delete edgeProps.edge_type;
        cypher = `MATCH (a), (b) WHERE a.id = $src AND b.id = $tgt CREATE (a)-[r:${edgeType} $props]->(b) RETURN r`;
        params.src = source;
        params.tgt = target;
        params.props = edgeProps;
        break;
      }
      case "edit-edge": {
        const setEdge = Object.entries(dataAfter)
          .filter(([k]) => !["id", "source", "target", "edge_type"].includes(k))
          .map(([k]) => `r.${k} = $props.${k}`)
          .join(", ");
        if (!setEdge) {
          return { success: false, cypher: "", error: "No properties to update" };
        }
        cypher = `MATCH ()-[r]->() WHERE r.id = $edgeId SET ${setEdge} RETURN r`;
        params.edgeId = proposal.targetEdgeId;
        params.props = dataAfter;
        break;
      }
      case "delete-edge": {
        cypher = `MATCH ()-[r]->() WHERE r.id = $edgeId DELETE r`;
        params.edgeId = proposal.targetEdgeId;
        break;
      }
    }

    await writeQuery(cypher, params);

    // Mark applied
    await db
      .update(proposals)
      .set({ status: "applied", appliedAt: new Date() })
      .where(eq(proposals.id, proposal.id));

    // Write audit entry
    await db.insert(auditLog).values({
      action: "proposal_applied",
      proposalId: proposal.id,
      userId,
      targetNodeId: proposal.targetNodeId,
      targetEdgeId: proposal.targetEdgeId,
      dataBefore: proposal.dataBefore,
      dataAfter: proposal.dataAfter,
      cypherExecuted: cypher,
    });

    return { success: true, cypher };
  } catch (err) {
    const errorMsg = String(err);

    await db
      .update(proposals)
      .set({ status: "failed", errorMessage: errorMsg })
      .where(eq(proposals.id, proposal.id));

    await db.insert(auditLog).values({
      action: "proposal_failed",
      proposalId: proposal.id,
      userId,
      targetNodeId: proposal.targetNodeId,
      targetEdgeId: proposal.targetEdgeId,
      cypherExecuted: cypher,
    });

    return { success: false, cypher, error: errorMsg };
  }
}
