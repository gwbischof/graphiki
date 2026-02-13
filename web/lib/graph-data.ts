export interface NodeData {
  id: string;
  label: string;
  node_type: string;
  role?: string;
  org_type?: string;
  location_type?: string;
  network?: string;
  doc_count: number;
  status?: string;
  section?: number;
  notes?: string;
  // Allow config-driven subtype fields to be accessed dynamically
  [key: string]: unknown;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  edge_type: string;
  amount?: number;
  date?: string;
  description?: string;
  channel?: string;
  quote?: string;
  source_doc?: string;
  doc_url?: string;
  doc_id?: string;
  role?: string;
  stake?: string;
  confidence?: string;
}

export interface CytoscapeElement {
  group: "nodes" | "edges";
  data: NodeData | EdgeData;
}

export interface GraphData {
  elements: CytoscapeElement[];
}

export interface Proposal {
  id: string;
  type: "add-node" | "edit-node" | "delete-node" | "add-edge" | "edit-edge" | "delete-edge";
  data: Record<string, unknown>;
  author: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

// ── Community types ──

export interface CommunityNode {
  id: string;
  label: string;
  node_type: "_community";
  level: number;
  community_id: number;
  member_count: number;
  type_distribution: Record<string, number>;
  top_nodes: Array<{ id: string; label: string; doc_count: number }>;
  parent_community?: string;
  x?: number;
  y?: number;
  doc_count: number; // derived from member_count for size scaling
}

export interface InterCommunityEdge {
  id: string;
  source: string;
  target: string;
  edge_type: "_inter_community";
  edge_count: number;
}

// ── View types ──

export type ViewQuery =
  | { type: "structured"; nodeTypes?: string[]; filters?: Record<string, unknown>; hops?: number; centerNode?: string }
  | { type: "cypher"; cypher: string }
  | { type: "search"; q: string; filters?: Record<string, unknown> }
  | { type: "community"; communityId: string; level?: number };

export interface SavedView {
  slug: string;
  name: string;
  description?: string;
  query: ViewQuery;
  created_at: string;
  author?: string;
}

// ── Data loading ──

export async function loadGraphData(): Promise<GraphData> {
  const res = await fetch("/data/graph.json");
  if (!res.ok) throw new Error("Failed to load graph data");
  return res.json();
}
