// Graph configuration types and loader
// All node types, edge types, colors, and shapes are driven by graph-config.json

export interface SubtypeStyle {
  color: string;
  label: string;
}

export interface NodeTypeConfig {
  shape: string;
  sizeMultiplier: number;
  subtypeField: string;
  subtypes: Record<string, SubtypeStyle>;
  defaultColor: string;
}

export interface EdgeTypeConfig {
  color: string;
  label: string;
}

export interface StatusStyleConfig {
  color: string;
  label: string;
}

export interface CommunityStyleConfig {
  sizeScale: "log" | "linear";
  minSize: number;
  maxSize: number;
  colorBy: "dominant_type" | "level" | "fixed";
  fixedColor?: string;
  interEdgeColor: string;
  interEdgeMinWidth: number;
  interEdgeMaxWidth: number;
}

export interface GraphMetadata {
  datasetName?: string;
  nodeCount?: number;
  edgeCount?: number;
  lastUpdated?: string;
  generated?: boolean;
}

export interface SearchConfig {
  searchableFields: string[];
  resultLimit: number;
  debounceMs: number;
}

export interface GraphConfig {
  nodeTypes: Record<string, NodeTypeConfig>;
  edgeTypes: Record<string, EdgeTypeConfig>;
  statusStyles: Record<string, StatusStyleConfig>;
  defaultEdgeColor: string;
  communityStyles?: CommunityStyleConfig;
  metadata?: GraphMetadata;
  searchConfig?: SearchConfig;
}

export async function loadGraphConfig(): Promise<GraphConfig> {
  const res = await fetch("/data/graph-config.json");
  if (!res.ok) throw new Error("Failed to load graph config");
  return res.json();
}

/** Get the color for a node given its type and subtype value */
export function getNodeColor(
  config: GraphConfig,
  nodeType: string,
  subtypeValue: string | undefined
): string {
  const nt = config.nodeTypes[nodeType];
  if (!nt) return "#565f89";
  if (subtypeValue && nt.subtypes[subtypeValue]) {
    return nt.subtypes[subtypeValue].color;
  }
  return nt.defaultColor;
}

/** Get the color for an edge type */
export function getEdgeColor(config: GraphConfig, edgeType: string): string {
  return config.edgeTypes[edgeType]?.color || config.defaultEdgeColor;
}

/** Get Tailwind-compatible status badge classes */
export function getStatusStyle(config: GraphConfig, status: string): string {
  const style = config.statusStyles[status];
  if (!style) return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  const c = style.color;
  // Map color names to Tailwind color classes
  const map: Record<string, string> = {
    red: "bg-red-500/20 text-red-300 border-red-500/30",
    orange: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    yellow: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    zinc: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    green: "bg-green-500/20 text-green-300 border-green-500/30",
  };
  return map[c] || "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
}

// Map doc_count to node size (log scale)
function docCountToSize(count: number): number {
  if (count <= 0) return 12;
  const s = Math.log10(count + 1) * 10;
  return Math.max(12, Math.min(50, s));
}

/** Build all Cytoscape styles dynamically from config */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildCytoscapeStyles(config: GraphConfig): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles: any[] = [];

  // Generate a style block per node type
  for (const [typeName, ntConfig] of Object.entries(config.nodeTypes)) {
    const { shape, sizeMultiplier, subtypeField, subtypes, defaultColor } = ntConfig;

    const getColor = (subtypeVal: string): string =>
      subtypes[subtypeVal]?.color || defaultColor;

    styles.push({
      selector: `node[node_type='${typeName}']`,
      style: {
        label: "data(label)",
        ...(shape !== "ellipse" ? { shape } : {}),
        width: (ele: { data: (k: string) => number }) =>
          docCountToSize(ele.data("doc_count")) * sizeMultiplier,
        height: (ele: { data: (k: string) => number }) =>
          docCountToSize(ele.data("doc_count")) * sizeMultiplier,
        "background-color": (ele: { data: (k: string) => string }) =>
          getColor(ele.data(subtypeField)),
        "border-width": 2,
        "border-color": (ele: { data: (k: string) => string }) =>
          getColor(ele.data(subtypeField)),
        "border-opacity": 0.5,
        "background-opacity": typeName === "Person" ? 0.9 : 0.85,
        color: "#c0caf5",
        "font-size": typeName === "Person" ? "10px" : "9px",
        "font-family": "system-ui, sans-serif",
        "font-weight": 400,
        "text-valign": "bottom",
        "text-margin-y": 6,
        "text-outline-width": 2,
        "text-outline-color": "#0f0f1a",
        "text-outline-opacity": 0.8,
        "min-zoomed-font-size": 8,
        "overlay-opacity": 0,
      },
    });
  }

  // Edge styles
  styles.push({
    selector: "edge",
    style: {
      width: 1.5,
      "line-color": (ele: { data: (k: string) => string }) =>
        config.edgeTypes[ele.data("edge_type")]?.color || config.defaultEdgeColor,
      "target-arrow-color": (ele: { data: (k: string) => string }) =>
        config.edgeTypes[ele.data("edge_type")]?.color || config.defaultEdgeColor,
      "target-arrow-shape": "triangle",
      "arrow-scale": 0.8,
      "curve-style": "bezier",
      opacity: 0.4,
      "overlay-opacity": 0,
    },
  });

  // Interaction styles (static — not config-driven)
  styles.push(
    {
      selector: "node:selected",
      style: {
        "border-width": 4,
        "border-color": "#ffffff",
        "border-opacity": 1,
        "background-opacity": 1,
        "font-size": "12px",
        "font-weight": 600,
        "text-outline-width": 3,
        "z-index": 999,
      },
    },
    {
      selector: "node.connected",
      style: {
        "background-opacity": 1,
        "border-opacity": 0.8,
        "font-weight": 500,
      },
    },
    {
      selector: "node.dimmed",
      style: {
        "background-opacity": 0.15,
        "border-opacity": 0.1,
        color: "#565f89",
        "text-opacity": 0.3,
      },
    },
    {
      selector: "edge.connected",
      style: {
        opacity: 0.9,
        width: 2.5,
      },
    },
    {
      selector: "edge.dimmed",
      style: {
        opacity: 0.08,
      },
    },
    {
      selector: "node.search-match",
      style: {
        "border-width": 3,
        "border-color": "#ff9e64",
        "border-opacity": 1,
        "background-opacity": 1,
        "font-weight": 600,
        "z-index": 998,
      },
    },
    {
      selector: "node.filtered-out",
      style: {
        display: "none",
      },
    },
    {
      selector: "edge.filtered-out",
      style: {
        display: "none",
      },
    }
  );

  return styles;
}
