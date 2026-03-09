import { auth } from '@acme/auth';
import { createRateLimiter } from '@acme/security';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withRateLimit } from '../../../../_lib/withRateLimit';

const resetConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

/**
 * POST /api/auth/password/reset/confirm
 * Confirm password reset. Body: { token: string, newPassword: string }
 *
 * Returns { ok: true } on success, or { ok: false, error: "..." } on failure.
 */
async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = resetConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Token and a valid password (min 8 chars) are required' },
        { status: 400 },
      );
    }
    const { token, newPassword } = parsed.data;

    // Call Better Auth's reset password API
    await auth.api.resetPassword({
      body: { token, newPassword },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[password/reset/confirm] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export const POST = withRateLimit('/api/auth/password/reset/confirm', limiter, handlePost);
