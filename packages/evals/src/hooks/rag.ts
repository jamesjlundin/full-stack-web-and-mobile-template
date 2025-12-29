/**
 * RAG (Retrieval-Augmented Generation) hooks for evaluation
 *
 * This module provides interfaces and utilities for evaluating RAG pipelines.
 * The actual RAG package (packages/rag) will be added later; this provides
 * future-compatible hooks.
 */

/**
 * Represents a chunk of text retrieved from the RAG system
 */
export interface RetrievedChunk {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * Function type for retrieving chunks from a RAG system
 */
export type RetrievalFn = (query: string, k: number) => Promise<RetrievedChunk[]>;

/**
 * RAG module interface when loaded
 */
export interface RagModule {
  retrieve: RetrievalFn;
  // Add additional RAG functions as needed
}

/**
 * Scoring result for RAG evaluation
 */
export interface RagScoringResult {
  precisionAtK: number;
  recallAtK: number;
  contextFaithfulness: number;
  avgRelevanceScore: number;
}

/**
 * Calculate precision@k for retrieval results
 * Precision = number of relevant items / k
 */
export function calculatePrecisionAtK(
  retrieved: RetrievedChunk[],
  relevantIds: Set<string>,
  k: number,
): number {
  const topK = retrieved.slice(0, k);
  const relevantCount = topK.filter((chunk) => relevantIds.has(chunk.id)).length;
  return k > 0 ? relevantCount / k : 0;
}

/**
 * Calculate recall@k for retrieval results
 * Recall = number of relevant items retrieved / total relevant items
 */
export function calculateRecallAtK(
  retrieved: RetrievedChunk[],
  relevantIds: Set<string>,
  k: number,
): number {
  const topK = retrieved.slice(0, k);
  const relevantCount = topK.filter((chunk) => relevantIds.has(chunk.id)).length;
  return relevantIds.size > 0 ? relevantCount / relevantIds.size : 0;
}

/**
 * Calculate context faithfulness score
 * Measures how well the retrieved context supports the generated answer
 */
export function calculateContextFaithfulness(
  answer: string,
  retrievedChunks: RetrievedChunk[],
): number {
  // Simple heuristic: check if key terms from answer appear in context
  if (retrievedChunks.length === 0) {
    return 0;
  }

  const context = retrievedChunks.map((c) => c.content.toLowerCase()).join(' ');
  const answerWords = answer
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  if (answerWords.length === 0) {
    return 1; // Empty answer is vacuously faithful
  }

  const matchedWords = answerWords.filter((word) => context.includes(word));
  return matchedWords.length / answerWords.length;
}

/**
 * Calculate average relevance score from retrieved chunks
 */
export function calculateAvgRelevanceScore(chunks: RetrievedChunk[]): number {
  if (chunks.length === 0) {
    return 0;
  }
  const totalScore = chunks.reduce((sum, chunk) => sum + chunk.score, 0);
  return totalScore / chunks.length;
}

/**
 * Comprehensive RAG scoring function
 */
export function scoreRagResults(
  retrieved: RetrievedChunk[],
  relevantIds: Set<string>,
  answer: string,
  k: number,
): RagScoringResult {
  return {
    precisionAtK: calculatePrecisionAtK(retrieved, relevantIds, k),
    recallAtK: calculateRecallAtK(retrieved, relevantIds, k),
    contextFaithfulness: calculateContextFaithfulness(answer, retrieved),
    avgRelevanceScore: calculateAvgRelevanceScore(retrieved),
  };
}

/**
 * Attempt to dynamically load the RAG package if it exists
 * Returns null if the package is not available
 */
export async function loadRag(): Promise<RagModule | null> {
  try {
    // Check if RAG package exists first
    const exists = await ragPackageExists();
    if (!exists) {
      console.warn('RAG package not available yet');
      return null;
    }

    // Dynamic import of @acme/rag
    // Using a variable to avoid static analysis issues with bundlers
    const ragModulePath = '@acme/rag';
    const ragModule = await import(/* webpackIgnore: true */ ragModulePath);

    // Check for required exports
    if (!ragModule.ragQuery || !ragModule.hasOpenAIKey) {
      console.warn('RAG package found but does not export expected interface');
      return null;
    }

    // Check if OpenAI API key is available
    if (!ragModule.hasOpenAIKey()) {
      console.warn('RAG package available but OPENAI_API_KEY not set - RAG evals will be skipped');
      return null;
    }

    // Import database client
    const dbModulePath = '@acme/db';
    const dbModule = await import(/* webpackIgnore: true */ dbModulePath);

    if (!dbModule.db) {
      console.warn('Database module not available');
      return null;
    }

    // Create the retrieve function that matches our interface
    const retrieve: RetrievalFn = async (query: string, k: number) => {
      const result = await ragModule.ragQuery(dbModule.db, { query, k });
      return result.chunks.map(
        (chunk: {
          id: string;
          text: string;
          score: number;
          metadata?: Record<string, unknown>;
        }) => ({
          id: chunk.id,
          content: chunk.text,
          score: chunk.score,
          metadata: chunk.metadata,
        }),
      );
    };

    console.log('RAG module loaded successfully');
    return { retrieve };
  } catch (err) {
    // Only log actual errors, not module-not-found which is expected
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (
      !errorMessage.includes('Cannot find module') &&
      !errorMessage.includes('MODULE_NOT_FOUND')
    ) {
      console.warn('Failed to load RAG package:', errorMessage);
    } else {
      console.warn('RAG package not available yet');
    }
    return null;
  }
}

/**
 * Check if RAG package exists (without loading it)
 */
export async function ragPackageExists(): Promise<boolean> {
  try {
    const fs = await import('fs');
    const path = await import('path');

    // Check multiple possible locations
    const possiblePaths = [
      path.resolve(process.cwd(), '../rag/package.json'),
      path.resolve(process.cwd(), 'packages/rag/package.json'),
      path.resolve(process.cwd(), '../../packages/rag/package.json'),
    ];

    for (const ragPath of possiblePaths) {
      if (fs.existsSync(ragPath)) {
        return true;
      }
    }

    // Also try to resolve the package directly
    try {
      await import.meta.resolve?.('@acme/rag');
      return true;
    } catch {
      // Package not resolvable
    }

    return false;
  } catch {
    return false;
  }
}
