/**
 * Model adapters index
 */

export * from "./types.js";
export { createMockModel, MockModel } from "./mock.js";
export { createOpenAIModel, OpenAIModel, hasOpenAIKey } from "./openai.js";

import { createMockModel } from "./mock.js";
import { createOpenAIModel } from "./openai.js";

import type { ModelAdapter } from "./types.js";

/**
 * Get a model adapter by name
 */
export function getModel(name: string): ModelAdapter {
  switch (name.toLowerCase()) {
    case "mock":
      return createMockModel();
    case "openai":
    case "gpt-4":
    case "gpt-4o":
    case "gpt-4o-mini":
      return createOpenAIModel(name === "openai" ? "gpt-4o-mini" : name);
    default:
      console.warn(`Unknown model "${name}", falling back to mock`);
      return createMockModel();
  }
}
