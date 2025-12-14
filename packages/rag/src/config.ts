/**
 * RAG Configuration Constants
 *
 * These settings define the embedding model and dimensions used throughout the RAG system.
 * If you change the model, ensure EMBED_DIMS matches the model's output dimensions.
 */

/**
 * Embedding model identifier (OpenAI format: provider:model)
 * text-embedding-3-small is cost-effective and suitable for most RAG applications
 */
export const EMBED_MODEL = "openai:text-embedding-3-small";

/**
 * Embedding vector dimensions
 * text-embedding-3-small outputs 1536-dimensional vectors by default
 * If you change models, update this value and run a migration
 */
export const EMBED_DIMS = 1536;

/**
 * RAG configuration version for tracking compatibility
 * Increment when making breaking changes to chunk/embed/index strategy
 */
export const RAG_CONFIG_VERSION = "v1";

/**
 * Default chunk size in characters for fixed-size chunking
 */
export const DEFAULT_CHUNK_SIZE = 800;

/**
 * Default overlap between chunks in characters
 */
export const DEFAULT_CHUNK_OVERLAP = 200;
