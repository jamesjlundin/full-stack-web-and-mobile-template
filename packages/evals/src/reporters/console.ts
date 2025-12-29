/**
 * Console reporter for evaluation results
 */

import type { Reporter, EvalResults, SuiteResult, CaseResult } from './types.js';

/**
 * Console reporter that outputs results to stdout
 */
export class ConsoleReporter implements Reporter {
  name = 'console';

  report(results: EvalResults): void {
    this.printHeader(results);
    this.printSuites(results.suites);
    this.printMetrics(results.metrics);
    this.printSummary(results);
    this.printThresholds(results);
  }

  private printHeader(results: EvalResults): void {
    console.log('\n' + '='.repeat(60));
    console.log('  EVALUATION RESULTS');
    console.log('='.repeat(60));
    console.log(`  Model: ${results.model}`);
    console.log(`  Timestamp: ${results.timestamp}`);
    console.log(`  Duration: ${(results.duration / 1000).toFixed(2)}s`);
    console.log('='.repeat(60) + '\n');
  }

  private printSuites(suites: SuiteResult[]): void {
    for (const suite of suites) {
      this.printSuite(suite);
    }
  }

  private printSuite(suite: SuiteResult): void {
    const status = suite.failed === 0 ? '\u2713' : '\u2717';
    const statusColor = suite.failed === 0 ? '\x1b[32m' : '\x1b[31m';

    console.log(`${statusColor}${status}\x1b[0m ${suite.name}`);
    console.log(
      `  Score: ${(suite.score * 100).toFixed(1)}% | ` +
        `Passed: ${suite.passed}/${suite.total} | ` +
        `Failed: ${suite.failed} | ` +
        `Skipped: ${suite.skipped}`,
    );

    // Print failed cases
    const failedCases = suite.cases.filter((c) => !c.passed && !c.skipped);
    if (failedCases.length > 0) {
      console.log('  Failed cases:');
      for (const c of failedCases) {
        this.printFailedCase(c);
      }
    }

    console.log();
  }

  private printFailedCase(c: CaseResult): void {
    console.log(`    \x1b[31m\u2717\x1b[0m ${c.name}`);
    if (c.error) {
      console.log(`      Error: ${c.error}`);
    }
    if (c.details) {
      console.log(`      Details: ${c.details}`);
    }
  }

  private printMetrics(metrics: Record<string, number>): void {
    console.log('-'.repeat(60));
    console.log('METRICS');
    console.log('-'.repeat(60));

    for (const [name, value] of Object.entries(metrics)) {
      const displayName = name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      console.log(`  ${displayName}: ${(value * 100).toFixed(1)}%`);
    }
    console.log();
  }

  private printSummary(results: EvalResults): void {
    console.log('-'.repeat(60));
    console.log('SUMMARY');
    console.log('-'.repeat(60));
    console.log(`  Total Cases: ${results.summary.totalCases}`);
    console.log(`  Passed: ${results.summary.passedCases}`);
    console.log(`  Failed: ${results.summary.failedCases}`);
    console.log(`  Skipped: ${results.summary.skippedCases}`);
    console.log(`  Overall Score: ${(results.summary.overallScore * 100).toFixed(1)}%`);
    console.log();
  }

  private printThresholds(results: EvalResults): void {
    console.log('-'.repeat(60));
    console.log('THRESHOLD CHECK');
    console.log('-'.repeat(60));

    if (results.thresholdsPassed) {
      console.log('  \x1b[32m\u2713 All thresholds passed\x1b[0m');
    } else {
      console.log('  \x1b[31m\u2717 Threshold failures:\x1b[0m');
      for (const failure of results.thresholdFailures) {
        console.log(`    - ${failure}`);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }
}

/**
 * Create a console reporter instance
 */
export function createConsoleReporter(): Reporter {
  return new ConsoleReporter();
}
