"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Loader2, PackageMinus } from "lucide-react";
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
import { Input } from "@/components/ui/input";

interface AuditEntry {
  id: string;
  action: string;
  proposalId: string | null;
  userId: string | null;
  userName: string | null;
  targetNodeId: string | null;
  targetEdgeId: string | null;
  dataBefore: unknown;
  dataAfter: unknown;
  cypherExecuted: string | null;
  squashSummary: string | null;
  squashedCount: number | null;
  createdAt: string;
}

interface AuditLogPanelProps {
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

const actionColors: Record<string, string> = {
  proposal_created: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  proposal_approved: "bg-green-500/15 text-green-400 border-green-500/20",
  proposal_rejected: "bg-red-500/15 text-red-400 border-red-500/20",
  proposal_applied: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  proposal_failed: "bg-red-500/15 text-red-400 border-red-500/20",
  squash: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

export function AuditLogPanel({ open, onOpenChange }: AuditLogPanelProps) {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterNodeId, setFilterNodeId] = useState("");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filterNodeId) params.set("targetNodeId", filterNodeId);
      const res = await fetch(`/api/audit?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filterNodeId]);

  useEffect(() => {
    if (open) fetchEntries();
  }, [open, fetchEntries]);

  const isAdmin = session?.user?.role === "admin";

  async function handleSquash() {
    if (!filterNodeId) return;
    const summary = prompt("Enter squash summary:");
    if (!summary) return;

    const res = await fetch("/api/audit/squash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetNodeId: filterNodeId, summary }),
    });

    if (res.ok) {
      fetchEntries();
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="glass-panel border-white/[0.06] w-[420px] sm:max-w-[420px]"
      >
        <SheetHeader>
          <SheetTitle className="text-sm font-medium flex items-center gap-2">
            <History className="size-4" />
            Audit Log
          </SheetTitle>
          <SheetDescription className="text-xs">
            History of all graph changes and proposal actions.
          </SheetDescription>
        </SheetHeader>

        <div className="flex gap-2 mt-3">
          <Input
            value={filterNodeId}
            onChange={(e) => setFilterNodeId(e.target.value)}
            placeholder="Filter by node ID..."
            className="h-7 text-xs bg-white/[0.04] border-white/[0.06] flex-1"
          />
          {isAdmin && filterNodeId && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleSquash}
              className="gap-1 text-[10px]"
            >
              <PackageMinus className="size-3" />
              Squash
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 -mx-4 px-4 mt-3">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="size-4 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No audit entries found.
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              <AnimatePresence>
                {entries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-mono h-4 px-1.5 ${
                          actionColors[entry.action] ||
                          "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"
                        }`}
                      >
                        {entry.action.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>

                    {entry.userName && (
                      <p className="text-[10px] text-muted-foreground">
                        by {entry.userName}
                      </p>
                    )}

                    {entry.targetNodeId && (
                      <p className="text-[10px] text-foreground/70 font-mono mt-1">
                        {entry.targetNodeId}
                      </p>
                    )}

                    {entry.squashSummary && (
                      <p className="text-[10px] text-purple-300/80 mt-1">
                        {entry.squashSummary} ({entry.squashedCount} entries)
                      </p>
                    )}

                    {entry.cypherExecuted && (
                      <p className="text-[9px] text-muted-foreground/50 font-mono mt-1 truncate">
                        {entry.cypherExecuted}
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
