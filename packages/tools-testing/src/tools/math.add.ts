/**
 * Math.add tool - Adds two numbers.
 * Deterministic mock tool for testing purposes.
 */

import { defineContract } from '@acme/tools';
import { z } from 'zod';

import type { ToolContract, ToolImpl } from '@acme/tools';

// =============================================================================
// Contract
// =============================================================================

/** Math.add input schema */
export const mathAddInputSchema = z.object({
  /** First number */
  a: z.number(),
  /** Second number */
  b: z.number(),
});

/** Math.add output schema */
export const mathAddOutputSchema = z.object({
  /** Sum of a and b */
  sum: z.number(),
});

/** Math.add tool contract */
export const mathAddContract = defineContract({
  name: 'math.add',
  description: 'Add two numbers together',
  input: mathAddInputSchema,
  output: mathAddOutputSchema,
});

// =============================================================================
// Implementation
// =============================================================================

/** Input type for math.add tool */
export type MathAddInput = z.infer<typeof mathAddInputSchema>;

/** Output type for math.add tool */
export type MathAddOutput = z.infer<typeof mathAddOutputSchema>;

/**
 * Math.add tool implementation.
 * Returns the sum of two numbers.
 *
 * @param input - Math.add input with a and b
 * @returns Math.add output with sum
 */
export const mathAddImpl: ToolImpl<typeof mathAddContract> = (
  input: MathAddInput,
): MathAddOutput => {
  return { sum: input.a + input.b };
};

// Export contract type for external use
export type MathAddContract = ToolContract<typeof mathAddInputSchema, typeof mathAddOutputSchema>;
