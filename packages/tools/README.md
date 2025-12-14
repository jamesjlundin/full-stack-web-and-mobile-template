# @acme/tools

Provider-agnostic, typed tool system for agents (including MCP clients) and application code.

## Features

- **Zod-based Contracts**: Type-safe tool definitions with input/output validation
- **In-memory Registry**: Register, list, and invoke tools with automatic validation
- **MCP Adapter**: Expose tools in MCP-compatible format (pure functions, no network)
- **HTTP Client**: Optional typed wrapper for remote tool invocation
- **Observability**: Automatic logging via `@acme/obs` with timing and redacted args

## Installation

```bash
pnpm add @acme/tools
```

## Quick Start

### Define a Tool Contract

```typescript
import { z } from "zod";
import { defineContract, registerTool, invokeTool } from "@acme/tools";

// Define the contract with Zod schemas
const greetContract = defineContract({
  name: "greet",
  description: "Greet a user by name",
  input: z.object({
    name: z.string().min(1),
    formal: z.boolean().optional().default(false),
  }),
  output: z.object({
    message: z.string(),
  }),
});

// Implement the tool
const greetImpl = (input) => {
  const greeting = input.formal ? "Good day" : "Hello";
  return { message: `${greeting}, ${input.name}!` };
};

// Register the tool
registerTool(greetContract, greetImpl);

// Invoke the tool
const result = await invokeTool("greet", { name: "Alice" });
// { ok: true, result: { message: "Hello, Alice!" } }
```

### Use Common Zod Helpers

```typescript
import { nonemptyString, positiveInt, safeJson } from "@acme/tools";

const myContract = defineContract({
  name: "example",
  input: z.object({
    title: nonemptyString,
    count: positiveInt,
    data: safeJson,
  }),
  output: z.object({ success: z.boolean() }),
});
```

### Expose Tools via MCP Adapter

```typescript
import { toMcpEndpoints } from "@acme/tools";

// Create MCP-compatible endpoints
const mcp = toMcpEndpoints();

// List all tools with schemas
const tools = mcp.list_tools();
// [{ name: "greet", description: "...", input_schema: {...} }]

// Call a tool
const result = await mcp.call_tool("greet", { name: "Bob" });
// { ok: true, result: { message: "Hello, Bob!" } }
```

The MCP adapter returns pure objects - you wire up the network transport (HTTP, WebSocket) elsewhere.

### HTTP Client (for remote tools)

```typescript
import { buildHttpClient } from "@acme/tools/adapters/http";

const client = buildHttpClient("http://localhost:3000");

// Call remote tool
const result = await client.callTool("greet", { name: "Charlie" });

// List remote tools
const tools = await client.listTools();
```

## API Reference

### Contracts

- `defineContract(definition)` - Create a typed tool contract
- `zodToJsonSchema(schema)` - Convert Zod schema to JSON Schema
- `nonemptyString` - Non-empty string validator
- `positiveInt` - Positive integer validator
- `nonNegativeInt` - Non-negative integer validator
- `safeJson` - Safe JSON value validator

### Registry

- `registerTool(contract, impl)` - Register a tool
- `getTool(name)` - Get tool by name
- `listTools()` - List all registered tools
- `invokeTool(name, input, options?)` - Invoke a tool with validation
- `clearRegistry()` - Clear all registered tools
- `hasTool(name)` - Check if tool exists
- `toolCount()` - Get number of registered tools

### Adapters

- `toMcpEndpoints(options?)` - Create MCP-style endpoints
- `getToolInfo(name)` - Get single tool's MCP info
- `buildHttpClient(baseUrl, options?)` - Create HTTP tool client

## Observability

Every tool invocation automatically logs via `@acme/obs`:

```json
{
  "ts": "2024-01-01T00:00:00.000Z",
  "span": "tool.call",
  "name": "greet",
  "duration_ms": 5,
  "status": "ok",
  "args_sample": { "name": "Alice" }
}
```

Arguments are automatically redacted to remove PII (emails, phone numbers, secrets).

## RAG Query Contract

A placeholder contract for RAG integration is provided:

```typescript
import { ragQueryContract } from "@acme/tools";

// Contract shape:
// Input: { query: string, k: number }
// Output: { chunks: Array<{ id, text, score, metadata? }> }
```

Implementation will be added in `@acme/rag` package.
