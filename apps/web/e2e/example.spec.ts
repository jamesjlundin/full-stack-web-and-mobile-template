import { test, expect } from '@playwright/test';

/**
 * Example E2E Tests
 *
 * These tests demonstrate common Playwright patterns for this Next.js app.
 * Use these as templates for your own tests.
 */

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    // The page should load without errors
    await expect(page).toHaveTitle(/.*/);
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');

    // Check for login link in the navigation
    const loginLink = page.getByRole('navigation').getByRole('link', { name: /sign in/i });
    await expect(loginLink).toBeVisible();
  });
});

test.describe('Public Pages', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');

    // Check for login form elements
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/register');

    // Check for registration form elements
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login');

    // Click the register link in the main content
    await page
      .getByRole('main')
      .getByRole('link', { name: /create one/i })
      .click();

    // Should be on register page
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();

    // Click the sign in link in the main content (not navigation)
    await page
      .getByRole('main')
      .getByRole('link', { name: /sign in/i })
      .click();

    // Should be back on login page
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Health Check', () => {
  test('API health endpoint should respond', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });
});
