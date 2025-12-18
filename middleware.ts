// middleware.ts
export const preferredRegion = "sin1";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkMiddleware, getAuth } from "@clerk/nextjs/server";

/**
 * Middleware handles:
 * - Auth guard for private routes
 * - Allow public access to stats/tournament pages
 * - Skip static assets and public APIs
 */

const PUBLIC_PATHS = [
  "/", // homepage
  "/sign-in",
  "/sign-up",
  "/api/public",
  "/favicon.ico",
  "/robots.txt",
  "/manifest.json",
  "/privacy",
  "/terms",
  "/docs", // documentation landing
  "/docs/", // documentation landing
  "/docs/getting-started",
  "/docs/features",
  "/docs/teams",
  "/docs/sessions",
  "/docs/leaderboards",
  "/help",
];

const PUBLIC_PATTERNS = [
  /^\/team\/[^/]+\/stats$/, // /team/[slug]/stats
  /^\/tournament\/[^/]+$/, // /tournament/[slug]
  /^\/tournament\/[^/]+\/results$/, // optional future variant
  /^\/spectate\/[^/]+$/, // /spectate/[teamSlug]
];

export default clerkMiddleware(async (auth: any, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // 1. Skip static assets and build files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/assets") ||
    pathname.includes("favicon")
  ) {
    return NextResponse.next();
  }

  // 2. Allow public routes
  const isPublicRoute =
    PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(path)
    ) || PUBLIC_PATTERNS.some((pattern) => pattern.test(pathname));

  if (isPublicRoute) return NextResponse.next();

  // 3. Auth check
  const { userId } = getAuth(req);
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // 4. Allow request to proceed
  return NextResponse.next();
});

// 5. Limit middleware execution
export const config = {
  matcher: ["/((?!_next|images|assets|favicon.ico|robots.txt|api/public).*)"],
};
