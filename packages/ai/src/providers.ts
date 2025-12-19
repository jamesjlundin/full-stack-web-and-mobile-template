import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

import type { LanguageModel } from "ai";

export type ProviderId = "openai" | "anthropic" | "google";

export type ModelInfo = {
  id: string;
  name: string;
};

export type ProviderConfig = {
  id: ProviderId;
  name: string;
  models: ModelInfo[];
  defaultModel: string;
};

// Provider configurations with their available models
// Models updated December 2025 from official documentation
const providerConfigs: Record<ProviderId, ProviderConfig> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    models: [
      // GPT-5 series (latest)
      { id: "gpt-5.2", name: "GPT-5.2" },
      { id: "gpt-5.2-pro", name: "GPT-5.2 Pro" },
      { id: "gpt-5.1", name: "GPT-5.1" },
      // GPT-4.1 series
      { id: "gpt-4.1", name: "GPT-4.1" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
      { id: "gpt-4.1-nano", name: "GPT-4.1 Nano" },
      // O-series reasoning models
      { id: "o4-mini", name: "o4 Mini" },
      { id: "o3", name: "o3" },
      { id: "o3-mini", name: "o3 Mini" },
    ],
    defaultModel: "gpt-4.1-mini",
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    models: [
      // Claude 4.5 series (latest)
      { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5" },
      { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5" },
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5" },
      // Claude 4.1 series
      { id: "claude-opus-4-1-20250805", name: "Claude Opus 4.1" },
      // Claude 4 series
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
    ],
    defaultModel: "claude-sonnet-4-5-20250929",
  },
  google: {
    id: "google",
    name: "Google",
    models: [
      // Gemini 3 series (latest, preview)
      { id: "gemini-3-flash-preview", name: "Gemini 3 Flash" },
      { id: "gemini-3-pro-preview", name: "Gemini 3 Pro" },
      // Gemini 2.5 series (stable)
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" },
    ],
    defaultModel: "gemini-2.5-flash",
  },
};

// Environment variable keys for each provider
const providerEnvKeys: Record<ProviderId, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
};

/**
 * Check if a provider is available based on its API key being set
 */
export function isProviderAvailable(providerId: ProviderId): boolean {
  const envKey = providerEnvKeys[providerId];
  return !!process.env[envKey];
}

/**
 * Get list of available providers based on which API keys are set
 */
export function getAvailableProviders(): ProviderConfig[] {
  return Object.values(providerConfigs).filter((config) =>
    isProviderAvailable(config.id)
  );
}

/**
 * Get the default provider (first available, preferring openai)
 */
export function getDefaultProvider(): ProviderConfig | null {
  const available = getAvailableProviders();
  if (available.length === 0) return null;

  // Prefer OpenAI if available, otherwise return first available
  return available.find((p) => p.id === "openai") ?? available[0]!;
}

/**
 * Get a specific provider config by ID
 */
export function getProviderConfig(providerId: ProviderId): ProviderConfig | null {
  if (!isProviderAvailable(providerId)) return null;
  return providerConfigs[providerId] ?? null;
}

/**
 * Create a language model instance for the given provider and model
 */
export function getModel(providerId: ProviderId, modelId?: string): LanguageModel {
  const config = providerConfigs[providerId];
  if (!config) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  const model = modelId ?? config.defaultModel;

  switch (providerId) {
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY not set");
      const client = createOpenAI({ apiKey });
      return client(model);
    }
    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
      const client = createAnthropic({ apiKey });
      return client(model);
    }
    case "google": {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not set");
      const client = createGoogleGenerativeAI({ apiKey });
      return client(model);
    }
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
}

/**
 * Validate that a provider/model combination is valid and available
 */
export function validateProviderModel(
  providerId: string,
  modelId?: string
): { valid: true; providerId: ProviderId; modelId: string } | { valid: false; error: string } {
  // Check if provider ID is valid
  if (!Object.keys(providerConfigs).includes(providerId)) {
    return { valid: false, error: `Unknown provider: ${providerId}` };
  }

  const typedProviderId = providerId as ProviderId;

  // Check if provider is available (API key set)
  if (!isProviderAvailable(typedProviderId)) {
    return { valid: false, error: `Provider ${providerId} is not configured` };
  }

  const config = providerConfigs[typedProviderId]!;
  const resolvedModelId = modelId ?? config.defaultModel;

  // Check if model is valid for this provider
  const validModel = config.models.some((m) => m.id === resolvedModelId);
  if (!validModel) {
    return { valid: false, error: `Invalid model ${resolvedModelId} for provider ${providerId}` };
  }

  return { valid: true, providerId: typedProviderId, modelId: resolvedModelId };
}
