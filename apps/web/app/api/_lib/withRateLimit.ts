import { NextRequest } from 'next/server';

import { withRateLimitKey } from './withRateLimitKey';

import type { RateLimiter } from './withRateLimitKey';

type RouteHandler = (request: NextRequest) => Promise<Response>;

/**
 * Extract client IP from request headers.
 * Uses x-forwarded-for (first IP) or falls back to x-real-ip.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs; take the first one
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'unknown';
}

/**
 * Wraps a Next.js route handler with rate limiting by IP address.
 * Rate limit check happens before the handler is invoked.
 */
export function withRateLimit(
  routeId: string,
  limiter: RateLimiter,
  handler: RouteHandler,
): RouteHandler {
  return withRateLimitKey<undefined>(routeId, limiter, getClientIp, handler);
}
