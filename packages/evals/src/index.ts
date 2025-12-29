/**
 * @acme/evals - LLM Evaluation Harness
 *
 * A portable evaluation harness for testing LLM outputs against
 * various quality metrics including schema compliance, constraint
 * satisfaction, grounding, tool usage, and retrieval quality.
 */

// Models
export * from "./models/index.js";

// Reporters
export * from "./reporters/index.js";

// Suites
export * from "./suites/index.js";

// Fixtures
export * from "./fixtures/index.js";

// Thresholds
export * from "./thresholds.js";

// RAG Hooks
export * from "./hooks/rag.js";

// Runner
export { runEvaluations } from "./runner.js";
export type { RunnerConfig } from "./runner.js";
