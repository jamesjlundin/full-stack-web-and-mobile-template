import { auth } from '@acme/auth';
// eslint-disable-next-line import/no-unresolved
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for Vercel Blob upload request body
const uploadBodySchema = z.object({
  type: z.enum(['blob.generate-client-token', 'blob.upload-completed']),
  payload: z.record(z.string(), z.unknown()),
});

/**
 * Upload API route for Vercel Blob
 * Handles client-side uploads with authentication
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Check authentication
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const rawBody = await request.json().catch(() => null);
  const parsed = uploadBodySchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const body = rawBody as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Validate file type and size before generating upload token
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

        // Extract content type from pathname if available
        const ext = pathname.split('.').pop()?.toLowerCase();
        const extToType: Record<string, string> = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          webp: 'image/webp',
          gif: 'image/gif',
        };

        const contentType = ext ? extToType[ext] : null;

        if (contentType && !allowedTypes.includes(contentType)) {
          throw new Error('File type not allowed. Please upload an image.');
        }

        return {
          allowedContentTypes: allowedTypes,
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB max
          tokenPayload: JSON.stringify({
            userId: session.user.id,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This callback is called after the upload is complete
        // Log as structured JSON for log aggregators
        console.log(
          JSON.stringify({
            ts: new Date().toISOString(),
            event: 'upload_completed',
            blob_url: blob.url,
            user_id: tokenPayload ? JSON.parse(tokenPayload).userId : null,
          }),
        );

        // In a production app, you might want to:
        // - Save the blob URL to your database
        // - Associate it with the user
        // - Create a record for the uploaded file
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
