import { test, expect } from '@playwright/test';

// Force single worker to avoid rate limiting
test.describe.configure({ mode: 'serial' });

/**
 * Redirect After Login E2E Tests
 *
 * Tests the workflow where unauthenticated users trying to access protected pages
 * are redirected to login with ?next= param, and after login are redirected back
 * to their originally requested page.
 */

// Generate unique email for each test run to avoid conflicts
const generateTestEmail = () =>
  `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'Test User';

test.describe('Redirect After Login', () => {
  test('should redirect to /app/agent after login when ?next=/app/agent', async ({ page }) => {
    const testEmail = generateTestEmail();

    // Step 1: Try to access /app/agent while not logged in
    await page.goto('/app/agent');

    // Should be redirected to login with ?next=/app/agent
    await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fagent/);

    // Wait for the form to be fully hydrated (email input visible means form is ready)
    await expect(page.getByLabel(/email/i)).toBeVisible();

    // Step 2: Click "Create one" link to register - should preserve ?next=
    const registerLink = page.getByRole('link', { name: /create one/i });
    await expect(registerLink).toBeVisible();
    await registerLink.click();

    // Should be on register page with ?next= preserved
    await expect(page).toHaveURL(/\/register\?next=%2Fapp%2Fagent/);

    // Step 3: Fill in registration form
    await page.getByLabel(/name/i).fill(TEST_NAME);
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);

    // Submit registration
    await page.getByRole('button', { name: /create account/i }).click();

    // Step 4: After successful registration (without email verification),
    // should be redirected to /app/agent
    await expect(page).toHaveURL(/\/app\/agent/, { timeout: 15000 });

    // Verify we're actually on the agent page by checking for the main heading
    await expect(page.getByRole('heading', { name: 'AI Agent', exact: true })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should preserve ?next= when navigating from login to register', async ({ page }) => {
    // Go directly to login with ?next=
    await page.goto('/login?next=/app/agent');

    // Wait for the form to be fully hydrated (email input visible means form is ready)
    await expect(page.getByLabel(/email/i)).toBeVisible();

    // Wait for the register link to have the ?next= parameter (indicates hydration is complete)
    const registerLink = page.getByRole('link', { name: /create one/i });
    await expect(registerLink).toHaveAttribute('href', /register\?next=/, { timeout: 10000 });

    // Click register link
    await registerLink.click();

    // Should preserve the ?next= parameter
    await expect(page).toHaveURL(/\/register\?next=%2Fapp%2Fagent/);
  });

  test('should preserve ?next= when navigating from register to login', async ({ page }) => {
    // Go directly to register with ?next=
    await page.goto('/register?next=/app/agent');

    // Wait for the form to be fully hydrated (name input visible means form is ready)
    await expect(page.getByLabel(/name/i)).toBeVisible();

    // Click sign in link (in main content, not header)
    const signInLink = page.getByRole('main').getByRole('link', { name: /sign in/i });
    await signInLink.click();

    // Should preserve the ?next= parameter
    await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fagent/);
  });

  test('should redirect to /app/agent after login with existing user', async ({ page }) => {
    const testEmail = generateTestEmail();

    // First, create a user by registering
    await page.goto('/register');
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await page.getByLabel(/name/i).fill(TEST_NAME);
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /create account/i }).click();

    // Wait for successful registration and redirect to app
    await expect(page).toHaveURL(/\/app/, { timeout: 15000 });

    // Log out by going to logout page and clicking the sign out button
    await page.goto('/logout');
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
    await page.getByRole('button', { name: /sign out/i }).click();

    // Wait for redirect to home page after logout
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Now try to access /app/agent
    await page.goto('/app/agent');

    // Should be redirected to login with ?next=/app/agent
    await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fagent/);

    // Wait for the form to be fully hydrated
    await expect(page.getByLabel(/email/i)).toBeVisible();

    // Log in with the user we created
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should be redirected to /app/agent (not default /app/home)
    await expect(page).toHaveURL(/\/app\/agent/, { timeout: 15000 });
  });

  test('should redirect to default /app/home when no ?next= param', async ({ page }) => {
    const testEmail = generateTestEmail();

    // Register without any ?next= param
    await page.goto('/register');
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await page.getByLabel(/name/i).fill(TEST_NAME);
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /create account/i }).click();

    // Should be redirected to default /app/home
    await expect(page).toHaveURL(/\/app\/home/, { timeout: 15000 });
  });

  test('should preserve ?next= through verify email link', async ({ page }) => {
    // Go to login with ?next=
    await page.goto('/login?next=/app/agent');

    // Wait for the form to be fully hydrated
    await expect(page.getByLabel(/email/i)).toBeVisible();

    // Click verify email link
    const verifyLink = page.getByRole('link', { name: /verify email/i });
    await verifyLink.click();

    // Should preserve the ?next= parameter
    await expect(page).toHaveURL(/\/auth\/verify\?next=%2Fapp%2Fagent/);
  });
});

test.describe('Protected Routes Redirect', () => {
  test('should redirect /app/home to login with ?next=/app/home', async ({ page }) => {
    await page.goto('/app/home');
    await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fhome/);
  });

  test('should redirect /app/agent to login with ?next=/app/agent', async ({ page }) => {
    await page.goto('/app/agent');
    await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fagent/);
  });
});
