"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchPanel } from "@/components/search-panel";
import { PathFinder } from "@/components/path-finder";
import { useMemo } from "react";
import type { GraphConfig } from "@/lib/graph-config";
import type { CytoscapeElement, NodeData, EdgeData } from "@/lib/graph-data";

interface ControlPanelProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeNodeTypes: Set<string>;
  onToggleNodeType: (nodeType: string) => void;
  activeSubtypes: Map<string, Set<string>>;
  onToggleSubtype: (nodeType: string, subtype: string) => void;
  activeEdgeTypes: Set<string>;
  onToggleEdgeType: (type: string) => void;
  onFit: () => void;
  onReset: () => void;
  nodeCount: number;
  edgeCount: number;
  config: GraphConfig;
  localElements?: CytoscapeElement[];
  onLocateNode?: (nodeId: string) => void;
  onExpandNode?: (nodeId: string) => void;
  onPathFound?: (elements: CytoscapeElement[]) => void;
}

function formatLabel(key: string) {
  return key
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ControlPanel({
  searchQuery,
  onSearchChange,
  activeNodeTypes,
  onToggleNodeType,
  activeSubtypes,
  onToggleSubtype,
  activeEdgeTypes,
  onToggleEdgeType,
  onFit,
  onReset,
  nodeCount,
  edgeCount,
  config,
  localElements,
  onLocateNode,
  onExpandNode,
  onPathFound,
}: ControlPanelProps) {
  // Compute which node types, subtypes, and edge types exist in the data
  const { presentNodeTypes, presentSubtypes, presentEdgeTypes } = useMemo(() => {
    const nodeTypes = new Set<string>();
    const subtypes = new Map<string, Set<string>>();
    const edgeTypes = new Set<string>();

    if (localElements) {
      for (const el of localElements) {
        if (el.group === "nodes") {
          const d = el.data as NodeData;
          const nt = d.node_type;
          if (nt) nodeTypes.add(nt);
          const ntConfig = config.nodeTypes[nt];
          if (ntConfig?.subtypeField) {
            const sv = d[ntConfig.subtypeField] as string;
            if (sv) {
              let s = subtypes.get(nt);
              if (!s) { s = new Set(); subtypes.set(nt, s); }
              s.add(sv);
            }
          }
        } else {
          const d = el.data as EdgeData;
          if (d.edge_type) edgeTypes.add(d.edge_type);
        }
      }
    }

    return { presentNodeTypes: nodeTypes, presentSubtypes: subtypes, presentEdgeTypes: edgeTypes };
  }, [localElements, config]);

  // Track open/closed state per section
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = { edges: true, pathfinder: false };
    for (const typeName of Object.keys(config.nodeTypes)) {
      init[typeName] = true;
    }
    return init;
  });

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 28, stiffness: 200, delay: 0.2 }}
      className="glass-panel absolute left-3 top-16 bottom-16 w-[260px] rounded-xl z-10 flex flex-col overflow-hidden"
    >
      {/* Search */}
      <div className="p-3 border-b border-white/5">
        <SearchPanel
          localElements={localElements}
          config={config}
          onLocate={onLocateNode || (() => {})}
          onExpand={onExpandNode || (() => {})}
          onSearchQueryChange={onSearchChange}
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Stats */}
          <div className="flex gap-3 text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
            <span>{nodeCount} nodes</span>
            <span className="text-white/10">|</span>
            <span>{edgeCount} edges</span>
          </div>

          {/* Node type filters — only for types present in data */}
          {presentNodeTypes.size > 0 && (
            <div>
              <button
                onClick={() => toggle("nodeTypes")}
                className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-muted-foreground uppercase mb-2 hover:text-foreground transition-colors w-full"
              >
                {(openSections.nodeTypes ?? true) ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                Node Types
              </button>
              <AnimatePresence>
                {(openSections.nodeTypes ?? true) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1">
                      {Object.entries(config.nodeTypes)
                        .filter(([typeName]) => presentNodeTypes.has(typeName))
                        .map(([typeName, ntConfig]) => {
                          const nodeTypeCount = localElements?.filter(
                            (e) => e.group === "nodes" && (e.data as NodeData).node_type === typeName
                          ).length ?? 0;

                          return (
                            <label
                              key={typeName}
                              className="flex items-center gap-2 py-1 px-1 rounded-md hover:bg-white/[0.03] cursor-pointer group transition-colors"
                            >
                              <Checkbox
                                checked={activeNodeTypes.has(typeName)}
                                onCheckedChange={() => onToggleNodeType(typeName)}
                                className="size-3.5"
                              />
                              <span
                                className="size-2 rounded-full shrink-0"
                                style={{ backgroundColor: ntConfig.defaultColor }}
                              />
                              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">
                                {formatLabel(typeName)}
                              </span>
                              <span className="text-[9px] font-mono text-muted-foreground/50 ml-auto">
                                {nodeTypeCount.toLocaleString()}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Subtype filters — only for types with subtypes present in data */}
          {Object.entries(config.nodeTypes)
            .filter(([typeName, ntConfig]) =>
              presentNodeTypes.has(typeName) && Object.keys(ntConfig.subtypes).length > 0 && (presentSubtypes.get(typeName)?.size ?? 0) > 0
            )
            .map(([typeName, ntConfig]) => {
              const isOpen = openSections[typeName] ?? true;
              const activeSet = activeSubtypes.get(typeName) || new Set();
              const existingSubtypes = presentSubtypes.get(typeName);

              const visibleSubtypes = Object.entries(ntConfig.subtypes).filter(
                ([key]) => !existingSubtypes || existingSubtypes.has(key)
              );
              if (visibleSubtypes.length === 0) return null;

              return (
                <div key={typeName}>
                  <button
                    onClick={() => toggle(typeName)}
                    className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-muted-foreground uppercase mb-2 hover:text-foreground transition-colors w-full"
                  >
                    {isOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                    {typeName} Subtypes
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1">
                          {visibleSubtypes.map(([key, style]) => (
                            <label
                              key={key}
                              className="flex items-center gap-2 py-1 px-1 rounded-md hover:bg-white/[0.03] cursor-pointer group transition-colors"
                            >
                              <Checkbox
                                checked={activeSet.has(key)}
                                onCheckedChange={() => onToggleSubtype(typeName, key)}
                                className="size-3.5"
                              />
                              <span
                                className="size-2 rounded-full shrink-0"
                                style={{ backgroundColor: style.color }}
                              />
                              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">
                                {style.label || formatLabel(key)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

          {/* Edge Type Filters — only when edges exist */}
          {presentEdgeTypes.size > 0 && <div>
            <button
              onClick={() => toggle("edges")}
              className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-muted-foreground uppercase mb-2 hover:text-foreground transition-colors w-full"
            >
              {openSections.edges ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              Edge Types
            </button>
            <AnimatePresence>
              {openSections.edges && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1">
                    {Object.entries(config.edgeTypes)
                      .filter(([key]) => presentEdgeTypes.has(key))
                      .map(([key, etConfig]) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 py-1 px-1 rounded-md hover:bg-white/[0.03] cursor-pointer group transition-colors"
                        >
                          <Checkbox
                            checked={activeEdgeTypes.has(key)}
                            onCheckedChange={() => onToggleEdgeType(key)}
                            className="size-3.5"
                          />
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: etConfig.color }}
                          />
                          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                            {etConfig.label || formatLabel(key)}
                          </span>
                        </label>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>}

          {/* Path Finder (collapsible) */}
          <div>
            <button
              onClick={() => toggle("pathfinder")}
              className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-muted-foreground uppercase mb-2 hover:text-foreground transition-colors w-full"
            >
              {openSections.pathfinder ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              Path Finder
            </button>
            <AnimatePresence>
              {openSections.pathfinder && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <PathFinder onPathFound={onPathFound || (() => {})} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>

      {/* Controls */}
      <div className="p-3 border-t border-white/5 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onFit}
          className="flex-1 h-7 text-[10px] gap-1 bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
        >
          <Maximize2 className="size-3" />
          Fit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="flex-1 h-7 text-[10px] gap-1 bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
        >
          <RotateCcw className="size-3" />
          Reset
        </Button>
      </div>
    </motion.div>
  );
}
