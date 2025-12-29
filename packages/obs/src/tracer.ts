import type { TraceContext, TraceResult } from './types';

/**
 * Generate a random hex trace ID (16 bytes = 32 hex chars)
 */
function generateTraceId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Log a span event as single-line JSON (friendly to log aggregators)
 */
function logSpanEvent(
  event: 'start' | 'end',
  spanName: string,
  ctx: TraceContext,
  duration_ms?: number,
  error?: string,
): void {
  const log: Record<string, unknown> = {
    ts: new Date().toISOString(),
    event,
    span: spanName,
    trace_id: ctx.traceId,
  };

  if (ctx.parentId) {
    log.parent_id = ctx.parentId;
  }

  if (duration_ms !== undefined) {
    log.duration_ms = duration_ms;
  }

  if (error) {
    log.error = error;
  }

  console.log(JSON.stringify(log));
}

/**
 * Wrap a function with tracing context
 * Logs span start/end as single-line JSON
 *
 * @param spanName - Name of the span (e.g., "chat.stream", "llm.call")
 * @param fn - Async or sync function to execute within the trace
 * @param parent - Optional parent trace context for distributed tracing
 * @returns TraceResult with result, error, context, and duration
 */
export async function withTrace<T>(
  spanName: string,
  fn: (ctx: TraceContext) => Promise<T> | T,
  parent?: TraceContext,
): Promise<TraceResult<T>> {
  const ctx: TraceContext = {
    traceId: parent?.traceId ?? generateTraceId(),
    parentId: parent?.traceId,
    startMs: Date.now(),
  };

  logSpanEvent('start', spanName, ctx);

  let result: T | undefined;
  let error: Error | undefined;

  try {
    result = await fn(ctx);
  } catch (e) {
    error = e instanceof Error ? e : new Error(String(e));
  }

  const duration_ms = Date.now() - ctx.startMs;

  logSpanEvent('end', spanName, ctx, duration_ms, error?.message);

  return {
    result,
    error,
    ctx,
    duration_ms,
  };
}

/**
 * Create a new trace context without executing a function
 * Useful for manual trace management
 */
export function createTraceContext(parent?: TraceContext): TraceContext {
  return {
    traceId: parent?.traceId ?? generateTraceId(),
    parentId: parent?.traceId,
    startMs: Date.now(),
  };
}
