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
 * Convert JSON Schema to Zod schema dynamically
 */
async function jsonSchemaToZod(
  jsonSchema: Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const { z } = await import('zod');

  const properties = jsonSchema.properties as Record<
    string,
    { type?: string; enum?: string[]; description?: string }
  >;
  const required = (jsonSchema.required as string[]) ?? [];

  if (!properties) {
    return z.object({}).passthrough();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shape: Record<string, any> = {};

  for (const [key, prop] of Object.entries(properties)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let schema: any;

    switch (prop.type) {
      case 'string':
        if (prop.enum) {
          schema = z.enum(prop.enum as [string, ...string[]]);
        } else {
          schema = z.string();
        }
        break;
      case 'number':
      case 'integer':
        schema = z.number();
        break;
      case 'boolean':
        schema = z.boolean();
        break;
      case 'array':
        schema = z.array(z.unknown());
        break;
      case 'object':
        schema = z.object({}).passthrough();
        break;
      default:
        schema = z.unknown();
    }

    // Make optional if not in required array
    if (!required.includes(key)) {
      schema = schema.optional();
    }

    shape[key] = schema;
  }

  return z.object(shape);
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

        const result = await ai.generateText({
          model,
          messages: jsonMessages,
          temperature: options?.temperature ?? 0,
        });

        // Try to extract JSON from the response
        let jsonContent = result.text.trim();

        // Remove markdown code blocks if present
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
        const toolCalls: ToolCall[] = [];

        if (result.toolCalls && Array.isArray(result.toolCalls)) {
          for (const tc of result.toolCalls) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const toolCall = tc as any;
            toolCalls.push({
              name: toolCall.toolName,
              arguments: toolCall.args as Record<string, unknown>,
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

    for (const toolDef of tools) {
      const zodSchema = await jsonSchemaToZod(toolDef.parameters);

      result[toolDef.name] = ai.tool({
        description: toolDef.description,
        // AI SDK v5 uses inputSchema instead of parameters
        inputSchema: zodSchema,
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
