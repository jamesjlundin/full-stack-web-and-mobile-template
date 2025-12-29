/**
 * Embedding utilities for RAG
 *
 * Provides an abstraction over embedding models, with OpenAI as the primary provider.
 */

import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";

import { EMBED_DIMS, EMBED_MODEL } from "./config";

/**
 * Interface for embedding providers
 */
export interface Embedder {
  /** Model identifier */
  model: string;
  /** Vector dimensions */
  dims: number;
  /** Embed multiple texts at once (batched for efficiency) */
  embed(texts: string[]): Promise<number[][]>;
  /** Embed a single text */
  embedSingle(text: string): Promise<number[]>;
}

/**
 * Error thrown when OPENAI_API_KEY is not set
 */
export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "OPENAI_API_KEY environment variable is not set. " +
        "Embedding requires an OpenAI API key. " +
        "Set OPENAI_API_KEY in your environment or .env file.",
    );
    this.name = "MissingApiKeyError";
  }
}

/**
 * Check if OpenAI API key is available
 */
export function hasOpenAIKey(): boolean {
  return (
    typeof process.env.OPENAI_API_KEY === "string" &&
    process.env.OPENAI_API_KEY.length > 0
  );
}

/**
 * Create an OpenAI embedder using the Vercel AI SDK
 *
 * @returns Embedder instance configured for text-embedding-3-small
 * @throws MissingApiKeyError if OPENAI_API_KEY is not set
 *
 * @example
 * ```ts
 * const embedder = openaiEmbedder();
 * const vectors = await embedder.embed(["Hello world", "Goodbye world"]);
 * // vectors[0].length === 1536
 * ```
 */
export function openaiEmbedder(): Embedder {
  // Extract model name from EMBED_MODEL (format: "openai:model-name")
  const modelName = EMBED_MODEL.split(":")[1] || "text-embedding-3-small";

  return {
    model: EMBED_MODEL,
    dims: EMBED_DIMS,

    async embed(texts: string[]): Promise<number[][]> {
      if (!hasOpenAIKey()) {
        throw new MissingApiKeyError();
      }

      if (texts.length === 0) {
        return [];
      }

      // Use embedMany for batch embedding
      const result = await embedMany({
        model: openai.embedding(modelName),
        values: texts,
      });

      return result.embeddings;
    },

    async embedSingle(text: string): Promise<number[]> {
      if (!hasOpenAIKey()) {
        throw new MissingApiKeyError();
      }

      const result = await embed({
        model: openai.embedding(modelName),
        value: text,
      });

      return result.embedding;
    },
  };
}

/**
 * Get the default embedder (OpenAI)
 */
export function getDefaultEmbedder(): Embedder {
  return openaiEmbedder();
}
