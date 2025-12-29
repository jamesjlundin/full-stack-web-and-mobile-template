import { NextRequest, NextResponse } from "next/server";

import type { createRateLimiter } from "@acme/security";

type RateLimiter = ReturnType<typeof createRateLimiter>;
type RouteHandler = (request: NextRequest) => Promise<Response>;

/**
 * Extract client IP from request headers.
 * Uses x-forwarded-for (first IP) or falls back to x-real-ip.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs; take the first one
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}

/**
 * Wraps a Next.js route handler with rate limiting.
 * Rate limit check happens before the handler is invoked.
 */
export function withRateLimit(
  routeId: string,
  limiter: RateLimiter,
  handler: RouteHandler,
): RouteHandler {
  return async (request: NextRequest): Promise<Response> => {
    const ip = getClientIp(request);
    const key = `${routeId}:${ip}`;

    const result = await limiter.check(key);
    const resetSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);

    const rateLimitHeaders: Record<string, string> = {
      "X-RateLimit-Limit": String(limiter.limit),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(result.resetAt),
    };

    if (!result.allowed) {
      // Add Retry-After header when rate limited
      rateLimitHeaders["Retry-After"] = String(Math.max(1, resetSeconds));

      return NextResponse.json(
        { error: "rate_limited" },
        {
          status: 429,
          headers: rateLimitHeaders,
        },
      );
    }

    // Call the actual handler
    const response = await handler(request);

    // Clone response to add headers (Response headers may be immutable)
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      newHeaders.set(key, value);
    }

    // Return new response with rate limit headers
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}
