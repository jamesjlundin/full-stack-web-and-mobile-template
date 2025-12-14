/**
 * RAG (Retrieval-Augmented Generation) Schema
 *
 * Defines the rag_chunks table for storing document chunks with vector embeddings.
 * This table is used by @acme/rag for semantic similarity search.
 *
 * Note: The actual pgvector column type and index are created via raw SQL migration
 * since Drizzle doesn't have native pgvector support. This schema provides the
 * TypeScript types for non-vector columns.
 */

import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";

/**
 * RAG chunks table
 *
 * Stores document chunks with their embeddings for vector similarity search.
 * The embedding column uses pgvector VECTOR(1536) type, created via migration.
 */
export const ragChunks = pgTable(
  "rag_chunks",
  {
    /** Unique chunk identifier (ULID) */
    id: text("id").primaryKey(),

    /** Parent document identifier */
    docId: text("doc_id").notNull(),

    /** Text content of the chunk */
    content: text("content").notNull(),

    /**
     * Vector embedding
     * Note: This is typed as text for Drizzle compatibility, but the actual
     * database column is VECTOR(1536). Use raw SQL for vector operations.
     */
    // embedding is handled via raw SQL due to pgvector type

    /** Optional metadata (source, order, etc.) */
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    /** Creation timestamp */
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // Index on doc_id for efficient document-level operations
    index("rag_chunks_doc_id_idx").on(table.docId),
  ]
);

/**
 * Type for selecting rag_chunks rows
 */
export type RagChunk = typeof ragChunks.$inferSelect;

/**
 * Type for inserting rag_chunks rows (without embedding, handled via raw SQL)
 */
export type NewRagChunk = typeof ragChunks.$inferInsert;
