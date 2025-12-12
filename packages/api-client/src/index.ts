import type { ChatChunk } from "@acme/types";

type StreamChatParams = {
  prompt: string;
  method?: "POST" | "GET";
};

function buildRequest({ prompt, method }: StreamChatParams): RequestInfo | URL {
  if (method === "GET") {
    const url = new URL("/api/chat/stream", window.location.origin);
    url.searchParams.set("prompt", prompt);
    return url;
  }

  return "/api/chat/stream";
}

function buildInit({ prompt, method }: StreamChatParams): RequestInit | undefined {
  if (method === "GET") {
    return { method };
  }

  return {
    method: method ?? "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }),
  };
}

export async function* streamChat({ prompt, method = "POST" }: StreamChatParams): AsyncGenerator<ChatChunk> {
  const target = buildRequest({ prompt, method });
  const init = buildInit({ prompt, method });

  const response = await fetch(target, init);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Response body is not readable");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();

    if (value) {
      const text = decoder.decode(value, { stream: true });

      if (text) {
        yield { content: text };
      }
    }

    if (done) {
      break;
    }
  }

  const remaining = decoder.decode();

  if (remaining) {
    yield { content: remaining };
  }

  yield { content: "", done: true };
}

export type { ChatChunk } from "@acme/types";
export type { StreamChatParams };
