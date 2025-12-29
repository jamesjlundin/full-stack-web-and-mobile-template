import { auth } from '@acme/auth';
import { NextResponse } from 'next/server';

/**
 * POST /api/auth/password/reset/confirm
 * Confirm password reset. Body: { token: string, newPassword: string }
 *
 * Returns { ok: true } on success, or { ok: false, error: "..." } on failure.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ ok: false, error: 'Token is required' }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ ok: false, error: 'New password is required' }, { status: 400 });
    }

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
