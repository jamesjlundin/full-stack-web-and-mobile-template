/**
 * Version metadata utilities for tracking prompt, schema, and RAG versions.
 *
 * This module provides:
 * - buildVersionMeta: Creates a version metadata object for logging/tracking
 * - attachVersionHeaders: Adds version headers to HTTP responses
 *
 * Version headers are additive and safe - they do not alter response bodies
 * or streaming control flow.
 */

/**
 * Version metadata that can be attached to logs and responses.
 */
export interface VersionMeta {
  prompt_id: string;
  prompt_version: number;
  schema_id: string;
  schema_version: number;
  /** RAG config version - will be set when RAG is implemented (Step 26) */
  rag_config_version: string | null;
  /** Embedding model identifier - will be set when RAG is implemented */
  embed_model?: string;
}

/**
 * Arguments for building version metadata.
 */
export interface BuildVersionMetaArgs {
  prompt_id: string;
  prompt_version: number;
  schema_id: string;
  schema_version: number;
  rag_config_version?: string | null;
  embed_model?: string;
}

/**
 * Builds version metadata for logging and response headers.
 *
 * @param args - Version information for prompt, schema, and optional RAG config
 * @returns VersionMeta object suitable for logging and header attachment
 *
 * @example
 * const meta = buildVersionMeta({
 *   prompt_id: "chat.default",
 *   prompt_version: 1,
 *   schema_id: "chat.response",
 *   schema_version: 1,
 *   rag_config_version: null,
 *   embed_model: "gpt-4o-mini"
 * });
 */
export function buildVersionMeta(args: BuildVersionMetaArgs): VersionMeta {
  return {
    prompt_id: args.prompt_id,
    prompt_version: args.prompt_version,
    schema_id: args.schema_id,
    schema_version: args.schema_version,
    rag_config_version: args.rag_config_version ?? null,
    embed_model: args.embed_model,
  };
}

/**
 * HTTP header names for version metadata.
 * These headers are additive and do not modify existing response behavior.
 */
export const VERSION_HEADERS = {
  PROMPT_ID: "X-Prompt-Id",
  PROMPT_VERSION: "X-Prompt-Version",
  SCHEMA_ID: "X-Schema-Id",
  SCHEMA_VERSION: "X-Schema-Version",
  RAG_CONFIG_VERSION: "X-Rag-Config-Version",
  EMBED_MODEL: "X-Embed-Model",
} as const;

/**
 * Attaches version metadata headers to a Response object.
 * Creates a new Response with the added headers (does not mutate the original).
 *
 * Headers added:
 * - X-Prompt-Id: The prompt identifier
 * - X-Prompt-Version: The prompt version number
 * - X-Schema-Id: The schema identifier
 * - X-Schema-Version: The schema version number
 * - X-Rag-Config-Version: RAG config version (if set)
 * - X-Embed-Model: Embedding model identifier (if set)
 *
 * @param response - The original Response object
 * @param meta - Version metadata to attach
 * @returns New Response with version headers added
 *
 * @example
 * const response = new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
 * const withVersions = attachVersionHeaders(response, versionMeta);
 */
export function attachVersionHeaders(response: Response, meta: VersionMeta): Response {
  const headers = new Headers(response.headers);

  headers.set(VERSION_HEADERS.PROMPT_ID, meta.prompt_id);
  headers.set(VERSION_HEADERS.PROMPT_VERSION, String(meta.prompt_version));
  headers.set(VERSION_HEADERS.SCHEMA_ID, meta.schema_id);
  headers.set(VERSION_HEADERS.SCHEMA_VERSION, String(meta.schema_version));

  if (meta.rag_config_version !== null) {
    headers.set(VERSION_HEADERS.RAG_CONFIG_VERSION, meta.rag_config_version);
  }

  if (meta.embed_model !== undefined) {
    headers.set(VERSION_HEADERS.EMBED_MODEL, meta.embed_model);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Extracts version headers from a Response for inspection/testing.
 *
 * @param response - Response to extract headers from
 * @returns Partial VersionMeta from the headers
 */
export function extractVersionHeaders(response: Response): Partial<VersionMeta> {
  const headers = response.headers;
  const result: Partial<VersionMeta> = {};

  const promptId = headers.get(VERSION_HEADERS.PROMPT_ID);
  if (promptId) result.prompt_id = promptId;

  const promptVersion = headers.get(VERSION_HEADERS.PROMPT_VERSION);
  if (promptVersion) result.prompt_version = parseInt(promptVersion, 10);

  const schemaId = headers.get(VERSION_HEADERS.SCHEMA_ID);
  if (schemaId) result.schema_id = schemaId;

  const schemaVersion = headers.get(VERSION_HEADERS.SCHEMA_VERSION);
  if (schemaVersion) result.schema_version = parseInt(schemaVersion, 10);

  const ragVersion = headers.get(VERSION_HEADERS.RAG_CONFIG_VERSION);
  if (ragVersion) result.rag_config_version = ragVersion;

  const embedModel = headers.get(VERSION_HEADERS.EMBED_MODEL);
  if (embedModel) result.embed_model = embedModel;

  return result;
}
