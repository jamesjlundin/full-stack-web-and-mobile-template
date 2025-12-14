/**
 * Reporter types and interfaces
 */

/**
 * Individual test case result
 */
export interface CaseResult {
  id: string;
  suite: string;
  name: string;
  passed: boolean;
  score: number;
  details?: string;
  error?: string;
  skipped?: boolean;
}

/**
 * Suite-level results
 */
export interface SuiteResult {
  name: string;
  score: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  cases: CaseResult[];
}

/**
 * Overall evaluation results
 */
export interface EvalResults {
  model: string;
  timestamp: string;
  duration: number;
  thresholdsPassed: boolean;
  thresholdFailures: string[];
  metrics: Record<string, number>;
  suites: SuiteResult[];
  summary: {
    totalCases: number;
    passedCases: number;
    failedCases: number;
    skippedCases: number;
    overallScore: number;
  };
}

/**
 * Reporter interface
 */
export interface Reporter {
  name: string;
  report(results: EvalResults): void;
}
