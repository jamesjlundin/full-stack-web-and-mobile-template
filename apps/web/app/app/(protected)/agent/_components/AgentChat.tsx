"use client";

import { Bot, ImagePlus, Send, Square, Trash2, Upload, User, X } from "lucide-react";
import { useRef, useEffect, useState, useMemo } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useAgentChat } from "../_lib/useAgentChat";

import { MessageContent, UserMessageContent } from "./MessageContent";
import { ToolCallDisplay } from "./ToolCallDisplay";

import type { AiProviderInfo } from "@acme/api-client";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";

type AgentChatProps = {
  providers: AiProviderInfo[];
  defaultProvider: string | null;
  blobStorageEnabled: boolean;
};

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function AgentChat({ providers, defaultProvider, blobStorageEnabled }: AgentChatProps) {
  // Initialize selected provider/model from defaults
  const [selectedProvider, setSelectedProvider] = useState<string | null>(() => {
    if (defaultProvider && providers.some((p) => p.id === defaultProvider)) {
      return defaultProvider;
    }
    return providers[0]?.id ?? null;
  });

  const [selectedModel, setSelectedModel] = useState<string | null>(() => {
    const provider = providers.find((p) => p.id === selectedProvider);
    return provider?.defaultModel ?? null;
  });

  // Get current provider's models
  const currentProvider = useMemo(
    () => providers.find((p) => p.id === selectedProvider),
    [providers, selectedProvider]
  );

  // Update model when provider changes
  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = providers.find((p) => p.id === providerId);
    setSelectedModel(provider?.defaultModel ?? null);
  };

  const { messages, isStreaming, isUploading, error, sendMessage, stopStreaming, clearChat } = useAgentChat({
    provider: selectedProvider,
    model: selectedModel,
  });

  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        return false;
      }
      return true;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim() || selectedFiles.length > 0) && !isStreaming) {
      sendMessage({
        text: input,
        images: selectedFiles.length > 0 ? selectedFiles : undefined,
      });
      setInput("");
      setSelectedFiles([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((input.trim() || selectedFiles.length > 0) && !isStreaming) {
        sendMessage({
          text: input,
          images: selectedFiles.length > 0 ? selectedFiles : undefined,
        });
        setInput("");
        setSelectedFiles([]);
      }
    }
  };

  const insertImageCommand = () => {
    setInput((prev) => {
      if (prev.startsWith("/image ")) return prev;
      return "/image " + prev;
    });
    textareaRef.current?.focus();
  };

  const hasProviders = providers.length > 0;

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-background">
      {/* Model selector header */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
        <span className="text-sm text-muted-foreground">Model:</span>
        {hasProviders ? (
          <>
            <Select
              value={selectedProvider ?? undefined}
              onValueChange={handleProviderChange}
              disabled={isStreaming}
            >
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentProvider && (
              <Select
                value={selectedModel ?? undefined}
                onValueChange={setSelectedModel}
                disabled={isStreaming}
              >
                <SelectTrigger className="w-[200px] h-8 text-sm">
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  {currentProvider.models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground italic">
            Mock (no API keys configured)
          </span>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">AI Agent Demo</p>
            <p className="text-sm mt-1">
              {hasProviders
                ? blobStorageEnabled
                  ? "Try asking about weather, time, or generate images!"
                  : "Try asking about weather or time!"
                : "No AI providers configured. Using mock responses."}
            </p>
            <div className="mt-4 space-y-1 text-xs">
              <p>&quot;What&apos;s the weather in San Francisco?&quot;</p>
              <p>&quot;What time is it in Tokyo?&quot;</p>
              {blobStorageEnabled && <p>&quot;/image a sunset over mountains&quot;</p>}
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

                    {/* Message content (text and images) */}
                    <MessageContent parts={message.parts} />

                    {/* Streaming indicator */}
                    {isStreaming &&
                      message.id === messages[messages.length - 1]?.id &&
                      message.parts.length === 0 &&
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
                <UserMessageContent parts={message.parts} />
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

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-16 w-16 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-1 -right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload indicator */}
      {isUploading && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4 animate-pulse" />
            Uploading images...
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about weather, time, or use /image to generate..."
              className="min-h-[44px] max-h-32 resize-none flex-1"
              rows={1}
              disabled={isStreaming}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept={ACCEPTED_IMAGE_TYPES}
              multiple
              className="hidden"
            />
            {isStreaming ? (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={stopStreaming}
                title="Stop"
                className="shrink-0"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() && selectedFiles.length === 0}
                title="Send"
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-1">
            {blobStorageEnabled && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isStreaming}
                        className="shrink-0"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload image</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={insertImageCommand}
                        disabled={isStreaming}
                        className="shrink-0"
                      >
                        <ImagePlus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generate image (/image)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
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
