import { getCurrentUser, type CurrentUserResult } from '@acme/auth';
import { NextRequest, NextResponse } from 'next/server';

import type { createRateLimiter } from '@acme/security';

type RateLimiter = ReturnType<typeof createRateLimiter>;
type UserRouteHandler = (
  request: NextRequest,
  user: NonNullable<CurrentUserResult>,
) => Promise<Response>;

/**
 * Wraps a Next.js route handler with authentication and user-based rate limiting.
 * Rate limit is applied per user ID instead of IP address.
 * Returns 401 if not authenticated, 429 if rate limited.
 */
export function withUserRateLimit(
  routeId: string,
  limiter: RateLimiter,
  handler: UserRouteHandler,
): (request: NextRequest) => Promise<Response> {
  return async (request: NextRequest): Promise<Response> => {
    // Check authentication first
    const userResult = await getCurrentUser(request);

    if (!userResult?.user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Rate limit by user ID
    const key = `${routeId}:user:${userResult.user.id}`;
    const result = await limiter.check(key);
    const resetSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);

    const rateLimitHeaders: Record<string, string> = {
      'X-RateLimit-Limit': String(limiter.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(result.resetAt),
    };

    if (!result.allowed) {
      rateLimitHeaders['Retry-After'] = String(Math.max(1, resetSeconds));

      return NextResponse.json(
        { error: 'rate_limited' },
        {
          status: 429,
          headers: rateLimitHeaders,
        },
      );
    }

    // Call the handler with authenticated user
    const response = await handler(request, userResult);

    // Clone response to safely read the body and add headers
    const clonedResponse = response.clone();
    const newHeaders = new Headers(clonedResponse.headers);
    for (const [headerKey, value] of Object.entries(rateLimitHeaders)) {
      newHeaders.set(headerKey, value);
    }

    return new Response(clonedResponse.body, {
      status: clonedResponse.status,
      statusText: clonedResponse.statusText,
      headers: newHeaders,
    });
  };
}
