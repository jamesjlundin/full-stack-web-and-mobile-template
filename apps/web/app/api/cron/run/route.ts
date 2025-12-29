import { NextResponse } from "next/server";

import { verifyCronRequest, cronResponse } from "@/lib/cronAuth";
import { runJob, type JobName } from "@/server/jobs";

/**
 * POST /api/cron/run
 *
 * Manual trigger endpoint for running cron jobs on demand.
 * Useful for testing and debugging jobs locally or in production.
 *
 * Auth: requires x-cron-secret header
 * Body: { job: "heartbeat" | "nightly" }
 * Returns: Job result
 *
 * Example:
 *   curl -X POST http://localhost:3000/api/cron/run \
 *     -H "x-cron-secret: dev-secret" \
 *     -H "Content-Type: application/json" \
 *     -d '{"job": "heartbeat"}'
 */
export async function POST(request: Request) {
  // Verify cron authorization
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  // Parse request body
  let body: { job?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate job name
  const jobName = body.job;
  if (!jobName || !isValidJobName(jobName)) {
    return NextResponse.json(
      {
        error: "Invalid job name",
        message: 'Expected { job: "heartbeat" | "nightly" }',
        availableJobs: ["heartbeat", "nightly"],
      },
      { status: 400 },
    );
  }

  // Run the job
  try {
    const result = await runJob(jobName);
    return cronResponse(result.job, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: "cron.run.error",
        job: jobName,
        error: message,
      }),
    );

    return NextResponse.json(
      { error: "Job execution failed", message },
      { status: 500 },
    );
  }
}

/**
 * Type guard for valid job names
 */
function isValidJobName(name: string): name is JobName {
  return name === "heartbeat" || name === "nightly";
}
