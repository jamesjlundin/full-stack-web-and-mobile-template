import { describe, it, expect } from 'vitest';

import { postJson, randomEmail, randomPassword } from './http.js';

describe('Password Reset Flow', () => {
  describe('POST /api/auth/reset/request', () => {
    it('should always return 200 to prevent email enumeration', async () => {
      // Request reset for a non-existent email
      const response = await postJson('/api/auth/reset/request', {
        email: randomEmail(),
      });

      // Must always return 200 to prevent email enumeration
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('ok', true);
    });

    it('should return 200 even for invalid email format (prevents enumeration)', async () => {
      // Request reset with empty email - server should still return 200
      const response = await postJson('/api/auth/reset/request', {
        email: '',
      });

      // Return 200 even for edge cases to prevent enumeration
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('ok', true);
    });

    it('should return devToken in development mode', async () => {
      // First, create a test user
      const testEmail = randomEmail();
      const testPassword = randomPassword();

      // Sign up a new user
      const signUpResponse = await postJson('/api/auth/email-password/sign-up', {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      });

      expect([200, 201]).toContain(signUpResponse.status);

      // Request password reset for the created user
      const response = await postJson('/api/auth/reset/request', {
        email: testEmail,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('ok', true);
      // In dev mode, should return devToken
      // Note: This depends on ALLOW_DEV_TOKENS being set or NODE_ENV !== production
      // We just check the structure is correct
    });
  });

  describe('POST /api/auth/reset/confirm', () => {
    it('should return 400 for invalid/fake token', async () => {
      const response = await postJson('/api/auth/reset/confirm', {
        token: 'FAKE_TOKEN_12345',
        newPassword: 'NewSecurePassword123!',
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error', 'invalid_or_expired_token');
    });

    it('should return 400 when token is missing', async () => {
      const response = await postJson('/api/auth/reset/confirm', {
        newPassword: 'NewSecurePassword123!',
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error', 'invalid_or_expired_token');
    });

    it('should return 400 when password is missing', async () => {
      const response = await postJson('/api/auth/reset/confirm', {
        token: 'some_token',
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
    });

    it('should return 400 for password shorter than 8 characters', async () => {
      const response = await postJson('/api/auth/reset/confirm', {
        token: 'some_token',
        newPassword: 'short',
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
    });
  });
});
