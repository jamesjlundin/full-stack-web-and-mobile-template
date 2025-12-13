import { Resend } from "resend";

export type SendVerificationEmailResult = {
  ok: boolean;
  error?: string;
  dryRun?: boolean;
};

/**
 * Send a verification email via Resend.
 *
 * Behavior by environment:
 * - NODE_ENV !== "production": Logs a DEV-ONLY message, does NOT send email
 * - NODE_ENV === "production" && !RESEND_API_KEY: Returns error (not configured)
 * - RESEND_DRY_RUN === "1": Logs email payload instead of sending (for CI)
 * - Otherwise: Sends email via Resend
 *
 * @param to - Recipient email address
 * @param token - Verification token
 * @returns Promise<SendVerificationEmailResult>
 */
export async function sendVerificationEmail({
  to,
  token,
}: {
  to: string;
  token: string;
}): Promise<SendVerificationEmailResult> {
  const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const verifyUrl = `${appBaseUrl}/auth/verify?token=${encodeURIComponent(token)}`;

  // DEV MODE: Do not call Resend, just log
  if (process.env.NODE_ENV !== "production") {
    console.log("[DEV] Would send verification email:");
    console.log(`  To: ${to}`);
    console.log(`  Token: ${token}`);
    console.log(`  Link: ${verifyUrl}`);
    return { ok: true };
  }

  // PRODUCTION: Check for RESEND_API_KEY
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("[PROD] RESEND_API_KEY is not configured. Cannot send verification email.");
    return {
      ok: false,
      error: "Email service not configured. RESEND_API_KEY is required in production.",
    };
  }

  const mailFrom = process.env.MAIL_FROM || "no-reply@example.com";

  const emailPayload = {
    from: mailFrom,
    to,
    subject: "Verify your email",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px;">
  <h1 style="color: #333;">Verify your email address</h1>
  <p>Click the button below to verify your email address:</p>
  <p style="margin: 30px 0;">
    <a href="${verifyUrl}"
       style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
      Verify Email
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">
    Or copy and paste this link into your browser:<br>
    <a href="${verifyUrl}" style="color: #0070f3;">${verifyUrl}</a>
  </p>
  <p style="color: #999; font-size: 12px; margin-top: 40px;">
    If you didn't request this email, you can safely ignore it.
  </p>
</body>
</html>
    `.trim(),
  };

  // DRY RUN: Log payload instead of sending
  if (process.env.RESEND_DRY_RUN === "1") {
    console.log("[DRY_RUN] Would send verification email via Resend:");
    console.log(JSON.stringify(emailPayload, null, 2));
    return { ok: true, dryRun: true };
  }

  // PRODUCTION: Send via Resend
  try {
    const resend = new Resend(resendApiKey);
    const result = await resend.emails.send(emailPayload);

    if (result.error) {
      console.error("[PROD] Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }

    console.log("[PROD] Verification email sent successfully:", result.data?.id);
    return { ok: true };
  } catch (error) {
    console.error("[PROD] Failed to send verification email:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message };
  }
}
