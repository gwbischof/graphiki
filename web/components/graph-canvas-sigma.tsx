"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import { type Settings } from "sigma/settings";
import forceAtlas2 from "graphology-layout-forceatlas2";
import type { CytoscapeElement, NodeData, EdgeData } from "@/lib/graph-data";
import type { GraphConfig } from "@/lib/graph-config";
import { cytoscapeToGraphology } from "@/lib/graph-adapter";
import {
  createNodeReducer,
  createEdgeReducer,
  drawDarkHover,
  type NodeState,
  type EdgeState,
} from "@/lib/sigma-styles";

interface GraphCanvasSigmaProps {
  elements: CytoscapeElement[];
  searchQuery: string;
  activeNodeTypes: Set<string>;
  activeSubtypes: Map<string, Set<string>>;
  activeEdgeTypes: Set<string>;
  onNodeSelect: (node: NodeData | null) => void;
  onEdgeSelect?: (edge: EdgeData, sourceNode: NodeData, targetNode: NodeData, allPairEdges: EdgeData[]) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  config: GraphConfig;
}

export function GraphCanvas({
  elements,
  searchQuery,
  activeNodeTypes,
  activeSubtypes,
  activeEdgeTypes,
  onNodeSelect,
  onEdgeSelect,
  onNodeDoubleClick,
  config,
}: GraphCanvasSigmaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const selectedRef = useRef<string | null>(null);

  // Build the graph from elements
  const graph = useMemo(() => {
    const g = cytoscapeToGraphology(elements);

    // If no positions set, run ForceAtlas2 synchronously for small graphs
    let hasPositions = false;
    g.forEachNode((_id, attrs) => {
      if (attrs.x !== undefined && attrs.y !== undefined) hasPositions = true;
    });

    if (!hasPositions) {
      // Group nodes by a grouping attribute (e.g. dataset) for clustered layout
      const groups = new Map<string, string[]>();
      g.forEachNode((id, attrs) => {
        const key = String(attrs.dataset ?? attrs.node_type ?? "default");
        let list = groups.get(key);
        if (!list) { list = []; groups.set(key, list); }
        list.push(id);
      });

      if (groups.size > 1) {
        // Arrange each group as a sphere, with spheres placed in a ring
        const sortedGroups = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
        const ringRadius = 200 + sortedGroups.length * 80;

        sortedGroups.forEach(([, nodeIds], i) => {
          // Position this group's center on a ring
          const angle = (i / sortedGroups.length) * 2 * Math.PI;
          const cx = ringRadius * Math.cos(angle);
          const cy = ringRadius * Math.sin(angle);

          // Sphere radius proportional to sqrt of node count
          const r = Math.max(40, Math.sqrt(nodeIds.length) * 3);

          for (const id of nodeIds) {
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            g.setNodeAttribute(id, "x", cx + r * Math.sin(phi) * Math.cos(theta));
            g.setNodeAttribute(id, "y", cy + r * Math.sin(phi) * Math.sin(theta));
          }
        });
      } else {
        // Single group: one sphere
        const R = 500;
        g.forEachNode((id) => {
          const theta = Math.random() * 2 * Math.PI;
          const phi = Math.acos(2 * Math.random() - 1);
          g.setNodeAttribute(id, "x", R * Math.sin(phi) * Math.cos(theta));
          g.setNodeAttribute(id, "y", R * Math.sin(phi) * Math.sin(theta));
        });
      }

      // Run ForceAtlas2 for layout (synchronous, fine for <5K nodes)
      if (g.order > 0 && g.order < 5000) {
        forceAtlas2.assign(g, {
          iterations: 100,
          settings: {
            gravity: 1,
            scalingRatio: 10,
            barnesHutOptimize: g.order > 500,
            strongGravityMode: true,
            slowDown: 5,
          },
        });
      }
    }

    return g;
  }, [elements]);

  // Edge coalescing: one visible edge per node pair
  const { hiddenEdges, pairCounts, pairEdgeKeys } = useMemo(() => {
    const pairMap = new Map<string, string[]>(); // pairKey -> edge keys
    graph.forEachEdge((key, attrs, source, target) => {
      const pairKey = source < target ? `${source}::${target}` : `${target}::${source}`;
      let list = pairMap.get(pairKey);
      if (!list) { list = []; pairMap.set(pairKey, list); }
      list.push(key);
    });

    const hidden = new Set<string>();
    const counts = new Map<string, number>();
    const edgeKeys = new Map<string, string[]>(); // pairKey -> all edge keys for click lookup

    for (const [pairKey, keys] of pairMap) {
      // Separate SUMMARY edges from real edges
      const realKeys: string[] = [];
      const summaryKeys: string[] = [];
      for (const k of keys) {
        const et = graph.getEdgeAttribute(k, "edge_type") as string;
        if (et === "SUMMARY") summaryKeys.push(k);
        else realKeys.push(k);
      }

      edgeKeys.set(pairKey, keys);

      if (realKeys.length > 0) {
        // Pick first real edge as representative, hide the rest + all SUMMARY edges
        const [rep, ...rest] = realKeys;
        for (const k of rest) hidden.add(k);
        for (const k of summaryKeys) hidden.add(k);
        counts.set(pairKey, realKeys.length);
        // Tag representative with pairKey for reducer lookup
        graph.setEdgeAttribute(rep, "_pairKey", pairKey);
      } else {
        // Only SUMMARY edges, no real edges — hide everything
        for (const k of summaryKeys) hidden.add(k);
        counts.set(pairKey, 0);
      }
    }

    return { hiddenEdges: hidden, pairCounts: counts, pairEdgeKeys: edgeKeys };
  }, [graph]);

  // Compute filtered-out sets
  const filteredOutNodes = useMemo(() => {
    const filtered = new Set<string>();
    graph.forEachNode((id, attrs) => {
      const nodeType = attrs.node_type as string;

      // Filter by node type
      if (!activeNodeTypes.has(nodeType)) {
        filtered.add(id);
        return;
      }

      // Filter by subtype (only for types that have subtypes configured)
      const ntConfig = config.nodeTypes[nodeType];
      if (ntConfig && Object.keys(ntConfig.subtypes).length > 0) {
        const subtypeField = ntConfig.subtypeField;
        const subtypeValue = attrs[subtypeField] as string;
        const activeSet = activeSubtypes.get(nodeType);
        if (activeSet && subtypeValue && !activeSet.has(subtypeValue)) {
          filtered.add(id);
        }
      }
    });
    return filtered;
  }, [graph, activeNodeTypes, activeSubtypes, config]);

  const filteredOutEdges = useMemo(() => {
    const filtered = new Set<string>();
    graph.forEachEdge((key, attrs, source, target) => {
      const edgeType = attrs.edge_type as string;
      // Internal types (prefixed with _) are always visible
      const isInternal = edgeType.startsWith("_");
      if (
        (!isInternal && !activeEdgeTypes.has(edgeType)) ||
        filteredOutNodes.has(source) ||
        filteredOutNodes.has(target)
      ) {
        filtered.add(key);
      }
    });
    return filtered;
  }, [graph, activeEdgeTypes, filteredOutNodes]);

  // Compute search matches
  const searchMatches = useMemo(() => {
    const matches = new Set<string>();
    if (!searchQuery.trim()) return matches;
    const q = searchQuery.toLowerCase();
    graph.forEachNode((id, attrs) => {
      const label = ((attrs.label as string) || "").toLowerCase();
      const nodeId = ((attrs.id as string) || id).toLowerCase();
      const notes = ((attrs.notes as string) || "").toLowerCase();
      if (label.includes(q) || nodeId.includes(q) || notes.includes(q)) {
        matches.add(id);
      }
    });
    return matches;
  }, [graph, searchQuery]);

  // Selection state
  const getSelectionState = useCallback(
    (selectedNodeId: string | null) => {
      const selected = new Set<string>();
      const connectedNodes = new Set<string>();
      const connectedEdges = new Set<string>();
      const isDimmed = !!selectedNodeId;

      if (selectedNodeId && graph.hasNode(selectedNodeId)) {
        selected.add(selectedNodeId);
        graph.forEachEdge(selectedNodeId, (edgeKey, _attrs, source, target) => {
          connectedEdges.add(edgeKey);
          connectedNodes.add(source);
          connectedNodes.add(target);
        });
      }

      const nodeState: NodeState = {
        selected,
        connected: connectedNodes,
        dimmed: isDimmed,
        searchMatches,
        filteredOut: filteredOutNodes,
      };

      const edgeState: EdgeState = {
        connected: connectedEdges,
        dimmed: isDimmed,
        filteredOut: filteredOutEdges,
        hiddenEdges,
        pairCounts,
      };

      return { nodeState, edgeState };
    },
    [graph, searchMatches, filteredOutNodes, filteredOutEdges, hiddenEdges, pairCounts]
  );

  // Initialize Sigma
  useEffect(() => {
    if (!containerRef.current || graph.order === 0) return;

    graphRef.current = graph;

    const { nodeState, edgeState } = getSelectionState(selectedRef.current);

    const settings: Partial<Settings> = {
      nodeReducer: createNodeReducer(config, nodeState),
      edgeReducer: createEdgeReducer(config, edgeState),
      renderLabels: true,
      labelFont: "system-ui, sans-serif",
      labelSize: 11,
      labelColor: { color: "#dde2f5" },
      labelRenderedSizeThreshold: 6,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      defaultDrawNodeHover: drawDarkHover as any,
      defaultEdgeType: "arrow",
      enableEdgeEvents: true,
      minCameraRatio: 0.05,
      maxCameraRatio: 10,
      itemSizesReference: "screen",
      stagePadding: 60,
    };

    const sigma = new Sigma(graph, containerRef.current, settings);
    sigmaRef.current = sigma;

    // Click node
    sigma.on("clickNode", ({ node }) => {
      selectedRef.current = node;
      const attrs = graph.getNodeAttributes(node);
      const nodeData = { id: node, ...attrs } as NodeData;
      onNodeSelect(nodeData);
      refreshReducers();
    });

    // Click edge — collect all edges for the node pair
    sigma.on("clickEdge", ({ edge }) => {
      if (!onEdgeSelect) return;
      const edgeAttrs = graph.getEdgeAttributes(edge);
      const source = graph.source(edge);
      const target = graph.target(edge);
      const sourceAttrs = graph.getNodeAttributes(source);
      const targetAttrs = graph.getNodeAttributes(target);
      const edgeData = { id: edge, source, target, edge_type: edgeAttrs.edge_type || "", ...edgeAttrs } as EdgeData;
      const sourceNode = { id: source, ...sourceAttrs } as NodeData;
      const targetNode = { id: target, ...targetAttrs } as NodeData;

      // Collect all edges for this node pair
      const pairKey = source < target ? `${source}::${target}` : `${target}::${source}`;
      const allKeys = pairEdgeKeys.get(pairKey) || [edge];
      const allPairEdges: EdgeData[] = allKeys.map((k) => {
        const attrs = graph.getEdgeAttributes(k);
        const s = graph.source(k);
        const t = graph.target(k);
        return { id: k, source: s, target: t, edge_type: attrs.edge_type || "", ...attrs } as EdgeData;
      });

      onEdgeSelect(edgeData, sourceNode, targetNode, allPairEdges);
    });

    // Double-click node (expand community)
    sigma.on("doubleClickNode", ({ node }) => {
      if (onNodeDoubleClick) {
        onNodeDoubleClick(node);
      }
    });

    // Click canvas (deselect)
    sigma.on("clickStage", () => {
      selectedRef.current = null;
      onNodeSelect(null);
      refreshReducers();
    });

    function refreshReducers() {
      const { nodeState: ns, edgeState: es } = getSelectionState(selectedRef.current);
      sigma.setSetting("nodeReducer", createNodeReducer(config, ns));
      sigma.setSetting("edgeReducer", createEdgeReducer(config, es));
    }

    return () => {
      sigma.kill();
      sigmaRef.current = null;
    };
  }, [graph, config, getSelectionState, onNodeSelect, onEdgeSelect, onNodeDoubleClick]);

  // Update reducers when filters/search change
  useEffect(() => {
    const sigma = sigmaRef.current;
    if (!sigma) return;

    const { nodeState, edgeState } = getSelectionState(selectedRef.current);
    sigma.setSetting("nodeReducer", createNodeReducer(config, nodeState));
    sigma.setSetting("edgeReducer", createEdgeReducer(config, edgeState));
  }, [config, getSelectionState]);

  return (
    <div
      ref={containerRef}
      className="sigma-container absolute inset-0"
      style={{ zIndex: 1 }}
    />
  );
}
