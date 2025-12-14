import { redact } from "./redaction";

import type { ToolLog, LogToolCallArgs } from "./types";

/**
 * Log a tool call with timing and redacted arguments
 * Outputs single-line JSON for log aggregator compatibility
 *
 * @param args - Tool call details including name, timing, and optional arguments
 */
export async function logToolCall(args: LogToolCallArgs): Promise<void> {
  const duration_ms = args.finishedAt - args.startedAt;

  const log: ToolLog = {
    span: "tool.call",
    name: args.name,
    duration_ms,
    status: args.error ? "error" : "ok",
  };

  // Add redacted args sample if provided
  if (args.args !== undefined) {
    log.args_sample = redact(args.args);
  }

  if (args.error) {
    log.error = args.error;
  }

  // Add trace_id as a top-level field for correlation
  const output: Record<string, unknown> = {
    ts: new Date().toISOString(),
    ...log,
  };

  if (args.traceId) {
    output.trace_id = args.traceId;
  }

  console.log(JSON.stringify(output));
}
