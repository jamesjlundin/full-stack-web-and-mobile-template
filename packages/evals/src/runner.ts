/**
 * Evaluation Runner
 *
 * Main runner that orchestrates evaluation suites, aggregates results,
 * and computes metrics.
 */

import { getAllFixtures } from './fixtures/index.js';
import { loadRag } from './hooks/rag.js';
import { getSuites, allSuites } from './suites/index.js';
import { checkThresholds, mergeThresholds } from './thresholds.js';

import type { RagModule } from './hooks/rag.js';
import type { ModelAdapter } from './models/types.js';
import type { EvalResults, SuiteResult, CaseResult, Reporter } from './reporters/types.js';
import type { Suite, EvalContext } from './suites/types.js';
import type { Thresholds } from './thresholds.js';

/**
 * Runner configuration
 */
export interface RunnerConfig {
  model: ModelAdapter;
  suites?: string[];
  limit?: number;
  thresholds?: Partial<Thresholds>;
  enableRag?: boolean;
  reporter?: Reporter;
}

/**
 * Run all evaluations
 */
export async function runEvaluations(config: RunnerConfig): Promise<EvalResults> {
  const startTime = Date.now();

  // Load fixtures
  const fixtures = getAllFixtures();

  // Load RAG module if enabled
  let ragModule: RagModule | null = null;
  if (config.enableRag) {
    ragModule = await loadRag();
  }

  // Get suites to run
  let suitesToRun: Suite[];
  if (config.suites && config.suites.length > 0) {
    suitesToRun = getSuites(config.suites);
  } else if (config.enableRag) {
    suitesToRun = allSuites; // Include retrieval_quality if RAG enabled
  } else {
    suitesToRun = getSuites(); // Default suites
  }

  // Build evaluation context
  const context: EvalContext = {
    model: config.model,
    fixtures,
    limit: config.limit,
    ragModule,
  };

  // Run suites
  const suiteResults: SuiteResult[] = [];
  const metrics: Record<string, number> = {};

  for (const suite of suitesToRun) {
    console.log(`Running suite: ${suite.name}...`);

    const caseResults = await suite.run(context);
    const suiteResult = aggregateSuiteResults(suite.name, caseResults);
    suiteResults.push(suiteResult);

    // Store metric
    metrics[suite.metricName] = suiteResult.score;
  }

  // Calculate summary
  const allCases = suiteResults.flatMap((s) => s.cases);
  const summary = {
    totalCases: allCases.length,
    passedCases: allCases.filter((c) => c.passed && !c.skipped).length,
    failedCases: allCases.filter((c) => !c.passed && !c.skipped).length,
    skippedCases: allCases.filter((c) => c.skipped).length,
    overallScore: calculateOverallScore(suiteResults),
  };

  // Check thresholds
  const thresholds = mergeThresholds(config.thresholds);
  const thresholdResult = checkThresholds(metrics, thresholds);

  const duration = Date.now() - startTime;

  return {
    model: config.model.name,
    timestamp: new Date().toISOString(),
    duration,
    thresholdsPassed: thresholdResult.passed,
    thresholdFailures: thresholdResult.failures,
    metrics,
    suites: suiteResults,
    summary,
  };
}

/**
 * Aggregate case results into suite result
 */
function aggregateSuiteResults(suiteName: string, cases: CaseResult[]): SuiteResult {
  const nonSkippedCases = cases.filter((c) => !c.skipped);
  const passed = nonSkippedCases.filter((c) => c.passed).length;
  const failed = nonSkippedCases.filter((c) => !c.passed).length;
  const skipped = cases.filter((c) => c.skipped).length;

  // Calculate score as average of individual scores
  const score =
    nonSkippedCases.length > 0
      ? nonSkippedCases.reduce((sum, c) => sum + c.score, 0) / nonSkippedCases.length
      : 1; // If all skipped, score is 1

  return {
    name: suiteName,
    score,
    total: cases.length,
    passed,
    failed,
    skipped,
    cases,
  };
}

/**
 * Calculate overall score across all suites
 */
function calculateOverallScore(suiteResults: SuiteResult[]): number {
  if (suiteResults.length === 0) {
    return 1;
  }

  const totalScore = suiteResults.reduce((sum, s) => sum + s.score, 0);
  return totalScore / suiteResults.length;
}
