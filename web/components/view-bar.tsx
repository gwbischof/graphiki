"use client";

import { motion } from "framer-motion";
import { Bookmark, Share2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewBarProps {
  viewName: string | null;
  onSaveView: () => void;
  onShare: () => void;
}

export function ViewBar({ viewName, onSaveView, onShare }: ViewBarProps) {
  if (!viewName) return null;

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 200 }}
      className="glass-panel absolute bottom-16 left-1/2 -translate-x-1/2 z-20 rounded-lg px-3 py-1.5 flex items-center gap-3"
    >
      <div className="flex items-center gap-2">
        <Bookmark className="size-3 text-primary/60" />
        <span className="text-[11px] font-mono text-foreground">{viewName}</span>
      </div>

      <div className="w-px h-3.5 bg-white/8" />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="xs"
          onClick={onSaveView}
          className="text-[10px] text-muted-foreground gap-1"
        >
          <Pencil className="size-2.5" />
          Save as View
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={onShare}
          className="text-[10px] text-muted-foreground gap-1"
        >
          <Share2 className="size-2.5" />
          Share
        </Button>
      </div>
    </motion.div>
  );
}
