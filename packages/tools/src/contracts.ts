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
export const safeJson: z.ZodType<
  string | number | boolean | null | { [key: string]: unknown } | unknown[]
> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.lazy(() => safeJson)),
  z.record(z.lazy(() => safeJson)),
]);

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
 * This is a simplified conversion for common patterns.
 * @param schema - Zod schema to convert
 * @returns JSON Schema representation
 */
export function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  // Handle ZodObject
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const fieldSchema = value as z.ZodTypeAny;
      properties[key] = zodToJsonSchema(fieldSchema);

      // Check if field is required (not optional)
      if (!(fieldSchema instanceof z.ZodOptional)) {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }

  // Handle ZodArray
  if (schema instanceof z.ZodArray) {
    return {
      type: "array",
      items: zodToJsonSchema(schema.element),
    };
  }

  // Handle ZodString
  if (schema instanceof z.ZodString) {
    const checks = schema._def.checks || [];
    const result: Record<string, unknown> = { type: "string" };

    for (const check of checks) {
      if (check.kind === "min") {
        result.minLength = check.value;
      } else if (check.kind === "max") {
        result.maxLength = check.value;
      }
    }

    return result;
  }

  // Handle ZodNumber
  if (schema instanceof z.ZodNumber) {
    const checks = schema._def.checks || [];
    const result: Record<string, unknown> = { type: "number" };

    for (const check of checks) {
      if (check.kind === "int") {
        result.type = "integer";
      } else if (check.kind === "min") {
        result.minimum = check.value;
      } else if (check.kind === "max") {
        result.maximum = check.value;
      }
    }

    return result;
  }

  // Handle ZodBoolean
  if (schema instanceof z.ZodBoolean) {
    return { type: "boolean" };
  }

  // Handle ZodNull
  if (schema instanceof z.ZodNull) {
    return { type: "null" };
  }

  // Handle ZodOptional
  if (schema instanceof z.ZodOptional) {
    return zodToJsonSchema(schema.unwrap());
  }

  // Handle ZodDefault
  if (schema instanceof z.ZodDefault) {
    const inner = zodToJsonSchema(schema._def.innerType);
    return { ...inner, default: schema._def.defaultValue() };
  }

  // Handle ZodUnion
  if (schema instanceof z.ZodUnion) {
    const options = schema._def.options as z.ZodTypeAny[];
    return {
      oneOf: options.map((opt) => zodToJsonSchema(opt)),
    };
  }

  // Handle ZodRecord
  if (schema instanceof z.ZodRecord) {
    return {
      type: "object",
      additionalProperties: zodToJsonSchema(schema._def.valueType),
    };
  }

  // Handle ZodLiteral
  if (schema instanceof z.ZodLiteral) {
    return { const: schema._def.value };
  }

  // Handle ZodEnum
  if (schema instanceof z.ZodEnum) {
    return {
      type: "string",
      enum: schema._def.values,
    };
  }

  // Fallback for unknown schemas
  return {};
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
  metadata: z.record(z.unknown()).optional(),
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
