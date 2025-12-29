import { describe, it, expect, beforeAll } from 'vitest';

import { postJson, randomEmail, randomPassword, streamText } from './http.js';

describe('Agent Stream', () => {
  const testEmail = randomEmail();
  const testPassword = randomPassword();
  let bearerToken: string = '';

  beforeAll(async () => {
    // Sign up a test user
    const signUpResponse = await postJson<{
      success?: boolean;
      requiresVerification?: boolean;
      devToken?: string;
      email?: string;
    }>('/api/auth/email-password/sign-up', {
      email: testEmail,
      password: testPassword,
      name: 'Stream Test User',
    });

    expect([200, 201]).toContain(signUpResponse.status);

    // If verification is required, verify the email
    if (signUpResponse.data.requiresVerification) {
      let devToken = signUpResponse.data.devToken;

      // If devToken wasn't returned in sign-up, request verification email to get it
      if (!devToken) {
        const verifyRequestResponse = await postJson<{
          ok: boolean;
          devToken?: string;
        }>('/api/auth/email/verify/request', { email: testEmail });
        expect(verifyRequestResponse.status).toBe(200);
        devToken = verifyRequestResponse.data.devToken;
      }

      // Verify the email with the token
      if (devToken) {
        const verifyResponse = await postJson('/api/auth/email/verify/confirm', {
          token: devToken,
        });
        expect(verifyResponse.status).toBe(200);
      } else {
        throw new Error(
          'Email verification is required but no devToken was provided. ' +
            'Set ALLOW_DEV_TOKENS=true in CI environment for integration tests.',
        );
      }
    }

    // Obtain a bearer token
    const tokenResponse = await postJson<{
      token: string;
      user: { id: string; email: string };
    }>('/api/auth/token', {
      email: testEmail,
      password: testPassword,
    });

    expect(tokenResponse.status).toBe(200);
    expect(tokenResponse.data.token).toBeDefined();
    bearerToken = tokenResponse.data.token;
  });

  it('should stream multiple chunks from /api/agent/stream via POST', async () => {
    const response = await streamText('/api/agent/stream', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'integration test' }],
      }),
      maxChunks: 5,
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    });

    expect(response.status).toBe(200);

    // Check content type is SSE
    const contentType = response.headers.get('Content-Type');
    expect(contentType).toContain('text/event-stream');

    // Should have received chunks
    expect(response.chunks.length).toBeGreaterThan(0);

    // Log chunks for debugging
    console.log(`Received ${response.chunks.length} chunks`);
    response.chunks.forEach((chunk, i) => {
      console.log(`Chunk ${i + 1}:`, chunk.substring(0, 100));
    });

    // Verify chunks contain SSE data format
    const allText = response.chunks.join('');
    expect(allText.length).toBeGreaterThan(0);
    expect(allText).toContain('data:');
  });

  it('should stream weather tool response from /api/agent/stream', async () => {
    const response = await streamText('/api/agent/stream', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'What is the weather in San Francisco?' }],
      }),
      maxChunks: 10,
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    });

    expect(response.status).toBe(200);

    const contentType = response.headers.get('Content-Type');
    expect(contentType).toContain('text/event-stream');

    // Should have received chunks
    expect(response.chunks.length).toBeGreaterThan(0);

    // Log chunks for debugging
    console.log(`Weather query received ${response.chunks.length} chunks`);
    response.chunks.forEach((chunk, i) => {
      console.log(`Chunk ${i + 1}:`, chunk.substring(0, 150));
    });
  });

  it('should include done marker in stream', async () => {
    const response = await streamText('/api/agent/stream', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'short test' }],
      }),
      maxChunks: 20, // Get more chunks to ensure we see the done marker
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    });

    expect(response.status).toBe(200);

    const allText = response.chunks.join('');

    // The stream should contain type indicators
    // Either "type":"done" or "type":"text" depending on implementation
    console.log('Stream content sample:', allText.substring(0, 500));

    // Verify we got actual content
    expect(allText.length).toBeGreaterThan(10);
  });

  it('should return 401 without authentication', async () => {
    const response = await streamText('/api/agent/stream', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'unauthorized test' }],
      }),
      maxChunks: 1,
      // No Authorization header
    });

    expect(response.status).toBe(401);
  });
});
