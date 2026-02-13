"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Clock, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ApiProposal {
  id: string;
  type: string;
  status: string;
  targetNodeId: string | null;
  targetEdgeId: string | null;
  dataBefore: unknown;
  dataAfter: Record<string, unknown> | null;
  reason: string | null;
  authorId: string | null;
  authorName: string | null;
  reviewComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
  appliedAt: string | null;
  errorMessage: string | null;
}

interface ModQueueProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProposalTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    "add-node": "bg-green-500/15 text-green-400 border-green-500/20",
    "edit-node": "bg-blue-500/15 text-blue-400 border-blue-500/20",
    "delete-node": "bg-red-500/15 text-red-400 border-red-500/20",
    "add-edge": "bg-green-500/15 text-green-400 border-green-500/20",
    "edit-edge": "bg-blue-500/15 text-blue-400 border-blue-500/20",
    "delete-edge": "bg-red-500/15 text-red-400 border-red-500/20",
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border ${
        colors[type] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"
      }`}
    >
      {type}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "approved" || status === "applied")
    return <Check className="size-3.5 text-green-400" />;
  if (status === "rejected" || status === "failed")
    return <X className="size-3.5 text-red-400" />;
  return <Clock className="size-3.5 text-yellow-400 glow-pulse" />;
}

type Tab = "pending" | "reviewed" | "mine";

export function ModQueue({ open, onOpenChange }: ModQueueProps) {
  const { data: session } = useSession();
  const [proposals, setProposals] = useState<ApiProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isMod =
    session?.user?.role === "mod" || session?.user?.role === "admin";

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proposals?limit=100");
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && session?.user) fetchProposals();
  }, [open, session, fetchProposals]);

  const pending = proposals.filter((p) => p.status === "pending");
  const reviewed = proposals.filter(
    (p) => p.status !== "pending"
  );
  const mine = proposals.filter(
    (p) => p.authorId === session?.user?.id
  );

  const displayed =
    activeTab === "pending"
      ? pending
      : activeTab === "reviewed"
        ? reviewed
        : mine;

  async function handleAction(id: string, status: "approved" | "rejected") {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchProposals();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "pending", label: "Pending", count: pending.length },
    { key: "reviewed", label: "Reviewed", count: reviewed.length },
    { key: "mine", label: "My Proposals", count: mine.length },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="glass-panel border-white/[0.06] w-[380px] sm:max-w-[380px]"
      >
        <SheetHeader>
          <SheetTitle className="text-sm font-medium flex items-center gap-2">
            Proposals
            {pending.length > 0 && (
              <Badge
                variant="outline"
                className="text-[9px] font-mono h-4 px-1.5 bg-yellow-500/15 border-yellow-500/25 text-yellow-400"
              >
                {pending.length} pending
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {isMod
              ? "Review and approve or reject graph edit proposals."
              : "Track the status of proposed graph edits."}
          </SheetDescription>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 mb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                activeTab === tab.key
                  ? "bg-white/[0.08] text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 text-muted-foreground">
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>

        <ScrollArea className="flex-1 -mx-4 px-4">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="size-4 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No proposals in this tab.
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              <AnimatePresence>
                {displayed.map((proposal) => (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={proposal.status} />
                        <ProposalTypeBadge type={proposal.type} />
                      </div>
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {formatDate(proposal.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-foreground/80 mb-1">
                      {proposal.reason}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        by {proposal.authorName || "Unknown"}
                      </span>

                      {isMod &&
                        proposal.status === "pending" && (
                          <div className="flex gap-1.5">
                            <Button
                              variant="outline"
                              size="icon-xs"
                              onClick={() =>
                                handleAction(proposal.id, "approved")
                              }
                              disabled={actionLoading === proposal.id}
                              className="bg-green-500/10 border-green-500/20 hover:bg-green-500/20 text-green-400"
                            >
                              {actionLoading === proposal.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Check className="size-3" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon-xs"
                              onClick={() =>
                                handleAction(proposal.id, "rejected")
                              }
                              disabled={actionLoading === proposal.id}
                              className="bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-400"
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        )}
                    </div>

                    {/* Show proposed data */}
                    {proposal.dataAfter &&
                      Object.keys(proposal.dataAfter).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/[0.04]">
                          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                            Changes
                          </div>
                          {Object.entries(proposal.dataAfter).map(
                            ([key, val]) => (
                              <div
                                key={key}
                                className="flex gap-2 text-[10px]"
                              >
                                <span className="text-muted-foreground">
                                  {key}:
                                </span>
                                <span className="text-foreground/70 truncate">
                                  {String(val)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}

                    {/* Error message for failed proposals */}
                    {proposal.errorMessage && (
                      <p className="text-[10px] text-red-400 mt-1 truncate">
                        {proposal.errorMessage}
                      </p>
                    )}

                    {/* Review comment */}
                    {proposal.reviewComment && (
                      <p className="text-[10px] text-muted-foreground italic mt-1">
                        Review: {proposal.reviewComment}
                      </p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
