/**
 * Constraint Satisfaction Suite
 *
 * Evaluates whether model outputs satisfy specified constraints.
 * Metric: % of responses that pass all constraints.
 */

import type { Suite, EvalContext } from "./types.js";
import type {
  QAFixture,
  SummarizeFixture,
  PlanFixture,
} from "../fixtures/types.js";
import type { CaseResult } from "../reporters/types.js";

export const constraintSatisfactionSuite: Suite = {
  name: "Constraint Satisfaction",
  description: "Evaluates whether model outputs satisfy specified constraints",
  metricName: "constraint_satisfaction",

  async run(context: EvalContext): Promise<CaseResult[]> {
    const constraintFixtures = context.fixtures.filter(
      (f) =>
        f.category === "qa" ||
        f.category === "summarize" ||
        f.category === "plan",
    );

    const results: CaseResult[] = [];
    const limit = context.limit ?? constraintFixtures.length;

    for (let i = 0; i < Math.min(limit, constraintFixtures.length); i++) {
      const fixture = constraintFixtures[i];
      const result = await evaluateConstraints(context, fixture);
      results.push(result);
    }

    return results;
  },
};

async function evaluateConstraints(
  context: EvalContext,
  fixture: QAFixture | SummarizeFixture | PlanFixture,
): Promise<CaseResult> {
  try {
    const prompt = buildPrompt(fixture);
    const response = await context.model.generate([
      { role: "user", content: prompt },
    ]);

    const violations: string[] = [];

    // Check QA constraints
    if (fixture.category === "qa") {
      const qaFixture = fixture as QAFixture;

      if (qaFixture.expectedAnswer) {
        if (
          !response.content
            .toLowerCase()
            .includes(qaFixture.expectedAnswer.toLowerCase())
        ) {
          violations.push(
            `Expected answer "${qaFixture.expectedAnswer}" not found`,
          );
        }
      }

      if (qaFixture.acceptablePatterns) {
        const matched = qaFixture.acceptablePatterns.some((pattern) =>
          pattern.test(response.content),
        );
        if (!matched) {
          violations.push("Response did not match any acceptable patterns");
        }
      }
    }

    // Check summarization constraints
    if (fixture.category === "summarize") {
      const sumFixture = fixture as SummarizeFixture;

      if (
        sumFixture.maxLength &&
        response.content.length > sumFixture.maxLength * 2
      ) {
        violations.push(
          `Summary too long: ${response.content.length} chars (max ~${sumFixture.maxLength})`,
        );
      }

      if (sumFixture.keyPoints) {
        const lowerResponse = response.content.toLowerCase();
        const missingPoints = sumFixture.keyPoints.filter(
          (point) => !lowerResponse.includes(point.toLowerCase()),
        );
        if (missingPoints.length > sumFixture.keyPoints.length / 2) {
          violations.push(`Missing key points: ${missingPoints.join(", ")}`);
        }
      }
    }

    // Check planning constraints
    if (fixture.category === "plan") {
      const planFixture = fixture as PlanFixture;

      // Check for numbered steps or bullet points
      const stepPatterns = [
        /\d+\.\s/g, // Numbered list
        /[-*]\s/g, // Bullet points
        /step\s*\d/gi, // "Step 1", "Step 2", etc.
      ];

      const hasSteps = stepPatterns.some((pattern) =>
        pattern.test(response.content),
      );

      if (!hasSteps) {
        violations.push("Response does not contain clear steps");
      }

      if (planFixture.expectedSteps) {
        const stepCount = countSteps(response.content);
        if (stepCount < planFixture.expectedSteps - 1) {
          violations.push(
            `Expected ~${planFixture.expectedSteps} steps, found ${stepCount}`,
          );
        }
      }
    }

    const passed = violations.length === 0;

    return {
      id: fixture.id,
      suite: "constraint_satisfaction",
      name: fixture.name,
      passed,
      score: passed ? 1 : 0,
      details: violations.length > 0 ? violations.join("; ") : undefined,
    };
  } catch (error) {
    return {
      id: fixture.id,
      suite: "constraint_satisfaction",
      name: fixture.name,
      passed: false,
      score: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function buildPrompt(
  fixture: QAFixture | SummarizeFixture | PlanFixture,
): string {
  switch (fixture.category) {
    case "qa":
      return (fixture as QAFixture).question;
    case "summarize":
      return `Summarize the following content:\n\n${(fixture as SummarizeFixture).content}`;
    case "plan":
      return `Create a plan for: ${(fixture as PlanFixture).task}`;
  }
}

function countSteps(content: string): number {
  const numberedSteps = content.match(/\d+\.\s/g)?.length ?? 0;
  const bulletSteps = content.match(/^[-*]\s/gm)?.length ?? 0;
  const stepMentions = content.match(/step\s*\d/gi)?.length ?? 0;

  return Math.max(numberedSteps, bulletSteps, stepMentions);
}

export default constraintSatisfactionSuite;
