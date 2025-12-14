/**
 * @acme/tools - Provider-agnostic typed tool system for agents and MCP clients.
 *
 * Provides:
 * - Zod-based tool contracts with type inference
 * - In-memory tool registry with validation and observability
 * - MCP adapter for exposing tools in MCP-compatible format
 * - HTTP client adapter for remote tool invocation
 */

// Contracts and schema helpers
export {
  defineContract,
  zodToJsonSchema,
  nonemptyString,
  positiveInt,
  nonNegativeInt,
  safeJson,
  optionalString,
  ragQueryContract,
  ragQueryInputSchema,
  ragQueryOutputSchema,
  ragChunkSchema,
} from "./contracts.js";

export type {
  ToolDefinition,
  ToolContract,
  ToolInput,
  ToolOutput,
  ToolImpl,
  RagQueryInput,
  RagQueryOutput,
  RagChunk,
} from "./contracts.js";

// Registry
export {
  registerTool,
  getTool,
  listTools,
  invokeTool,
  clearRegistry,
  hasTool,
  toolCount,
} from "./registry.js";

export type {
  RegisteredTool,
  ToolMeta,
  InvokeOptions,
  InvokeResult,
} from "./registry.js";

// Adapters
export { toMcpEndpoints, getToolInfo } from "./adapters/mcp.js";
export { buildHttpClient } from "./adapters/http.js";

export type {
  McpToolInfo,
  McpCallResultOk,
  McpCallResultError,
  McpCallResult,
  McpEndpointOptions,
  McpEndpoints,
} from "./adapters/mcp.js";

export type {
  HttpCallResult,
  HttpClientOptions,
  HttpToolClient,
} from "./adapters/http.js";
