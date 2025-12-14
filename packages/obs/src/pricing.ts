/**
 * Static pricing tables for LLM providers/models
 * Costs are per 1M tokens in USD
 *
 * To extend: add new entries to PRICING_TABLE following the same pattern
 */

interface ModelPricing {
  input: number; // cost per 1M input tokens
  output: number; // cost per 1M output tokens
}

/**
 * Pricing table indexed by "provider:model"
 * Values are cost per 1M tokens in USD
 */
const PRICING_TABLE: Record<string, ModelPricing> = {
  // OpenAI models
  "openai:gpt-4o-mini": { input: 0.15, output: 0.6 },
  "openai:gpt-4o": { input: 2.5, output: 10.0 },
  "openai:gpt-4-turbo": { input: 10.0, output: 30.0 },
  "openai:gpt-4": { input: 30.0, output: 60.0 },
  "openai:gpt-3.5-turbo": { input: 0.5, output: 1.5 },

  // Anthropic models
  "anthropic:claude-3-5-sonnet": { input: 3.0, output: 15.0 },
  "anthropic:claude-3-opus": { input: 15.0, output: 75.0 },
  "anthropic:claude-3-haiku": { input: 0.25, output: 1.25 },

  // Embedding models (output is typically 0 as they don't generate text)
  "openai:text-embedding-3-small": { input: 0.02, output: 0 },
  "openai:text-embedding-3-large": { input: 0.13, output: 0 },
  "openai:text-embedding-ada-002": { input: 0.1, output: 0 },
};

export interface GetCostArgs {
  model: string;
  tokensIn: number;
  tokensOut: number;
  provider?: string;
}

/**
 * Calculate cost in USD for a given model and token counts
 *
 * @param args.model - Model name (e.g., "gpt-4o-mini")
 * @param args.tokensIn - Number of input tokens
 * @param args.tokensOut - Number of output tokens
 * @param args.provider - Provider name (e.g., "openai"), defaults to "openai"
 * @returns Cost in USD, or undefined if model not found in pricing table
 */
export function getCostUsd(args: GetCostArgs): number | undefined {
  const provider = args.provider ?? "openai";
  const key = `${provider}:${args.model}`;
  const pricing = PRICING_TABLE[key];

  if (!pricing) {
    return undefined;
  }

  // Convert from per-1M to actual cost
  const inputCost = (args.tokensIn / 1_000_000) * pricing.input;
  const outputCost = (args.tokensOut / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Get available models in the pricing table
 */
export function getAvailableModels(): string[] {
  return Object.keys(PRICING_TABLE);
}
