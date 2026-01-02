import * as fs from 'fs';
import * as path from 'path';

import { chromium, type FullConfig } from '@playwright/test';

import { AUTH_FILE } from '../playwright.config';

/**
 * Global setup for Playwright E2E tests.
 *
 * This function runs once before all tests to create an authenticated test user
 * and save the browser storage state (cookies, localStorage) to a file.
 *
 * Authenticated tests can then use this storage state to skip login flows.
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';

  // Ensure the auth directory exists
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Generate unique test user credentials for this test run
  const timestamp = Date.now();
  const testEmail = `e2e-test-${timestamp}@example.com`;
  const testPassword = `TestPassword123!${timestamp}`;
  const testName = 'E2E Test User';

  console.log(`[global-setup] Creating test user: ${!!testEmail} (email present)`);

  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to registration page
    await page.goto(`${baseURL}/register`);

    // Fill registration form
    await page.getByLabel(/name/i).fill(testName);
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);

    // Submit registration
    await page.getByRole('button', { name: /create account/i }).click();

    // Wait for successful registration - should redirect to /app/home or show success
    // The app may redirect to login page after registration or directly to app
    await page.waitForURL(
      (url) => {
        const pathname = url.pathname;
        return pathname.includes('/app') || pathname.includes('/login');
      },
      { timeout: 15000 },
    );

    // If redirected to login, log in with the new credentials
    if (page.url().includes('/login')) {
      await page.getByLabel(/email/i).fill(testEmail);
      await page.getByLabel(/password/i).fill(testPassword);
      await page.getByRole('button', { name: /sign in/i }).click();

      // Wait for redirect to app
      await page.waitForURL((url) => url.pathname.includes('/app'), { timeout: 15000 });
    }

    // Verify we're authenticated by checking we're on an app page
    await page.waitForURL((url) => url.pathname.includes('/app'), { timeout: 15000 });

    console.log('[global-setup] Successfully authenticated test user');

    // Save the storage state (cookies, localStorage)
    await context.storageState({ path: AUTH_FILE });

    console.log(`[global-setup] Saved auth state to ${AUTH_FILE}`);
  } catch (error) {
    console.error('[global-setup] Failed to create authenticated user:', error);
    // Take a screenshot for debugging
    await page.screenshot({ path: 'e2e/global-setup-error.png' });
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
