/**
 * @acme/rag - RAG (Retrieval-Augmented Generation) Package
 *
 * Provides chunk → embed → index → query utilities for building RAG pipelines
 * with PostgreSQL + pgvector as the vector store.
 *
 * @example
 * ```ts
 * import { fixedSizeChunks, openaiEmbedder, upsertChunks, ragQuery } from "@acme/rag";
 * import { db } from "@acme/db";
 *
 * // 1. Chunk your document
 * const chunks = fixedSizeChunks(documentText, { source: "doc-1" });
 *
 * // 2. Embed the chunks
 * const embedder = openaiEmbedder();
 * const embeddings = await embedder.embed(chunks.map(c => c.content));
 *
 * // 3. Index in pgvector
 * await upsertChunks(db, chunks.map((c, i) => ({
 *   id: c.id,
 *   docId: "doc-1",
 *   content: c.content,
 *   embedding: embeddings[i],
 *   metadata: c.metadata,
 * })));
 *
 * // 4. Query
 * const results = await ragQuery(db, { query: "search term", k: 5 });
 * ```
 */

// Configuration
export {
  EMBED_MODEL,
  EMBED_DIMS,
  RAG_CONFIG_VERSION,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_CHUNK_OVERLAP,
} from "./config";

// Chunking
export {
  fixedSizeChunks,
  mdToText,
  splitParagraphs,
  type Chunk,
  type FixedSizeChunkOptions,
} from "./chunk";

// Embedding
export {
  openaiEmbedder,
  getDefaultEmbedder,
  hasOpenAIKey,
  MissingApiKeyError,
  type Embedder,
} from "./embed";

// Vector store operations
export {
  upsertChunks,
  querySimilar,
  deleteDocChunks,
  countChunks,
  type ChunkRow,
  type SimilarChunk,
} from "./store";

// High-level query API
export {
  ragQuery,
  createRetrieveFn,
  type RagQueryOptions,
  type RagQueryResult,
} from "./query";
