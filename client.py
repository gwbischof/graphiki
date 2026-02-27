"""
Python client for the Graphoni REST API.

Usage:
    from client import GraphoniClient

    client = GraphoniClient("http://localhost:3001", api_key="gk_...")
    results = client.search("Maxwell", limit=10)
"""

import os
import json
import requests
from typing import Optional


class GraphoniError(Exception):
    """Error from the Graphoni API."""

    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"HTTP {status_code}: {detail}")


class GraphoniClient:
    """
    Client for the Graphoni graph wiki REST API.

    Usage:
        client = GraphoniClient()
        results = client.search("Epstein")

        node = client.get_node("jeffrey_epstein", hops=2)
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        admin_key: Optional[str] = None,
    ):
        self.base_url = (
            base_url or os.environ.get("GRAPHONI_URL", "http://localhost:3001")
        ).rstrip("/")
        self.api_key = api_key or os.environ.get("GRAPHONI_API_KEY")
        self.admin_key = admin_key or os.environ.get("GRAPHONI_ADMIN_KEY")
        self.session = requests.Session()
        if self.api_key:
            self.session.headers["Authorization"] = f"Bearer {self.api_key}"

    def _request(self, method: str, path: str, **kwargs) -> dict:
        url = f"{self.base_url}{path}"
        resp = self.session.request(method, url, **kwargs)
        if not resp.ok:
            try:
                body = resp.json()
                detail = body.get("error", resp.text)
            except Exception:
                detail = resp.text
            raise GraphoniError(resp.status_code, detail)
        return resp.json()

    def _get(self, path: str, **params) -> dict:
        # Filter None values from params
        params = {k: v for k, v in params.items() if v is not None}
        return self._request("GET", path, params=params)

    def _post(self, path: str, body: dict) -> dict:
        return self._request("POST", path, json=body)

    def _patch(self, path: str, body: dict) -> dict:
        return self._request("PATCH", path, json=body)

    def _delete(self, path: str) -> dict:
        return self._request("DELETE", path)

    # ── Read methods (guest, no auth needed) ──

    def search(
        self,
        query: str,
        limit: int = 20,
        types: Optional[list[str]] = None,
    ) -> list[dict]:
        """Text substring search for nodes by label, ID, name, or notes."""
        params = {"q": query, "limit": limit}
        if types:
            params["types"] = ",".join(types)
        data = self._get("/api/graph/search", **params)
        return data.get("results", [])

    def get_node(self, node_id: str, hops: int = 1, limit: int = 100) -> dict:
        """Get a node and its neighborhood (connected nodes/edges)."""
        return self._get(f"/api/graph/node/{node_id}", hops=hops, limit=limit)

    def find_path(
        self,
        from_node: str,
        to_node: str,
        max_length: int = 6,
    ) -> dict:
        """Find shortest path between two nodes."""
        return self._get(
            "/api/graph/path",
            **{"from": from_node, "to": to_node, "maxLength": max_length},
        )

    def stats(self) -> dict:
        """Graph statistics (node/edge counts by type)."""
        return self._get("/api/graph/stats")

    def expand(self, node_id: str, hops: int = 1, limit: int = 100) -> dict:
        """Expand a node's neighborhood."""
        return self._get("/api/graph/expand", nodeId=node_id, hops=hops, limit=limit)

    # ── Complex query (mod+) ──

    def query(self, query_dict: dict, limit: int = 5000) -> dict:
        """
        Execute a complex graph query via /api/graph/query.

        query_dict types:
          - {"type": "structured", "nodeTypes": [...], "filters": {...}, "centerNode": "...", "hops": 2}
          - {"type": "cypher", "cypher": "MATCH ..."}
          - {"type": "search", "q": "text"}
          - {"type": "community", "communityId": "...", "level": 0}
        """
        body = {**query_dict, "limit": limit}
        return self._post("/api/graph/query", body)

    # ── Proposal methods (user+) ──

    def add_node(
        self,
        label: str,
        node_type: str,
        reason: str,
        properties: Optional[dict] = None,
    ) -> dict:
        """Submit proposal to add a node."""
        data_after = {"label": label, "node_type": node_type}
        if properties:
            data_after.update(properties)
        return self._post(
            "/api/proposals",
            {"type": "add-node", "dataAfter": data_after, "reason": reason},
        )

    def edit_node(self, node_id: str, reason: str, properties: dict) -> dict:
        """Submit proposal to edit a node."""
        return self._post(
            "/api/proposals",
            {
                "type": "edit-node",
                "targetNodeId": node_id,
                "dataAfter": properties,
                "reason": reason,
            },
        )

    def delete_node(self, node_id: str, reason: str) -> dict:
        """Submit proposal to delete a node."""
        return self._post(
            "/api/proposals",
            {"type": "delete-node", "targetNodeId": node_id, "reason": reason},
        )

    def add_edge(
        self,
        source: str,
        target: str,
        edge_type: str,
        reason: str,
        properties: Optional[dict] = None,
    ) -> dict:
        """Submit proposal to add an edge."""
        data_after = {"source": source, "target": target, "edge_type": edge_type}
        if properties:
            data_after.update(properties)
        return self._post(
            "/api/proposals",
            {"type": "add-edge", "dataAfter": data_after, "reason": reason},
        )

    def edit_edge(self, edge_id: str, reason: str, properties: dict) -> dict:
        """Submit proposal to edit an edge."""
        return self._post(
            "/api/proposals",
            {
                "type": "edit-edge",
                "targetEdgeId": edge_id,
                "dataAfter": properties,
                "reason": reason,
            },
        )

    def delete_edge(self, edge_id: str, reason: str) -> dict:
        """Submit proposal to delete an edge."""
        return self._post(
            "/api/proposals",
            {"type": "delete-edge", "targetEdgeId": edge_id, "reason": reason},
        )

    # ── Review methods (mod+) ──

    def list_proposals(
        self,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict]:
        """List edit proposals (filterable by status)."""
        data = self._get(
            "/api/proposals", status=status, limit=limit, offset=offset
        )
        return data.get("proposals", [])

    def get_proposal(self, proposal_id: str) -> dict:
        """Get a single proposal by ID."""
        data = self._get(f"/api/proposals/{proposal_id}")
        return data.get("proposal", data)

    def approve_proposal(self, proposal_id: str, comment: str = "") -> dict:
        """Approve a pending proposal (auto-applies Cypher)."""
        return self._patch(
            f"/api/proposals/{proposal_id}",
            {"status": "approved", "reviewComment": comment},
        )

    def reject_proposal(self, proposal_id: str, comment: str = "") -> dict:
        """Reject a pending proposal."""
        return self._patch(
            f"/api/proposals/{proposal_id}",
            {"status": "rejected", "reviewComment": comment},
        )

    # ── Bulk admin methods (X-API-Key auth) ──

    def _bulk_post(self, path: str, body: dict) -> dict:
        """POST with X-API-Key header for bulk admin endpoints."""
        headers = {}
        if self.admin_key:
            headers["X-API-Key"] = self.admin_key
        url = f"{self.base_url}{path}"
        resp = self.session.post(url, json=body, headers=headers)
        if not resp.ok:
            try:
                detail = resp.json().get("error", resp.text)
            except Exception:
                detail = resp.text
            raise GraphoniError(resp.status_code, detail)
        return resp.json()

    def bulk_merge_nodes(
        self,
        labels: list[str],
        nodes: list[dict],
        merge_key: str,
        batch_size: int = 1000,
    ) -> int:
        """Bulk MERGE nodes via /api/admin/bulk-nodes. Returns total merged count."""
        total = 0
        for i in range(0, len(nodes), batch_size):
            batch = nodes[i : i + batch_size]
            data = self._bulk_post(
                "/api/admin/bulk-nodes",
                {"labels": labels, "nodes": batch, "merge_key": merge_key},
            )
            total += data.get("merged", 0)
        return total

    def bulk_merge_edges(
        self,
        edge_type: str,
        source_label: str,
        target_label: str,
        edges: list[dict],
        source_key: str = "efta_id",
        target_key: str = "id",
        batch_size: int = 1000,
    ) -> int:
        """Bulk MERGE edges via /api/admin/bulk-edges. Returns total created count."""
        total = 0
        for i in range(0, len(edges), batch_size):
            batch = edges[i : i + batch_size]
            data = self._bulk_post(
                "/api/admin/bulk-edges",
                {
                    "edge_type": edge_type,
                    "source_label": source_label,
                    "target_label": target_label,
                    "edges": batch,
                    "source_key": source_key,
                    "target_key": target_key,
                },
            )
            total += data.get("created", 0)
        return total

    # ── Other ──

    def audit_log(
        self,
        limit: int = 50,
        offset: int = 0,
        target_node_id: Optional[str] = None,
        action: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> list[dict]:
        """Query the audit log."""
        data = self._get(
            "/api/audit",
            limit=limit,
            offset=offset,
            targetNodeId=target_node_id,
            action=action,
            userId=user_id,
        )
        return data.get("entries", [])

    def me(self) -> dict:
        """Get current authenticated user info."""
        return self._get("/api/me")
