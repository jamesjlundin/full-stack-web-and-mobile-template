import { agentDefaultV1 } from "./prompts/agent/default.v1";
import { chatDefaultV1 } from "./prompts/chat/default.v1";

import type { PromptDef } from "./prompts/types";

/**
 * Prompt Router - Single point of control for active prompt versions.
 *
 * To switch a feature to a new prompt version:
 * 1. Create the new version file (e.g., default.v2.ts)
 * 2. Import it here
 * 3. Update the PROMPT_MAPPING to point to the new version
 *
 * Example: To upgrade chat to v2:
 *   import { chatDefaultV2 } from "./prompts/chat/default.v2.js";
 *   Then change: "chat": { default: chatDefaultV1 }
 *   To:          "chat": { default: chatDefaultV2 }
 */

type ChannelMapping = Record<string, PromptDef>;
type FeatureMapping = Record<string, ChannelMapping>;

/**
 * Central mapping of feature -> channel -> prompt.
 * Change this mapping to switch prompt versions in one place.
 */
const PROMPT_MAPPING: FeatureMapping = {
  chat: {
    default: chatDefaultV1,
    // Future channels could be added here:
    // mobile: chatMobileV1,
    // api: chatApiV1,
  },
  agent: {
    default: agentDefaultV1,
  },
  // Future features:
  // summary: { default: summaryDefaultV1 },
  // rag: { default: ragDefaultV1 },
};

const DEFAULT_CHANNEL = "default";

/**
 * Selects the active prompt for a given feature and optional channel.
 *
 * @param feature - The feature name (e.g., "chat", "summary")
 * @param channel - Optional channel override (e.g., "mobile", "api")
 * @returns The active PromptDef for this feature/channel combination
 * @throws Error if the feature or channel is not found
 *
 * @example
 * const prompt = selectPrompt("chat");
 * // Returns chatDefaultV1
 *
 * @example
 * const prompt = selectPrompt("chat", "mobile");
 * // Returns chat mobile prompt if configured, otherwise throws
 */
export function selectPrompt(feature: string, channel?: string): PromptDef {
  const featureMapping = PROMPT_MAPPING[feature];

  if (!featureMapping) {
    throw new Error(
      `Unknown feature: "${feature}". Available: ${Object.keys(PROMPT_MAPPING).join(", ")}`,
    );
  }

  const targetChannel = channel ?? DEFAULT_CHANNEL;
  const prompt = featureMapping[targetChannel];

  if (!prompt) {
    throw new Error(
      `Unknown channel "${targetChannel}" for feature "${feature}". Available: ${Object.keys(featureMapping).join(", ")}`,
    );
  }

  return prompt;
}

/**
 * Lists all available features in the prompt registry.
 */
export function listFeatures(): string[] {
  return Object.keys(PROMPT_MAPPING);
}

/**
 * Lists all available channels for a given feature.
 */
export function listChannels(feature: string): string[] {
  const featureMapping = PROMPT_MAPPING[feature];
  if (!featureMapping) {
    return [];
  }
  return Object.keys(featureMapping);
}
