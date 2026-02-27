"use client";

import { motion } from "framer-motion";
import type { GraphConfig } from "@/lib/graph-config";
import type { CytoscapeElement, NodeData } from "@/lib/graph-data";

interface GraphLegendProps {
  config: GraphConfig;
  elements?: CytoscapeElement[];
}

/** Render an SVG shape icon for a Cytoscape shape name */
function ShapeIcon({ shape }: { shape: string }) {
  if (shape === "diamond") {
    return <span className="size-2 rotate-45 bg-muted-foreground/40" />;
  }
  if (shape === "hexagon") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10">
        <polygon
          points="5,0 9.33,2.5 9.33,7.5 5,10 0.67,7.5 0.67,2.5"
          fill="currentColor"
          className="text-muted-foreground/40"
        />
      </svg>
    );
  }
  // Default: ellipse → circle
  return <span className="size-2 rounded-full bg-muted-foreground/40" />;
}

export function GraphLegend({ config, elements }: GraphLegendProps) {
  // Compute which node types actually exist in the data
  const presentNodeTypes = new Set<string>();
  if (elements) {
    for (const el of elements) {
      if (el.group === "nodes") {
        const nt = (el.data as NodeData).node_type;
        if (nt) presentNodeTypes.add(nt);
      }
    }
  }

  // Build a flat list of subtypes only for present node types
  const allSubtypes = Object.entries(config.nodeTypes)
    .filter(([typeName]) => !elements || presentNodeTypes.has(typeName))
    .flatMap(([, nt]) =>
      Object.entries(nt.subtypes).map(([key, style]) => ({
        key,
        color: style.color,
        label: style.label || key,
      }))
    );

  // Shape legend only for present node types
  const visibleShapes = Object.entries(config.nodeTypes)
    .filter(([typeName]) => !elements || presentNodeTypes.has(typeName));

  if (allSubtypes.length === 0 && visibleShapes.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 28, stiffness: 200, delay: 0.4 }}
      className="glass-panel absolute bottom-3 left-1/2 -translate-x-1/2 z-10 rounded-xl px-4 py-2.5 flex items-center gap-5"
    >
      {/* Node subtypes */}
      {allSubtypes.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase mr-1">
            Types
          </span>
          {allSubtypes.map(({ key, color, label }) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      )}

      {allSubtypes.length > 0 && visibleShapes.length > 0 && (
        <div className="w-px h-4 bg-white/10" />
      )}

      {/* Shape legend — only present node types */}
      {visibleShapes.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase mr-1">
            Shape
          </span>
          {visibleShapes.map(([typeName, ntConfig]) => (
            <div key={typeName} className="flex items-center gap-1.5 ml-2 first:ml-0">
              <ShapeIcon shape={ntConfig.shape} />
              <span className="text-[10px] text-muted-foreground">{typeName}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
