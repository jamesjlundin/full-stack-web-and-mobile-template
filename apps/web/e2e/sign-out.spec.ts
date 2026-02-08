import { expect } from '@playwright/test';

import { test } from './fixtures';

/**
 * Sign Out E2E Test
 *
 * This test creates its own isolated user to avoid revoking the shared session
 * used by other authenticated tests. This follows Playwright's recommendation:
 * tests that modify server-side state (session revocation) should use isolated auth.
 */

test.describe('Sign Out Flow', () => {
  test('should sign out when clicking sign out button', async ({ page, authHelper, testUser }) => {
    // Create an isolated user for this test
    await authHelper.signUp(testUser);

    await page.goto('/app/home');

    // Find and click the sign out button
    const signOutButton = page.getByTestId('dashboard-signout-button');
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
