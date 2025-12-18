/**
 * Tool contracts and Zod schema definitions for typed tool registry.
 * Provides type-safe tool definitions that can be consumed by MCP clients and app code.
 */

import { z } from "zod";

// =============================================================================
// Common Zod Helpers
// =============================================================================

/** Non-empty string validator */
export const nonemptyString = z.string().min(1, "String cannot be empty");

/** Positive integer validator */
export const positiveInt = z.number().int().positive("Must be a positive integer");

/** Non-negative integer validator */
export const nonNegativeInt = z.number().int().nonnegative("Must be a non-negative integer");

/** Safe JSON value (no undefined, functions, or symbols) */
export const safeJson = z.unknown();

/** Optional string that defaults to empty */
export const optionalString = z.string().optional().default("");

// =============================================================================
// Tool Definition Types
// =============================================================================

/**
 * Generic tool definition with typed input/output schemas.
 * TIn and TOut represent the inferred types from Zod schemas.
 */
export interface ToolDefinition<
  TIn extends z.ZodTypeAny = z.ZodTypeAny,
  TOut extends z.ZodTypeAny = z.ZodTypeAny,
> {
  /** Unique tool name (e.g., "echo", "math.add", "rag.query") */
  name: string;
  /** Optional human-readable description */
  description?: string;
  /** Zod schema for input validation */
  input: TIn;
  /** Zod schema for output validation */
  output: TOut;
}

/**
 * Tool contract that pairs a definition with its implementation type.
 * Use this when registering tools to ensure type safety.
 */
export interface ToolContract<
  TIn extends z.ZodTypeAny = z.ZodTypeAny,
  TOut extends z.ZodTypeAny = z.ZodTypeAny,
> extends ToolDefinition<TIn, TOut> {
  /** Inferred input type from schema */
  _inputType?: z.infer<TIn>;
  /** Inferred output type from schema */
  _outputType?: z.infer<TOut>;
}

/**
 * Helper type to infer input type from a ToolContract
 */
export type ToolInput<T extends ToolContract> = T extends ToolContract<infer TIn, infer _TOut>
  ? z.infer<TIn>
  : never;

/**
 * Helper type to infer output type from a ToolContract
 */
export type ToolOutput<T extends ToolContract> = T extends ToolContract<infer _TIn, infer TOut>
  ? z.infer<TOut>
  : never;

/**
 * Tool implementation function signature
 */
export type ToolImpl<TContract extends ToolContract> = (
  input: ToolInput<TContract>
) => Promise<ToolOutput<TContract>> | ToolOutput<TContract>;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a type-safe tool contract with proper TypeScript inference.
 * @param definition - Tool definition with name, description, and schemas
 * @returns Typed tool contract
 */
export function defineContract<TIn extends z.ZodTypeAny, TOut extends z.ZodTypeAny>(
  definition: ToolDefinition<TIn, TOut>
): ToolContract<TIn, TOut> {
  return definition;
}

/**
 * Convert a Zod schema to JSON Schema format for MCP compatibility.
 * @param schema - Zod schema to convert
 * @returns JSON Schema representation
 */
export function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  return z.toJSONSchema(schema, { target: "draft-07" }) as Record<string, unknown>;
}

// =============================================================================
// RAG Query Contract (Placeholder for Step 26)
// =============================================================================

/**
 * RAG chunk result schema
 */
export const ragChunkSchema = z.object({
  /** Unique chunk identifier */
  id: z.string(),
  /** Chunk text content */
  text: z.string(),
  /** Similarity/relevance score */
  score: z.number(),
  /** Optional metadata */
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * RAG query input schema
 */
export const ragQueryInputSchema = z.object({
  /** Search query string */
  query: nonemptyString,
  /** Number of chunks to retrieve */
  k: positiveInt,
});

/**
 * RAG query output schema
 */
export const ragQueryOutputSchema = z.object({
  /** Retrieved chunks sorted by relevance */
  chunks: z.array(ragChunkSchema),
});

/**
 * RAG query tool contract (placeholder - implementation in packages/rag/query.ts)
 * Use this contract when implementing the RAG query tool in Step 26.
 */
export const ragQueryContract = defineContract({
  name: "rag.query",
  description: "Query the RAG vector store for relevant document chunks",
  input: ragQueryInputSchema,
  output: ragQueryOutputSchema,
});

// Export inferred types for RAG
export type RagQueryInput = z.infer<typeof ragQueryInputSchema>;
export type RagQueryOutput = z.infer<typeof ragQueryOutputSchema>;
export type RagChunk = z.infer<typeof ragChunkSchema>;
