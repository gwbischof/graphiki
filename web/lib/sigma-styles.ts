// Sigma.js nodeReducer/edgeReducer functions driven by GraphConfig
// Replaces buildCytoscapeStyles for the Sigma renderer

import type { Attributes } from "graphology-types";
import type { GraphConfig } from "./graph-config";

// Map doc_count to node size (log scale, pixel-based)
function docCountToSize(count: number, multiplier = 1): number {
  if (count <= 0) return 3;
  const s = Math.log10(count + 1) * 2;
  return Math.max(3, Math.min(10, s * multiplier));
}

// Map config shapes to Sigma node types
// Sigma v3 only ships circle and point programs — map everything to circle
const SHAPE_MAP: Record<string, string> = {
  ellipse: "circle",
  diamond: "circle",
  hexagon: "circle",
  rectangle: "circle",
  triangle: "circle",
  star: "circle",
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
      borderColor: adjustAlpha(color, 0.35),
      borderSize: 1.5,
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
      result.borderColor = "#ffb847";
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
      result.borderColor = adjustAlpha(color, 0.6);
      result.borderSize = 2;
    }
    // Dimmed (not connected, not selected)
    else if (nodeState.dimmed && !nodeState.connected.has(node)) {
      result.color = adjustAlpha(color, 0.2);
      result.borderColor = adjustAlpha(color, 0.08);
      result.borderSize = 0;
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
      color: adjustAlpha(color, 0.65),
    };

    if (edgeState.filteredOut.has(_edge)) {
      result.hidden = true;
      return result;
    }

    if (edgeState.connected.has(_edge)) {
      result.size = 3;
      result.color = adjustAlpha(color, 0.95);
    } else if (edgeState.dimmed) {
      result.color = adjustAlpha(color, 0.12);
    }

    return result;
  };
}

// Custom hover renderer — dark background instead of Sigma's default white
export function drawDarkHover(
  context: CanvasRenderingContext2D,
  data: Record<string, unknown>,
  settings: Record<string, unknown>,
) {
  const label = data.label as string;
  if (!label) return;

  const size = (settings.labelSize as number) || 11;
  const font = (settings.labelFont as string) || "system-ui, sans-serif";
  const weight = (settings.labelWeight as string) || "normal";
  const x = data.x as number;
  const y = data.y as number;
  const nodeSize = data.size as number;

  context.font = `${weight} ${size}px ${font}`;
  const textWidth = context.measureText(label).width;

  const PADDING = 4;
  const boxWidth = Math.round(textWidth + 8);
  const boxHeight = Math.round(size + 2 * PADDING);
  const radius = Math.max(nodeSize, size / 2) + PADDING;

  const angleRadian = Math.asin(boxHeight / 2 / radius);
  const xDelta = Math.sqrt(Math.abs(radius * radius - (boxHeight / 2) * (boxHeight / 2)));

  // Dark background with subtle glow
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 12;
  context.shadowColor = "rgba(0,0,0,0.6)";
  context.fillStyle = "rgba(10, 13, 28, 0.92)";

  context.beginPath();
  context.moveTo(x + xDelta, y + boxHeight / 2);
  context.lineTo(x + radius + boxWidth, y + boxHeight / 2);
  context.lineTo(x + radius + boxWidth, y - boxHeight / 2);
  context.lineTo(x + xDelta, y - boxHeight / 2);
  context.arc(x, y, radius, angleRadian, -angleRadian);
  context.closePath();
  context.fill();

  // Subtle border
  context.strokeStyle = "rgba(255,255,255,0.12)";
  context.lineWidth = 1;
  context.stroke();

  // Reset shadow
  context.shadowBlur = 0;

  // Draw label text
  context.fillStyle = "#e8ecf8";
  context.fillText(label, x + nodeSize + 3, y + size / 3);
}

// Adjust hex color to include alpha as rgba
function adjustAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
