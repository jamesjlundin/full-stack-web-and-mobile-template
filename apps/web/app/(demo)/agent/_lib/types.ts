export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "complete" | "error";
}

export type StreamEventType = "text" | "tool_call" | "tool_result" | "done" | "error";

export interface StreamEvent {
  type: StreamEventType;
  text?: string;
  id?: string;
  name?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  error?: string;
}
