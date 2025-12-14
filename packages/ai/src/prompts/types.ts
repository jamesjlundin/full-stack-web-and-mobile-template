/**
 * PromptDef defines a versioned prompt for use in AI interactions.
 *
 * Versioning convention:
 * - Each prompt is stored in its own file: {name}.v{version}.ts
 * - Bumping to a new version (e.g., v2) means creating a new file alongside v1
 * - Example: prompts/chat/default.v1.ts, prompts/chat/default.v2.ts
 * - The router (router.ts) controls which version is currently active
 */
export interface PromptDef {
  /** Unique identifier for this prompt (e.g., "chat.default") */
  id: string;
  /** Version number of this prompt definition */
  version: number;
  /** The system prompt content */
  content: string;
}
