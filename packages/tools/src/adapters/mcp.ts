/**
 * MCP (Model Context Protocol) adapter for the tool registry.
 * Exposes registered tools in MCP-compatible format without requiring network servers.
 * This is a pure function adapter that returns plain objects.
 */

import { zodToJsonSchema } from "../contracts.js";
import { listTools, getTool, invokeTool } from "../registry.js";

// =============================================================================
// MCP Types
// =============================================================================

/**
 * MCP tool metadata format
 */
export interface McpToolInfo {
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
}

/**
 * MCP call_tool success result
 */
export interface McpCallResultOk<T = unknown> {
  ok: true;
  result: T;
}

/**
 * MCP call_tool error result
 */
export interface McpCallResultError {
  ok: false;
  error: string;
  validation_errors?: Array<{
    path: (string | number)[];
    message: string;
  }>;
}

/**
 * MCP call_tool result union
 */
export type McpCallResult<T = unknown> = McpCallResultOk<T> | McpCallResultError;

/**
 * Options for MCP endpoints
 */
export interface McpEndpointOptions {
  /** Optional trace ID for correlation */
  traceId?: string;
}

/**
 * MCP endpoints interface
 */
export interface McpEndpoints {
  /**
   * List all registered tools with their schemas
   * Equivalent to MCP's tools/list endpoint
   */
  list_tools(): McpToolInfo[];

  /**
   * Call a registered tool
   * Equivalent to MCP's tools/call endpoint
   *
   * @param name - Tool name to invoke
   * @param input - Input data for the tool
   * @returns Promise resolving to result or error
   */
  call_tool<T = unknown>(name: string, input: unknown): Promise<McpCallResult<T>>;
}

// =============================================================================
// Adapter Implementation
// =============================================================================

/**
 * Create MCP-style endpoints from the current registry state.
 * These are pure functions that return plain objects, suitable for
 * integration with any network transport (HTTP, WebSocket, etc.).
 *
 * @param options - Optional configuration for the endpoints
 * @returns Object with list_tools and call_tool methods
 *
 * @example
 * ```typescript
 * import { toMcpEndpoints } from '@acme/tools/adapters/mcp';
 *
 * const mcp = toMcpEndpoints();
 *
 * // List all tools
 * const tools = mcp.list_tools();
 * // [{ name: "echo", description: "...", input_schema: {...} }]
 *
 * // Call a tool
 * const result = await mcp.call_tool("echo", { text: "hello" });
 * // { ok: true, result: { text: "hello" } }
 * ```
 */
export function toMcpEndpoints(options: McpEndpointOptions = {}): McpEndpoints {
  return {
    list_tools(): McpToolInfo[] {
      const tools = listTools();
      const result: McpToolInfo[] = [];

      for (const meta of tools) {
        const tool = getTool(meta.name);

        if (tool) {
          result.push({
            name: meta.name,
            description: meta.description,
            input_schema: zodToJsonSchema(tool.contract.input),
          });
        }
      }

      return result;
    },

    async call_tool<T = unknown>(name: string, input: unknown): Promise<McpCallResult<T>> {
      const invokeResult = await invokeTool<T>(name, input, {
        traceId: options.traceId,
      });

      if (invokeResult.ok) {
        return {
          ok: true,
          result: invokeResult.result,
        };
      }

      // Format validation errors for MCP response
      // Convert path to (string | number)[] - filter out symbols as they're not JSON-serializable
      const validationErrors = invokeResult.validationErrors?.map((issue) => ({
        path: issue.path.filter((p): p is string | number => typeof p !== "symbol"),
        message: issue.message,
      }));

      return {
        ok: false,
        error: invokeResult.error,
        ...(validationErrors && validationErrors.length > 0
          ? { validation_errors: validationErrors }
          : {}),
      };
    },
  };
}

/**
 * Create a single tool info object for MCP format.
 * Useful when you need to expose a specific tool's metadata.
 *
 * @param name - Tool name to get info for
 * @returns Tool info or undefined if not found
 */
export function getToolInfo(name: string): McpToolInfo | undefined {
  const tool = getTool(name);

  if (!tool) {
    return undefined;
  }

  return {
    name: tool.contract.name,
    description: tool.contract.description,
    input_schema: zodToJsonSchema(tool.contract.input),
  };
}
