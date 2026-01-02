import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * This config is designed for template users to extend. It provides:
 * - Sensible defaults for local development and CI
 * - Automatic web server startup in development
 * - Multiple browser support (chromium by default, extend as needed)
 * - Global setup for authenticated test user creation
 *
 * Run tests:
 *   pnpm test:e2e           # Run all E2E tests
 *   pnpm test:e2e:ui        # Open Playwright UI mode
 *   pnpm test:e2e:headed    # Run with visible browser
 */

// Auth state file path - shared between global setup and tests
export const AUTH_FILE = 'e2e/.auth/user.json';

export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Global setup for authenticated user creation
  globalSetup: require.resolve('./e2e/global-setup'),

  // Run tests in parallel within files
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers on CI to avoid flakiness
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: process.env.CI ? 'github' : 'html',

  // Shared settings for all projects
  use: {
    // Base URL for navigation actions
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',
  },

  // Browser configurations
  projects: [
    // Unauthenticated tests - no storage state
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*(?<!\.auth)\.spec\.ts/,
    },

    // Authenticated tests - use saved auth state
    {
      name: 'chromium-authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      testMatch: /.*\.auth\.spec\.ts/,
    },

    // Uncomment to add more browsers:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Mobile viewports (uncomment to enable):
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Web server configuration for local development
  // In CI, the server is started separately before tests run
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },

  // Test timeout
  timeout: 30_000,

  // Expect timeout for assertions
  expect: {
    timeout: 10_000,
  },
});
