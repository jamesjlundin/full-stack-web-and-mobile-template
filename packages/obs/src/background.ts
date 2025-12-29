/**
 * Background work helpers for running tasks after response
 *
 * Uses Vercel waitUntil when available, falls back to safe fire-and-forget.
 * Designed for cron jobs and background processing.
 */

/**
 * Get current time in milliseconds
 */
export function nowMs(): number {
  return Date.now();
}

/**
 * Calculate duration from a start time
 * @param startMs - Start timestamp from nowMs()
 * @returns Duration in milliseconds
 */
export function durationMs(startMs: number): number {
  return Date.now() - startMs;
}

/**
 * Log a background task event as single-line JSON
 */
function logBackgroundEvent(
  event: "start" | "complete" | "error",
  taskName: string,
  duration_ms?: number,
  error?: string,
): void {
  const log: Record<string, unknown> = {
    ts: new Date().toISOString(),
    event: `background.${event}`,
    task: taskName,
  };

  if (duration_ms !== undefined) {
    log.duration_ms = duration_ms;
  }

  if (error) {
    log.error = error;
  }

  console.log(JSON.stringify(log));
}

/**
 * Type for the waitUntil function available in Vercel runtime
 */
type WaitUntilFn = (promise: Promise<unknown>) => void;

/**
 * Context object that may contain waitUntil (from Vercel runtime)
 */
export interface BackgroundContext {
  waitUntil?: WaitUntilFn;
}

/**
 * Check if BACKGROUND_ENABLED is set (defaults to enabled)
 */
function isBackgroundEnabled(): boolean {
  const val = process.env.BACKGROUND_ENABLED;
  // Enabled by default, only disabled if explicitly set to "0" or "false"
  if (val === "0" || val === "false") {
    return false;
  }
  return true;
}

/**
 * Attempt to get waitUntil from various sources
 * In Vercel runtime, waitUntil may be available via different mechanisms
 */
function getWaitUntil(ctx?: BackgroundContext): WaitUntilFn | undefined {
  // First check if passed explicitly in context
  if (ctx?.waitUntil) {
    return ctx.waitUntil;
  }

  // In Node.js/Vercel Edge runtime, waitUntil might be on globalThis
  // This is a best-effort detection
  const global = globalThis as unknown as { waitUntil?: WaitUntilFn };
  if (typeof global.waitUntil === "function") {
    return global.waitUntil;
  }

  return undefined;
}

/**
 * Run a task in the background after the response is sent
 *
 * Uses Vercel waitUntil when available to keep the function running
 * after the response is returned. Falls back to safe fire-and-forget
 * execution with error logging.
 *
 * @param promiseOrFn - Promise or async function to execute
 * @param ctx - Optional context containing waitUntil function
 * @param taskName - Optional name for logging (defaults to "anonymous")
 *
 * @example
 * // In a Next.js route handler
 * import { runInBackground } from "@acme/obs";
 *
 * export async function GET() {
 *   // Do main work...
 *
 *   // Schedule background work (won't block response)
 *   runInBackground(async () => {
 *     await sendAnalytics();
 *     await warmCache();
 *   }, undefined, "post-response-tasks");
 *
 *   return Response.json({ ok: true });
 * }
 */
export function runInBackground(
  promiseOrFn: Promise<unknown> | (() => Promise<unknown>),
  ctx?: BackgroundContext,
  taskName = "anonymous",
): void {
  // Check if background work is enabled
  if (!isBackgroundEnabled()) {
    logBackgroundEvent(
      "complete",
      taskName,
      0,
      "disabled via BACKGROUND_ENABLED",
    );
    return;
  }

  const startMs = nowMs();
  logBackgroundEvent("start", taskName);

  // Convert function to promise if needed
  const promise =
    typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn;

  // Wrap with logging
  const wrappedPromise = promise
    .then(() => {
      logBackgroundEvent("complete", taskName, durationMs(startMs));
    })
    .catch((err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logBackgroundEvent("error", taskName, durationMs(startMs), errorMessage);
      // Don't rethrow - background tasks should never crash the process
    });

  // Try to use waitUntil if available
  const waitUntil = getWaitUntil(ctx);
  if (waitUntil) {
    try {
      waitUntil(wrappedPromise);
      return;
    } catch {
      // waitUntil might throw if called at wrong time, fall through to fire-and-forget
    }
  }

  // Fire-and-forget fallback - promise will execute but we don't await it
  // The wrapped promise already handles errors, so no unhandled rejection
  void wrappedPromise;
}
