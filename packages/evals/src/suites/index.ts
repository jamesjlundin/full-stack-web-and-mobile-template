/**
 * Evaluation suites index
 */

export * from "./types.js";

export { schemaFidelitySuite } from "./schema_fidelity.js";
export { constraintSatisfactionSuite } from "./constraint_satisfaction.js";
export { groundingCheckSuite } from "./grounding_check.js";
export { toolUsageCheckSuite } from "./tool_usage_check.js";
export {
  retrievalQualitySuite,
  isRetrievalQualityEnabled,
} from "./retrieval_quality.js";

import { constraintSatisfactionSuite } from "./constraint_satisfaction.js";
import { groundingCheckSuite } from "./grounding_check.js";
import { retrievalQualitySuite } from "./retrieval_quality.js";
import { schemaFidelitySuite } from "./schema_fidelity.js";
import { toolUsageCheckSuite } from "./tool_usage_check.js";

import type { Suite } from "./types.js";

/**
 * All available suites
 */
export const allSuites: Suite[] = [
  schemaFidelitySuite,
  constraintSatisfactionSuite,
  groundingCheckSuite,
  toolUsageCheckSuite,
  retrievalQualitySuite,
];

/**
 * Default suites (excludes retrieval_quality which requires RAG)
 */
export const defaultSuites: Suite[] = [
  schemaFidelitySuite,
  constraintSatisfactionSuite,
  groundingCheckSuite,
  toolUsageCheckSuite,
];

/**
 * Get suites by name
 */
export function getSuites(names?: string[]): Suite[] {
  if (!names || names.length === 0) {
    return defaultSuites;
  }

  const suiteMap: Record<string, Suite> = {
    schema_fidelity: schemaFidelitySuite,
    constraint_satisfaction: constraintSatisfactionSuite,
    grounding_check: groundingCheckSuite,
    tool_usage_check: toolUsageCheckSuite,
    retrieval_quality: retrievalQualitySuite,
  };

  return names
    .map((name) => suiteMap[name.toLowerCase()])
    .filter((s): s is Suite => s !== undefined);
}
