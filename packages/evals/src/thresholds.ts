/**
 * Threshold configuration for evaluation metrics
 */

export interface Thresholds {
  schema_fidelity: number;
  constraint_satisfaction: number;
  grounding_check: number;
  tool_usage_check: number;
  retrieval_quality: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  schema_fidelity: 0.99,
  constraint_satisfaction: 0.90,
  grounding_check: 0.85,
  tool_usage_check: 0.90,
  retrieval_quality: 0.80,
};

/**
 * Merge user-provided thresholds with defaults
 */
export function mergeThresholds(
  custom?: Partial<Thresholds>
): Thresholds {
  return {
    ...DEFAULT_THRESHOLDS,
    ...custom,
  };
}

/**
 * Parse threshold constraints from CLI argument
 * Format: "schema_fidelity:0.95,constraint_satisfaction:0.85"
 */
export function parseThresholdConstraints(
  constraintStr: string
): Partial<Thresholds> {
  const result: Partial<Thresholds> = {};

  if (!constraintStr) {
    return result;
  }

  const pairs = constraintStr.split(',');
  for (const pair of pairs) {
    const [key, value] = pair.split(':');
    if (key && value) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && isValidThresholdKey(key)) {
        result[key as keyof Thresholds] = numValue;
      }
    }
  }

  return result;
}

/**
 * Check if a key is a valid threshold key
 */
function isValidThresholdKey(key: string): key is keyof Thresholds {
  return key in DEFAULT_THRESHOLDS;
}

/**
 * Check if results meet thresholds
 */
export function checkThresholds(
  results: Record<string, number>,
  thresholds: Thresholds
): { passed: boolean; failures: string[] } {
  const failures: string[] = [];

  for (const [metric, threshold] of Object.entries(thresholds)) {
    const score = results[metric];
    if (score !== undefined && score < threshold) {
      failures.push(
        `${metric}: ${(score * 100).toFixed(1)}% < ${(threshold * 100).toFixed(1)}%`
      );
    }
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}
