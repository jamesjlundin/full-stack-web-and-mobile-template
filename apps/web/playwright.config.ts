import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * This config uses Playwright's recommended "setup project" pattern for auth.
 * The setup project creates an authenticated user and saves browser state.
 * Tests that need auth opt in with: test.use({ storageState: 'e2e/.auth/user.json' });
 *
 * Run tests:
 *   pnpm test:e2e           # Run all E2E tests
 *   pnpm test:e2e:ui        # Open Playwright UI mode
 *   pnpm test:e2e:headed    # Run with visible browser
 *
 * @see https://playwright.dev/docs/auth#basic-shared-account-in-all-tests
 */

export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Run tests in parallel within files
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers on CI to avoid flakiness
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  // CI: GitHub annotations for PR feedback + HTML report as artifact
  // Local: Interactive HTML report
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',

  // Shared settings for all projects
  use: {
    // Base URL for navigation actions
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on first retry (free in happy path, helps debug flaky tests)
    video: 'on-first-retry',
  },

  // Browser configurations
  projects: [
    // Setup project - creates authenticated user and saves storage state.
    // Runs before all test projects via the `dependencies` array.
    // Produces traces and appears in HTML reports (unlike legacy globalSetup).
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Main test project - runs after setup completes.
    // Tests are unauthenticated by default. Authenticated tests opt in with:
    //   test.use({ storageState: 'e2e/.auth/user.json' });
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    // Uncomment to add more browsers:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    //   dependencies: ['setup'],
    // },

    // Mobile viewports (uncomment to enable):
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    //   dependencies: ['setup'],
    // },
  ],

  // Web server configuration for local development
  // In CI, the server is started separately before tests run
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.PLAYWRIGHT_FRESH_SERVER,
        timeout: 120_000,
        env: {
          DATABASE_URL:
            process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/acme',
          BETTER_AUTH_SECRET:
            process.env.BETTER_AUTH_SECRET || 'test_secret_key_for_local_development_32',
          APP_BASE_URL: process.env.APP_BASE_URL || 'http://localhost:3000',
          DISABLE_RATE_LIMIT: 'true',
        },
      },

  // Test timeout
  timeout: 30_000,

  // Expect timeout for assertions
  expect: {
    timeout: 10_000,
  },
});
