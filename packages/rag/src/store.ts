/**
 * Vector store operations for RAG
 *
 * Provides upsertChunks and querySimilar functions using Drizzle ORM and pgvector.
 */

import { sql } from 'drizzle-orm';

import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Row type for inserting/upserting chunks
 */
export interface ChunkRow {
  /** Unique chunk identifier */
  id: string;
  /** Parent document identifier */
  docId: string;
  /** Text content of the chunk */
  content: string;
  /** Embedding vector (1536 dimensions for text-embedding-3-small) */
  embedding: number[];
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result from similarity search
 */
export interface SimilarChunk {
  /** Chunk identifier */
  id: string;
  /** Parent document identifier */
  docId: string;
  /** Text content */
  content: string;
  /** Metadata */
  metadata: Record<string, unknown> | null;
  /** Cosine distance score (lower is more similar, 0 = identical) */
  score: number;
}

/**
 * Database type - accepts either NodePgDatabase or NeonHttpDatabase
 * Using generic Record type for schema flexibility
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbInstance = NodePgDatabase<any> | NeonHttpDatabase<any>;

/**
 * Upsert chunks into the rag_chunks table
 *
 * Performs an upsert (insert or update on conflict) for each chunk.
 * This allows re-indexing documents without duplicating chunks.
 *
 * @param db - Drizzle database instance with schema
 * @param rows - Array of chunk rows to upsert
 *
 * @example
 * ```ts
 * await upsertChunks(db, [
 *   {
 *     id: "chunk-1",
 *     docId: "doc-1",
 *     content: "Hello world",
 *     embedding: [0.1, 0.2, ...], // 1536 dimensions
 *     metadata: { source: "example.txt" }
 *   }
 * ]);
 * ```
 */
export async function upsertChunks(db: DbInstance, rows: ChunkRow[]): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  // Use raw SQL for upsert with vector type
  for (const row of rows) {
    const embeddingStr = `[${row.embedding.join(',')}]`;
    const metadataStr = row.metadata ? JSON.stringify(row.metadata) : null;

    await db.execute(sql`
      INSERT INTO rag_chunks (id, doc_id, content, embedding, metadata)
      VALUES (
        ${row.id},
        ${row.docId},
        ${row.content},
        ${embeddingStr}::vector,
        ${metadataStr}::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        doc_id = EXCLUDED.doc_id,
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata,
        created_at = NOW()
    `);
  }
}

/**
 * Query for similar chunks using cosine distance
 *
 * Uses pgvector's <=> operator for efficient cosine distance search.
 * Results are ordered by distance (ascending, so most similar first).
 *
 * @param db - Drizzle database instance
 * @param queryEmbedding - Query vector (1536 dimensions)
 * @param k - Number of results to return
 * @returns Array of similar chunks with scores
 *
 * @example
 * ```ts
 * const results = await querySimilar(db, queryVector, 5);
 * // results[0] is most similar, with lowest score
 * ```
 */
export async function querySimilar(
  db: DbInstance,
  queryEmbedding: number[],
  k: number,
): Promise<SimilarChunk[]> {
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  // Use raw SQL for vector similarity search
  const results = await db.execute<{
    id: string;
    doc_id: string;
    content: string;
    metadata: Record<string, unknown> | null;
    distance: number;
  }>(sql`
    SELECT
      id,
      doc_id,
      content,
      metadata,
      embedding <=> ${embeddingStr}::vector AS distance
    FROM rag_chunks
    ORDER BY distance ASC
    LIMIT ${k}
  `);

  return results.rows.map((row) => ({
    id: row.id,
    docId: row.doc_id,
    content: row.content,
    metadata: row.metadata,
    score: row.distance,
  }));
}

/**
 * Delete all chunks for a given document
 *
 * @param db - Drizzle database instance
 * @param docId - Document identifier
 */
export async function deleteDocChunks(db: DbInstance, docId: string): Promise<void> {
  await db.execute(sql`DELETE FROM rag_chunks WHERE doc_id = ${docId}`);
}

/**
 * Count total chunks in the store
 */
export async function countChunks(db: DbInstance): Promise<number> {
  const result = await db.execute<{ count: string }>(
    sql`SELECT COUNT(*)::text as count FROM rag_chunks`,
  );
  return parseInt(result.rows[0]?.count || '0', 10);
}
