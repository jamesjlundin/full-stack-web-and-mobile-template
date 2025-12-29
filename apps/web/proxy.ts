import { NextResponse, type NextRequest } from "next/server";

/**
 * Protected route paths that require authentication.
 * Add paths here to protect them. Supports exact matches and prefix matches.
 * - Exact: "/dashboard" matches only /dashboard
 * - Prefix with wildcard: "/app" matches /app, /app/settings, /app/foo/bar, etc.
 */
const PROTECTED_PATH_PREFIXES = [
  "/app",
  "/dashboard",
  "/account",
  "/protected",
];

// Security headers for API responses
const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

// Check if origin is allowed in development (localhost or 127.0.0.1)
function isDevOriginAllowed(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

// Get allowed origin based on environment
function getAllowedOrigin(requestOrigin: string | null): string | null {
  if (!requestOrigin) return null;

  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    // In development, allow localhost and 127.0.0.1 origins
    if (isDevOriginAllowed(requestOrigin)) {
      return requestOrigin;
    }
  } else {
    // In production, only allow APP_BASE_URL origin
    const allowedOrigin = process.env.APP_BASE_URL?.replace(/\/$/, "");
    if (allowedOrigin && requestOrigin === allowedOrigin) {
      return allowedOrigin;
    }
  }

  return null;
}

// Apply security headers to response
function applySecurityHeaders(response: NextResponse): void {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
}

// Apply CORS headers to response
function applyCorsHeaders(
  response: NextResponse,
  allowedOrigin: string | null,
): void {
  if (allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization",
    );
  }
}

// Handle API routes with security headers and CORS
function handleApiRoute(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");
  const allowedOrigin = getAllowedOrigin(origin);

  // Handle OPTIONS preflight request
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    applySecurityHeaders(response);
    applyCorsHeaders(response, allowedOrigin);
    return response;
  }

  // For non-OPTIONS requests, proceed with security and CORS headers
  const response = NextResponse.next();
  applySecurityHeaders(response);
  applyCorsHeaders(response, allowedOrigin);

  return response;
}

// Check if a path requires authentication
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Check authentication status by calling /api/me
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const meUrl = new URL("/api/me", request.nextUrl.origin);
  const response = await fetch(meUrl.toString(), {
    headers: { cookie: request.headers.get("cookie") ?? "" },
    credentials: "include",
  });

  return response.status !== 401;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle API routes: apply security headers and CORS
  if (pathname.startsWith("/api/")) {
    return handleApiRoute(request);
  }

  // Only check authentication for protected paths
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // Handle protected app routes: check authentication
  const authenticated = await isAuthenticated(request);

  if (!authenticated) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next (Next.js internals)
     * - static files (images, fonts, etc.)
     * - favicon.ico
     */
    "/((?!_next|.*\\..*|favicon.ico).*)",
  ],
};
