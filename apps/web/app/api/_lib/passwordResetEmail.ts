import { Resend } from 'resend';

export type SendPasswordResetEmailResult = {
  ok: boolean;
  error?: string;
  dryRun?: boolean;
};

/**
 * Build the password reset email HTML content.
 *
 * @param webResetUrl - The web reset URL
 * @param mobileDeepLink - Optional mobile deep link URL
 * @returns HTML email content
 */
export function buildPasswordResetEmailHtml(webResetUrl: string, mobileDeepLink?: string): string {
  const mobileSection = mobileDeepLink
    ? `
  <p style="color: #666; font-size: 14px; margin-top: 20px;">
    <strong>On mobile?</strong><br>
    <a href="${mobileDeepLink}" style="color: #0070f3;">Open in app</a>
  </p>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px;">
  <h1 style="color: #333;">Reset your password</h1>
  <p>You requested to reset your password. Click the button below to set a new password:</p>
  <p style="margin: 30px 0;">
    <a href="${webResetUrl}"
       style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
      Reset Password
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">
    Or copy and paste this link into your browser:<br>
    <a href="${webResetUrl}" style="color: #0070f3;">${webResetUrl}</a>
  </p>
  ${mobileSection}
  <p style="color: #999; font-size: 12px; margin-top: 40px;">
    If you didn't request this password reset, you can safely ignore this email.
    Your password will remain unchanged.
  </p>
</body>
</html>
  `.trim();
}

/**
 * Build password reset URLs for web and optionally mobile.
 *
 * @param token - The password reset token
 * @returns Object containing webResetUrl and optionally mobileDeepLink
 */
export function buildPasswordResetUrls(token: string): {
  webResetUrl: string;
  mobileDeepLink?: string;
} {
  const appBaseUrl = (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const webResetUrl = `${appBaseUrl}/reset-password/confirm?token=${encodeURIComponent(token)}`;

  // Mobile deep linking (optional, controlled by environment)
  const mobileDeepLinkEnabled = process.env.MOBILE_DEEP_LINK_ENABLED === '1';
  const mobileAppScheme = process.env.MOBILE_APP_SCHEME || 'app-template';

  let mobileDeepLink: string | undefined;
  if (mobileDeepLinkEnabled) {
    mobileDeepLink = `${mobileAppScheme}://reset?token=${encodeURIComponent(token)}`;
  }

  return { webResetUrl, mobileDeepLink };
}

/**
 * Send a password reset email via Resend.
 *
 * Behavior by environment:
 * - NODE_ENV !== "production": Logs a DEV-ONLY message with URLs, does NOT send email
 * - NODE_ENV === "production" && !RESEND_API_KEY: Returns error (not configured)
 * - RESEND_DRY_RUN === "1": Logs email payload instead of sending (for CI)
 * - Otherwise: Sends email via Resend
 *
 * @param to - Recipient email address
 * @param token - Password reset token
 * @returns Promise<SendPasswordResetEmailResult>
 */
export async function sendPasswordResetEmail({
  to,
  token,
}: {
  to: string;
  token: string;
}): Promise<SendPasswordResetEmailResult> {
  const { webResetUrl, mobileDeepLink } = buildPasswordResetUrls(token);

  // DEV MODE: Do not call Resend, just log
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DEV] Would send password reset email:');
    console.log(`  To: ${to}`);
    console.log(`  Token: ${token}`);
    console.log(`  Web Link: ${webResetUrl}`);
    if (mobileDeepLink) {
      console.log(`  Mobile Link: ${mobileDeepLink}`);
    }
    return { ok: true };
  }

  // PRODUCTION: Check for RESEND_API_KEY
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('[PROD] RESEND_API_KEY is not configured. Cannot send password reset email.');
    console.log('[PROD] Password reset URLs for manual testing:');
    console.log(`  Web Link: ${webResetUrl}`);
    if (mobileDeepLink) {
      console.log(`  Mobile Link: ${mobileDeepLink}`);
    }
    return {
      ok: false,
      error: 'Email service not configured. RESEND_API_KEY is required in production.',
    };
  }

  const mailFrom = process.env.MAIL_FROM || 'onboarding@resend.dev';
  const html = buildPasswordResetEmailHtml(webResetUrl, mobileDeepLink);

  const emailPayload = {
    from: mailFrom,
    to,
    subject: 'Reset your password',
    html,
  };

  // DRY RUN: Log payload instead of sending
  if (process.env.RESEND_DRY_RUN === '1') {
    console.log('[DRY_RUN] Would send password reset email via Resend:');
    console.log(JSON.stringify(emailPayload, null, 2));
    return { ok: true, dryRun: true };
  }

  // PRODUCTION: Send via Resend
  try {
    const resend = new Resend(resendApiKey);
    const result = await resend.emails.send(emailPayload);

    if (result.error) {
      console.error('[PROD] Resend error:', result.error);
      return { ok: false, error: result.error.message };
    }

    console.log('[PROD] Password reset email sent successfully:', result.data?.id);
    return { ok: true };
  } catch (error) {
    console.error('[PROD] Failed to send password reset email:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, error: message };
  }
}
