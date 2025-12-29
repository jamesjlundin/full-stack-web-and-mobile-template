/**
 * RAG Query API Endpoint
 *
 * POST /api/rag/query
 * Queries the RAG vector store for relevant document chunks.
 *
 * Request body: { query: string, k?: number }
 * Response: { chunks: [...], took_ms: number }
 *
 * Returns 400 if OPENAI_API_KEY is not set.
 */

import { db } from '@acme/db';
import { withTrace } from '@acme/obs';
import { ragQuery, hasOpenAIKey, MissingApiKeyError } from '@acme/rag';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Handle POST requests to query the RAG system
 */
export async function POST(request: NextRequest) {
  // Check for API key early and return helpful error
  if (!hasOpenAIKey()) {
    return NextResponse.json(
      {
        error: 'embedding_api_key_missing',
        message:
          'OPENAI_API_KEY environment variable is not set. ' +
          'The RAG query endpoint requires an OpenAI API key for generating embeddings. ' +
          'Please set the OPENAI_API_KEY environment variable.',
      },
      { status: 400 },
    );
  }

  const startTime = Date.now();

  const { result, error } = await withTrace('rag.query', async () => {
    // Parse request body
    const body = await request.json().catch(() => null);

    if (!body || typeof body.query !== 'string' || body.query.trim() === '') {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: "Request body must include a non-empty 'query' string",
        },
        { status: 400 },
      );
    }

    const query = body.query.trim();
    const k = typeof body.k === 'number' && body.k > 0 ? body.k : 3;

    try {
      // Execute RAG query
      const queryResult = await ragQuery(db, { query, k });

      const tookMs = Date.now() - startTime;

      // Map to response format (text instead of content for API consistency)
      return NextResponse.json({
        chunks: queryResult.chunks.map((chunk) => ({
          id: chunk.id,
          doc_id: chunk.docId,
          text: chunk.text,
          score: chunk.score,
          metadata: chunk.metadata,
        })),
        took_ms: tookMs,
      });
    } catch (err) {
      if (err instanceof MissingApiKeyError) {
        return NextResponse.json(
          {
            error: 'embedding_api_key_missing',
            message: err.message,
          },
          { status: 400 },
        );
      }

      // Log unexpected errors but don't expose details
      console.error('RAG query error:', err);

      return NextResponse.json(
        {
          error: 'query_failed',
          message: 'An error occurred while processing the query',
        },
        { status: 500 },
      );
    }
  });

  if (error) {
    console.error('RAG query trace error:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'An internal error occurred',
      },
      { status: 500 },
    );
  }

  return result!;
}
