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
    const loginLink = page.getByTestId('header-signin-link');
    await expect(loginLink).toBeVisible();
  });
});

test.describe('Public Pages', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');

    // Check for login form elements
    await expect(page.getByTestId('login-heading')).toBeVisible();
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-password-input')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/register');

    // Check for registration form elements
    await expect(page.getByTestId('register-heading')).toBeVisible();
    await expect(page.getByTestId('register-name-input')).toBeVisible();
    await expect(page.getByTestId('register-email-input')).toBeVisible();
    await expect(page.getByTestId('register-password-input')).toBeVisible();
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login');

    // Click the register link
    await page.getByTestId('login-register-link').click();

    // Should be on register page
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByTestId('register-heading')).toBeVisible();

    // Click the sign in link
    await page.getByTestId('register-signin-link').click();

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
