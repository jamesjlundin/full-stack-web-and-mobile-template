# @acme/obs

Minimal, provider-agnostic observability layer for LLM and tool calls.

## Features

- Tracing with trace IDs and span timing
- LLM call logging with cost estimation
- Tool call logging with PII redaction
- pgvector-aware fields for RAG integration
- Single-line JSON output for log aggregators

## Usage

### Wrap requests with tracing

```typescript
import { withTrace } from '@acme/obs';

const { result, error, ctx, duration_ms } = await withTrace('chat.stream', async (ctx) => {
  // Your request handling code
  return response;
});
```

### Log LLM calls

```typescript
import { logLlmCall } from '@acme/obs';

await logLlmCall({
  provider: 'openai',
  model: 'gpt-4o-mini',
  startedAt: startTime,
  finishedAt: Date.now(),
  tokensIn: 100,
  tokensOut: 50,
  promptVersion: 1,
  schemaVersion: 1,
  traceId: ctx.traceId,
});
```

### Log tool calls

```typescript
import { logToolCall } from '@acme/obs';

await logToolCall({
  name: 'search',
  startedAt: startTime,
  finishedAt: Date.now(),
  args: { query: 'user@example.com' }, // PII will be redacted
  traceId: ctx.traceId,
});
```

### Redact PII

```typescript
import { redact } from '@acme/obs';

const safe = redact({
  email: 'user@example.com',
  token: 'abcd1234abcd1234abcd1234abcd1234',
});
// { email: "[REDACTED_EMAIL]", token: "[REDACTED_SECRET]" }
```

## LLM Log Fields

| Field                  | Type            | Description                 |
| ---------------------- | --------------- | --------------------------- |
| span                   | "llm.call"      | Span type identifier        |
| model                  | string          | Model name                  |
| provider               | string          | Provider name               |
| tokens_input           | number?         | Input token count           |
| tokens_output          | number?         | Output token count          |
| latency_ms             | number          | Request duration            |
| cost_usd               | number?         | Estimated cost              |
| prompt_version         | number?         | Active prompt version       |
| schema_version         | number?         | Active schema version       |
| rag_config_version     | string?         | RAG config version (future) |
| embed_model            | string?         | Embedding model name        |
| embed_dims             | number?         | Embedding dimensions        |
| retrieved_chunks_count | number?         | RAG chunks retrieved        |
| tool_calls_count       | number?         | Tools invoked               |
| error                  | string?         | Error message if failed     |
| status                 | "ok" \| "error" | Call status                 |

## Extending Pricing

Edit `src/pricing.ts` to add models:

```typescript
const PRICING_TABLE: Record<string, ModelPricing> = {
  'openai:gpt-4o-mini': { input: 0.15, output: 0.6 },
  // Add your model here:
  'provider:model-name': { input: X, output: Y },
};
```

## Sinks

Placeholder sinks for external vendors are in `src/sinks/`:

- `sentry.ts` - Sentry integration stub
- `langsmith.ts` - LangSmith integration stub

These are no-op by default. Implement as needed without adding dependencies.
