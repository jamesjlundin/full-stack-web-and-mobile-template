"use client";

import { useCallback, useRef, useState } from "react";

import type { Message, StreamEvent, ToolCall } from "./types";

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function useAgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    setError(null);
    setIsStreaming(true);

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: content.trim(),
    };

    // Add placeholder assistant message
    const assistantMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      toolCalls: [],
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Build message history for API
      const allMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/agent/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages }),
        credentials: "include",
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      const toolCallsMap = new Map<string, ToolCall>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          const data = line.slice(6);
          if (!data) continue;

          try {
            const event: StreamEvent = JSON.parse(data);

            switch (event.type) {
              case "text":
                if (event.text) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === "assistant") {
                      last.content += event.text;
                    }
                    return updated;
                  });
                }
                break;

              case "tool_call":
                if (event.id && event.name) {
                  const toolCall: ToolCall = {
                    id: event.id,
                    name: event.name,
                    args: event.args || {},
                    status: "pending",
                  };
                  toolCallsMap.set(event.id, toolCall);

                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === "assistant") {
                      last.toolCalls = Array.from(toolCallsMap.values());
                    }
                    return updated;
                  });
                }
                break;

              case "tool_result":
                if (event.id) {
                  const existing = toolCallsMap.get(event.id);
                  if (existing) {
                    existing.result = event.result;
                    existing.status = "complete";
                    toolCallsMap.set(event.id, existing);

                    setMessages((prev) => {
                      const updated = [...prev];
                      const last = updated[updated.length - 1];
                      if (last && last.role === "assistant") {
                        last.toolCalls = Array.from(toolCallsMap.values());
                      }
                      return updated;
                    });
                  }
                }
                break;

              case "error":
                setError(event.error || "An error occurred");
                break;

              case "done":
                // Stream complete
                break;
            }
          } catch {
            // Invalid JSON, skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // Request was aborted, not an error
      } else {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        // Remove the empty assistant message on error
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant" && !last.content && !last.toolCalls?.length) {
            updated.pop();
          }
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages, isStreaming]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearChat,
  };
}
