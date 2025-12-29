import { withTrace, runInBackground, nowMs, durationMs } from '@acme/obs';

/**
 * Nightly job result
 */
export interface NightlyResult {
  ok: boolean;
  ts: number;
  job: 'nightly';
  tasks: {
    healthCheck: boolean;
    cleanup?: boolean;
  };
  duration_ms: number;
}

/**
 * Emit summary metrics (background work example)
 * Runs after response is sent via runInBackground
 */
async function emitSummaryMetrics(taskResults: NightlyResult['tasks']): Promise<void> {
  // Simulate metrics emission - in production, send to observability platform
  const metrics = {
    ts: new Date().toISOString(),
    event: 'cron.nightly.metrics',
    tasks_completed: Object.values(taskResults).filter(Boolean).length,
    tasks_total: Object.keys(taskResults).length,
  };

  console.log(JSON.stringify(metrics));

  // Simulate async work (e.g., posting to external metrics service)
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Run nightly maintenance job
 *
 * Template maintenance example that is safe and idempotent:
 * - Runs a lightweight health check
 * - Placeholder for cleanup tasks (expired sessions, old logs, etc.)
 * - Uses runInBackground for non-critical follow-up work
 *
 * @returns NightlyResult with status and timing info
 */
export async function runNightly(): Promise<NightlyResult> {
  const startMs = nowMs();

  const { result, error } = await withTrace('cron.nightly', async () => {
    const tasks: NightlyResult['tasks'] = {
      healthCheck: false,
      cleanup: false,
    };

    // Task 1: Health check
    try {
      // Simple sanity check - verify environment is healthy
      const envCheck = typeof process.env.NODE_ENV === 'string' && typeof Date.now === 'function';
      tasks.healthCheck = envCheck;
    } catch {
      tasks.healthCheck = false;
    }

    // Task 2: Cleanup placeholder
    // In production, implement actual cleanup logic:
    // - Clean expired sessions: await db.delete(sessions).where(lt(sessions.expiresAt, now))
    // - Archive old logs: await archiveLogsOlderThan(30 days)
    // - Prune temp files: await cleanupTempDirectory()
    try {
      // Placeholder - simulate successful cleanup
      tasks.cleanup = true;
    } catch {
      tasks.cleanup = false;
    }

    return tasks;
  });

  const duration = durationMs(startMs);

  if (error) {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: 'cron.nightly.error',
        error: error.message,
        duration_ms: duration,
      }),
    );

    return {
      ok: false,
      ts: Date.now(),
      job: 'nightly',
      tasks: { healthCheck: false },
      duration_ms: duration,
    };
  }

  const tasks = result || { healthCheck: false };

  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'cron.nightly.complete',
      tasks,
      duration_ms: duration,
    }),
  );

  // Schedule non-critical background work (runs after response is sent)
  runInBackground(() => emitSummaryMetrics(tasks), undefined, 'nightly-metrics');

  return {
    ok: true,
    ts: Date.now(),
    job: 'nightly',
    tasks,
    duration_ms: duration,
  };
}
