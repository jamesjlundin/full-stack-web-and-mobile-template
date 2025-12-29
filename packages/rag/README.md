# @acme/rag

Production-ready RAG (Retrieval-Augmented Generation) package using PostgreSQL + pgvector.

## Overview

This package provides the complete chunk → embed → index → query pipeline for building RAG applications:

1. **Chunk**: Split documents into overlapping chunks for embedding
2. **Embed**: Generate vector embeddings using OpenAI's text-embedding-3-small
3. **Index**: Store chunks and embeddings in PostgreSQL with pgvector
4. **Query**: Retrieve relevant chunks using cosine similarity search

## Prerequisites

- PostgreSQL with pgvector extension (enabled by migration)
- `DATABASE_URL` environment variable pointing to your Neon Postgres
- `OPENAI_API_KEY` environment variable (required for embedding)

## Installation

The package is part of the monorepo workspace. Dependencies are managed via pnpm:

```bash
pnpm install
```

## Database Setup

Run the migration to create the pgvector extension and `rag_chunks` table:

```bash
pnpm -C packages/db migrate:apply
```

This creates:

- `vector` extension for pgvector
- `rag_chunks` table with columns: id, doc_id, content, embedding (VECTOR(1536)), metadata, created_at
- IVFFlat index on embeddings for fast cosine similarity search

## Usage

### Basic Pipeline

```typescript
import { db } from "@acme/db";
import {
  fixedSizeChunks,
  openaiEmbedder,
  upsertChunks,
  ragQuery,
} from "@acme/rag";

// 1. Chunk your document
const chunks = fixedSizeChunks(documentText, {
  size: 800, // characters per chunk
  overlap: 200, // overlap between chunks
  source: "my-doc.md",
});

// 2. Generate embeddings
const embedder = openaiEmbedder();
const embeddings = await embedder.embed(chunks.map((c) => c.content));

// 3. Index in pgvector
await upsertChunks(
  db,
  chunks.map((c, i) => ({
    id: c.id,
    docId: "doc-123",
    content: c.content,
    embedding: embeddings[i],
    metadata: c.metadata,
  })),
);

// 4. Query for relevant chunks
const results = await ragQuery(db, {
  query: "What is TypeScript?",
  k: 5, // return top 5 results
});

for (const chunk of results.chunks) {
  console.log(`[${chunk.score.toFixed(4)}] ${chunk.text.slice(0, 100)}...`);
}
```

### Markdown Processing

```typescript
import { mdToText, fixedSizeChunks } from "@acme/rag";

// Convert markdown to plain text (removes formatting)
const plainText = mdToText(markdownContent);

// Then chunk the plain text
const chunks = fixedSizeChunks(plainText, { source: "readme.md" });
```

## Configuration

Constants are defined in `src/config.ts`:

| Constant                | Default                           | Description                               |
| ----------------------- | --------------------------------- | ----------------------------------------- |
| `EMBED_MODEL`           | `"openai:text-embedding-3-small"` | Embedding model identifier                |
| `EMBED_DIMS`            | `1536`                            | Vector dimensions (must match model)      |
| `RAG_CONFIG_VERSION`    | `"v1"`                            | Config version for compatibility tracking |
| `DEFAULT_CHUNK_SIZE`    | `800`                             | Default chunk size in characters          |
| `DEFAULT_CHUNK_OVERLAP` | `200`                             | Default overlap between chunks            |

### Changing Models

If you change the embedding model:

1. Update `EMBED_MODEL` and `EMBED_DIMS` in `src/config.ts`
2. Create a new migration to alter the `embedding` column dimension
3. Re-index all documents

## API Reference

### Chunking

- `fixedSizeChunks(text, options)` - Split text into fixed-size overlapping chunks
- `mdToText(markdown)` - Convert Markdown to plain text
- `splitParagraphs(text)` - Split text on paragraph boundaries

### Embedding

- `openaiEmbedder()` - Create OpenAI embedder instance
- `hasOpenAIKey()` - Check if API key is available
- `MissingApiKeyError` - Error thrown when key is missing

### Storage

- `upsertChunks(db, rows)` - Insert or update chunks in the database
- `querySimilar(db, embedding, k)` - Find similar chunks by vector
- `deleteDocChunks(db, docId)` - Delete all chunks for a document
- `countChunks(db)` - Count total chunks

### Query

- `ragQuery(db, { query, k })` - High-level query combining embed + search
- `createRetrieveFn(db)` - Create retrieval function for evals

## Scripts

```bash
# Build the package
pnpm -C packages/rag build

# Seed sample data (requires OPENAI_API_KEY)
pnpm -C packages/rag seed
```

## Environment Variables

| Variable         | Required      | Description                                |
| ---------------- | ------------- | ------------------------------------------ |
| `DATABASE_URL`   | Yes           | PostgreSQL connection string with pgvector |
| `OPENAI_API_KEY` | For embedding | OpenAI API key for text-embedding-3-small  |

## Validation

Test the RAG system via the API endpoint:

```bash
# Without API key (expect 400 error)
curl -X POST http://localhost:3000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'

# With API key and seeded data (expect 200 with results)
curl -X POST http://localhost:3000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is TypeScript?", "k": 3}'
```
