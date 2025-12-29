/**
 * Text chunking utilities for RAG
 *
 * Provides simple, effective chunking strategies for preparing text for embedding.
 */

import { ulid } from "ulid";

import { DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP } from "./config";

/**
 * A chunk of text with metadata
 */
export interface Chunk {
  /** Unique identifier for this chunk */
  id: string;
  /** The text content of the chunk */
  content: string;
  /** Metadata about the chunk */
  metadata: {
    /** Source document identifier */
    source?: string;
    /** Order/position of this chunk in the original document */
    order: number;
    /** Character offset in original text */
    charOffset: number;
    /** Original text length */
    originalLength: number;
  };
}

/**
 * Options for fixed-size chunking
 */
export interface FixedSizeChunkOptions {
  /** Maximum characters per chunk (default: 800) */
  size?: number;
  /** Overlap between consecutive chunks in characters (default: 200) */
  overlap?: number;
  /** Optional source identifier for metadata */
  source?: string;
}

/**
 * Split text into fixed-size chunks with overlap
 *
 * @param text - The text to chunk
 * @param options - Chunking options
 * @returns Array of chunks with IDs and metadata
 *
 * @example
 * ```ts
 * const chunks = fixedSizeChunks("Long document text...", { size: 500, overlap: 100 });
 * // Returns: [{ id: "01HX...", content: "Long doc...", metadata: {...} }, ...]
 * ```
 */
export function fixedSizeChunks(
  text: string,
  options: FixedSizeChunkOptions = {},
): Chunk[] {
  const {
    size = DEFAULT_CHUNK_SIZE,
    overlap = DEFAULT_CHUNK_OVERLAP,
    source,
  } = options;

  if (size <= 0) {
    throw new Error("Chunk size must be positive");
  }

  if (overlap < 0 || overlap >= size) {
    throw new Error("Overlap must be non-negative and less than chunk size");
  }

  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    return [];
  }

  const chunks: Chunk[] = [];
  const step = size - overlap;
  let order = 0;
  let position = 0;

  while (position < trimmedText.length) {
    const end = Math.min(position + size, trimmedText.length);
    const content = trimmedText.slice(position, end).trim();

    if (content.length > 0) {
      chunks.push({
        id: ulid(),
        content,
        metadata: {
          source,
          order,
          charOffset: position,
          originalLength: trimmedText.length,
        },
      });
      order++;
    }

    // Move to next position
    position += step;

    // If remaining text is smaller than overlap, include it in the last chunk
    if (
      position < trimmedText.length &&
      trimmedText.length - position < overlap
    ) {
      break;
    }
  }

  return chunks;
}

/**
 * Convert Markdown text to plain text for embedding
 *
 * Removes common Markdown syntax while preserving content structure.
 * This helps create more semantic embeddings by removing formatting noise.
 *
 * @param markdown - Markdown text to convert
 * @returns Plain text with Markdown formatting removed
 *
 * @example
 * ```ts
 * const text = mdToText("# Hello **World**\n\n- Item 1\n- Item 2");
 * // Returns: "Hello World\n\nItem 1\nItem 2"
 * ```
 */
export function mdToText(markdown: string): string {
  return (
    markdown
      // Remove code blocks (preserve content)
      .replace(/```[\s\S]*?```/g, (match) => {
        const content = match.replace(/```\w*\n?/g, "").replace(/```/g, "");
        return content.trim();
      })
      // Remove inline code
      .replace(/`([^`]+)`/g, "$1")
      // Remove headers (keep text)
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold/italic (keep text)
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      // Remove links (keep text)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove images (keep alt text)
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      // Remove blockquotes marker
      .replace(/^>\s+/gm, "")
      // Remove horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // Remove list markers (keep content)
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^[\s]*\d+\.\s+/gm, "")
      // Remove extra blank lines
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/**
 * Split text on paragraph boundaries for natural chunking
 *
 * @param text - Text to split
 * @returns Array of paragraphs
 */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}
