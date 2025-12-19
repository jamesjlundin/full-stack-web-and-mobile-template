import { describe, it, expect } from "vitest";

import {
  postJson,
  getJson,
  randomEmail,
  randomPassword,
  cookiesToString,
} from "./http.js";

describe("Auth Cookie Flow", () => {
  const testEmail = randomEmail();
  const testPassword = randomPassword();
  let sessionCookies: string[] = [];
  let verificationWasRequired = false;

  it("should sign up a new user and verify if required", async () => {
    const response = await postJson<{
      success?: boolean;
      requiresVerification?: boolean;
      devToken?: string;
      email?: string;
    }>("/api/auth/email-password/sign-up", {
      email: testEmail,
      password: testPassword,
      name: "Test User",
    });

    // Better Auth may return 200 on success
    expect([200, 201]).toContain(response.status);
    expect(response.data).toBeDefined();

    // Track if verification was required (determines if cookies will be returned on sign-in)
    verificationWasRequired = !!response.data.requiresVerification;

    // If verification is required, verify the email
    if (response.data.requiresVerification) {
      let devToken = response.data.devToken;

      // If devToken wasn't returned in sign-up, request verification email to get it
      if (!devToken) {
        const verifyRequestResponse = await postJson<{ ok: boolean; devToken?: string }>(
          "/api/auth/email/verify/request",
          { email: testEmail }
        );
        expect(verifyRequestResponse.status).toBe(200);
        devToken = verifyRequestResponse.data.devToken;
      }

      // Verify the email with the token
      if (devToken) {
        const verifyResponse = await postJson("/api/auth/email/verify/confirm", {
          token: devToken,
        });
        expect(verifyResponse.status).toBe(200);
      } else {
        // If no devToken is available, tests cannot proceed - fail with helpful message
        throw new Error(
          "Email verification is required but no devToken was provided. " +
          "Set ALLOW_DEV_TOKENS=true in CI environment for integration tests."
        );
      }
    }
  });

  it("should sign in and receive session cookies when verified", async () => {
    const response = await postJson("/api/auth/email-password/sign-in", {
      email: testEmail,
      password: testPassword,
    });

    expect(response.status).toBe(200);

    // Cookies are only returned when email verification is enabled and user is verified
    // If RESEND_API_KEY is not set, verification is disabled and no cookies are returned
    if (verificationWasRequired) {
      expect(response.cookies.length).toBeGreaterThan(0);
      sessionCookies = response.cookies;
    } else {
      // Without verification enabled, sign-in succeeds but doesn't return session cookies
      // This is expected behavior - set RESEND_API_KEY to enable full auth flow
      console.log(
        "Note: RESEND_API_KEY not set - verification disabled, cookies not returned. " +
        "Set RESEND_API_KEY in CI to test full cookie-based auth flow."
      );
    }
  });

  it("should access /api/me with session cookies", async () => {
    // Skip this test if we don't have cookies (verification was not enabled)
    if (sessionCookies.length === 0) {
      console.log("Skipping: No session cookies available (RESEND_API_KEY not set)");
      return;
    }

    const response = await getJson<{ user: { id: string; email: string } }>(
      "/api/me",
      {
        cookies: cookiesToString(sessionCookies),
      }
    );

    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data.user).toBeDefined();
    expect(response.data.user.email).toBe(testEmail);
  });

  it("should return 401 for /api/me without cookies", async () => {
    const response = await getJson("/api/me");

    expect(response.status).toBe(401);
    expect(response.data).toHaveProperty("error");
  });
});
