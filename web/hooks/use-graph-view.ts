"use client";

import { useReducer, useCallback, useEffect } from "react";
import type { CytoscapeElement, NodeData } from "@/lib/graph-data";
import {
  viewReducer,
  createInitialViewState,
  type BreadcrumbItem,
} from "@/lib/graph-view-state";
import { loadGraphData } from "@/lib/graph-data";

export function useGraphView() {
  const [state, dispatch] = useReducer(viewReducer, null, createInitialViewState);

  // Initial load: try communities first, fall back to static data
  useEffect(() => {
    async function load() {
      dispatch({ type: "SET_LOADING", loading: true });

      try {
        // Try loading communities from API
        const res = await fetch("/api/graph/communities?level=0");
        if (res.ok) {
          const data = await res.json();
          if (data.elements && data.elements.length > 0) {
            dispatch({ type: "SET_ELEMENTS", elements: data.elements });
            return;
          }
        }
      } catch {
        // API not available
      }

      // Fallback: load static graph data
      try {
        const data = await loadGraphData();
        dispatch({ type: "SET_ELEMENTS", elements: data.elements });
      } catch (err) {
        console.error("Failed to load graph data:", err);
        dispatch({ type: "SET_LOADING", loading: false });
      }
    }

    load();
  }, []);

  // Expand a community node
  const expandCommunity = useCallback(
    async (communityId: string, label: string) => {
      // Check cache first
      const cached = state.communityCache.get(communityId);
      if (cached) {
        dispatch({ type: "EXPAND_COMMUNITY", communityId, children: cached });
        dispatch({
          type: "PUSH_BREADCRUMB",
          item: { id: communityId, label, level: state.breadcrumb.length },
        });
        return;
      }

      dispatch({ type: "SET_LOADING", loading: true });

      try {
        const res = await fetch(`/api/graph/community/${encodeURIComponent(communityId)}`);
        if (res.ok) {
          const data = await res.json();
          dispatch({ type: "EXPAND_COMMUNITY", communityId, children: data.elements });
          dispatch({
            type: "PUSH_BREADCRUMB",
            item: { id: communityId, label, level: state.breadcrumb.length },
          });
        }
      } catch (err) {
        console.error("Failed to expand community:", err);
      }

      dispatch({ type: "SET_LOADING", loading: false });
    },
    [state.communityCache, state.breadcrumb.length]
  );

  // Collapse back to a breadcrumb level
  const collapseTo = useCallback(
    async (index: number) => {
      dispatch({ type: "COLLAPSE_TO", breadcrumbIndex: index });

      // Re-fetch the appropriate level
      if (index === 0) {
        // Back to overview
        try {
          const res = await fetch("/api/graph/communities?level=0");
          if (res.ok) {
            const data = await res.json();
            dispatch({ type: "SET_ELEMENTS", elements: data.elements });
            return;
          }
        } catch { /* fallback below */ }

        const data = await loadGraphData();
        dispatch({ type: "SET_ELEMENTS", elements: data.elements });
      }
    },
    []
  );

  // Load a saved view or ad-hoc query
  const loadView = useCallback(
    async (slug: string) => {
      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "SET_ACTIVE_VIEW", view: slug });

      try {
        const res = await fetch(`/api/views/${encodeURIComponent(slug)}?results=true`);
        if (res.ok) {
          const data = await res.json();
          dispatch({
            type: "RESET",
            elements: data.elements,
          });
          dispatch({ type: "SET_ACTIVE_VIEW", view: slug });
        }
      } catch (err) {
        console.error("Failed to load view:", err);
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    []
  );

  // Focus on a specific node (from search)
  const focusOnNode = useCallback(
    async (nodeId: string, hops = 1) => {
      dispatch({ type: "SET_LOADING", loading: true });

      try {
        const res = await fetch(
          `/api/graph/node/${encodeURIComponent(nodeId)}?hops=${hops}&limit=100`
        );
        if (res.ok) {
          const data = await res.json();
          dispatch({ type: "SET_ELEMENTS", elements: data.elements });
        }
      } catch (err) {
        console.error("Failed to focus on node:", err);
      }

      dispatch({ type: "SET_LOADING", loading: false });
    },
    []
  );

  // Add neighborhood to current view
  const addNeighborhood = useCallback(
    async (nodeId: string, hops = 1) => {
      try {
        const res = await fetch(
          `/api/graph/node/${encodeURIComponent(nodeId)}?hops=${hops}&limit=100`
        );
        if (res.ok) {
          const data = await res.json();
          const existing = new Set(
            state.elements
              .filter((e) => e.group === "nodes")
              .map((e) => (e.data as NodeData).id)
          );

          // Merge new elements with existing
          const newElements: CytoscapeElement[] = [];
          for (const el of data.elements) {
            if (el.group === "nodes" && !existing.has((el.data as NodeData).id)) {
              newElements.push(el);
            } else if (el.group === "edges") {
              newElements.push(el);
            }
          }

          dispatch({
            type: "SET_ELEMENTS",
            elements: [...state.elements, ...newElements],
          });
        }
      } catch (err) {
        console.error("Failed to add neighborhood:", err);
      }
    },
    [state.elements]
  );

  // Check if a node is a community supernode
  const isCommunityNode = useCallback(
    (nodeId: string): boolean => {
      const el = state.elements.find(
        (e) => e.group === "nodes" && e.data.id === nodeId
      );
      return !!el && (el.data as NodeData).node_type === "_community";
    },
    [state.elements]
  );

  return {
    ...state,
    expandCommunity,
    collapseTo,
    loadView,
    focusOnNode,
    addNeighborhood,
    isCommunityNode,
    breadcrumb: state.breadcrumb as BreadcrumbItem[],
  };
}
