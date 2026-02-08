import { test as setup } from '@playwright/test';

/**
 * Authentication setup for Playwright E2E tests.
 *
 * This runs as a "setup project" before all test projects.
 * It creates an authenticated test user and saves the browser
 * storage state (cookies, localStorage) to a file.
 *
 * Authenticated tests can then use this storage state to skip login flows:
 *   test.use({ storageState: 'e2e/.auth/user.json' });
 *
 * @see https://playwright.dev/docs/auth#basic-shared-account-in-all-tests
 */

const AUTH_FILE = 'e2e/.auth/user.json';

setup('create authenticated user', async ({ page }) => {
  // Generate unique test user credentials for this test run
  const timestamp = Date.now();
  const testEmail = `e2e-test-${timestamp}@example.com`;
  const testPassword = `TestPassword123!${timestamp}`;
  const testName = 'E2E Test User';

  // Navigate to registration page
  await page.goto('/register');

  // Fill registration form using data-testid selectors
  await page.getByTestId('register-name-input').fill(testName);
  await page.getByTestId('register-email-input').fill(testEmail);
  await page.getByTestId('register-password-input').fill(testPassword);

  // Submit registration
  await page.getByTestId('register-submit-button').click();

  // Wait for successful registration - should redirect to /app or /login
  await page.waitForURL(
    (url) => {
      const pathname = url.pathname;
      return pathname.includes('/app') || pathname.includes('/login');
    },
    { timeout: 15000 },
  );

  // If redirected to login, log in with the new credentials
  if (page.url().includes('/login')) {
    await page.getByTestId('login-email-input').fill(testEmail);
    await page.getByTestId('login-password-input').fill(testPassword);
    await page.getByTestId('login-submit-button').click();

    // Wait for redirect to app
    await page.waitForURL((url) => url.pathname.includes('/app'), { timeout: 15000 });
  }

  // Verify we're authenticated by checking we're on an app page
  await page.waitForURL((url) => url.pathname.includes('/app'), { timeout: 15000 });

  // Save the storage state (cookies, localStorage)
  await page.context().storageState({ path: AUTH_FILE });
});
