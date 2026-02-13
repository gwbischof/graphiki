// Re-export config-driven style utilities
// All colors, shapes, and Cytoscape styles are now in graph-config.ts
export {
  buildCytoscapeStyles,
  getNodeColor,
  getEdgeColor,
  getStatusStyle,
} from "./graph-config";
export type { GraphConfig } from "./graph-config";

// Map doc_count to node size (log scale) — layout concern, stays here
export function docCountToSize(count: number): number {
  if (count <= 0) return 12;
  const s = Math.log10(count + 1) * 10;
  return Math.max(12, Math.min(50, s));
}
