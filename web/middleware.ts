import { NextRequest, NextResponse } from "next/server";

/**
 * API key middleware for Graphoni.
 *
 * Gates all /api/* routes (except /api/health and /api/auth/*).
 * Accepts any of:
 *   - X-API-Key header matching GRAPHONI_API_KEY env var
 *   - NextAuth session cookie (browser users)
 *   - Authorization: Bearer gk_* header (per-user API keys, validated downstream)
 *
 * If GRAPHONI_API_KEY is not set, all requests pass through (dev mode).
 */

const GRAPHONI_API_KEY = process.env.GRAPHONI_API_KEY;

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/api/health") return true;
  if (pathname.startsWith("/api/auth/")) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only gate /api/* routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Public routes always pass through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Dev mode: no GRAPHONI_API_KEY set → allow all
  if (!GRAPHONI_API_KEY) {
    return NextResponse.next();
  }

  // Same-origin requests (browser frontend) pass through
  const referer = request.headers.get("referer");
  if (referer) {
    const refererUrl = new URL(referer);
    const requestUrl = request.nextUrl;
    if (refererUrl.origin === requestUrl.origin) {
      return NextResponse.next();
    }
  }

  // Check X-API-Key header
  const xApiKey = request.headers.get("x-api-key");
  if (xApiKey === GRAPHONI_API_KEY) {
    return NextResponse.next();
  }

  // Check for NextAuth session cookie (authjs.session-token or __Secure- variant)
  const hasSessionCookie =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");
  if (hasSessionCookie) {
    return NextResponse.next();
  }

  // Check for per-user Bearer API key (gk_* tokens validated downstream by auth-guard)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer gk_")) {
    return NextResponse.next();
  }

  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401 }
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
