/**
 * In-memory tool registry with validation and observability.
 * Provides registerTool, getTool, listTools, and invokeTool functions.
 */

import { logToolCall, redact } from "@acme/obs";
import { z } from "zod";

import type { ToolContract, ToolImpl } from "./contracts.js";

// =============================================================================
// Types
// =============================================================================

/**
 * Registered tool entry containing contract and implementation
 */
export interface RegisteredTool<TContract extends ToolContract = ToolContract> {
  contract: TContract;
  impl: ToolImpl<TContract>;
}

/**
 * Tool metadata for listing tools
 */
export interface ToolMeta {
  name: string;
  description?: string;
}

/**
 * Options for invoking a tool
 */
export interface InvokeOptions {
  /** Optional trace ID for correlation */
  traceId?: string;
  /** Skip input validation (not recommended) */
  skipInputValidation?: boolean;
  /** Skip output validation (not recommended) */
  skipOutputValidation?: boolean;
}

/**
 * Result from tool invocation
 */
export type InvokeResult<T> =
  | { ok: true; result: T }
  | { ok: false; error: string; validationErrors?: z.ZodIssue[] };

// =============================================================================
// Registry Singleton
// =============================================================================

/** Internal registry storage */
const registry = new Map<string, RegisteredTool>();

/**
 * Register a tool with its contract and implementation.
 * The tool can then be invoked via invokeTool().
 *
 * @param contract - Tool contract defining name, description, and schemas
 * @param impl - Implementation function matching the contract signature
 * @throws Error if a tool with the same name is already registered
 */
export function registerTool<TContract extends ToolContract>(
  contract: TContract,
  impl: ToolImpl<TContract>,
): void {
  if (registry.has(contract.name)) {
    throw new Error(`Tool "${contract.name}" is already registered`);
  }

  registry.set(contract.name, {
    contract,
    impl: impl as ToolImpl<ToolContract>,
  });
}

/**
 * Get a registered tool by name.
 *
 * @param name - Tool name to look up
 * @returns Tool entry with contract and impl, or undefined if not found
 */
export function getTool(name: string): RegisteredTool | undefined {
  return registry.get(name);
}

/**
 * List all registered tools with their metadata.
 *
 * @returns Array of tool metadata objects
 */
export function listTools(): ToolMeta[] {
  const tools: ToolMeta[] = [];

  for (const [name, tool] of registry) {
    tools.push({
      name,
      description: tool.contract.description,
    });
  }

  return tools;
}

/**
 * Invoke a registered tool with input validation, output validation,
 * and observability logging.
 *
 * @param name - Name of the tool to invoke
 * @param input - Input data (will be validated against contract schema)
 * @param options - Optional invocation options
 * @returns Promise resolving to result or error
 */
export async function invokeTool<T = unknown>(
  name: string,
  input: unknown,
  options: InvokeOptions = {},
): Promise<InvokeResult<T>> {
  const tool = registry.get(name);

  if (!tool) {
    return {
      ok: false,
      error: `Tool "${name}" not found`,
    };
  }

  const startedAt = Date.now();
  let finishedAt: number;
  let errorMessage: string | undefined;

  try {
    // Validate input
    let validatedInput: unknown = input;

    if (!options.skipInputValidation) {
      const inputResult = tool.contract.input.safeParse(input);

      if (!inputResult.success) {
        finishedAt = Date.now();

        // Log the failed validation
        await logToolCall({
          name,
          startedAt,
          finishedAt,
          error: "Input validation failed",
          args: redact(input),
          traceId: options.traceId,
        });

        return {
          ok: false,
          error: "Input validation failed",
          validationErrors: inputResult.error.issues,
        };
      }

      validatedInput = inputResult.data;
    }

    // Execute tool implementation
    const result = await tool.impl(validatedInput);

    // Validate output
    if (!options.skipOutputValidation) {
      const outputResult = tool.contract.output.safeParse(result);

      if (!outputResult.success) {
        finishedAt = Date.now();

        await logToolCall({
          name,
          startedAt,
          finishedAt,
          error: "Output validation failed",
          args: redact(input),
          traceId: options.traceId,
        });

        return {
          ok: false,
          error: "Output validation failed",
          validationErrors: outputResult.error.issues,
        };
      }
    }

    finishedAt = Date.now();

    // Log successful invocation
    await logToolCall({
      name,
      startedAt,
      finishedAt,
      args: redact(input),
      traceId: options.traceId,
    });

    return {
      ok: true,
      result: result as T,
    };
  } catch (err) {
    finishedAt = Date.now();
    errorMessage = err instanceof Error ? err.message : String(err);

    // Log error
    await logToolCall({
      name,
      startedAt,
      finishedAt,
      error: errorMessage,
      args: redact(input),
      traceId: options.traceId,
    });

    return {
      ok: false,
      error: errorMessage,
    };
  }
}

/**
 * Clear all registered tools (useful for testing).
 */
export function clearRegistry(): void {
  registry.clear();
}

/**
 * Check if a tool is registered.
 *
 * @param name - Tool name to check
 * @returns True if the tool is registered
 */
export function hasTool(name: string): boolean {
  return registry.has(name);
}

/**
 * Get the count of registered tools.
 *
 * @returns Number of registered tools
 */
export function toolCount(): number {
  return registry.size;
}
