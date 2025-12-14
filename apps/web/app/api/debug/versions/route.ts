import { selectPrompt, buildVersionMeta, schemas } from "@acme/ai";
import { NextResponse } from "next/server";

/**
 * Debug endpoint to return current resolved versions for the "chat" feature.
 * Useful for validation and documentation purposes.
 *
 * GET /api/debug/versions
 *
 * Returns:
 * {
 *   prompt_id: string,
 *   prompt_version: number,
 *   schema_id: string,
 *   schema_version: number,
 *   rag_config_version: null,
 *   embed_model: string | undefined
 * }
 */
export async function GET() {
  const activePrompt = selectPrompt("chat");

  const versionMeta = buildVersionMeta({
    prompt_id: activePrompt.id,
    prompt_version: activePrompt.version,
    schema_id: schemas.chatResponse.id,
    schema_version: schemas.chatResponse.version,
    rag_config_version: null, // Will be set when RAG is implemented (Step 26)
    embed_model: process.env.AI_MODEL || undefined,
  });

  return NextResponse.json(versionMeta);
}
