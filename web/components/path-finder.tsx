"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Route, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CytoscapeElement, NodeData } from "@/lib/graph-data";

interface PathFinderProps {
  onPathFound: (elements: CytoscapeElement[]) => void;
}

export function PathFinder({ onPathFound }: PathFinderProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ pathLength: number; nodes: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const findPath = useCallback(async () => {
    if (!from.trim() || !to.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/graph/path?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      const data = await res.json();

      if (data.path === null) {
        setError(data.message || "No path found");
      } else if (data.elements) {
        const nodeNames = data.elements
          .filter((e: CytoscapeElement) => e.group === "nodes")
          .map((e: CytoscapeElement) => (e.data as NodeData).label);
        setResult({ pathLength: data.pathLength, nodes: nodeNames });
        onPathFound(data.elements);
      }
    } catch {
      setError("Path finding failed. Is Memgraph running?");
    }

    setLoading(false);
  }, [from, to, onPathFound]);

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
        <Route className="size-3" />
        Path Finder
      </div>

      <div className="space-y-1.5">
        <Input
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="From node ID..."
          className="h-7 text-xs bg-white/[0.04] border-white/[0.06]"
        />
        <Input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="To node ID..."
          className="h-7 text-xs bg-white/[0.04] border-white/[0.06]"
          onKeyDown={(e) => e.key === "Enter" && findPath()}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={findPath}
          disabled={loading || !from.trim() || !to.trim()}
          className="w-full h-7 text-[10px] gap-1.5 bg-white/[0.03] border-white/[0.06]"
        >
          {loading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Route className="size-3" />
          )}
          Find Shortest Path
        </Button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[10px] text-red-400/80 px-1"
          >
            {error}
          </motion.p>
        )}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]"
          >
            <div className="text-[10px] text-muted-foreground mb-1">
              Path ({result.pathLength} hops):
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {result.nodes.map((name, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-foreground">{name}</span>
                  {i < result.nodes.length - 1 && (
                    <ArrowRight className="size-2.5 text-muted-foreground/40" />
                  )}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
