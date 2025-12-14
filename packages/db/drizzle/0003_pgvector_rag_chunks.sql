-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
-- Create rag_chunks table for storing document chunks with embeddings
CREATE TABLE IF NOT EXISTS "rag_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"doc_id" text NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create index on doc_id for efficient document-level queries
CREATE INDEX IF NOT EXISTS "rag_chunks_doc_id_idx" ON "rag_chunks" USING btree ("doc_id");
--> statement-breakpoint
-- Create IVFFlat index on embeddings for fast cosine similarity search
-- Using 100 lists which is suitable for up to ~100k vectors
-- For larger datasets, increase lists count (sqrt(n) is a good heuristic)
CREATE INDEX IF NOT EXISTS "rag_chunks_embedding_idx" ON "rag_chunks" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
