/**
 * Trace context for distributed tracing
 */
export interface TraceContext {
  traceId: string;
  parentId?: string;
  startMs: number;
}

/**
 * Log entry for LLM calls
 * Includes fields for pgvector-aware RAG (populated once Step 26 lands)
 */
export interface LlmLog {
  span: 'llm.call';
  model: string;
  provider: string;
  tokens_input?: number;
  tokens_output?: number;
  latency_ms: number;
  cost_usd?: number;
  prompt_version?: number;
  schema_version?: number;
  rag_config_version?: string | null;
  embed_model?: string;
  embed_dims?: number;
  retrieved_chunks_count?: number;
  tool_calls_count?: number;
  error?: string;
  status: 'ok' | 'error';
}

/**
 * Log entry for tool calls
 */
export interface ToolLog {
  span: 'tool.call';
  name: string;
  duration_ms: number;
  error?: string;
  status: 'ok' | 'error';
  args_sample?: unknown;
}

/**
 * Arguments for logging an LLM call
 */
export interface LogLlmCallArgs {
  provider: string;
  model: string;
  startedAt: number;
  finishedAt: number;
  tokensIn?: number;
  tokensOut?: number;
  promptVersion?: number;
  schemaVersion?: number;
  ragConfigVersion?: string | null;
  embedModel?: string;
  embedDims?: number;
  retrievedChunksCount?: number;
  toolCallsCount?: number;
  error?: string;
  traceId?: string;
}

/**
 * Arguments for logging a tool call
 */
export interface LogToolCallArgs {
  name: string;
  startedAt: number;
  finishedAt: number;
  error?: string;
  args?: unknown;
  traceId?: string;
}

/**
 * Result from withTrace wrapper
 */
export interface TraceResult<T> {
  result?: T;
  error?: Error;
  ctx: TraceContext;
  duration_ms: number;
}
