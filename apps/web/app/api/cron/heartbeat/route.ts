import { verifyCronRequest, cronResponse } from '@/lib/cronAuth';
import { runHeartbeat } from '@/server/jobs';

/**
 * GET /api/cron/heartbeat
 *
 * Heartbeat cron endpoint - safe canary for testing cron infrastructure.
 * Runs daily at 12pm UTC via Vercel Cron (Hobby plan: daily minimum).
 *
 * Auth: requires x-cron-secret header or Vercel Cron header
 * Returns: { ok: true, ts: number, job: "heartbeat", checks: {...}, duration_ms: number }
 */
export async function GET(request: Request) {
  // Verify cron authorization
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  // Run the heartbeat job
  const result = await runHeartbeat();

  return cronResponse(result.job, {
    checks: result.checks,
    duration_ms: result.duration_ms,
  });
}
