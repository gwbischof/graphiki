import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";

/**
 * Check admin access via either:
 * 1. X-API-Key header matching GRAPHONI_ADMIN_KEY env var
 * 2. Existing requireRole("admin") (NextAuth session or Bearer gk_ API key)
 *
 * Returns { error } if unauthorized, or {} if authorized.
 */
export async function requireAdmin(request: NextRequest): Promise<{
  error?: NextResponse;
}> {
  // Check X-API-Key first (fast path for scripts/automation)
  const apiKey = request.headers.get("x-api-key");
  const expected = process.env.GRAPHONI_ADMIN_KEY;
  if (expected && apiKey === expected) {
    return {};
  }

  // Fall back to session/Bearer auth
  const { error } = await requireRole("admin");
  if (error) return { error };

  return {};
}
