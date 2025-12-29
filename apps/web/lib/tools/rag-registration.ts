/**
 * RAG Tool Registration
 *
 * Registers the "rag.query" tool with the typed tool registry.
 * This module should be imported once at app initialization.
 */

import { db } from "@acme/db";
import { ragQuery, hasOpenAIKey, MissingApiKeyError } from "@acme/rag";
import {
  registerTool,
  hasTool,
  ragQueryContract,
  type RagQueryInput,
  type RagQueryOutput,
} from "@acme/tools";

/**
 * Register the rag.query tool with the tools registry.
 * This is idempotent - calling multiple times will not re-register.
 */
export function registerRagTool(): void {
  // Skip if already registered (idempotent)
  if (hasTool("rag.query")) {
    return;
  }

  registerTool(
    ragQueryContract,
    async (input: RagQueryInput): Promise<RagQueryOutput> => {
      // Check for API key
      if (!hasOpenAIKey()) {
        throw new MissingApiKeyError();
      }

      // Execute RAG query
      const result = await ragQuery(db, {
        query: input.query,
        k: input.k,
      });

      // Map to expected output format (content -> text for contract compatibility)
      return {
        chunks: result.chunks.map((chunk) => ({
          id: chunk.id,
          text: chunk.text,
          score: chunk.score,
          metadata: chunk.metadata,
        })),
      };
    },
  );
}

/**
 * Check if the RAG tool is available (registered and API key present)
 */
export function isRagToolAvailable(): boolean {
  return hasTool("rag.query") && hasOpenAIKey();
}

// Auto-register on module load
registerRagTool();
