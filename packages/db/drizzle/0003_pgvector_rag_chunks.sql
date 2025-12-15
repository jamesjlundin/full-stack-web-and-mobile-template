-- RAG chunks table with pgvector support
-- This migration gracefully handles environments where pgvector is not available

DO $$
BEGIN
    -- Try to enable pgvector extension
    CREATE EXTENSION IF NOT EXISTS vector;

    -- Create rag_chunks table with vector column
    CREATE TABLE IF NOT EXISTS "rag_chunks" (
        "id" text PRIMARY KEY NOT NULL,
        "doc_id" text NOT NULL,
        "content" text NOT NULL,
        "embedding" vector(1536) NOT NULL,
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL
    );

    -- Create index on doc_id for efficient document-level queries
    CREATE INDEX IF NOT EXISTS "rag_chunks_doc_id_idx" ON "rag_chunks" USING btree ("doc_id");

    -- Create IVFFlat index on embeddings for fast cosine similarity search
    CREATE INDEX IF NOT EXISTS "rag_chunks_embedding_idx" ON "rag_chunks" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

    RAISE NOTICE 'pgvector extension and rag_chunks table created successfully';
EXCEPTION
    WHEN OTHERS THEN
        -- pgvector not available - this is OK for CI/dev environments without vector support
        RAISE WARNING 'pgvector extension not available: %. RAG features will be disabled.', SQLERRM;
        RAISE WARNING 'To enable RAG features, install pgvector or use a database that supports it (e.g., Neon with pgvector enabled).';
END $$;
