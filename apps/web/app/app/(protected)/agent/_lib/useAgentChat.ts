'use client';

// eslint-disable-next-line import/no-unresolved
import { upload } from '@vercel/blob/client';
import { useCallback, useRef, useState } from 'react';

import type { ImagePart, Message, MessagePart, StreamEvent, ToolCall } from './types';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

type UseAgentChatOptions = {
  provider?: string | null;
  model?: string | null;
};

type SendMessageOptions = {
  text: string;
  images?: File[];
};

export function useAgentChat(options: UseAgentChatOptions = {}) {
  const { provider, model } = options;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Upload images to Vercel Blob
  const uploadImages = useCallback(async (files: File[]): Promise<ImagePart[]> => {
    const uploadedImages: ImagePart[] = [];

    for (const file of files) {
      try {
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        });

        uploadedImages.push({
          type: 'image',
          url: blob.url,
          alt: file.name,
        });
      } catch (err) {
        console.error('Failed to upload image:', err);
        throw new Error(`Failed to upload ${file.name}`);
      }
    }

    return uploadedImages;
  }, []);

  // Process /image command
  const processImageCommand = useCallback((text: string): string => {
    if (text.startsWith('/image ')) {
      const prompt = text.slice(7).trim();
      return `Generate an image: ${prompt}`;
    }
    return text;
  }, []);

  const sendMessage = useCallback(
    async (options: SendMessageOptions | string) => {
      // Support both string (legacy) and options object
      const { text: rawText, images } =
        typeof options === 'string' ? { text: options, images: undefined } : options;

      const text = processImageCommand(rawText.trim());
      if (!text && (!images || images.length === 0)) return;
      if (isStreaming) return;

      setError(null);
      setIsStreaming(true);

      try {
        // Upload images if provided
        let imageParts: ImagePart[] = [];
        if (images && images.length > 0) {
          setIsUploading(true);
          try {
            imageParts = await uploadImages(images);
          } catch (uploadError) {
            setError(
              uploadError instanceof Error ? uploadError.message : 'Failed to upload images',
            );
            setIsStreaming(false);
            setIsUploading(false);
            return;
          }
          setIsUploading(false);
        }

        // Build message parts
        const parts: MessagePart[] = [];
        if (text) {
          parts.push({ type: 'text', text });
        }
        parts.push(...imageParts);

        // Add user message
        const userMessage: Message = {
          id: generateId(),
          role: 'user',
          parts,
        };

        // Add placeholder assistant message
        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          parts: [],
          toolCalls: [],
        };

        setMessages((prev) => [...prev, userMessage, assistantMessage]);

        // Create abort controller
        abortControllerRef.current = new AbortController();

        // Build message history for API
        const allMessages = [...messages, userMessage].map((m) => ({
          role: m.role,
          parts: m.parts,
        }));

        const requestBody: {
          messages: { role: string; parts: MessagePart[] }[];
          provider?: string;
          model?: string;
        } = { messages: allMessages };

        if (provider) {
          requestBody.provider = provider;
        }
        if (model) {
          requestBody.model = model;
        }

        const response = await fetch('/api/agent/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          credentials: 'include',
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        const toolCallsMap = new Map<string, ToolCall>();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            const data = line.slice(6);
            if (!data) continue;

            try {
              const event: StreamEvent = JSON.parse(data);

              switch (event.type) {
                case 'text':
                  if (event.text) {
                    const textToAdd = event.text;
                    setMessages((prev) =>
                      prev.map((msg, index) => {
                        if (index !== prev.length - 1 || msg.role !== 'assistant') {
                          return msg;
                        }
                        // Find existing text part
                        const textPartIndex = msg.parts.findIndex((p) => p.type === 'text');
                        if (textPartIndex >= 0) {
                          return {
                            ...msg,
                            parts: msg.parts.map((part, pIndex) =>
                              pIndex === textPartIndex && part.type === 'text'
                                ? { ...part, text: part.text + textToAdd }
                                : part,
                            ),
                          };
                        } else {
                          return {
                            ...msg,
                            parts: [...msg.parts, { type: 'text', text: textToAdd }],
                          };
                        }
                      }),
                    );
                  }
                  break;

                case 'image':
                  if (event.url) {
                    setMessages((prev) =>
                      prev.map((msg, index) => {
                        if (index !== prev.length - 1 || msg.role !== 'assistant') {
                          return msg;
                        }
                        return {
                          ...msg,
                          parts: [
                            ...msg.parts,
                            {
                              type: 'image' as const,
                              url: event.url!,
                              alt: event.alt,
                            },
                          ],
                        };
                      }),
                    );
                  }
                  break;

                case 'tool_call':
                  if (event.id && event.name) {
                    const toolCall: ToolCall = {
                      id: event.id,
                      name: event.name,
                      args: event.args || {},
                      status: 'pending',
                    };
                    toolCallsMap.set(event.id, toolCall);

                    setMessages((prev) =>
                      prev.map((msg, index) => {
                        if (index !== prev.length - 1 || msg.role !== 'assistant') {
                          return msg;
                        }
                        return {
                          ...msg,
                          toolCalls: Array.from(toolCallsMap.values()),
                        };
                      }),
                    );
                  }
                  break;

                case 'tool_result':
                  if (event.id) {
                    const existing = toolCallsMap.get(event.id);
                    if (existing) {
                      existing.result = event.result;
                      existing.status = 'complete';
                      toolCallsMap.set(event.id, existing);

                      setMessages((prev) =>
                        prev.map((msg, index) => {
                          if (index !== prev.length - 1 || msg.role !== 'assistant') {
                            return msg;
                          }
                          return {
                            ...msg,
                            toolCalls: Array.from(toolCallsMap.values()),
                          };
                        }),
                      );
                    }
                  }
                  break;

                case 'error':
                  setError(event.error || 'An error occurred');
                  break;

                case 'done':
                  // Stream complete
                  break;
              }
            } catch {
              // Invalid JSON, skip
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          // Request was aborted, not an error
        } else {
          const errorMessage = err instanceof Error ? err.message : 'An error occurred';
          setError(errorMessage);
          // Remove the empty assistant message on error
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant' && last.parts.length === 0 && !last.toolCalls?.length) {
              updated.pop();
            }
            return updated;
          });
        }
      } finally {
        setIsStreaming(false);
        setIsUploading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, isStreaming, provider, model, uploadImages, processImageCommand],
  );

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
    isUploading,
    error,
    sendMessage,
    stopStreaming,
    clearChat,
  };
}
