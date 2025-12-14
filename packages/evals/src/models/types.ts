/**
 * Model types and interfaces for evaluation
 */

/**
 * Tool call structure for function calling evaluations
 */
export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Model response structure
 */
export interface ModelResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason?: 'stop' | 'tool_calls' | 'length' | 'error';
}

/**
 * Message structure for model input
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Model interface that all model adapters must implement
 */
export interface ModelAdapter {
  name: string;
  generate(
    messages: Message[],
    options?: GenerateOptions
  ): Promise<ModelResponse>;
}

/**
 * Options for generation
 */
export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
  responseFormat?: 'text' | 'json';
}

/**
 * Tool definition for function calling
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}
