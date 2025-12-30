import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 *
 * These tests cover the web authentication flows using the browser.
 * They complement the API-level integration tests in packages/tests/.
 *
 * Note: For comprehensive auth API testing, see packages/tests/src/auth.*.test.ts
 */

test.describe('Login Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form with all fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation for empty form submission', async ({ page }) => {
    // Clear any default values and submit
    await page.getByRole('button', { name: /sign in/i }).click();

    // HTML5 validation should prevent submission - email field should be focused
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeFocused();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('nonexistent@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show an error alert in the main content area
    // The exact message may vary (e.g., "Invalid email or password", "User not found")
    // so we just check that an error alert with the destructive variant appears
    const errorAlert = page.locator('[role="alert"][class*="destructive"]');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
  });

  test('should have forgot password link', async ({ page }) => {
    const forgotLink = page.getByRole('link', { name: /forgot password/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/\/reset-password/);
  });

  test('should have register link', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /create one/i });
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('Register Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form with all fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('should show validation for empty form submission', async ({ page }) => {
    await page.getByRole('button', { name: /create account/i }).click();

    // HTML5 validation should prevent submission - name field should be focused
    const nameInput = page.getByLabel(/name/i);
    await expect(nameInput).toBeFocused();
  });

  test('should have sign in link', async ({ page }) => {
    // Use the link in the main content area (not the navigation)
    const signInLink = page.getByRole('main').getByRole('link', { name: /sign in/i });
    await expect(signInLink).toBeVisible();
    await signInLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Password Reset', () => {
  test('should display password reset form', async ({ page }) => {
    await page.goto('/reset-password');

    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users from /app/home to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/app/home');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });
});
