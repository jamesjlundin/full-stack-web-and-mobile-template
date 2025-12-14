/**
 * RAG Query API
 *
 * Provides the main ragQuery function that combines embedding and similarity search.
 */


import { openaiEmbedder, hasOpenAIKey, MissingApiKeyError } from "./embed.js";
import { querySimilar } from "./store.js";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";

/**
 * Options for RAG query
 */
export interface RagQueryOptions {
  /** Search query text */
  query: string;
  /** Number of results to return (default: 3) */
  k?: number;
}

/**
 * Result from RAG query
 */
export interface RagQueryResult {
  /** Retrieved chunks sorted by relevance */
  chunks: Array<{
    /** Chunk identifier */
    id: string;
    /** Parent document identifier */
    docId: string;
    /** Text content */
    text: string;
    /** Cosine distance score (lower is more similar) */
    score: number;
    /** Optional metadata */
    metadata?: Record<string, unknown>;
  }>;
}

/**
 * Database type - accepts any Drizzle NodePgDatabase instance
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbInstance = NodePgDatabase<any>;

/**
 * Execute a RAG query: embed the query and find similar chunks
 *
 * This is the main entry point for RAG retrieval. It:
 * 1. Embeds the query text using OpenAI
 * 2. Searches for similar chunks using pgvector cosine distance
 * 3. Returns top-k results sorted by relevance
 *
 * @param db - Drizzle database instance
 * @param options - Query options (query text and k)
 * @returns Promise resolving to query results
 * @throws MissingApiKeyError if OPENAI_API_KEY is not set
 *
 * @example
 * ```ts
 * const results = await ragQuery(db, { query: "What is TypeScript?", k: 5 });
 * for (const chunk of results.chunks) {
 *   console.log(`[${chunk.score.toFixed(4)}] ${chunk.text.slice(0, 100)}...`);
 * }
 * ```
 */
export async function ragQuery(
  db: DbInstance,
  options: RagQueryOptions
): Promise<RagQueryResult> {
  const { query, k = 3 } = options;

  if (!hasOpenAIKey()) {
    throw new MissingApiKeyError();
  }

  // Embed the query
  const embedder = openaiEmbedder();
  const queryEmbedding = await embedder.embedSingle(query);

  // Search for similar chunks
  const similar = await querySimilar(db, queryEmbedding, k);

  // Transform results to match expected output format
  return {
    chunks: similar.map((chunk) => ({
      id: chunk.id,
      docId: chunk.docId,
      text: chunk.content,
      score: chunk.score,
      metadata: chunk.metadata ?? undefined,
    })),
  };
}

/**
 * Retrieve function compatible with evals interface
 *
 * This wraps ragQuery to match the RetrievalFn signature expected by packages/evals.
 *
 * @param db - Drizzle database instance
 * @returns Retrieval function
 */
export function createRetrieveFn(db: DbInstance) {
  return async (query: string, k: number) => {
    const result = await ragQuery(db, { query, k });
    return result.chunks.map((chunk) => ({
      id: chunk.id,
      content: chunk.text,
      score: chunk.score,
      metadata: chunk.metadata,
    }));
  };
}
