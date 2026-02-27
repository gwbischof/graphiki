// All Cypher queries in one place
// Used by API routes to query Neo4j

import { runQuery, writeQuery, isNeo4jAvailable } from "./neo4j";
import type { CytoscapeElement, NodeData, EdgeData, SavedView, ViewQuery } from "./graph-data";
import { Record as Neo4jRecord } from "neo4j-driver";

// ── Helpers ──

function toNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (val && typeof val === "object" && "toNumber" in val) {
    return (val as { toNumber: () => number }).toNumber();
  }
  return Number(val) || 0;
}

const META_LABELS = new Set(["efta", "available", "missing"]);

function nodeToData(node: Record<string, unknown>, labels?: string[]): NodeData {
  const props = node as Record<string, unknown>;
  let nodeType = String(props.node_type || "");
  if (!nodeType && labels) {
    nodeType = labels.find(l => !META_LABELS.has(l)) || "Unknown";
  }
  return {
    ...props,
    id: String(props.id || ""),
    label: String(props.label || props.name || props.id || ""),
    node_type: nodeType || "Unknown",
    doc_count: toNumber(props.doc_count),
  } as NodeData;
}

function edgeToData(
  rel: Record<string, unknown>,
  sourceId: string,
  targetId: string,
  relType: string
): EdgeData {
  const props = rel as Record<string, unknown>;
  return {
    id: String(props.id || `${sourceId}-${relType}-${targetId}`),
    source: sourceId,
    target: targetId,
    edge_type: relType,
    ...props,
  } as EdgeData;
}

// ── Stats ──

export async function getGraphStats(): Promise<{
  nodeCount: number;
  edgeCount: number;
  nodeTypes: Record<string, number>;
  edgeTypes: Record<string, number>;
}> {
  if (!isNeo4jAvailable()) {
    return { nodeCount: 0, edgeCount: 0, nodeTypes: {}, edgeTypes: {} };
  }

  const nodeResult = await runQuery("MATCH (n) RETURN count(n) as count");
  const edgeResult = await runQuery("MATCH ()-[r]->() RETURN count(r) as count");

  const nodeTypeResult = await runQuery(
    "MATCH (n) RETURN n.node_type as type, count(n) as count ORDER BY count DESC"
  );
  const edgeTypeResult = await runQuery(
    "MATCH ()-[r]->() RETURN type(r) as type, count(r) as count ORDER BY count DESC"
  );

  const nodeTypes: Record<string, number> = {};
  for (const rec of nodeTypeResult) {
    const r = rec as unknown as Neo4jRecord;
    const type = r.get("type");
    if (type) nodeTypes[String(type)] = toNumber(r.get("count"));
  }

  const edgeTypes: Record<string, number> = {};
  for (const rec of edgeTypeResult) {
    const r = rec as unknown as Neo4jRecord;
    const type = r.get("type");
    if (type) edgeTypes[String(type)] = toNumber(r.get("count"));
  }

  return {
    nodeCount: toNumber((nodeResult[0] as unknown as Neo4jRecord)?.get("count")),
    edgeCount: toNumber((edgeResult[0] as unknown as Neo4jRecord)?.get("count")),
    nodeTypes,
    edgeTypes,
  };
}

// ── Search ──

export async function searchNodes(
  q: string,
  limit = 20,
  nodeTypes?: string[]
): Promise<CytoscapeElement[]> {
  if (!isNeo4jAvailable()) return [];

  let cypher: string;
  const params: Record<string, unknown> = { q: `(?i).*${q}.*`, limit };

  if (nodeTypes && nodeTypes.length > 0) {
    cypher = `
      MATCH (n)
      WHERE n.node_type IN $nodeTypes
        AND (n.label =~ $q OR n.id =~ $q OR n.name =~ $q OR coalesce(n.notes, '') =~ $q)
      RETURN n
      LIMIT $limit
    `;
    params.nodeTypes = nodeTypes;
  } else {
    cypher = `
      MATCH (n)
      WHERE n.label =~ $q OR n.id =~ $q OR n.name =~ $q OR coalesce(n.notes, '') =~ $q
      RETURN n
      LIMIT $limit
    `;
  }

  const records = await runQuery(cypher, params);
  return records.map((rec) => {
    const r = rec as unknown as Neo4jRecord;
    const node = r.get("n");
    return {
      group: "nodes" as const,
      data: nodeToData(node.properties, node.labels),
    };
  });
}

// ── Node + Neighborhood ──

