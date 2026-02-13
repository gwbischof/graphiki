"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Home, ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  id: string;
  label: string;
  level: number;
}

interface BreadcrumbBarProps {
  items: BreadcrumbItem[];
  onNavigate: (index: number) => void;
}

export function BreadcrumbBar({ items, onNavigate }: BreadcrumbBarProps) {
  if (items.length <= 1) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -20, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="glass-panel absolute top-16 left-1/2 -translate-x-1/2 z-20 rounded-lg px-1 py-1 flex items-center gap-0.5"
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.2 }}
              className="flex items-center"
            >
              <button
                onClick={() => onNavigate(index)}
                disabled={isLast}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono
                  transition-all duration-150
                  ${isLast
                    ? "text-foreground cursor-default"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.06] active:scale-95"
                  }
                `}
              >
                {isFirst && (
                  <Home className="size-2.5 opacity-60" />
                )}
                <span className="max-w-[120px] truncate">
                  {item.label}
                </span>
              </button>

              {!isLast && (
                <ChevronRight className="size-2.5 text-white/15 mx-0.5 shrink-0" />
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
