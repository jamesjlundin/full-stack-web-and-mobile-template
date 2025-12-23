"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";

import type { MessagePart } from "../_lib/types";

type MessageContentProps = {
  parts: MessagePart[];
  className?: string;
};

export function MessageContent({ parts, className = "" }: MessageContentProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (parts.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        {parts.map((part, index) => {
          if (part.type === "text") {
            return (
              <p key={index} className="whitespace-pre-wrap text-sm">
                {part.text}
              </p>
            );
          }

          if (part.type === "image") {
            return (
              <div key={index} className="relative group">
                <img
                  src={part.url}
                  alt={part.alt || "Image"}
                  className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setLightboxImage(part.url)}
                />
                {part.alt && (
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {part.alt}
                  </span>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Lightbox for full-size image viewing */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          {lightboxImage && (
            <img
              src={lightboxImage}
              alt="Full size"
              className="w-full h-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

type UserMessageContentProps = {
  parts: MessagePart[];
};

export function UserMessageContent({ parts }: UserMessageContentProps) {
  const textParts = parts.filter((p) => p.type === "text");
  const imageParts = parts.filter((p) => p.type === "image");

  return (
    <div className="space-y-2">
      {/* Text content */}
      {textParts.map((part, index) => (
        <span key={index}>{part.type === "text" ? part.text : null}</span>
      ))}

      {/* Image thumbnails */}
      {imageParts.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {imageParts.map((part, index) => (
            <img
              key={index}
              src={part.type === "image" ? part.url : ""}
              alt={part.type === "image" ? part.alt || "Attached image" : ""}
              className="max-w-32 max-h-32 rounded-md object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
