/**
 * Schema registry for JSON schemas used in AI interactions.
 *
 * Each schema is versioned via its $id field (e.g., "chat.response.v1").
 * To add a new schema version, create a new JSON file and register it here.
 */

import chatResponseSchema from './chat/response.json' with { type: 'json' };
import toolsCallSchema from './tools/call.json' with { type: 'json' };

export interface SchemaInfo {
  id: string;
  version: number;
  schema: object;
}

/**
 * Parse schema $id to extract id and version
 * Expected format: "namespace.name.vN" or "namespace.name" (defaults to v1)
 */
function parseSchemaId(rawId: string): { id: string; version: number } {
  const match = rawId.match(/^(.+)\.v(\d+)$/);
  if (match) {
    return { id: match[1], version: parseInt(match[2], 10) };
  }
  return { id: rawId, version: 1 };
}

function createSchemaInfo(schema: { $id?: string }): SchemaInfo {
  const rawId = schema.$id ?? 'unknown';
  const { id, version } = parseSchemaId(rawId);
  return { id, version, schema };
}

export const schemas = {
  chatResponse: createSchemaInfo(chatResponseSchema),
  toolsCall: createSchemaInfo(toolsCallSchema),
} as const;

export type SchemaKey = keyof typeof schemas;
