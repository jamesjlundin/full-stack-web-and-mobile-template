export type MessageRole = "user" | "assistant";

// Message parts for multimodal content
export type TextPart = {
  type: "text";
  text: string;
};

export type ImagePart = {
  type: "image";
  url: string;
  alt?: string;
};

export type MessagePart = TextPart | ImagePart;

export interface Message {
  id: string;
  role: MessageRole;
  parts: MessagePart[];
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "complete" | "error";
}

export type StreamEventType =
  | "text"
  | "image"
  | "tool_call"
  | "tool_result"
  | "done"
  | "error";

export interface StreamEvent {
  type: StreamEventType;
  text?: string;
  url?: string;
  alt?: string;
  id?: string;
  name?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

// Helper to get text content from a message
export function getMessageText(message: Message): string {
  return message.parts
    .filter((part): part is TextPart => part.type === "text")
    .map((part) => part.text)
    .join("");
}

// Helper to get images from a message
export function getMessageImages(message: Message): ImagePart[] {
  return message.parts.filter(
    (part): part is ImagePart => part.type === "image",
  );
}

// Helper to create a text-only message
export function createTextMessage(
  role: MessageRole,
  text: string,
  id?: string,
): Message {
  return {
    id: id || Math.random().toString(36).substring(2, 9),
    role,
    parts: [{ type: "text", text }],
  };
}
