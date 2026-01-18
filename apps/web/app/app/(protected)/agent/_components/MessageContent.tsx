'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';

import type { MessagePart } from '../_lib/types';

type MessageContentProps = {
  parts: MessagePart[];
  className?: string;
};

export function MessageContent({ parts, className = '' }: MessageContentProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (parts.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        {parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <p key={index} className="whitespace-pre-wrap text-sm">
                {part.text}
              </p>
            );
          }

          if (part.type === 'image') {
            return (
              <div key={index} className="relative group">
                {/* Using unoptimized for dynamic images from multiple sources (AI providers, user uploads).
                    Remote patterns are configured in next.config.mjs for Vercel Blob and OpenAI DALL-E. */}
                <Image
                  src={part.url}
                  alt={part.alt || 'Image'}
                  width={512}
                  height={256}
                  className="max-w-full max-h-64 w-auto h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setLightboxImage(part.url)}
                  unoptimized
                />
                {part.alt && (
                  <span className="text-xs text-muted-foreground mt-1 block">{part.alt}</span>
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
            <div className="relative w-full h-full min-h-[50vh]">
              {/* Keep unoptimized for lightbox to preserve original image quality */}
              <Image
                src={lightboxImage}
                alt="Full size"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
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
  const textParts = parts.filter((p) => p.type === 'text');
  const imageParts = parts.filter((p) => p.type === 'image');

  return (
    <div className="space-y-2">
      {/* Text content */}
      {textParts.map((part, index) => (
        <span key={index}>{part.type === 'text' ? part.text : null}</span>
      ))}

      {/* Image thumbnails - unoptimized for dynamic user-uploaded images */}
      {imageParts.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {imageParts.map((part, index) => (
            <Image
              key={index}
              src={part.type === 'image' ? part.url : ''}
              alt={part.type === 'image' ? part.alt || 'Attached image' : ''}
              width={128}
              height={128}
              className="max-w-32 max-h-32 w-auto h-auto rounded-md object-cover"
              unoptimized
            />
          ))}
        </div>
      )}
    </div>
  );
}
