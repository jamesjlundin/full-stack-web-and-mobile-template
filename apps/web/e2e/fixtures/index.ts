/**
 * E2E Test Fixtures
 *
 * Central export point for all test fixtures and helpers.
 *
 * Usage:
 *   import { test, expect, AuthHelper, generateTestUser } from './fixtures';
 */

export { test, expect, AuthHelper, generateTestUser } from './auth.fixture';
export type { AuthCredentials } from './auth.fixture';

/** Path to the shared auth state file created by auth.setup.ts */
export const AUTH_FILE = 'e2e/.auth/user.json';
