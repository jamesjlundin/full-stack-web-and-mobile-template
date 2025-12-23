/**
 * Mock model adapter for deterministic testing
 *
 * This model provides consistent, predictable responses for evaluation testing.
 * It's designed to pass all evaluation thresholds with correct responses.
 */

import type {
  ModelAdapter,
  ModelResponse,
  Message,
  GenerateOptions,
  ToolCall,
} from './types.js';

/**
 * Mock model that returns deterministic responses based on input patterns
 */
export class MockModel implements ModelAdapter {
  name = 'mock';

  async generate(
    messages: Message[],
    options?: GenerateOptions
  ): Promise<ModelResponse> {
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage?.content ?? '';

    // Check if tools are requested
    if (options?.tools && options.tools.length > 0) {
      return this.generateToolResponse(content, options);
    }

    // Check if JSON response is requested
    if (options?.responseFormat === 'json') {
      return this.generateJsonResponse(content);
    }

    // Default text response
    return this.generateTextResponse(content);
  }

  private generateToolResponse(
    content: string,
    options: GenerateOptions
  ): ModelResponse {
    const tools = options.tools ?? [];
    const firstTool = tools[0];

    if (!firstTool) {
      return { content: 'No tools available', finishReason: 'stop' };
    }

    // Generate appropriate tool call based on content
    const toolCall = this.inferToolCall(content, firstTool);

    return {
      content: '',
      toolCalls: [toolCall],
      finishReason: 'tool_calls',
    };
  }

  private inferToolCall(
    content: string,
    tool: { name: string; parameters: Record<string, unknown> }
  ): ToolCall {
    const lowerContent = content.toLowerCase();

    // Weather tool inference
    if (tool.name === 'get_weather' || lowerContent.includes('weather')) {
      return {
        name: 'get_weather',
        arguments: { location: 'San Francisco', unit: 'celsius' },
      };
    }

    // Calculator tool inference
    if (tool.name === 'calculator' || lowerContent.includes('calculat')) {
      return {
        name: 'calculator',
        arguments: { expression: '2 + 2', precision: 2 },
      };
    }

    // Search tool inference
    if (tool.name === 'search' || lowerContent.includes('search')) {
      return {
        name: 'search',
        arguments: { query: 'test query', limit: 10 },
      };
    }

    // Default: use first tool with empty arguments
    return {
      name: tool.name,
      arguments: this.generateDefaultArguments(tool.parameters),
    };
  }

  private generateDefaultArguments(
    parameters: Record<string, unknown>
  ): Record<string, unknown> {
    const args: Record<string, unknown> = {};
    const props =
      (parameters.properties as Record<string, { type?: string }>) ?? {};

    for (const [key, schema] of Object.entries(props)) {
      switch (schema.type) {
        case 'string':
          args[key] = 'test_value';
          break;
        case 'number':
          args[key] = 42;
          break;
        case 'boolean':
          args[key] = true;
          break;
        case 'array':
          args[key] = [];
          break;
        case 'object':
          args[key] = {};
          break;
        default:
          args[key] = null;
      }
    }

    return args;
  }

