#!/usr/bin/env node
/**
 * CLI for running evaluations
 *
 * Usage:
 *   node dist/cli.js --model=mock --report=console
 *   node dist/cli.js --model=openai --report=json --suites=schema_fidelity,tool_usage_check
 *   node dist/cli.js --rag --model=mock
 */

import minimist from 'minimist';

import { ragPackageExists } from './hooks/rag.js';
import { getModel } from './models/index.js';
import { getReporter } from './reporters/index.js';
import { runEvaluations } from './runner.js';
import { parseThresholdConstraints, mergeThresholds } from './thresholds.js';

interface CliArgs {
  model?: string;
  report?: string;
  suites?: string;
  thresholdSchema?: string;
  thresholdConstraints?: string;
  limit?: number;
  rag?: boolean;
  help?: boolean;
}

function printHelp(): void {
  console.log(`
@acme/evals - LLM Evaluation Harness

Usage:
  node dist/cli.js [options]

Options:
  --model=<name>              Model to use: mock, openai, gpt-4o-mini (default: mock)
  --report=<type>             Reporter type: console, json (default: console)
  --suites=<list>             Comma-separated suite names to run (default: all)
                              Available: schema_fidelity, constraint_satisfaction,
                                        grounding_check, tool_usage_check, retrieval_quality
  --thresholdConstraints=<s>  Custom thresholds, e.g. "schema_fidelity:0.95,constraint_satisfaction:0.85"
  --limit=<n>                 Limit number of test cases per suite
  --rag                       Enable RAG evaluation (requires packages/rag)
  --help                      Show this help message

Examples:
  # Run with mock model and console output
  node dist/cli.js --model=mock --report=console

  # Run with OpenAI and JSON output
  node dist/cli.js --model=openai --report=json

  # Run specific suites only
  node dist/cli.js --suites=schema_fidelity,tool_usage_check

  # Run with custom thresholds
  node dist/cli.js --thresholdConstraints="schema_fidelity:0.95"

  # Enable RAG evaluation
  node dist/cli.js --rag --model=mock
`);
}

async function main(): Promise<void> {
  const args = minimist<CliArgs>(process.argv.slice(2), {
    string: ['model', 'report', 'suites', 'thresholdSchema', 'thresholdConstraints'],
    boolean: ['rag', 'help'],
    default: {
      model: 'mock',
      report: 'console',
      rag: false,
    },
  });

  // Show help
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Parse arguments
  const modelName = args.model ?? 'mock';
  const reporterName = args.report ?? 'console';
  const suitesArg = args.suites;
  const enableRag = args.rag ?? false;
  const limit = args.limit ? Number(args.limit) : undefined;

  // Parse suites
  const suites = suitesArg ? suitesArg.split(',').map((s) => s.trim()) : undefined;

  // Check RAG availability if requested
  if (enableRag) {
    const ragExists = await ragPackageExists();
    if (!ragExists) {
      console.warn(
        'Warning: --rag flag set but packages/rag not found. RAG evaluation will be skipped.',
      );
    }
  }

  // Parse custom thresholds
  const customThresholds = args.thresholdConstraints
    ? parseThresholdConstraints(args.thresholdConstraints)
    : undefined;
  const thresholds = mergeThresholds(customThresholds);

  // Get model and reporter
  const model = getModel(modelName);
  const reporter = getReporter(reporterName);

  console.log(`\nStarting evaluation with model: ${model.name}`);
  if (suites) {
    console.log(`Suites: ${suites.join(', ')}`);
  }
  if (enableRag) {
    console.log('RAG evaluation: enabled');
  }
  console.log();

  // Run evaluations
  const results = await runEvaluations({
    model,
    suites,
    limit,
    thresholds,
    enableRag,
  });

  // Report results
  reporter.report(results);

  // Exit with appropriate code
  if (!results.thresholdsPassed) {
    console.error('\nEvaluation FAILED: Thresholds not met');
    process.exit(1);
  }

  console.log('\nEvaluation PASSED: All thresholds met');
  process.exit(0);
}

// Run CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
