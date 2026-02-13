"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { CytoscapeElement, NodeData } from "@/lib/graph-data";

interface SearchResult {
  id: string;
  label: string;
  node_type: string;
  doc_count: number;
  [key: string]: unknown;
}

interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  search: (q: string) => void;
  clear: () => void;
}

export function useSearch(localElements?: CytoscapeElement[]): UseSearchReturn {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);

      // Try API first
      try {
        const res = await fetch(`/api/graph/search?q=${encodeURIComponent(q)}&limit=20`);
        if (res.ok) {
          const data = await res.json();
          const searchResults: SearchResult[] = (data.results || []).map(
            (el: CytoscapeElement) => {
              const d = el.data as NodeData;
              return {
                ...d,
                id: d.id,
                label: d.label,
                node_type: d.node_type,
                doc_count: d.doc_count || 0,
              };
            }
          );
          setResults(searchResults);
          setIsSearching(false);
          return;
        }
      } catch {
        // API not available, fall through to local search
      }

      // Fallback: search local elements
      if (localElements) {
        const lq = q.toLowerCase();
        const localResults: SearchResult[] = localElements
          .filter((e) => {
            if (e.group !== "nodes") return false;
            const d = e.data as NodeData;
            return (
              (d.label || "").toLowerCase().includes(lq) ||
              (d.id || "").toLowerCase().includes(lq) ||
              (d.notes || "").toLowerCase().includes(lq)
            );
          })
          .slice(0, 20)
          .map((e) => {
            const d = e.data as NodeData;
            return {
              ...d,
              id: d.id,
              label: d.label,
              node_type: d.node_type,
              doc_count: d.doc_count || 0,
            };
          });
        setResults(localResults);
      }

      setIsSearching(false);
    },
    [localElements]
  );

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
  }, []);

  return { query, setQuery, results, isSearching, search, clear };
}
