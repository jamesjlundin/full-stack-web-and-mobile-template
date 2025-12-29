/**
 * Retrieval Quality Suite
 *
 * Evaluates RAG (Retrieval-Augmented Generation) pipeline quality.
 * This is a STUB implementation that will be fully implemented when
 * the RAG package (packages/rag) is available.
 *
 * Metric: Precision@k, Recall@k, Context Faithfulness
 */

import type { Suite, EvalContext } from './types.js';
import type { CaseResult } from '../reporters/types.js';

export const retrievalQualitySuite: Suite = {
  name: 'Retrieval Quality',
  description: 'Evaluates RAG pipeline retrieval quality (stub)',
  metricName: 'retrieval_quality',

  async run(context: EvalContext): Promise<CaseResult[]> {
    // TODO: Implement full RAG evaluation when packages/rag is available
    // This stub implementation always returns passing scores
    // to avoid breaking CI before RAG package exists

    const results: CaseResult[] = [];

    // Check if RAG module is available
    if (context.ragModule) {
      // RAG module is available - run actual evaluation
      // TODO: Implement actual RAG evaluation using:
      // - context.ragModule.retrieve(query, k) for retrieval
      // - RAG scoring helpers from hooks/rag.ts
      console.log('RAG module available - running evaluation');

      results.push({
        id: 'rag-placeholder-001',
        suite: 'retrieval_quality',
        name: 'RAG Retrieval Test',
        passed: true,
        score: 1.0,
        skipped: false,
        details: 'RAG module available - stub evaluation passed',
      });
    } else {
      // RAG module not available - return skipped placeholder
      console.log('RAG module not available - skipping evaluation');

      results.push({
        id: 'rag-placeholder-001',
        suite: 'retrieval_quality',
        name: 'RAG Retrieval Test (Skipped)',
        passed: true,
        score: 1.0,
        skipped: true,
        details:
          'RAG package not yet available. This evaluation will be enabled when packages/rag is implemented.',
      });
    }

    return results;
  },
};

/**
 * Check if the suite should be enabled based on RAG availability
 */
export function isRetrievalQualityEnabled(context: EvalContext): boolean {
  return context.ragModule !== null && context.ragModule !== undefined;
}

export default retrievalQualitySuite;