export async function getNodeWithNeighborhood(
  nodeId: string,
  hops = 1,
  limit = 100
): Promise<CytoscapeElement[]> {
  if (!isNeo4jAvailable()) return [];

  const cypher = `
    MATCH (center {id: $nodeId})
    OPTIONAL MATCH path = (center)-[*1..${Math.min(hops, 3)}]-(neighbor)
    WITH center, collect(DISTINCT neighbor) AS neighbors,
         [r IN relationships(path) | r] AS allRels
    UNWIND (neighbors + [center]) AS n
    WITH DISTINCT n, allRels
    RETURN n
    LIMIT $limit
  `;
  const params = { nodeId, limit };

  const nodeRecords = await runQuery(cypher, params);
  const elements: CytoscapeElement[] = [];
  const nodeIds = new Set<string>();

  for (const rec of nodeRecords) {
    const r = rec as unknown as Neo4jRecord;
    const node = r.get("n");
    if (node && node.properties) {
      const data = nodeToData(node.properties, node.labels);
      if (!nodeIds.has(data.id)) {
        nodeIds.add(data.id);
        elements.push({ group: "nodes", data });
      }
    }
  }

  // Fetch edges between these nodes
  if (nodeIds.size > 0) {
    const edgeCypher = `
      MATCH (a)-[r]->(b)
      WHERE a.id IN $ids AND b.id IN $ids
      RETURN a.id AS source, b.id AS target, type(r) AS relType, properties(r) AS props
      LIMIT $edgeLimit
    `;
    const edgeRecords = await runQuery(edgeCypher, {
      ids: Array.from(nodeIds),
      edgeLimit: limit * 3,
    });

    for (const rec of edgeRecords) {
      const r = rec as unknown as Neo4jRecord;
      const sourceId = String(r.get("source"));
      const targetId = String(r.get("target"));
      const relType = String(r.get("relType"));
      const props = r.get("props") || {};
      elements.push({
        group: "edges",
        data: edgeToData(props, sourceId, targetId, relType),
      });
    }
  }

  return elements;
}

// ── Subgraph query (for views) ──

export async function executeViewQuery(
  query: ViewQuery,
  limit = 5000
): Promise<CytoscapeElement[]> {
  if (!isNeo4jAvailable()) return [];

  let cypher: string;
  const params: Record<string, unknown> = { limit };

  switch (query.type) {
    case "search":
      return searchNodes(query.q, limit, query.filters?.nodeTypes as string[] | undefined);

    case "structured": {
      const conditions: string[] = [];
      if (query.nodeTypes && query.nodeTypes.length > 0) {
        conditions.push("n.node_type IN $nodeTypes");
        params.nodeTypes = query.nodeTypes;
      }
      if (query.filters) {
        for (const [key, value] of Object.entries(query.filters)) {
          const paramKey = `filter_${key}`;
          conditions.push(`n.${key} = $${paramKey}`);
          params[paramKey] = value;
        }
      }

      if (query.centerNode) {
        params.centerId = query.centerNode;
        const hops = Math.min(query.hops || 1, 3);
        cypher = `
          MATCH (center {id: $centerId})
          MATCH path = (center)-[*1..${hops}]-(n)
          ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
          WITH DISTINCT n
          LIMIT $limit
          MATCH (a)-[r]->(b)
          WHERE (a = n OR b = n) AND a.id IS NOT NULL AND b.id IS NOT NULL
          RETURN DISTINCT a, r, b
          LIMIT $limit
        `;
      } else {
        cypher = `
          MATCH (n)
          ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
          WITH n LIMIT $limit
          OPTIONAL MATCH (n)-[r]-(m)
          RETURN n, r, m
          LIMIT $limit
        `;
      }
      break;
    }

    case "community":
      cypher = `
        MATCH (c:Community {id: $communityId})
        MATCH (n)-[:BELONGS_TO]->(c)
        WITH collect(n) AS members
        UNWIND members AS n
        OPTIONAL MATCH (n)-[r]-(m) WHERE m IN members
        RETURN n, r, m
        LIMIT $limit
      `;
      params.communityId = query.communityId;
      break;

    case "cypher":
      // Sanitize: always append LIMIT if not present
      cypher = query.cypher;
      if (!/LIMIT\s+\d+/i.test(cypher)) {
        cypher += ` LIMIT ${limit}`;
      }
      break;

    default:
      return [];
  }

  const records = await runQuery(cypher, params);
  const elements: CytoscapeElement[] = [];
  const seenNodes = new Set<string>();
  const seenEdges = new Set<string>();

  for (const rec of records) {
    const r = rec as unknown as Neo4jRecord;

    // Try to extract nodes (a/n) and edges (r) from various return shapes
    for (const key of r.keys) {
      const val = r.get(key);
      if (!val) continue;

      // Node
      if (val.properties && val.labels) {
        const data = nodeToData(val.properties, val.labels);
        if (!seenNodes.has(data.id)) {
          seenNodes.add(data.id);
          elements.push({ group: "nodes", data });
        }
      }
      // Relationship
      else if (val.type && val.start && val.end && val.properties) {
        const sourceId = String(val.start.properties?.id || val.startNodeElementId);
        const targetId = String(val.end.properties?.id || val.endNodeElementId);
        const edgeId = `${sourceId}-${val.type}-${targetId}`;
        if (!seenEdges.has(edgeId)) {
          seenEdges.add(edgeId);
          elements.push({
            group: "edges",
            data: edgeToData(val.properties, sourceId, targetId, val.type),
          });
        }
      }
    }
  }

  return elements;
}

