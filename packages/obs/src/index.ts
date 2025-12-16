/**
 * @acme/obs - Minimal observability layer for LLM and tool calls
 *
 * Provides tracing, metrics, and redaction for AI workloads
 * with pgvector-aware fields for future RAG integration.
 */

// Tracer
export { withTrace, createTraceContext } from "./tracer";

// LLM logging
export { logLlmCall } from "./llm";

// Tool logging
export { logToolCall } from "./tools";

// Redaction
export { redact } from "./redaction";

// Pricing
export { getCostUsd, getAvailableModels } from "./pricing";

// Background work
export { runInBackground, nowMs, durationMs } from "./background";
export type { BackgroundContext } from "./background";

// Types
export type {
  TraceContext,
  TraceResult,
  LlmLog,
  ToolLog,
  LogLlmCallArgs,
  LogToolCallArgs,
} from "./types";
