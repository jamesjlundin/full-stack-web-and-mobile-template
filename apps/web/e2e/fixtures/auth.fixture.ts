import { test as base, expect, type Page } from '@playwright/test';

/**
 * Authentication fixture for E2E tests.
 *
 * Provides helpers for tests that need to create their own users
 * (as opposed to using the shared storageState from auth.setup.ts).
 *
 * Usage:
 *   import { test, expect } from './fixtures';
 *   test('my test', async ({ authHelper, testUser }) => {
 *     await authHelper.signUp(testUser);
 *     // ... test authenticated flows
 *   });
 */

export interface AuthCredentials {
  email: string;
  password: string;
  name?: string;
}

/**
 * Generate unique test user credentials.
 * Each call produces a unique email to avoid conflicts in parallel tests.
 */
export function generateTestUser(prefix = 'e2e'): AuthCredentials {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return {
    email: `${prefix}-${timestamp}-${random}@example.com`,
    password: 'TestPassword123!',
    name: `Test User ${timestamp}`,
  };
}

/**
 * Authentication helper class for E2E tests.
 * Wraps common auth UI flows using data-testid selectors.
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /** Sign up a new user via the registration form. */
  async signUp(credentials: AuthCredentials): Promise<void> {
    await this.page.goto('/register');
    await this.page.getByTestId('register-name-input').fill(credentials.name || 'Test User');
    await this.page.getByTestId('register-email-input').fill(credentials.email);
    await this.page.getByTestId('register-password-input').fill(credentials.password);
    await this.page.getByTestId('register-submit-button').click();
    await this.page.waitForURL(/\/app/, { timeout: 30000 });
  }

  /** Sign in an existing user via the login form. */
  async signIn(credentials: AuthCredentials): Promise<void> {
    await this.page.goto('/login');
    await this.page.getByTestId('login-email-input').fill(credentials.email);
    await this.page.getByTestId('login-password-input').fill(credentials.password);
    await this.page.getByTestId('login-submit-button').click();
    await this.page.waitForURL(/\/app/, { timeout: 30000 });
  }

  /** Sign out the current user. */
  async signOut(): Promise<void> {
    await this.page.getByTestId('dashboard-signout-button').click();
    await this.page.waitForURL(/\/(login|$)/, { timeout: 10000 });
  }

  /** Request a password reset email. */
  async requestPasswordReset(email: string): Promise<void> {
    await this.page.goto('/login');
    await this.page.getByTestId('login-forgot-password-link').click();
    await this.page.getByTestId('reset-password-email-input').fill(email);
    await expect(this.page.getByTestId('reset-password-heading')).toBeVisible();
  }

  /** Check if the current page indicates an authenticated session. */
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.page.waitForURL(/\/app/, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Extended test fixture with authentication helpers.
 *
 * Import this instead of @playwright/test when your test needs
 * to create its own users or perform auth flows.
 */
export const test = base.extend<{
  authHelper: AuthHelper;
  testUser: AuthCredentials;
}>({
  authHelper: async ({ page }, use) => {
    const authHelper = new AuthHelper(page);
    await use(authHelper);
  },

  // eslint-disable-next-line no-empty-pattern
  testUser: async ({}, use) => {
    const user = generateTestUser();
    await use(user);
  },
});

export { expect };
