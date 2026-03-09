import { auth } from '@acme/auth';
import { createRateLimiter } from '@acme/security';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withRateLimit } from '../../../../_lib/withRateLimit';

const verifyConfirmSchema = z.object({ token: z.string().min(1) });

const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

/**
 * POST /api/auth/email/verify/confirm
 * Confirm email verification. Body: { token: string }
 *
 * Returns { ok: true } on success, or { ok: false, error: "..." } on failure.
 */
async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = verifyConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Token is required' }, { status: 400 });
    }
    const { token } = parsed.data;

    // Call Better Auth's verify email API
    await auth.api.verifyEmail({
      query: { token },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[email/verify/confirm] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export const POST = withRateLimit('/api/auth/email/verify/confirm', limiter, handlePost);
