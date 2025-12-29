/**
 * Echo tool - Returns input text as-is or transformed.
 * Deterministic mock tool for testing purposes.
 */

import { defineContract } from "@acme/tools";
import { z } from "zod";

import type { ToolContract, ToolImpl } from "@acme/tools";

// =============================================================================
// Contract
// =============================================================================

/** Transform modes for echo tool */
export type EchoTransform = "none" | "uppercase" | "lowercase" | "reverse";

/** Echo input schema */
export const echoInputSchema = z.object({
  /** Text to echo back */
  text: z.string(),
  /** Optional transform to apply (default: "none") */
  transform: z
    .enum(["none", "uppercase", "lowercase", "reverse"])
    .optional()
    .default("none"),
});

/** Echo output schema */
export const echoOutputSchema = z.object({
  /** Echoed (and optionally transformed) text */
  text: z.string(),
});

/** Echo tool contract */
export const echoContract = defineContract({
  name: "echo",
  description: "Echo input text back, optionally transforming it",
  input: echoInputSchema,
  output: echoOutputSchema,
});

// =============================================================================
// Implementation
// =============================================================================

/** Input type for echo tool */
export type EchoInput = z.infer<typeof echoInputSchema>;

/** Output type for echo tool */
export type EchoOutput = z.infer<typeof echoOutputSchema>;

/**
 * Echo tool implementation.
 * Returns the input text, optionally transformed.
 *
 * @param input - Echo input with text and optional transform
 * @returns Echo output with (transformed) text
 */
export const echoImpl: ToolImpl<typeof echoContract> = (
  input: EchoInput,
): EchoOutput => {
  const { text, transform = "none" } = input;

  let result: string;

  switch (transform) {
    case "uppercase":
      result = text.toUpperCase();
      break;
    case "lowercase":
      result = text.toLowerCase();
      break;
    case "reverse":
      result = text.split("").reverse().join("");
      break;
    case "none":
    default:
      result = text;
      break;
  }

  return { text: result };
};

// Export contract type for external use
export type EchoContract = ToolContract<
  typeof echoInputSchema,
  typeof echoOutputSchema
>;
