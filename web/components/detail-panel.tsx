"use client";

import { useSession, signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, PenLine, ArrowRight, Zap, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NodeData, EdgeData } from "@/lib/graph-data";
import type { GraphConfig } from "@/lib/graph-config";
import { getNodeColor, getEdgeColor, getStatusStyle } from "@/lib/graph-config";

interface DetailPanelProps {
  node: NodeData | null;
  edges: EdgeData[];
  onClose: () => void;
  onProposeEdit: () => void;
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

function StatusBadge({ status, config }: { status: string; config: GraphConfig }) {
  const classes = getStatusStyle(config, status);
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${classes}`}
    >
      {config.statusStyles[status]?.label || status}
    </span>
  );
}

/** Get the subtype value for a node given its type */
function getSubtypeValue(node: NodeData, config: GraphConfig): string | undefined {
  const ntConfig = config.nodeTypes[node.node_type];
  if (!ntConfig) return undefined;
  return node[ntConfig.subtypeField] as string | undefined;
}

export function DetailPanel({ node, edges, onClose, onProposeEdit, config }: DetailPanelProps) {
  const { data: session } = useSession();
  const color = node && config
    ? getNodeColor(config, node.node_type, getSubtypeValue(node, config))
    : "#565f89";

  const subtypeValue = node && config ? getSubtypeValue(node, config) : undefined;
  const subtypeField = node && config ? config.nodeTypes[node.node_type]?.subtypeField : undefined;
  const isAdmin = session?.user?.role === "admin";
  const isLoggedIn = !!session?.user;

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ x: 340, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 340, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 200 }}
          className="glass-panel absolute right-3 top-16 bottom-16 w-[300px] rounded-xl z-10 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <h2 className="text-sm font-medium truncate">{node.label}</h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono h-5 border-white/10 bg-white/[0.03]"
                  >
                    {node.node_type}
                  </Badge>
                  {subtypeValue && subtypeField && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono h-5 border-white/10"
                      style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, color }}
                    >
                      {subtypeValue}
                    </Badge>
                  )}
                  {node.status && config && <StatusBadge status={node.status} config={config} />}
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

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Properties */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                  Properties
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-mono text-[11px] truncate">{node.id}</span>
                  {node.doc_count > 0 && (
                    <>
                      <span className="text-muted-foreground">Documents</span>
                      <span className="font-mono text-[11px]">
                        {node.doc_count.toLocaleString()}
                      </span>
                    </>
                  )}
                  {node.network && (
                    <>
                      <span className="text-muted-foreground">Network</span>
                      <span className="text-[11px]">{node.network}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              {node.notes && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                    Notes
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {node.notes}
                  </p>
                </div>
              )}

              {/* Connected Edges */}
              {edges.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                    Connections ({edges.length})
                  </div>
                  <div className="space-y-1.5">
                    {edges.map((edge) => {
                      const edgeColor = config
                        ? getEdgeColor(config, edge.edge_type)
                        : "#565f89";
                      const isSource = edge.source === node.id;
                      const otherEnd = isSource ? edge.target : edge.source;
                      return (
                        <div
                          key={edge.id}
                          className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
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
                            <ArrowRight className="size-2.5 text-muted-foreground/50" />
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
                    })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer: conditional on auth state */}
          <div className="p-3 border-t border-white/5 space-y-1.5">
            {isLoggedIn ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onProposeEdit}
                  className="w-full h-8 text-xs gap-1.5 bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                >
                  <PenLine className="size-3" />
                  Propose Edit
                </Button>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onProposeEdit}
                    className="w-full h-8 text-xs gap-1.5 bg-yellow-500/5 border-yellow-500/15 hover:bg-yellow-500/10 text-yellow-400"
                  >
                    <Zap className="size-3" />
                    Edit Directly (Admin)
                  </Button>
                )}
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => signIn()}
                className="w-full h-8 text-xs gap-1.5 bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
              >
                <LogIn className="size-3" />
                Sign in to propose edits
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
