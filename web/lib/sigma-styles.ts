// Sigma.js nodeReducer/edgeReducer functions driven by GraphConfig
// Replaces buildCytoscapeStyles for the Sigma renderer

import type { Attributes } from "graphology-types";
import type { GraphConfig } from "./graph-config";

// Map doc_count to node size (log scale)
function docCountToSize(count: number, multiplier = 1): number {
  if (count <= 0) return 4;
  const s = Math.log10(count + 1) * 4;
  return Math.max(4, Math.min(20, s * multiplier));
}

// Map config shapes to Sigma node types
const SHAPE_MAP: Record<string, string> = {
  ellipse: "circle",
  diamond: "diamond",
  hexagon: "hexagon",
  rectangle: "square",
  triangle: "triangle",
  star: "star",
};

export function getNodeColor(
  config: GraphConfig,
  nodeType: string,
  subtypeField: string,
  subtypeValue: string | undefined
): string {
  const nt = config.nodeTypes[nodeType];
  if (!nt) return "#565f89";
  if (subtypeValue && nt.subtypes[subtypeValue]) {
    return nt.subtypes[subtypeValue].color;
  }
  return nt.defaultColor;
}

export interface SigmaNodeDisplayData {
  label: string;
  size: number;
  color: string;
  type: string;
  x?: number;
  y?: number;
  hidden?: boolean;
  highlighted?: boolean;
  forceLabel?: boolean;
  zIndex?: number;
  borderColor?: string;
  borderSize?: number;
}

export interface SigmaEdgeDisplayData {
  label?: string;
  size: number;
  color: string;
  hidden?: boolean;
  type?: string;
  zIndex?: number;
}

export type NodeState = {
  selected: Set<string>;
  connected: Set<string>;
  dimmed: boolean; // true if any node is selected (so non-connected nodes dim)
  searchMatches: Set<string>;
  filteredOut: Set<string>;
};

export type EdgeState = {
  connected: Set<string>;
  dimmed: boolean;
  filteredOut: Set<string>;
};

export function createNodeReducer(config: GraphConfig, nodeState: NodeState) {
  return (node: string, data: Attributes): SigmaNodeDisplayData => {
    const nodeType = data.node_type as string;
    const ntConfig = config.nodeTypes[nodeType];
    const subtypeField = ntConfig?.subtypeField || "role";
    const subtypeValue = data[subtypeField] as string | undefined;

    const color = getNodeColor(config, nodeType, subtypeField, subtypeValue);
    const size = docCountToSize(data.doc_count || 0, ntConfig?.sizeMultiplier || 1);
    const shape = ntConfig ? (SHAPE_MAP[ntConfig.shape] || "circle") : "circle";

    const result: SigmaNodeDisplayData = {
      label: data.label || data.id || node,
      size,
      color,
      type: shape,
    };

    // Positions from server
    if (data.x !== undefined) result.x = data.x;
    if (data.y !== undefined) result.y = data.y;

    // Hidden if filtered out
    if (nodeState.filteredOut.has(node)) {
      result.hidden = true;
      return result;
    }

    // Search match highlighting
    if (nodeState.searchMatches.has(node)) {
      result.borderColor = "#ff9e64";
      result.borderSize = 3;
      result.forceLabel = true;
      result.zIndex = 998;
    }

    // Selected node
    if (nodeState.selected.has(node)) {
      result.highlighted = true;
      result.borderColor = "#ffffff";
      result.borderSize = 4;
      result.forceLabel = true;
      result.zIndex = 999;
    }
    // Connected to selected
    else if (nodeState.dimmed && nodeState.connected.has(node)) {
      result.forceLabel = true;
    }
    // Dimmed (not connected, not selected)
    else if (nodeState.dimmed && !nodeState.connected.has(node)) {
      result.color = adjustAlpha(color, 0.15);
      result.label = "";
    }

    return result;
  };
}

export function createEdgeReducer(config: GraphConfig, edgeState: EdgeState) {
  return (_edge: string, data: Attributes): SigmaEdgeDisplayData => {
    const edgeType = data.edge_type as string;
    const etConfig = config.edgeTypes[edgeType];
    const color = etConfig?.color || config.defaultEdgeColor;

    const result: SigmaEdgeDisplayData = {
      size: 1.5,
      color: adjustAlpha(color, 0.4),
    };

    if (edgeState.filteredOut.has(_edge)) {
      result.hidden = true;
      return result;
    }

    if (edgeState.connected.has(_edge)) {
      result.size = 2.5;
      result.color = adjustAlpha(color, 0.9);
    } else if (edgeState.dimmed) {
      result.color = adjustAlpha(color, 0.08);
    }

    return result;
  };
}

// Adjust hex color to include alpha as rgba
function adjustAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
