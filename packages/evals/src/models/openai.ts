/**
 * OpenAI model adapter using Vercel AI SDK
 *
 * Falls back to mock model if OPENAI_API_KEY is not available.
 */

import { createMockModel } from './mock.js';

import type {
  ModelAdapter,
  ModelResponse,
  Message,
  GenerateOptions,
  ToolCall,
} from './types.js';

/**
 * Check if OpenAI API key is available
 */
export function hasOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * OpenAI model adapter using Vercel AI SDK
 */
export class OpenAIModel implements ModelAdapter {
  name = 'openai';
  private modelId: string;

  constructor(modelId: string = 'gpt-4o-mini') {
    this.modelId = modelId;
  }

  async generate(
    messages: Message[],
    options?: GenerateOptions
  ): Promise<ModelResponse> {
    if (!hasOpenAIKey()) {
      console.warn('OPENAI_API_KEY not found, falling back to mock model');
      const mock = createMockModel();
      return mock.generate(messages, options);
    }

    try {
      // Dynamic import to avoid errors when AI SDK is not available
      const ai = await import('ai');
      const { openai } = await import('@ai-sdk/openai');

      const model = openai(this.modelId);

      // Convert messages to AI SDK format
      const aiMessages = messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }));

      // Handle JSON response format
      if (options?.responseFormat === 'json') {
        const result = await ai.generateObject({
          model,
          messages: aiMessages,
          output: 'no-schema',
          temperature: options?.temperature ?? 0,
        });

        return {
          content: JSON.stringify(result.object),
          finishReason: 'stop',
        };
      }

      // Handle tool calls
      if (options?.tools && options.tools.length > 0) {
        // For tool calls, we use a simplified approach that works with both
        // older and newer versions of the Vercel AI SDK
        const result = await ai.generateText({
          model,
          messages: aiMessages,
          temperature: options?.temperature ?? 0,
        });

        // Extract tool calls if any - using type assertion for SDK compatibility
        const toolCallsResult = (result as { toolCalls?: unknown[] }).toolCalls ?? [];
        const toolCalls: ToolCall[] = [];

        for (const tc of toolCallsResult) {
          const toolCall = tc as Record<string, unknown>;
          if (toolCall.toolName || toolCall.name) {
            toolCalls.push({
              name: (toolCall.toolName ?? toolCall.name) as string,
              arguments: (toolCall.args ?? toolCall.arguments ?? {}) as Record<string, unknown>,
            });
          }
        }

        return {
          content: result.text,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          finishReason:
            toolCalls.length > 0 ? 'tool_calls' : this.mapFinishReason(result.finishReason),
        };
      }

      // Standard text generation
      const result = await ai.generateText({
        model,
        messages: aiMessages,
        temperature: options?.temperature ?? 0,
      });

      return {
        content: result.text,
        finishReason: this.mapFinishReason(result.finishReason),
      };
    } catch (error) {
      console.error('OpenAI generation failed:', error);
      console.warn('Falling back to mock model');
      const mock = createMockModel();
      return mock.generate(messages, options);
    }
  }

  private mapFinishReason(
    reason: string | undefined
  ): ModelResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'tool-calls':
        return 'tool_calls';
      case 'length':
        return 'length';
      case 'error':
        return 'error';
      default:
        return 'stop';
    }
  }
}

/**
 * Create an OpenAI model instance
 */
export function createOpenAIModel(modelId?: string): ModelAdapter {
  return new OpenAIModel(modelId);
}
