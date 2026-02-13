"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Send, Loader2, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NodeData } from "@/lib/graph-data";

interface ProposalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: NodeData | null;
}

export function ProposalForm({ open, onOpenChange, node }: ProposalFormProps) {
  const { data: session } = useSession();
  const [reason, setReason] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [directApply, setDirectApply] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "admin";

  async function handleSubmit() {
    if (!reason.trim() || !session?.user) return;

    setLoading(true);
    setError(null);

    const dataAfter: Record<string, unknown> = {};
    if (node) {
      if (editLabel.trim()) dataAfter.label = editLabel;
      if (editNotes.trim()) dataAfter.notes = editNotes;
    }

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: node ? "edit-node" : "add-node",
          targetNodeId: node?.id,
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
        setReason("");
        setEditLabel("");
        setEditNotes("");
        setDirectApply(false);
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-white/[0.06] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">
            {node ? `Propose edit to "${node.label}"` : "Propose new node"}
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
                ? "Change has been applied to the graph."
                : "Your proposal has been queued for review."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {/* Author info from session */}
            <div className="text-[10px] text-muted-foreground">
              Submitting as{" "}
              <span className="text-foreground">
                {session?.user?.name || session?.user?.email || "Unknown"}
              </span>
            </div>

            {node && (
              <>
                <div>
                  <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block mb-1">
                    Updated name (optional)
                  </label>
                  <Input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    placeholder={node.label}
                    className="h-8 text-xs bg-white/[0.04] border-white/[0.06]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block mb-1">
                    Updated notes (optional)
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder={node.notes || "Add notes..."}
                    rows={3}
                    className="w-full rounded-md border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 resize-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block mb-1">
                Reason for change *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain your proposed change and cite sources..."
                rows={3}
                className="w-full rounded-md border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 resize-none"
              />
            </div>

            {/* Admin direct apply option */}
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

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
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
              disabled={!reason.trim() || loading || !session?.user}
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
