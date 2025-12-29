import { timingSafeEqual } from 'crypto';

import { NextResponse } from 'next/server';

/**
 * Cron authentication guard utilities
 *
 * Verifies cron requests using Vercel's official authentication mechanism:
 * - Authorization: Bearer {CRON_SECRET} header (set automatically by Vercel)
 * - x-cron-secret header (for manual triggers and local development)
 *
 * IMPORTANT: The x-vercel-cron header is NOT used for authentication.
 * It is informational only and can be easily spoofed by attackers.
 *
 * @see https://vercel.com/docs/cron-jobs/manage-cron-jobs
 */

/**
 * Get the configured cron secret.
 * Returns null if not configured in production (which will block all cron requests).
 */
function getCronSecret(): string | null {
  const secret = process.env.CRON_SECRET;

  // In production, CRON_SECRET must be set - fail closed
  if (process.env.NODE_ENV === 'production' && !secret) {
    console.error(
      '[SECURITY] CRON_SECRET is not set in production. All cron requests will be rejected. ' +
        'Set CRON_SECRET environment variable with: openssl rand -hex 32',
    );
    return null;
  }

  // In development without CRON_SECRET, allow a local-only fallback
  // This only works for local testing and logs a warning
  if (!secret) {
    console.warn(
      '[DEV] CRON_SECRET not set. Using insecure development fallback. ' +
        'This will NOT work in production.',
    );
    return 'dev-secret-local-only';
  }

  return secret;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Returns false if strings have different lengths or don't match.
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch {
    return false;
  }
}

/**
 * Check if request has valid cron authorization.
 *
 * Accepts authentication via:
 * 1. Authorization: Bearer {CRON_SECRET} - Vercel's official method
 * 2. x-cron-secret: {CRON_SECRET} - For manual triggers and local development
 *
 * SECURITY NOTE: The x-vercel-cron header is NOT used for authentication.
 * While Vercel sets this header to "true" for cron-triggered requests,
 * it can be trivially spoofed by attackers and provides no security.
 * Always rely on CRON_SECRET validation.
 *
 * @param request - Incoming request
 * @returns true if authorized, false otherwise
 */
export function isCronAuthorized(request: Request): boolean {
  const cronSecret = getCronSecret();

  // If no secret is configured (production without CRON_SECRET), reject all requests
  if (!cronSecret) {
    return false;
  }

  // Method 1: Check Authorization: Bearer header (Vercel's official method)
  // Vercel automatically sends: Authorization: Bearer {CRON_SECRET}
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];
    if (token && secureCompare(token, cronSecret)) {
      return true;
    }
  }

  // Method 2: Check x-cron-secret header (for manual triggers and local dev)
  const customSecret = request.headers.get('x-cron-secret');
  if (customSecret && secureCompare(customSecret, cronSecret)) {
    return true;
  }

  return false;
}

/**
 * Verify cron request and return error response if unauthorized.
 *
 * Use at the start of cron route handlers:
 * @example
 * export async function GET(request: Request) {
 *   const authError = verifyCronRequest(request);
 *   if (authError) return authError;
 *   // ... handle cron job
 * }
 *
 * @param request - Incoming request
 * @returns null if authorized, NextResponse with 401 error if not
 */
export function verifyCronRequest(request: Request): NextResponse | null {
  if (isCronAuthorized(request)) {
    return null;
  }

  // Log unauthorized attempt (without revealing secrets)
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'cron.unauthorized',
      path: new URL(request.url).pathname,
      method: request.method,
    }),
  );

  return NextResponse.json(
    {
      error: 'Unauthorized',
      message: 'Invalid or missing cron secret',
    },
    { status: 401 },
  );
}

/**
 * Create a standard cron response.
 *
 * @param job - Job name
 * @param data - Additional response data
 * @returns JSON response with standard cron fields
 */
export function cronResponse<T extends object>(job: string, data: T = {} as T): NextResponse {
  return NextResponse.json({
    ok: true,
    ts: Date.now(),
    job,
    ...data,
  });
}
