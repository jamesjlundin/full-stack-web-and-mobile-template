#!/usr/bin/env node
/**
 * RAG Seed Script
 *
 * Seeds the rag_chunks table with sample data for testing.
 * Requires OPENAI_API_KEY to be set for embedding generation.
 *
 * Usage: pnpm -C packages/rag seed
 */

import "dotenv/config";

import { db } from "@acme/db";

import { fixedSizeChunks } from "../chunk";
import { openaiEmbedder, hasOpenAIKey } from "../embed";
import { upsertChunks, countChunks, deleteDocChunks } from "../store";

/**
 * Sample documents for seeding
 */
const SAMPLE_DOCS = [
  {
    id: "seed-typescript",
    title: "Introduction to TypeScript",
    content: `TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. TypeScript adds optional static typing and class-based object-oriented programming to the language. It is designed for the development of large applications and transcompiles to JavaScript.

TypeScript was developed by Microsoft and is maintained by them. It was first released in October 2012. The language is designed for development of large applications and transcompiles to JavaScript. As TypeScript is a superset of JavaScript, existing JavaScript programs are also valid TypeScript programs.

Key features of TypeScript include:
- Static type checking at compile time
- Object-oriented programming support with classes and interfaces
- Enhanced IDE support with intelligent code completion
- Better code organization through modules and namespaces
- Support for the latest ECMAScript features

TypeScript compiles to readable, standards-based JavaScript. You can use existing JavaScript libraries with TypeScript seamlessly.`,
  },
  {
    id: "seed-react",
    title: "React Framework Overview",
    content: `React is a free and open-source front-end JavaScript library for building user interfaces based on components. It is maintained by Meta and a community of individual developers and companies. React can be used to develop single-page, mobile, or server-rendered applications.

React was created by Jordan Walke, a software engineer at Facebook (now Meta). It was first deployed on Facebook's News Feed in 2011 and later on Instagram in 2012. It was open-sourced at JSConf US in May 2013.

Core concepts in React:
- Components: Reusable pieces of UI that can be composed together
- JSX: A syntax extension that allows writing HTML-like code in JavaScript
- Virtual DOM: An efficient way to update the UI by minimizing direct DOM manipulation
- State: Data that changes over time and affects the rendered output
- Props: Data passed from parent to child components

React uses a declarative paradigm that makes your code more predictable and easier to debug.`,
  },
  {
    id: "seed-postgres",
    title: "PostgreSQL and pgvector",
    content: `PostgreSQL is a powerful, open source object-relational database system that uses and extends the SQL language combined with many features that safely store and scale the most complicated data workloads. PostgreSQL has earned a strong reputation for its proven architecture, reliability, data integrity, robust feature set, and extensibility.

pgvector is an open-source extension for PostgreSQL that adds support for vector similarity search. It enables storing vector embeddings alongside your other data in PostgreSQL and performing efficient similarity searches.

Key features of pgvector:
- Supports exact and approximate nearest neighbor search
- Multiple distance metrics: L2, inner product, and cosine distance
- IVFFlat and HNSW indexing for fast approximate search
- Seamlessly integrates with existing PostgreSQL features
- Works with any embedding model output

Common use cases for pgvector include:
- Semantic search over documents
- Recommendation systems
- Image similarity search
- Retrieval-augmented generation (RAG) for LLM applications

The combination of PostgreSQL's reliability and pgvector's vector search capabilities makes it an excellent choice for production RAG applications.`,
  },
];

async function main() {
  console.log("RAG Seed Script\n");

  // Check for API key
  if (!hasOpenAIKey()) {
    console.log("⚠️  OPENAI_API_KEY not set - skipping seed");
    console.log("   Set OPENAI_API_KEY environment variable to enable seeding");
    process.exit(0);
  }

  console.log("✓ OPENAI_API_KEY found");

  const embedder = openaiEmbedder();
  console.log(`✓ Using embedding model: ${embedder.model}`);

  for (const doc of SAMPLE_DOCS) {
    console.log(`\nProcessing: ${doc.title}`);

    // Delete existing chunks for this document
    await deleteDocChunks(db, doc.id);
    console.log(`  ✓ Cleared existing chunks for ${doc.id}`);

    // Chunk the document
    const chunks = fixedSizeChunks(doc.content, {
      size: 400,
      overlap: 100,
      source: doc.title,
    });
    console.log(`  ✓ Created ${chunks.length} chunks`);

    // Embed all chunks
    const texts = chunks.map((c) => c.content);
    const embeddings = await embedder.embed(texts);
    console.log(`  ✓ Generated ${embeddings.length} embeddings`);

    // Prepare rows for upsert
    const rows = chunks.map((chunk, i) => ({
      id: chunk.id,
      docId: doc.id,
      content: chunk.content,
      embedding: embeddings[i],
      metadata: {
        ...chunk.metadata,
        title: doc.title,
      },
    }));

    // Upsert to database
    await upsertChunks(db, rows);
    console.log(`  ✓ Upserted ${rows.length} chunks to database`);
  }

  // Final stats
  const count = await countChunks(db);
  console.log(`\n✓ Seed complete!`);
  console.log(`  Total chunks in database: ${count}`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
