import { test, expect } from '@playwright/test';

/**
 * Authenticated Dashboard E2E Tests
 *
 * These tests run with a pre-authenticated user session (created by global-setup.ts).
 * They verify that authenticated users can access protected routes and see the correct content.
 *
 * The `.auth.spec.ts` suffix indicates these tests use the authenticated storage state.
 */

test.describe('Authenticated Dashboard', () => {
  test('should display the dashboard when authenticated', async ({ page }) => {
    await page.goto('/app/home');

    // Should see the dashboard heading
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    // Should see the "Protected" badge
    await expect(page.getByText('Protected')).toBeVisible();

    // Should see account information card
    await expect(page.getByText('Account Information')).toBeVisible();
  });

  test('should display user information', async ({ page }) => {
    await page.goto('/app/home');

    // Should show "Signed in as" with user info
    await expect(page.getByText('Signed in as')).toBeVisible();

    // The test user should be displayed (email or name)
    // We use a flexible check since the display depends on user data
    const signedInText = page.locator('[role="alert"]').filter({ hasText: 'Signed in as' });
    await expect(signedInText).toBeVisible();
  });

  test('should have sign out button', async ({ page }) => {
    await page.goto('/app/home');

    // Should have a sign out button
    const signOutButton = page.getByRole('button', { name: /sign out/i });
    await expect(signOutButton).toBeVisible();
  });

  test('should have link to AI Agent demo', async ({ page }) => {
    await page.goto('/app/home');

    // Should have a link to the AI Agent page
    const agentLink = page.getByRole('link', { name: /ai agent demo/i });
    await expect(agentLink).toBeVisible();

    // Click and verify navigation
    await agentLink.click();
    await expect(page).toHaveURL(/\/app\/agent/);
  });

  test('should not redirect to login when authenticated', async ({ page }) => {
    // Navigate to protected route
    await page.goto('/app/home');

    // Should stay on the protected page (not redirected to login)
    await page.waitForURL((url) => url.pathname.includes('/app/home'), { timeout: 5000 });
    await expect(page).toHaveURL(/\/app\/home/);
  });

  test('should maintain session across page navigations', async ({ page }) => {
    // Start at dashboard
    await page.goto('/app/home');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    // Navigate to agent page
    await page.goto('/app/agent');
    await expect(page).toHaveURL(/\/app\/agent/);

    // Navigate back to dashboard
    await page.goto('/app/home');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    // Should still be authenticated
    await expect(page.getByText('Signed in as')).toBeVisible();
  });
});

test.describe('Sign Out Flow', () => {
  test('should sign out when clicking sign out button', async ({ page }) => {
    await page.goto('/app/home');

    // Find and click the sign out button
    const signOutButton = page.getByRole('button', { name: /sign out/i });
    await expect(signOutButton).toBeVisible();
    await signOutButton.click();

    // Should be redirected to login page or home page after sign out
    await page.waitForURL(
      (url) => {
        const pathname = url.pathname;
        return pathname === '/' || pathname.includes('/login');
      },
      { timeout: 10000 },
    );

    // Verify we're no longer on a protected route
    expect(page.url()).not.toContain('/app/home');
  });
});