  private generateJsonResponse(content: string): ModelResponse {
    const lowerContent = content.toLowerCase();

    // Extract schema patterns and generate conforming JSON
    // Note: Order matters! Check specific patterns before generic ones
    // (e.g., 'meeting' before 'item' since JSON schemas may contain 'minItems')

    if (lowerContent.includes('user') || lowerContent.includes('person')) {
      return {
        content: JSON.stringify({
          name: 'John Doe',
          email: 'john.doe@example.com',
          age: 30,
          active: true,
        }),
        finishReason: 'stop',
      };
    }

    // Check for meeting/event BEFORE product/item (schema may contain 'minItems')
    if (lowerContent.includes('event') || lowerContent.includes('meeting') || lowerContent.includes('attendees')) {
      // Handle nested address object for event schema trap
      if (lowerContent.includes('address') || lowerContent.includes('"location"')) {
        return {
          content: JSON.stringify({
            title: 'Team Meeting',
            date: '2024-01-15',
            time: '14:00',
            attendees: ['alice@example.com', 'bob@example.com'],
            location: {
              street: '123 Main St',
              city: 'San Francisco',
              zip: '94102',
            },
          }),
          finishReason: 'stop',
        };
      }
      return {
        content: JSON.stringify({
          title: 'Team Meeting',
          date: '2024-01-15',
          time: '14:00',
          attendees: ['alice@example.com', 'bob@example.com'],
        }),
        finishReason: 'stop',
      };
    }

    // Use word boundary to avoid matching 'minItems' from JSON schema
    if (lowerContent.includes('product') || /\bitem\b/.test(lowerContent)) {
      return {
        content: JSON.stringify({
          id: 'prod_123',
          name: 'Test Product',
          price: 99.99,
          inStock: true,
          category: 'electronics',
        }),
        finishReason: 'stop',
      };
    }

    if (lowerContent.includes('address')) {
      return {
        content: JSON.stringify({
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
          country: 'USA',
        }),
        finishReason: 'stop',
      };
    }

    // Default structured response
    return {
      content: JSON.stringify({
        result: 'success',
        data: { message: 'Mock response generated' },
      }),
      finishReason: 'stop',
    };
  }

  private generateTextResponse(content: string): ModelResponse {
    const lowerContent = content.toLowerCase();

    // QA-style responses
    if (lowerContent.includes('capital of france')) {
      return { content: 'The capital of France is Paris.', finishReason: 'stop' };
    }

    if (lowerContent.includes('capital of')) {
      const match = content.match(/capital of (\w+)/i);
      const country = match?.[1] ?? 'the country';
      return {
        content: `The capital of ${country} is a major city.`,
        finishReason: 'stop',
      };
    }

    // Machine learning definition - matches acceptablePatterns
    if (lowerContent.includes('machine learning') || lowerContent.includes('what is ml')) {
      return {
        content:
          'Machine learning is a subset of artificial intelligence where algorithms learn patterns from data to make predictions or decisions without being explicitly programmed.',
        finishReason: 'stop',
      };
    }

    // Summarization responses - include key points (AI, industries, automation, ethics)
    if (
      lowerContent.includes('summarize') ||
      lowerContent.includes('summary')
    ) {
      return {
        content:
          'AI is transforming industries through automation of complex tasks. These advancements raise important ethics questions about job displacement and regulation.',
        finishReason: 'stop',
      };
    }

    // Extraction responses
    if (lowerContent.includes('extract') || lowerContent.includes('find')) {
      return {
        content:
          'Extracted information: The relevant data points have been identified and compiled.',
        finishReason: 'stop',
      };
    }

    // Planning responses
    if (lowerContent.includes('plan') || lowerContent.includes('steps')) {
      return {
        content:
          '1. First, analyze the requirements\n2. Then, design the solution\n3. Implement the changes\n4. Test thoroughly\n5. Deploy and monitor',
        finishReason: 'stop',
      };
    }

    // Grounding/context-based responses
    if (lowerContent.includes('context:') || lowerContent.includes('given:')) {
      // Check for specific grounding scenarios
      if (lowerContent.includes('acme') && lowerContent.includes('founded')) {
        return {
          content:
            'Acme Corporation was founded in 1985 by Jane Doe in Seattle, Washington.',
          finishReason: 'stop',
        };
      }

      // Extract context and provide grounded response
      const contextMatch = content.match(/context:\s*(.+?)(?:\n|question:|$)/is);
      const context = contextMatch?.[1]?.trim() ?? '';

      if (context) {
        // Extract key facts from context for grounded response
        const sentences = context.split(/[.!?]+/).filter((s) => s.trim());
        if (sentences.length > 0) {
          return {
            content: `Based on the provided context: ${sentences[0].trim()}.`,
            finishReason: 'stop',
          };
        }
      }
    }

    // Default response
    return {
      content: 'This is a mock response for evaluation purposes.',
      finishReason: 'stop',
    };
  }
}

/**
 * Create a mock model instance
 */
export function createMockModel(): ModelAdapter {
  return new MockModel();
}
