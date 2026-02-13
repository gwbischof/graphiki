"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, ArrowRight, Search, PenLine, Send, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import type { NodeData, EdgeData } from "@/lib/graph-data";
import type { GraphConfig } from "@/lib/graph-config";
import { getEdgeColor } from "@/lib/graph-config";

interface ConnectionsPanelProps {
  edge: EdgeData | null;
  sourceNode: NodeData | null;
  targetNode: NodeData | null;
  allPairEdges: EdgeData[];
  onClose: () => void;
  config: GraphConfig | null;
}

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

function formatEdgeType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function EdgeCard({
  edge,
  nodeId,
  config,
  highlighted,
}: {
  edge: EdgeData;
  nodeId: string;
  config: GraphConfig;
  highlighted?: boolean;
}) {
  const edgeColor = getEdgeColor(config, edge.edge_type);
  const isSource = edge.source === nodeId;
  const otherEnd = isSource ? edge.target : edge.source;

  return (
    <div
      className={`p-2 rounded-lg border transition-colors ${
        highlighted
          ? "bg-white/[0.06] border-white/[0.12] ring-1 ring-primary/30"
          : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="size-1.5 rounded-full shrink-0"
          style={{ backgroundColor: edgeColor }}
        />
        <span
          className="text-[10px] font-mono"
          style={{ color: edgeColor }}
        >
          {formatEdgeType(edge.edge_type)}
        </span>
        <ArrowRight
          className={`size-2.5 text-muted-foreground/50 ${!isSource ? "rotate-180" : ""}`}
        />
        <span className="text-[11px] truncate">
          {otherEnd.replace(/_/g, " ")}
        </span>
      </div>
      {edge.description && (
        <p className="text-[10px] text-muted-foreground leading-relaxed pl-3">
          {edge.description}
        </p>
      )}
      {edge.amount != null && edge.amount > 0 && (
        <p className="text-[10px] text-green-400/80 font-mono pl-3">
          {formatAmount(edge.amount)}
          {edge.date && ` (${edge.date})`}
        </p>
      )}
      {edge.quote && (
        <p className="text-[10px] text-blue-300/70 italic pl-3 mt-0.5">
          &ldquo;{edge.quote}&rdquo;
        </p>
      )}
      {edge.doc_url && (
        <a
          href={edge.doc_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary mt-1 pl-3 transition-colors"
        >
          <ExternalLink className="size-2.5" />
          {edge.source_doc || edge.doc_id || "View doc"}
        </a>
      )}
    </div>
  );
}

function SummaryEditDialog({
  summaryEdge,
  onClose,
}: {
  summaryEdge: EdgeData;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const [editText, setEditText] = useState(summaryEdge.description || "");
  const [reason, setReason] = useState("");
  const [directApply, setDirectApply] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "admin";

  async function handleSubmit() {
    if (!reason.trim() || !session?.user) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "edit-edge",
          targetEdgeId: summaryEdge.id,
          dataAfter: { description: editText },
          reason: reason.trim(),
          directApply: isAdmin && directApply,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit proposal");
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-4 text-center"
      >
        <p className="text-xs text-muted-foreground">
          {directApply ? "Applied." : "Proposal submitted for review."}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="p-4 border-b border-white/5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
          Edit summary
        </span>
        <Button variant="ghost" size="icon-xs" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="size-3" />
        </Button>
      </div>

      <textarea
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        rows={4}
        className="w-full rounded-md border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 resize-none"
      />

      <div>
        <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block mb-1">
          Reason for change *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain your proposed change..."
          rows={2}
          className="w-full rounded-md border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 resize-none"
        />
      </div>

      {isAdmin && (
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={directApply}
            onChange={(e) => setDirectApply(e.target.checked)}
            className="rounded border-white/[0.06]"
          />
          <Zap className="size-3 text-yellow-400" />
          <span className="text-muted-foreground">Apply directly</span>
        </label>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="text-xs h-7 bg-white/[0.03] border-white/[0.06]"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!reason.trim() || loading || !session?.user}
          className="text-xs h-7 gap-1.5"
        >
          {loading ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
          {directApply ? "Apply" : "Submit"}
        </Button>
      </div>
    </div>
  );
}

export function ConnectionsPanel({
  edge,
  sourceNode,
  targetNode,
  allPairEdges,
  onClose,
  config,
}: ConnectionsPanelProps) {
  const [search, setSearch] = useState("");
  const [activeTypeFilters, setActiveTypeFilters] = useState<Set<string> | null>(null);
  const [editingSummary, setEditingSummary] = useState(false);

  // Find SUMMARY edge in the pair
  const summaryEdge = useMemo(
    () => allPairEdges.find((e) => e.edge_type === "SUMMARY") ?? null,
    [allPairEdges]
  );

  // Non-SUMMARY edges for the list
  const realEdges = useMemo(
    () => allPairEdges.filter((e) => e.edge_type !== "SUMMARY"),
    [allPairEdges]
  );

  // Unique edge types for filter chips (from real edges only)
  const edgeTypes = useMemo(() => {
    const types = new Set<string>();
    for (const e of realEdges) types.add(e.edge_type);
    return Array.from(types).sort();
  }, [realEdges]);

  // Active filters (null = all active)
  const activeFilters = activeTypeFilters ?? new Set(edgeTypes);

  // Filter edges
  const filteredEdges = useMemo(() => {
    const q = search.toLowerCase().trim();
    return realEdges.filter((e) => {
      if (!activeFilters.has(e.edge_type)) return false;
      if (!q) return true;
      const otherEnd = e.source === sourceNode?.id ? e.target : e.source;
      return (
        otherEnd.toLowerCase().replace(/_/g, " ").includes(q) ||
        (e.description || "").toLowerCase().includes(q) ||
        (e.quote || "").toLowerCase().includes(q)
      );
    });
  }, [realEdges, activeFilters, search, sourceNode]);

  const toggleType = (type: string) => {
    setActiveTypeFilters((prev) => {
      const current = prev ?? new Set(edgeTypes);
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const isOpen = !!(edge && sourceNode && targetNode);

  return (
    <AnimatePresence>
      {isOpen && config && (
        <motion.div
          initial={{ x: 340, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 340, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 200 }}
          className="glass-panel absolute right-3 top-16 bottom-16 w-[320px] rounded-xl z-10 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {realEdges.length} connection{realEdges.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="truncate font-medium">{sourceNode.label}</span>
                  <ArrowRight className="size-3 text-muted-foreground/50 shrink-0" />
                  <span className="truncate font-medium">{targetNode.label}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onClose}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Summary section */}
          {summaryEdge?.description && !editingSummary && (
            <div className="p-4 border-b border-white/5">
              <div className="rounded-lg border-l-2 border-[#e0af68] bg-white/[0.03] p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[10px] font-mono tracking-widest text-[#e0af68] uppercase">
                    Summary
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditingSummary(true)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <PenLine className="size-3" />
                  </Button>
                </div>
                <p className="text-[11px] leading-relaxed text-foreground/80">
                  {summaryEdge.description}
                </p>
              </div>
            </div>
          )}

          {/* Summary edit dialog */}
          {editingSummary && summaryEdge && (
            <SummaryEditDialog
              summaryEdge={summaryEdge}
              onClose={() => setEditingSummary(false)}
            />
          )}

          {/* Clicked edge detail */}
          {edge.edge_type !== "SUMMARY" && (
            <div className="p-4 border-b border-white/5">
              <EdgeCard edge={edge} nodeId={sourceNode.id} config={config} highlighted />
            </div>
          )}

          {/* All connections section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 pt-3 pb-2 space-y-2">
              <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                All connections ({filteredEdges.length})
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search connections..."
                  className="h-7 pl-7 text-xs bg-white/[0.03] border-white/[0.06]"
                />
              </div>

              {/* Type filter chips */}
              <div className="flex flex-wrap gap-1">
                {edgeTypes.map((type) => {
                  const color = getEdgeColor(config, type);
                  const active = activeFilters.has(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border transition-colors ${
                        active
                          ? "bg-white/[0.06] border-white/[0.1] text-foreground"
                          : "bg-white/[0.01] border-white/[0.04] text-muted-foreground/40"
                      }`}
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: active ? color : `${color}40` }}
                      />
                      {formatEdgeType(type)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Edge list */}
            <ScrollArea className="flex-1">
              <div className="px-4 pb-4 space-y-1.5">
                {filteredEdges.map((e) => (
                  <EdgeCard
                    key={e.id}
                    edge={e}
                    nodeId={sourceNode.id}
                    config={config}
                    highlighted={e.id === edge.id}
                  />
                ))}
                {filteredEdges.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/50 text-center py-4">
                    No matching connections
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
