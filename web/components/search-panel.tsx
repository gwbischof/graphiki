"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Expand, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearch } from "@/hooks/use-search";
import type { CytoscapeElement } from "@/lib/graph-data";
import type { GraphConfig } from "@/lib/graph-config";
import { getNodeColor } from "@/lib/graph-config";

interface SearchPanelProps {
  localElements?: CytoscapeElement[];
  config: GraphConfig;
  onLocate: (nodeId: string) => void;
  onExpand: (nodeId: string) => void;
  onSearchQueryChange?: (q: string) => void;
}

export function SearchPanel({
  localElements,
  config,
  onLocate,
  onExpand,
  onSearchQueryChange,
}: SearchPanelProps) {
  const { query, setQuery, results, isSearching, clear } = useSearch(localElements);

  const handleQueryChange = (q: string) => {
    setQuery(q);
    onSearchQueryChange?.(q);
  };

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search nodes..."
          className="pl-8 pr-8 h-8 text-xs bg-white/[0.04] border-white/[0.06] placeholder:text-muted-foreground/60"
        />
        {query && (
          <button
            onClick={() => { clear(); onSearchQueryChange?.(""); }}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <X className="size-3 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        )}
      </div>

      {/* Loading */}
      {isSearching && (
        <div className="flex items-center gap-2 px-1 py-2">
          <Loader2 className="size-3 animate-spin text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Searching...</span>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-0.5">
                {results.map((result) => {
                  const ntConfig = config.nodeTypes[result.node_type];
                  const subtypeField = ntConfig?.subtypeField || "role";
                  const subtypeValue = result[subtypeField] as string | undefined;
                  const color = getNodeColor(config, result.node_type, subtypeValue);

                  return (
                    <div
                      key={result.id}
                      className="flex items-center gap-2 py-1.5 px-1.5 rounded-md hover:bg-white/[0.04] group transition-colors"
                    >
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs truncate">{result.label}</div>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="text-[8px] font-mono h-3.5 px-1 border-white/10 bg-white/[0.02]"
                          >
                            {result.node_type}
                          </Badge>
                          {result.doc_count > 0 && (
                            <span className="text-[8px] font-mono text-muted-foreground/60">
                              {result.doc_count.toLocaleString()} docs
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onLocate(result.id)}
                          title="Locate in graph"
                          className="size-5"
                        >
                          <MapPin className="size-2.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onExpand(result.id)}
                          title="Expand neighborhood"
                          className="size-5"
                        >
                          <Expand className="size-2.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results */}
      {!isSearching && query.trim() && results.length === 0 && (
        <p className="text-[10px] text-muted-foreground/60 px-1 py-2">
          No results for &ldquo;{query}&rdquo;
        </p>
      )}
    </div>
  );
}
