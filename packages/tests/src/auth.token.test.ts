import { describe, it, expect } from "vitest";

import { postJson, getJson, randomEmail, randomPassword } from "./http.js";

describe("Auth Token Flow", () => {
  const testEmail = randomEmail();
  const testPassword = randomPassword();
  let bearerToken: string = "";

  it("should create a new user for token tests", async () => {
    // Sign up
    const signUpResponse = await postJson<{
      success?: boolean;
      requiresVerification?: boolean;
      devToken?: string;
    }>("/api/auth/email-password/sign-up", {
      email: testEmail,
      password: testPassword,
      name: "Token Test User",
    });

    expect([200, 201]).toContain(signUpResponse.status);

    // If verification is required and devToken is provided, verify the email
    if (signUpResponse.data.requiresVerification && signUpResponse.data.devToken) {
      const verifyResponse = await postJson("/api/auth/email/verify/confirm", {
        token: signUpResponse.data.devToken,
      });
      expect(verifyResponse.status).toBe(200);
    }
  });

  it("should obtain a token via /api/auth/token", async () => {
    const response = await postJson<{ token: string; user: { id: string; email: string } }>(
      "/api/auth/token",
      {
        email: testEmail,
        password: testPassword,
      }
    );

    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data.token).toBeDefined();
    expect(typeof response.data.token).toBe("string");
    expect(response.data.token.length).toBeGreaterThan(0);
    expect(response.data.user).toBeDefined();
    expect(response.data.user.email).toBe(testEmail);

    bearerToken = response.data.token;
  });

  it("should access /api/me with Bearer token", async () => {
    expect(bearerToken).toBeTruthy();

    const response = await getJson<{ user: { id: string; email: string } }>(
      "/api/me",
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data.user).toBeDefined();
    expect(response.data.user.email).toBe(testEmail);
  });

  it("should return 401 with invalid Bearer token", async () => {
    const response = await getJson("/api/me", {
      headers: {
        Authorization: "Bearer invalid-token-12345",
      },
    });

    expect(response.status).toBe(401);
    expect(response.data).toHaveProperty("error");
  });
});
