/**
 * Suite types and interfaces
 */

import type { Fixture } from "../fixtures/types.js";
import type { RagModule } from "../hooks/rag.js";
import type { ModelAdapter } from "../models/types.js";
import type { CaseResult } from "../reporters/types.js";

/**
 * Context passed to suite evaluators
 */
export interface EvalContext {
  model: ModelAdapter;
  fixtures: Fixture[];
  limit?: number;
  ragModule?: RagModule | null;
}

/**
 * Suite evaluator interface
 */
export interface Suite {
  name: string;
  description: string;
  metricName: string;
  run(context: EvalContext): Promise<CaseResult[]>;
}

/**
 * Suite result
 */
export interface SuiteRunResult {
  suiteName: string;
  metricName: string;
  results: CaseResult[];
  score: number;
}
