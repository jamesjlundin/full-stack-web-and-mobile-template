import { getCostUsd } from "./pricing";

import type { LlmLog, LogLlmCallArgs } from "./types";

/**
 * Log an LLM call with timing, cost, and version metadata
 * Outputs single-line JSON for log aggregator compatibility
 *
 * @param args - LLM call details including timing, tokens, and version info
 */
export async function logLlmCall(args: LogLlmCallArgs): Promise<void> {
  const latency_ms = args.finishedAt - args.startedAt;

  // Calculate cost if token counts are available
  let cost_usd: number | undefined;
  if (args.tokensIn !== undefined && args.tokensOut !== undefined) {
    cost_usd = getCostUsd({
      model: args.model,
      provider: args.provider,
      tokensIn: args.tokensIn,
      tokensOut: args.tokensOut,
    });
  }

  const log: LlmLog = {
    span: "llm.call",
    model: args.model,
    provider: args.provider,
    latency_ms,
    status: args.error ? "error" : "ok",
  };

  // Add optional fields only if present
  if (args.tokensIn !== undefined) {
    log.tokens_input = args.tokensIn;
  }

  if (args.tokensOut !== undefined) {
    log.tokens_output = args.tokensOut;
  }

  if (cost_usd !== undefined) {
    log.cost_usd = cost_usd;
  }

  if (args.promptVersion !== undefined) {
    log.prompt_version = args.promptVersion;
  }

  if (args.schemaVersion !== undefined) {
    log.schema_version = args.schemaVersion;
  }

  if (args.ragConfigVersion !== undefined) {
    log.rag_config_version = args.ragConfigVersion;
  }

  if (args.embedModel !== undefined) {
    log.embed_model = args.embedModel;
  }

  if (args.embedDims !== undefined) {
    log.embed_dims = args.embedDims;
  }

  if (args.retrievedChunksCount !== undefined) {
    log.retrieved_chunks_count = args.retrievedChunksCount;
  }

  if (args.toolCallsCount !== undefined) {
    log.tool_calls_count = args.toolCallsCount;
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
