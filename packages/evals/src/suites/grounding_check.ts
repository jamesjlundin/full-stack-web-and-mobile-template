/**
 * Grounding Check Suite
 *
 * Evaluates whether model outputs are properly grounded in provided context.
 * Metric: % of responses that contain expected context-based facts.
 */

import type { Suite, EvalContext } from './types.js';
import type { GroundingFixture } from '../fixtures/types.js';
import type { CaseResult } from '../reporters/types.js';

export const groundingCheckSuite: Suite = {
  name: 'Grounding Check',
  description: 'Evaluates context-fact matching in model outputs',
  metricName: 'grounding_check',

  async run(context: EvalContext): Promise<CaseResult[]> {
    const groundingFixtures = context.fixtures.filter(
      (f): f is GroundingFixture => f.category === 'grounding'
    );

    const results: CaseResult[] = [];
    const limit = context.limit ?? groundingFixtures.length;

    for (let i = 0; i < Math.min(limit, groundingFixtures.length); i++) {
      const fixture = groundingFixtures[i];
      const result = await evaluateGrounding(context, fixture);
      results.push(result);
    }

    return results;
  },
};

async function evaluateGrounding(
  context: EvalContext,
  fixture: GroundingFixture
): Promise<CaseResult> {
  try {
    const prompt = `Context: ${fixture.context}\n\nQuestion: ${fixture.question}`;
    const response = await context.model.generate([
      {
        role: 'system',
        content:
          'Answer questions based only on the provided context. Be specific and factual.',
      },
      { role: 'user', content: prompt },
    ]);

    const lowerResponse = response.content.toLowerCase();

    // Check how many expected facts are present in the response
    const foundFacts: string[] = [];
    const missingFacts: string[] = [];

    for (const fact of fixture.expectedFacts) {
      if (lowerResponse.includes(fact.toLowerCase())) {
        foundFacts.push(fact);
      } else {
        missingFacts.push(fact);
      }
    }

    const score = foundFacts.length / fixture.expectedFacts.length;
    const passed = score >= 0.5; // Pass if at least half the facts are present

    return {
      id: fixture.id,
      suite: 'grounding_check',
      name: fixture.name,
      passed,
      score,
      details:
        missingFacts.length > 0
          ? `Missing facts: ${missingFacts.join(', ')}`
          : `Found all expected facts: ${foundFacts.join(', ')}`,
    };
  } catch (error) {
    return {
      id: fixture.id,
      suite: 'grounding_check',
      name: fixture.name,
      passed: false,
      score: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default groundingCheckSuite;
