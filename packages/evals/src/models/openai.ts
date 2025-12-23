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
  ToolDefinition,
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
      const ai = await import('ai');
      const { openai } = await import('@ai-sdk/openai');

      const model = openai(this.modelId);

      // Convert messages to AI SDK format
      const aiMessages = messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }));

      // Handle JSON response format with structured output
      if (options?.responseFormat === 'json') {
        // Add JSON instruction to prompt for better structured output
        const jsonMessages = [
          ...aiMessages.slice(0, -1),
          {
            ...aiMessages[aiMessages.length - 1],
            content:
              aiMessages[aiMessages.length - 1].content +
              '\n\nRespond with valid JSON only. No markdown, no explanation.',
          },
        ];

        // Use OpenAI's native JSON mode via providerOptions
        const result = await ai.generateText({
          model,
          messages: jsonMessages,
          temperature: options?.temperature ?? 0,
          providerOptions: {
            openai: {
              response_format: { type: 'json_object' },
            },
          },
        });

        // Try to extract JSON from the response
        let jsonContent = result.text.trim();

        // Remove markdown code blocks if present (fallback safety)
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.slice(7);
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.slice(3);
        }
        if (jsonContent.endsWith('```')) {
          jsonContent = jsonContent.slice(0, -3);
        }
        jsonContent = jsonContent.trim();

        return {
          content: jsonContent,
          finishReason: 'stop',
        };
      }

      // Handle tool calls
      if (options?.tools && options.tools.length > 0) {
        const tools = await this.convertToolsToSDK(options.tools);

        const result = await ai.generateText({
          model,
          messages: aiMessages,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: tools as any,
          toolChoice: 'auto',
          temperature: options?.temperature ?? 0,
        });

        // Extract tool calls from result
        // AI SDK v5 uses result.steps for multi-step, or result.toolCalls for single step
        const toolCalls: ToolCall[] = [];

        // Try to get tool calls from steps first (AI SDK v5 pattern)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const steps = (result as any).steps;
        if (steps && Array.isArray(steps)) {
          for (const step of steps) {
            if (step.toolCalls && Array.isArray(step.toolCalls)) {
              for (const tc of step.toolCalls) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const toolCall = tc as any;
                // AI SDK v5 uses 'input' for args
                const args = toolCall.input ?? toolCall.args ?? {};
                toolCalls.push({
                  name: toolCall.toolName ?? toolCall.name,
                  arguments: args as Record<string, unknown>,
                });
              }
            }
          }
        }

        // Fallback: try result.toolCalls directly (older pattern)
        if (toolCalls.length === 0 && result.toolCalls && Array.isArray(result.toolCalls)) {
          for (const tc of result.toolCalls) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const toolCall = tc as any;
            const args = toolCall.input ?? toolCall.args ?? {};
            toolCalls.push({
              name: toolCall.toolName ?? toolCall.name,
              arguments: args as Record<string, unknown>,
            });
          }
        }

        return {
          content: result.text,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          finishReason:
            toolCalls.length > 0
              ? 'tool_calls'
              : this.mapFinishReason(result.finishReason),
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

  /**
   * Convert our tool definitions to Vercel AI SDK format
   */
  private async convertToolsToSDK(
    tools: ToolDefinition[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<Record<string, any>> {
    const ai = await import('ai');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: Record<string, any> = {};

    // Import jsonSchema helper for direct JSON Schema support (AI SDK v5)
    const { jsonSchema } = await import('ai');

    for (const toolDef of tools) {
      result[toolDef.name] = ai.tool({
        description: toolDef.description,
        inputSchema: jsonSchema(toolDef.parameters),
      });
    }

    return result;
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
