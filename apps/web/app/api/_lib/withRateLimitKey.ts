import { NextRequest, NextResponse } from 'next/server';

import type { createRateLimiter } from '@acme/security';

export type RateLimiter = ReturnType<typeof createRateLimiter>;

/**
 * Result from the key extraction function.
 * - `string`: The key to use for rate limiting; proceed with the request
 * - `Response`: An early response to return (e.g., 401 Unauthorized); skip rate limiting
 */
export type KeyResult = string | Response;

/**
 * Generic rate limiting wrapper that accepts a custom key extraction function.
 * Handles rate limit headers and 429 responses consistently.
 *
 * @param routeId - Unique identifier for this route (used as key prefix)
 * @param limiter - Rate limiter instance from @acme/security
 * @param getKey - Function to extract the rate limit key from the request.
 *                 Can return a Response to short-circuit (e.g., for auth failures).
 * @param handler - The actual route handler to wrap
 */
export function withRateLimitKey<TContext>(
  routeId: string,
  limiter: RateLimiter,
  getKey: (request: NextRequest) => Promise<KeyResult> | KeyResult,
  handler: (request: NextRequest, context: TContext) => Promise<Response>,
  getContext?: (request: NextRequest, key: string) => Promise<TContext> | TContext,
): (request: NextRequest) => Promise<Response> {
  return async (request: NextRequest): Promise<Response> => {
    // Extract the rate limit key
    const keyResult = await getKey(request);

    // If getKey returned a Response, return it immediately (e.g., 401)
    if (keyResult instanceof Response) {
      return keyResult;
    }

    const key = `${routeId}:${keyResult}`;

    const result = await limiter.check(key);
    const resetSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);

    const rateLimitHeaders: Record<string, string> = {
      'X-RateLimit-Limit': String(limiter.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(result.resetAt),
    };

    if (!result.allowed) {
      // Add Retry-After header when rate limited
      rateLimitHeaders['Retry-After'] = String(Math.max(1, resetSeconds));

      return NextResponse.json(
        { error: 'rate_limited' },
        {
          status: 429,
          headers: rateLimitHeaders,
        },
      );
    }

    // Get context if provided
    const context = getContext
      ? await getContext(request, keyResult)
      : (undefined as unknown as TContext);

    // Call the actual handler
    const response = await handler(request, context);

    // Clone response to add headers (Response headers may be immutable)
    const newHeaders = new Headers(response.headers);
    for (const [headerKey, value] of Object.entries(rateLimitHeaders)) {
      newHeaders.set(headerKey, value);
    }

    // Return new response with rate limit headers
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}
