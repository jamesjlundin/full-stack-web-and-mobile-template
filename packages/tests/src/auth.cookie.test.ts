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

  it("should sign up a new user", async () => {
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

  it("should sign in and receive session cookies", async () => {
    const response = await postJson("/api/auth/email-password/sign-in", {
      email: testEmail,
      password: testPassword,
    });

    expect(response.status).toBe(200);
    expect(response.cookies.length).toBeGreaterThan(0);

    // Store cookies for subsequent requests
    sessionCookies = response.cookies;
  });

  it("should access /api/me with session cookies", async () => {
    expect(sessionCookies.length).toBeGreaterThan(0);

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
