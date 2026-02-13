// Convert between CytoscapeElement[] wire format and Graphology graph instances

import Graph from "graphology";
import type { CytoscapeElement, NodeData, EdgeData } from "./graph-data";

export function cytoscapeToGraphology(elements: CytoscapeElement[]): Graph {
  const graph = new Graph({ multi: true, type: "directed", allowSelfLoops: true });

  // Add nodes first
  for (const el of elements) {
    if (el.group === "nodes") {
      const data = el.data as NodeData;
      if (!graph.hasNode(data.id)) {
        graph.addNode(data.id, { ...data });
      }
    }
  }

  // Add edges
  for (const el of elements) {
    if (el.group === "edges") {
      const data = el.data as EdgeData;
      // Only add edge if both endpoints exist
      if (graph.hasNode(data.source) && graph.hasNode(data.target)) {
        try {
          graph.addEdgeWithKey(data.id, data.source, data.target, { ...data });
        } catch {
          // Duplicate edge key — skip
        }
      }
    }
  }

  return graph;
}

export function graphologyToCytoscape(graph: Graph): CytoscapeElement[] {
  const elements: CytoscapeElement[] = [];

  graph.forEachNode((id, attrs) => {
    elements.push({
      group: "nodes",
      data: { id, ...attrs } as NodeData,
    });
  });

  graph.forEachEdge((key, attrs, source, target) => {
    elements.push({
      group: "edges",
      data: { id: key, source, target, ...attrs } as EdgeData,
    });
  });

  return elements;
}
