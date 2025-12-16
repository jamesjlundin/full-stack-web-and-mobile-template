import { withTrace, nowMs, durationMs } from "@acme/obs";

/**
 * Heartbeat job result
 */
export interface HeartbeatResult {
  ok: boolean;
  ts: number;
  job: "heartbeat";
  checks: {
    database?: boolean;
    memory?: boolean;
  };
  duration_ms: number;
}

/**
 * Run heartbeat health check
 *
 * Safe canary job for testing cron infrastructure.
 * Can be extended to include actual health checks.
 *
 * @returns HeartbeatResult with status and timing info
 */
export async function runHeartbeat(): Promise<HeartbeatResult> {
  const startMs = nowMs();

  const { result, error } = await withTrace("cron.heartbeat", async () => {
    const checks: HeartbeatResult["checks"] = {};

    // Memory check - verify we can allocate memory
    try {
      const memCheck = new Array(1000).fill("heartbeat");
      checks.memory = memCheck.length === 1000;
    } catch {
      checks.memory = false;
    }

    // Database check placeholder
    // In production, you might ping your database here:
    // try {
    //   await db.execute(sql`SELECT 1`);
    //   checks.database = true;
    // } catch {
    //   checks.database = false;
    // }
    checks.database = true; // Placeholder - always passes

    return checks;
  });

  const duration = durationMs(startMs);

  if (error) {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: "cron.heartbeat.error",
        error: error.message,
        duration_ms: duration,
      })
    );

    return {
      ok: false,
      ts: Date.now(),
      job: "heartbeat",
      checks: {},
      duration_ms: duration,
    };
  }

  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: "cron.heartbeat.complete",
      checks: result,
      duration_ms: duration,
    })
  );

  return {
    ok: true,
    ts: Date.now(),
    job: "heartbeat",
    checks: result || {},
    duration_ms: duration,
  };
}
