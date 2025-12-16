import { verifyCronRequest, cronResponse } from "@/lib/cronAuth";
import { runNightly } from "@/server/jobs";

/**
 * GET /api/cron/nightly
 *
 * Nightly maintenance cron endpoint.
 * Runs daily at 5:00 AM UTC via Vercel Cron.
 *
 * Performs:
 * - Health check
 * - Cleanup tasks (placeholder - extend with real cleanup logic)
 * - Background metrics emission
 *
 * Auth: requires x-cron-secret header or Vercel Cron header
 * Returns: { ok: true, ts: number, job: "nightly", tasks: {...}, duration_ms: number }
 */
export async function GET(request: Request) {
  // Verify cron authorization
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  // Run the nightly job
  const result = await runNightly();

  return cronResponse(result.job, {
    tasks: result.tasks,
    duration_ms: result.duration_ms,
  });
}

/**
 * POST handler - same as GET for flexibility
 * Some cron systems prefer POST for jobs that have side effects
 */
export async function POST(request: Request) {
  return GET(request);
}
