// ViewState type + reducer for tracking expanded communities, camera, visible graph

import type { CytoscapeElement } from "./graph-data";

export interface ViewState {
  // Current zoom level path: e.g. ["root", "community_0_3", "community_1_12"]
  breadcrumb: BreadcrumbItem[];
  // Currently visible elements
  elements: CytoscapeElement[];
  // Expanded community IDs (their children are shown instead)
  expandedCommunities: Set<string>;
  // Cache of fetched community data
  communityCache: Map<string, CytoscapeElement[]>;
  // Loading state
  loading: boolean;
  // Active view name (if viewing a saved view)
  activeView: string | null;
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  level: number;
}

export type ViewAction =
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ELEMENTS"; elements: CytoscapeElement[] }
  | { type: "EXPAND_COMMUNITY"; communityId: string; children: CytoscapeElement[] }
  | { type: "COLLAPSE_TO"; breadcrumbIndex: number }
  | { type: "PUSH_BREADCRUMB"; item: BreadcrumbItem }
  | { type: "SET_ACTIVE_VIEW"; view: string | null }
  | { type: "CACHE_COMMUNITY"; communityId: string; elements: CytoscapeElement[] }
  | { type: "RESET"; elements: CytoscapeElement[] };

export function createInitialViewState(): ViewState {
  return {
    breadcrumb: [{ id: "root", label: "Overview", level: -1 }],
    elements: [],
    expandedCommunities: new Set(),
    communityCache: new Map(),
    loading: true,
    activeView: null,
  };
}

export function viewReducer(state: ViewState, action: ViewAction): ViewState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.loading };

    case "SET_ELEMENTS":
      return { ...state, elements: action.elements, loading: false };

    case "EXPAND_COMMUNITY": {
      const newExpanded = new Set(state.expandedCommunities);
      newExpanded.add(action.communityId);

      // Replace the community supernode with its children
      const elements = [
        ...state.elements.filter(
          (e) =>
            // Remove the community node
            !(e.group === "nodes" && e.data.id === action.communityId) &&
            // Remove edges to/from the community node
            !(
              e.group === "edges" &&
              ((e.data as { source: string }).source === action.communityId ||
                (e.data as { target: string }).target === action.communityId)
            )
        ),
        ...action.children,
      ];

      const newCache = new Map(state.communityCache);
      newCache.set(action.communityId, action.children);

      return {
        ...state,
        elements,
        expandedCommunities: newExpanded,
        communityCache: newCache,
        loading: false,
      };
    }

    case "COLLAPSE_TO": {
      // Collapse everything below the given breadcrumb index
      const newBreadcrumb = state.breadcrumb.slice(0, action.breadcrumbIndex + 1);
      return {
        ...state,
        breadcrumb: newBreadcrumb,
        expandedCommunities: new Set(),
        // Elements will be re-fetched by the hook
        loading: true,
      };
    }

    case "PUSH_BREADCRUMB":
      return {
        ...state,
        breadcrumb: [...state.breadcrumb, action.item],
      };

    case "SET_ACTIVE_VIEW":
      return { ...state, activeView: action.view };

    case "CACHE_COMMUNITY": {
      const newCache = new Map(state.communityCache);
      newCache.set(action.communityId, action.elements);
      return { ...state, communityCache: newCache };
    }

    case "RESET":
      return {
        ...createInitialViewState(),
        elements: action.elements,
        loading: false,
      };

    default:
      return state;
  }
}
