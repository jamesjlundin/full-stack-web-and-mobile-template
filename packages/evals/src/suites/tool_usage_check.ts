/**
 * Tool Usage Check Suite
 *
 * Evaluates whether model correctly uses structured tool calls.
 * Metric: % of responses with correct tool selection and arguments.
 */

import type { Suite, EvalContext } from './types.js';
import type { ToolFixture } from '../fixtures/types.js';
import type { CaseResult } from '../reporters/types.js';

export const toolUsageCheckSuite: Suite = {
  name: 'Tool Usage Check',
  description: 'Evaluates correct structured tool call usage',
  metricName: 'tool_usage_check',

  async run(context: EvalContext): Promise<CaseResult[]> {
    const toolFixtures = context.fixtures.filter(
      (f): f is ToolFixture => f.category === 'tool'
    );

    const results: CaseResult[] = [];
    const limit = context.limit ?? toolFixtures.length;

    for (let i = 0; i < Math.min(limit, toolFixtures.length); i++) {
      const fixture = toolFixtures[i];
      const result = await evaluateToolUsage(context, fixture);
      results.push(result);
    }

    return results;
  },
};

async function evaluateToolUsage(
  context: EvalContext,
  fixture: ToolFixture
): Promise<CaseResult> {
  try {
    const response = await context.model.generate(
      [
        {
          role: 'system',
          content:
            'You are a helpful assistant with access to tools. Use the appropriate tool to complete the task.',
        },
        { role: 'user', content: fixture.prompt },
      ],
      { tools: fixture.tools }
    );

    // Check if tool was called
    if (!response.toolCalls || response.toolCalls.length === 0) {
      return {
        id: fixture.id,
        suite: 'tool_usage_check',
        name: fixture.name,
        passed: false,
        score: 0,
        error: 'No tool call was made',
        details: `Response: ${response.content.substring(0, 200)}`,
      };
    }

    const toolCall = response.toolCalls[0];

    // Check tool name
    if (toolCall.name !== fixture.expectedTool) {
      return {
        id: fixture.id,
        suite: 'tool_usage_check',
        name: fixture.name,
        passed: false,
        score: 0.5, // Partial credit for making a tool call
        error: `Wrong tool called: expected "${fixture.expectedTool}", got "${toolCall.name}"`,
      };
    }

    // Check expected arguments if specified
    if (fixture.expectedArguments) {
      const missingArgs: string[] = [];
      const wrongArgs: string[] = [];

      for (const [key, expectedValue] of Object.entries(
        fixture.expectedArguments
      )) {
        const actualValue = toolCall.arguments[key];

        if (actualValue === undefined) {
          missingArgs.push(key);
        } else if (typeof expectedValue === 'string') {
          // For string values, check if the actual value contains the expected
          const actualStr = String(actualValue).toLowerCase();
          const expectedStr = expectedValue.toLowerCase();
          if (!actualStr.includes(expectedStr)) {
            wrongArgs.push(`${key}: expected "${expectedValue}", got "${actualValue}"`);
          }
        }
      }

      if (missingArgs.length > 0 || wrongArgs.length > 0) {
        const issues = [
          ...missingArgs.map((a) => `missing: ${a}`),
          ...wrongArgs,
        ];

        return {
          id: fixture.id,
          suite: 'tool_usage_check',
          name: fixture.name,
          passed: false,
          score: 0.75, // Partial credit for correct tool
          error: 'Incorrect arguments',
          details: issues.join('; '),
        };
      }
    }

    return {
      id: fixture.id,
      suite: 'tool_usage_check',
      name: fixture.name,
      passed: true,
      score: 1,
      details: `Tool: ${toolCall.name}, Args: ${JSON.stringify(toolCall.arguments)}`,
    };
  } catch (error) {
    return {
      id: fixture.id,
      suite: 'tool_usage_check',
      name: fixture.name,
      passed: false,
      score: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default toolUsageCheckSuite;
