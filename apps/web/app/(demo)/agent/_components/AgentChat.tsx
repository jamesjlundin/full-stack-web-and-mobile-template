"use client";

import { Bot, Send, Square, Trash2, User } from "lucide-react";
import { useRef, useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import { useAgentChat } from "../_lib/useAgentChat";

import { ToolCallDisplay } from "./ToolCallDisplay";

import type { FormEvent, KeyboardEvent } from "react";

export function AgentChat() {
  const { messages, isStreaming, error, sendMessage, stopStreaming, clearChat } = useAgentChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      sendMessage(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        sendMessage(input);
        setInput("");
      }
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-background">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">AI Agent Demo</p>
            <p className="text-sm mt-1">Try asking about the weather or time!</p>
            <div className="mt-4 space-y-1 text-xs">
              <p>&quot;What&apos;s the weather in San Francisco?&quot;</p>
              <p>&quot;What time is it in Tokyo?&quot;</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}

            <div
              className={`max-w-[80%] ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2"
                  : "space-y-1"
              }`}
            >
              {message.role === "assistant" ? (
                <Card className="bg-muted/30 border-0 shadow-none">
                  <CardContent className="p-3">
                    {/* Tool calls */}
                    {message.toolCalls?.map((toolCall) => (
                      <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
                    ))}

                    {/* Text content */}
                    {message.content && (
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    )}

                    {/* Streaming indicator */}
                    {isStreaming &&
                      message.id === messages[messages.length - 1]?.id &&
                      !message.content &&
                      !message.toolCalls?.length && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              ) : (
                <span>{message.content}</span>
              )}
            </div>

            {message.role === "user" && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 pb-2">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Input area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about weather, time, or anything else..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
            disabled={isStreaming}
          />
          <div className="flex flex-col gap-2">
            {isStreaming ? (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={stopStreaming}
                title="Stop"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                title="Send"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={clearChat}
              disabled={isStreaming || messages.length === 0}
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