// ── All nodes (homepage) ──

export async function getAllNodes(perTypeLimit = 50000): Promise<CytoscapeElement[]> {
  if (!isNeo4jAvailable()) return [];
  // Get distinct node labels, then query each type with its own limit
  // so no single type dominates the results
  const labelRecords = await runQuery(
    "CALL db.labels() YIELD label RETURN label"
  );
  const skipLabels = new Set(["efta", "available", "missing", "View", "Community"]);
  const nodeLabels = labelRecords
    .map(r => String((r as unknown as Neo4jRecord).get("label")))
    .filter(l => !skipLabels.has(l));

  const allRecords = (await Promise.all(
    nodeLabels.map(l =>
      runQuery(
        `MATCH (n:\`${l}\`) RETURN n.id AS id, n.label AS label, n.name AS name,
         n.node_type AS node_type, n.dataset AS dataset, n.doc_count AS doc_count,
         labels(n) AS labels LIMIT $limit`,
        { limit: perTypeLimit }
      )
    )
  )).flat();

  // Deduplicate nodes that appear under multiple labels
  const seen = new Set<string>();
  const records = allRecords.filter(rec => {
    const id = String((rec as unknown as Neo4jRecord).get("id"));
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return records.map(rec => {
    const r = rec as unknown as Neo4jRecord;
    const props: Record<string, unknown> = {
      id: r.get("id"),
      label: r.get("label"),
      name: r.get("name"),
      node_type: r.get("node_type"),
      dataset: r.get("dataset"),
      doc_count: r.get("doc_count"),
    };
    const labels = r.get("labels") as string[] | undefined;
    return { group: "nodes" as const, data: nodeToData(props, labels) };
  });
}

// ── Communities ──

export async function getCommunities(
  level = 0,
  limit = 200
): Promise<CytoscapeElement[]> {
  if (!isNeo4jAvailable()) return [];

  const nodeRecords = await runQuery(
    `MATCH (c:Community {level: $level})
     RETURN c
     ORDER BY c.member_count DESC
     LIMIT $limit`,
    { level, limit }
  );

  const elements: CytoscapeElement[] = [];
  const communityIds: string[] = [];

  for (const rec of nodeRecords) {
    const r = rec as unknown as Neo4jRecord;
    const props = r.get("c").properties;
    const id = String(props.id);
    communityIds.push(id);

    let topNodes: Array<{ id: string; label: string; doc_count: number }> = [];
    let typeDist: Record<string, number> = {};
    try {
      topNodes = JSON.parse(String(props.top_nodes || "[]"));
    } catch { /* ignore */ }
    try {
      typeDist = JSON.parse(String(props.type_distribution || "{}"));
    } catch { /* ignore */ }

    elements.push({
      group: "nodes",
      data: {
        id,
        label: topNodes[0]?.label || `Community ${props.community_id}`,
        node_type: "_community",
        level: toNumber(props.level),
        community_id: toNumber(props.community_id),
        member_count: toNumber(props.member_count),
        type_distribution: typeDist,
        top_nodes: topNodes,
        doc_count: toNumber(props.member_count),
        x: props.x !== undefined ? toNumber(props.x) : undefined,
        y: props.y !== undefined ? toNumber(props.y) : undefined,
      } as NodeData,
    });
  }

  // Get inter-community edges
  if (communityIds.length > 0) {
    const edgeRecords = await runQuery(
      `MATCH (c1:Community {level: $level})-[r:INTER_COMMUNITY]->(c2:Community {level: $level})
       WHERE c1.id IN $ids AND c2.id IN $ids
       RETURN c1.id AS source, c2.id AS target, r.edge_count AS edge_count`,
      { level, ids: communityIds }
    );

    for (const rec of edgeRecords) {
      const r = rec as unknown as Neo4jRecord;
      const source = String(r.get("source"));
      const target = String(r.get("target"));
      elements.push({
        group: "edges",
        data: {
          id: `${source}-inter-${target}`,
          source,
          target,
          edge_type: "_inter_community",
          edge_count: toNumber(r.get("edge_count")),
        } as EdgeData,
      });
    }
  }

  return elements;
}

export async function getCommunityMembers(
  communityId: string,
  limit = 5000
): Promise<CytoscapeElement[]> {
  if (!isNeo4jAvailable()) return [];

  // Get member nodes
  const nodeRecords = await runQuery(
    `MATCH (n)-[:BELONGS_TO]->(c:Community {id: $communityId})
     RETURN n
     LIMIT $limit`,
    { communityId, limit }
  );

  const elements: CytoscapeElement[] = [];
  const nodeIds: string[] = [];

  for (const rec of nodeRecords) {
    const r = rec as unknown as Neo4jRecord;
    const node = r.get("n");
    const data = nodeToData(node.properties, node.labels);
    nodeIds.push(data.id);
    elements.push({ group: "nodes", data });
  }

  // Get edges between members
  if (nodeIds.length > 0) {
    const edgeRecords = await runQuery(
      `MATCH (a)-[r]->(b)
       WHERE a.id IN $ids AND b.id IN $ids AND type(r) <> 'BELONGS_TO'
       RETURN a.id AS source, b.id AS target, type(r) AS relType, properties(r) AS props
       LIMIT $edgeLimit`,
      { ids: nodeIds, edgeLimit: limit * 3 }
    );

    for (const rec of edgeRecords) {
      const r = rec as unknown as Neo4jRecord;
      const source = String(r.get("source"));
      const target = String(r.get("target"));
      const relType = String(r.get("relType"));
      const props = r.get("props") || {};
      elements.push({
        group: "edges",
        data: edgeToData(props, source, target, relType),
      });
    }
  }

  return elements;
}

// ── Views CRUD ──

export async function listViews(): Promise<SavedView[]> {
  if (!isNeo4jAvailable()) return [];

  const records = await runQuery(
    "MATCH (v:View) RETURN v ORDER BY v.created_at DESC"
  );
  return records.map((rec) => {
    const r = rec as unknown as Neo4jRecord;
    const props = r.get("v").properties;
    return {
      slug: String(props.slug),
      name: String(props.name),
      description: props.description ? String(props.description) : undefined,
      query: JSON.parse(String(props.query)),
      created_at: String(props.created_at),
      author: props.author ? String(props.author) : undefined,
    } as SavedView;
  });
}

export async function getView(slug: string): Promise<SavedView | null> {
  if (!isNeo4jAvailable()) return null;

  const records = await runQuery(
    "MATCH (v:View {slug: $slug}) RETURN v",
    { slug }
  );
  if (records.length === 0) return null;

  const r = records[0] as unknown as Neo4jRecord;
  const props = r.get("v").properties;
  return {
    slug: String(props.slug),
    name: String(props.name),
    description: props.description ? String(props.description) : undefined,
    query: JSON.parse(String(props.query)),
    created_at: String(props.created_at),
    author: props.author ? String(props.author) : undefined,
  };
}

export async function createView(view: SavedView): Promise<SavedView> {
  await writeQuery(
    `CREATE (v:View {
      slug: $slug,
      name: $name,
      description: $description,
      query: $query,
      created_at: $created_at,
      author: $author
    })`,
    {
      slug: view.slug,
      name: view.name,
      description: view.description || "",
      query: JSON.stringify(view.query),
      created_at: view.created_at || new Date().toISOString(),
      author: view.author || "",
    }
  );
  return view;
}

export async function deleteView(slug: string): Promise<boolean> {
  const records = await writeQuery(
    "MATCH (v:View {slug: $slug}) DELETE v RETURN count(v) as deleted",
    { slug }
  );
  const r = records[0] as unknown as Neo4jRecord;
  return toNumber(r?.get("deleted")) > 0;
}
