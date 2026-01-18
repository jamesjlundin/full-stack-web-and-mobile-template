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
    await expect(page.getByTestId('login-heading')).toBeVisible();
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-password-input')).toBeVisible();
    await expect(page.getByTestId('login-submit-button')).toBeVisible();
  });

  test('should show validation for empty form submission', async ({ page }) => {
    // Clear any default values and submit
    await page.getByTestId('login-submit-button').click();

    // HTML5 validation should prevent submission - email field should be focused
    const emailInput = page.getByTestId('login-email-input');
    await expect(emailInput).toBeFocused();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByTestId('login-email-input').fill('nonexistent@example.com');
    await page.getByTestId('login-password-input').fill('wrongpassword');
    await page.getByTestId('login-submit-button').click();

    // Should show an error alert in the main content area
    // The exact message may vary (e.g., "Invalid email or password", "User not found")
    // so we just check that an error alert with the destructive variant appears
    const errorAlert = page.locator('[role="alert"][class*="destructive"]');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
  });

  test('should have forgot password link', async ({ page }) => {
    const forgotLink = page.getByTestId('login-forgot-password-link');
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/\/reset-password/);
  });

  test('should have register link', async ({ page }) => {
    const registerLink = page.getByTestId('login-register-link');
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
    await expect(page.getByTestId('register-heading')).toBeVisible();
    await expect(page.getByTestId('register-name-input')).toBeVisible();
    await expect(page.getByTestId('register-email-input')).toBeVisible();
    await expect(page.getByTestId('register-password-input')).toBeVisible();
    await expect(page.getByTestId('register-submit-button')).toBeVisible();
  });

  test('should show validation for empty form submission', async ({ page }) => {
    await page.getByTestId('register-submit-button').click();

    // HTML5 validation should prevent submission - name field should be focused
    const nameInput = page.getByTestId('register-name-input');
    await expect(nameInput).toBeFocused();
  });

  test('should have sign in link', async ({ page }) => {
    const signInLink = page.getByTestId('register-signin-link');
    await expect(signInLink).toBeVisible();
    await signInLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Password Reset', () => {
  test('should display password reset form', async ({ page }) => {
    await page.goto('/reset-password');

    await expect(page.getByTestId('reset-password-heading')).toBeVisible();
    await expect(page.getByTestId('reset-password-email-input')).toBeVisible();
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
