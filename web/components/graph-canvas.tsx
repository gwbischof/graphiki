"use client";

import { useEffect, useRef, useCallback } from "react";
import cytoscape, { Core, NodeSingular } from "cytoscape";
import type { CytoscapeElement, NodeData, EdgeData } from "@/lib/graph-data";
import type { GraphConfig } from "@/lib/graph-config";
import { buildCytoscapeStyles } from "@/lib/graph-config";

interface GraphCanvasProps {
  elements: CytoscapeElement[];
  searchQuery: string;
  activeSubtypes: Map<string, Set<string>>;
  activeEdgeTypes: Set<string>;
  onNodeSelect: (node: NodeData | null, edges: EdgeData[]) => void;
  cyRef: React.MutableRefObject<Core | null>;
  config: GraphConfig;
}

export function GraphCanvas({
  elements,
  searchQuery,
  activeSubtypes,
  activeEdgeTypes,
  onNodeSelect,
  cyRef,
  config,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const initCy = useCallback(() => {
    if (!containerRef.current || elements.length === 0) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements as cytoscape.ElementDefinition[],
      style: buildCytoscapeStyles(config),
      layout: {
        name: "cose",
        animate: false,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 120,
        edgeElasticity: () => 100,
        gravity: 0.3,
        numIter: 500,
        padding: 60,
      } as cytoscape.CoseLayoutOptions,
      minZoom: 0.15,
      maxZoom: 4,
      wheelSensitivity: 0.3,
      pixelRatio: "auto",
      selectionType: "single",
    });

    cy.on("tap", "node", (evt) => {
      const node = evt.target as NodeSingular;
      const nodeData = node.data() as NodeData;
      const connectedEdges = node.connectedEdges().map((e) => e.data() as EdgeData);

      // Highlight connected
      cy.elements().removeClass("connected dimmed");
      const neighborhood = node.neighborhood().add(node);
      cy.elements().not(neighborhood).addClass("dimmed");
      neighborhood.addClass("connected");
      node.removeClass("dimmed connected");

      onNodeSelect(nodeData, connectedEdges);
    });

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass("connected dimmed");
        onNodeSelect(null, []);
      }
    });

    cyRef.current = cy;
  }, [elements, onNodeSelect, cyRef, config]);

  // Init
  useEffect(() => {
    initCy();
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [initCy]);

  // Search highlighting
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.nodes().removeClass("search-match");
    if (!searchQuery.trim()) return;

    const q = searchQuery.toLowerCase();
    cy.nodes().forEach((node) => {
      const label = (node.data("label") as string || "").toLowerCase();
      const id = (node.data("id") as string || "").toLowerCase();
      const notes = (node.data("notes") as string || "").toLowerCase();
      if (label.includes(q) || id.includes(q) || notes.includes(q)) {
        node.addClass("search-match");
      }
    });
  }, [searchQuery, cyRef]);

  // Filtering by subtype and edge type — generalized for all node types
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.nodes().forEach((node) => {
      const nodeType = node.data("node_type") as string;
      const ntConfig = config.nodeTypes[nodeType];

      if (ntConfig) {
        const subtypeField = ntConfig.subtypeField;
        const subtypeValue = node.data(subtypeField) as string;
        const activeSet = activeSubtypes.get(nodeType);

        if (activeSet && subtypeValue && !activeSet.has(subtypeValue)) {
          node.addClass("filtered-out");
        } else {
          node.removeClass("filtered-out");
        }
      } else {
        // Unknown node type — keep visible
        node.removeClass("filtered-out");
      }
    });

    // Edges: filter by type, and also hide if either endpoint is hidden
    cy.edges().forEach((edge) => {
      const edgeType = edge.data("edge_type") as string;
      const srcVisible = !edge.source().hasClass("filtered-out");
      const tgtVisible = !edge.target().hasClass("filtered-out");
      if (activeEdgeTypes.has(edgeType) && srcVisible && tgtVisible) {
        edge.removeClass("filtered-out");
      } else {
        edge.addClass("filtered-out");
      }
    });
  }, [activeSubtypes, activeEdgeTypes, cyRef, config]);

  return (
    <div
      ref={containerRef}
      className="cytoscape-container absolute inset-0"
      style={{ zIndex: 1 }}
    />
  );
}
