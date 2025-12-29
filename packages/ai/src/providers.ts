import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';

import type { streamText } from 'ai';

/**
 * Type for models that can be used with streamText.
 * This is derived from what streamText accepts.
 */
type StreamableModel = Parameters<typeof streamText>[0]['model'];

/**
 * Supported AI provider identifiers.
 */
export type ProviderId = 'openai' | 'anthropic' | 'google';

/**
 * Model information for display purposes.
 */
export type ModelInfo = {
  id: string;
  name: string;
};

/**
 * Provider configuration including available models.
 */
export type ProviderConfig = {
  id: ProviderId;
  name: string;
  models: ModelInfo[];
  defaultModel: string;
};

/**
 * Environment variable keys for each provider.
 */
const PROVIDER_ENV_KEYS: Record<ProviderId, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_API_KEY',
};

/**
 * Provider configurations with December 2025 model lists.
 */
const PROVIDER_CONFIGS: Record<ProviderId, Omit<ProviderConfig, 'id'>> = {
  openai: {
    name: 'OpenAI',
    models: [
      { id: 'gpt-5.2', name: 'GPT-5.2' },
      { id: 'gpt-5.2-pro', name: 'GPT-5.2 Pro' },
      { id: 'gpt-5.1', name: 'GPT-5.1' },
      { id: 'gpt-4.1', name: 'GPT-4.1' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
      { id: 'o4-mini', name: 'o4 Mini' },
      { id: 'o3', name: 'o3' },
      { id: 'o3-mini', name: 'o3 Mini' },
    ],
    defaultModel: 'gpt-4.1-mini',
  },
  anthropic: {
    name: 'Anthropic',
    models: [
      { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5' },
      { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5' },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
      { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1' },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
    ],
    defaultModel: 'claude-sonnet-4-5-20250929',
  },
  google: {
    name: 'Google',
    models: [
      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
      { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
    ],
    defaultModel: 'gemini-2.5-flash',
  },
};

/**
 * Provider priority order for default selection.
 */
const PROVIDER_PRIORITY: ProviderId[] = ['openai', 'anthropic', 'google'];

/**
 * Check if a provider is available (has API key set).
 */
export function isProviderAvailable(providerId: ProviderId): boolean {
  const envKey = PROVIDER_ENV_KEYS[providerId];
  return !!process.env[envKey];
}

/**
 * Get all available providers with their configurations.
 * Only returns providers that have their API key set.
 */
export function getAvailableProviders(): ProviderConfig[] {
  return PROVIDER_PRIORITY.filter(isProviderAvailable).map((id) => ({
    id,
    ...PROVIDER_CONFIGS[id],
  }));
}

/**
 * Get the default provider (first available by priority).
 * Returns null if no providers are available.
 */
export function getDefaultProvider(): ProviderConfig | null {
  const availableId = PROVIDER_PRIORITY.find(isProviderAvailable);
  if (!availableId) {
    return null;
  }
  return {
    id: availableId,
    ...PROVIDER_CONFIGS[availableId],
  };
}

/**
 * Validate and normalize provider and model selection.
 * Returns the validated provider and model, or null if invalid.
 */
export function validateProviderModel(
  providerId?: string,
  modelId?: string,
): { provider: ProviderId; model: string } | null {
  // If no provider specified, use default
  if (!providerId) {
    const defaultProvider = getDefaultProvider();
    if (!defaultProvider) {
      return null;
    }
    return {
      provider: defaultProvider.id,
      model: modelId || defaultProvider.defaultModel,
    };
  }

  // Validate provider ID
  if (!isValidProviderId(providerId)) {
    return null;
  }

  // Check if provider is available
  if (!isProviderAvailable(providerId)) {
    return null;
  }

  const config = PROVIDER_CONFIGS[providerId];

  // Validate model (use default if not specified or invalid)
  let model = config.defaultModel;
  if (modelId) {
    const validModel = config.models.find((m) => m.id === modelId);
    if (validModel) {
      model = validModel.id;
    }
  }

  return { provider: providerId, model };
}

/**
 * Type guard to check if a string is a valid provider ID.
 */
function isValidProviderId(id: string): id is ProviderId {
  return id === 'openai' || id === 'anthropic' || id === 'google';
}

/**
 * Get a language model instance for the specified provider and model.
 * Returns null if the provider is not available.
 */
export function getModel(providerId: ProviderId, modelId?: string): StreamableModel | null {
  const envKey = PROVIDER_ENV_KEYS[providerId];
  const apiKey = process.env[envKey];

  if (!apiKey) {
    return null;
  }

  const config = PROVIDER_CONFIGS[providerId];
  const model = modelId || config.defaultModel;

  // Note: Provider SDKs return LanguageModelV1 but streamText accepts LanguageModel (V2 union).
  // The SDK handles both at runtime, so we cast through unknown for type safety.
  switch (providerId) {
    case 'openai': {
      const client = createOpenAI({ apiKey });
      return client(model) as unknown as StreamableModel;
    }
    case 'anthropic': {
      const client = createAnthropic({ apiKey });
      return client(model) as unknown as StreamableModel;
    }
    case 'google': {
      const client = createGoogleGenerativeAI({ apiKey });
      return client(model) as unknown as StreamableModel;
    }
  }
}
