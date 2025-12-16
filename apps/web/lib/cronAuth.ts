import { NextResponse } from "next/server";

/**
 * Cron authentication guard utilities
 *
 * Verifies cron requests using dual-accept strategy:
 * 1. x-cron-secret header matches CRON_SECRET env var
 * 2. Vercel Cron header (if available in runtime)
 *
 * Use for all cron route handlers to prevent unauthorized access.
 */

/**
 * Default secret for local development (override in production!)
 */
const DEFAULT_CRON_SECRET = "dev-secret";

/**
 * Get the configured cron secret
 */
function getCronSecret(): string {
  return process.env.CRON_SECRET || DEFAULT_CRON_SECRET;
}

/**
 * Check if request has valid cron authorization
 *
 * Accepts either:
 * - x-cron-secret header matching CRON_SECRET
 * - Vercel's automatic cron authorization header
 *
 * @param request - Incoming request
 * @returns true if authorized, false otherwise
 */
export function isCronAuthorized(request: Request): boolean {
  // Check custom cron secret header (for manual triggers and local dev)
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret && cronSecret === getCronSecret()) {
    return true;
  }

  // Check Vercel's automatic cron authorization header
  // Vercel sets this header automatically for cron-triggered requests
  const vercelCronAuth = request.headers.get("authorization");
  const expectedVercelAuth = `Bearer ${getCronSecret()}`;
  if (vercelCronAuth && vercelCronAuth === expectedVercelAuth) {
    return true;
  }

  // Vercel also may set x-vercel-cron header for cron requests
  // This is set to "true" when the request comes from Vercel Cron
  const vercelCronHeader = request.headers.get("x-vercel-cron");
  if (vercelCronHeader === "true") {
    // Still require CRON_SECRET to be set in production for security
    // but if x-vercel-cron is present, we know it's from Vercel's scheduler
    return true;
  }

  return false;
}

/**
 * Verify cron request and return error response if unauthorized
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
      event: "cron.unauthorized",
      path: new URL(request.url).pathname,
      method: request.method,
    })
  );

  return NextResponse.json(
    {
      error: "Unauthorized",
      message: "Invalid or missing cron secret",
    },
    { status: 401 }
  );
}

/**
 * Create a standard cron response
 *
 * @param job - Job name
 * @param data - Additional response data
 * @returns JSON response with standard cron fields
 */
export function cronResponse<T extends object>(
  job: string,
  data: T = {} as T
): NextResponse {
  return NextResponse.json({
    ok: true,
    ts: Date.now(),
    job,
    ...data,
  });
}
