"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bookmark, ArrowLeft, Users, GitBranch } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { SavedView } from "@/lib/graph-data";

export default function ViewsGallery() {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/views")
      .then((res) => res.json())
      .then((data) => {
        setViews(data.views || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1 bg-white/[0.03] border-white/[0.06]"
            >
              <ArrowLeft className="size-3" />
              Back to Graph
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-medium flex items-center gap-2">
              <Bookmark className="size-4 text-primary/70" />
              Saved Views
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse and explore saved perspectives on the graph
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="size-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && views.length === 0 && (
          <div className="text-center py-20">
            <Bookmark className="size-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No saved views yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Explore the graph and save interesting perspectives
            </p>
          </div>
        )}

        {/* Views grid */}
        {!loading && views.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {views.map((view, i) => (
              <motion.div
                key={view.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/view/${view.slug}`}>
                  <div className="glass-panel rounded-xl p-4 hover:bg-white/[0.04] transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                        {view.name}
                      </h3>
                      <div className="flex items-center gap-1 text-muted-foreground/50">
                        <Users className="size-3" />
                        <GitBranch className="size-3" />
                      </div>
                    </div>
                    {view.description && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                        {view.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/50 uppercase">
                      <span>{view.query.type}</span>
                      <span className="text-white/10">|</span>
                      <span>{new Date(view.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
