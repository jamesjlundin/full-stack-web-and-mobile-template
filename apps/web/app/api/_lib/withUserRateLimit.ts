import { getCurrentUser, type CurrentUserResult } from '@acme/auth';
import { NextRequest, NextResponse } from 'next/server';

import { withRateLimitKey } from './withRateLimitKey';

import type { RateLimiter } from './withRateLimitKey';

type UserRouteHandler = (
  request: NextRequest,
  user: NonNullable<CurrentUserResult>,
) => Promise<Response>;

// Cache for storing user results during request processing
const userCache = new WeakMap<NextRequest, NonNullable<CurrentUserResult>>();

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
  return withRateLimitKey<NonNullable<CurrentUserResult>>(
    routeId,
    limiter,
    // Key extraction function: get user ID or return 401
    async (request: NextRequest) => {
      const userResult = await getCurrentUser(request);

      if (!userResult?.user) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      }

      // Cache the user result for context retrieval
      userCache.set(request, userResult);

      return `user:${userResult.user.id}`;
    },
    handler,
    // Context provider: retrieve the cached user result
    (request: NextRequest) => {
      const cached = userCache.get(request);
      if (!cached) {
        throw new Error('User result not found in cache');
      }
      return cached;
    },
  );
}
