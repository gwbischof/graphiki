"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Send, Loader2, Zap, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { NodeData } from "@/lib/graph-data";
import type { GraphConfig } from "@/lib/graph-config";
import { getNodeColor } from "@/lib/graph-config";

interface AddConnectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceNode: NodeData | null;
  allNodes: NodeData[];
  config: GraphConfig;
}

export function AddConnectionForm({
  open,
  onOpenChange,
  sourceNode,
  allNodes,
  config,
}: AddConnectionFormProps) {
  const { data: session } = useSession();
  const [targetNodeId, setTargetNodeId] = useState<string | null>(null);
  const [edgeType, setEdgeType] = useState("");
  const [reason, setReason] = useState("");
  const [directApply, setDirectApply] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [sourceDoc, setSourceDoc] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [quote, setQuote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetSearch, setTargetSearch] = useState("");

  const isAdmin = session?.user?.role === "admin";

  const edgeTypeOptions = useMemo(
    () =>
      Object.entries(config.edgeTypes)
        .filter(([key]) => key !== "SUMMARY" && key !== "_inter_community")
        .map(([key, val]) => ({ key, label: val.label, color: val.color })),
    [config.edgeTypes]
  );

  const targetNode = useMemo(
    () => allNodes.find((n) => n.id === targetNodeId) ?? null,
    [allNodes, targetNodeId]
  );

  function resetForm() {
    setTargetNodeId(null);
    setEdgeType("");
    setReason("");
    setDirectApply(false);
    setShowDetails(false);
    setDescription("");
    setAmount("");
    setDate("");
    setSourceDoc("");
    setDocUrl("");
    setQuote("");
    setTargetSearch("");
    setError(null);
  }

  async function handleSubmit() {
    if (!reason.trim() || !session?.user || !sourceNode || !targetNodeId || !edgeType) return;

    setLoading(true);
    setError(null);

    const dataAfter: Record<string, unknown> = {
      source: sourceNode.id,
      target: targetNodeId,
      edge_type: edgeType,
    };
    if (description.trim()) dataAfter.description = description.trim();
    if (amount.trim()) dataAfter.amount = Number(amount);
    if (date.trim()) dataAfter.date = date.trim();
    if (sourceDoc.trim()) dataAfter.source_doc = sourceDoc.trim();
    if (docUrl.trim()) dataAfter.doc_url = docUrl.trim();
    if (quote.trim()) dataAfter.quote = quote.trim();

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "add-edge",
          dataAfter,
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
        resetForm();
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setLoading(false);
    }
  }

  function getSubtypeValue(node: NodeData): string | undefined {
    const ntConfig = config.nodeTypes[node.node_type];
    if (!ntConfig) return undefined;
    return node[ntConfig.subtypeField] as string | undefined;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="glass-panel border-white/[0.06] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">
            New connection from &ldquo;{sourceNode?.label}&rdquo;
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isAdmin
              ? "As admin, you can apply changes directly or submit for review."
              : "Proposals are reviewed by moderators before being applied."}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-8 text-center"
          >
            <div className="text-2xl mb-2">
              {directApply ? "Applied" : "Submitted"}
            </div>
            <p className="text-xs text-muted-foreground">
              {directApply
                ? "Connection has been added to the graph."
                : "Your proposal has been queued for review."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {/* Author info */}
            <div className="text-[10px] text-muted-foreground">
              Submitting as{" "}
              <span className="text-foreground">
                {session?.user?.name || session?.user?.email || "Unknown"}
              </span>
            </div>

            {/* Target node picker */}
            <div>
              <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block mb-1">
                Target node *
              </label>
              {targetNode ? (
                <div className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.04] px-3 py-2">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: getNodeColor(
                        config,
                        targetNode.node_type,
                        getSubtypeValue(targetNode)
                      ),
                    }}
                  />
                  <span className="text-xs flex-1 truncate">{targetNode.label}</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-mono h-4 border-white/10 bg-white/[0.03]"
                  >
                    {targetNode.node_type}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => setTargetNodeId(null)}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    change
                  </button>
                </div>
              ) : (
                <Command className="rounded-md border border-white/[0.06] bg-white/[0.04]">
                  <CommandInput
                    placeholder="Search nodes..."
                    value={targetSearch}
                    onValueChange={setTargetSearch}
                    className="h-8 text-xs"
                  />
                  <CommandList className="max-h-[160px]">
                    <CommandEmpty className="py-3 text-xs">No nodes found.</CommandEmpty>
                    <CommandGroup>
                      {allNodes
                        .filter((n) => n.id !== sourceNode?.id)
                        .slice(0, 20)
                        .map((n) => {
                          const color = getNodeColor(
                            config,
                            n.node_type,
                            getSubtypeValue(n)
                          );
                          return (
                            <CommandItem
                              key={n.id}
                              value={`${n.label} ${n.id}`}
                              onSelect={() => {
                                setTargetNodeId(n.id);
                                setTargetSearch("");
                              }}
                              className="text-xs gap-2 py-1"
                            >
                              <span
                                className="size-2 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <span className="truncate flex-1">{n.label}</span>
                              <Badge
                                variant="outline"
                                className="text-[9px] font-mono h-4 border-white/10 bg-white/[0.03]"
                              >
                                {n.node_type}
                              </Badge>
                            </CommandItem>
                          );
                        })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              )}
            </div>

            {/* Edge type selector */}
            <div>
              <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block mb-1">
                Connection type *
              </label>
              <select
                value={edgeType}
                onChange={(e) => setEdgeType(e.target.value)}
                className="w-full h-8 rounded-md border border-white/[0.06] bg-white/[0.04] px-3 text-xs text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  Select type...
                </option>
                {edgeTypeOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional details toggle */}
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown
                className={`size-3 transition-transform ${showDetails ? "rotate-180" : ""}`}
              />
              {showDetails ? "Hide details" : "Add details"}
            </button>

            {showDetails && (
              <div className="space-y-2 pl-1 border-l border-white/[0.06]">
                <div>
                  <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this connection..."
                    rows={2}
                    className="w-full rounded-md border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 resize-none"
                  />
                </div>

                {edgeType === "MONEY" && (
                  <div>
                    <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full h-8 rounded-md border border-white/[0.06] bg-white/[0.04] px-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="e.g. 2005-03 or March 2005"
                    className="w-full h-8 rounded-md border border-white/[0.06] bg-white/[0.04] px-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block mb-1">
                    Source document
                  </label>
                  <input
                    type="text"
                    value={sourceDoc}
                    onChange={(e) => setSourceDoc(e.target.value)}
                    placeholder="e.g. EFTA00164939"
                    className="w-full h-8 rounded-md border border-white/[0.06] bg-white/[0.04] px-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block mb-1">
                    Document URL
                  </label>
                  <input
                    type="text"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-8 rounded-md border border-white/[0.06] bg-white/[0.04] px-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block mb-1">
                    Quote
                  </label>
                  <textarea
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="Relevant quote from source..."
                    rows={2}
                    className="w-full rounded-md border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block mb-1">
                Reason for change *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain this connection and cite sources..."
                rows={3}
                className="w-full rounded-md border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 resize-none"
              />
            </div>

            {/* Admin direct apply */}
            {isAdmin && (
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={directApply}
                  onChange={(e) => setDirectApply(e.target.checked)}
                  className="rounded border-white/[0.06]"
                />
                <Zap className="size-3 text-yellow-400" />
                <span className="text-muted-foreground">
                  Apply directly (skip review)
                </span>
              </label>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        )}

        {!submitted && (
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 bg-white/[0.03] border-white/[0.06]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={
                !reason.trim() || !targetNodeId || !edgeType || loading || !session?.user
              }
              className="text-xs h-8 gap-1.5"
            >
              {loading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Send className="size-3" />
              )}
              {directApply ? "Apply" : "Submit"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
