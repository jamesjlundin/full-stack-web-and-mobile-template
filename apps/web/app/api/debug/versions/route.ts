import { selectPrompt, buildVersionMeta, schemas } from '@acme/ai';
import { getCurrentUser } from '@acme/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to return current resolved versions for the "chat" feature.
 * Useful for validation and documentation purposes.
 *
 * GET /api/debug/versions
 *
 * Security:
 * - In production: Requires authentication
 * - In development: Accessible without authentication
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
export async function GET(request: NextRequest) {
  // In production, require authentication to access debug info
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const userResult = await getCurrentUser(request);

    if (!userResult?.user) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Authentication required in production',
        },
        { status: 401 },
      );
    }
  }

  const activePrompt = selectPrompt('chat');

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
