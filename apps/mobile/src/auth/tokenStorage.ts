/**
 * Secure Token Storage for React Native
 *
 * Uses react-native-keychain to store authentication tokens securely
 * in the iOS Keychain / Android Keystore.
 *
 * Provides three async functions:
 * - saveToken(token) - Store the session token securely
 * - loadToken() - Retrieve the stored token (returns null if not found)
 * - clearToken() - Remove the token from secure storage
 */

import * as Keychain from 'react-native-keychain';

// Service name used to identify our tokens in the keychain
const SERVICE_NAME = 'com.acme.mobile.auth';
const USERNAME = 'session_token';

/**
 * Save the authentication token to secure storage
 * @param token - The session/access token to store
 */
export async function saveToken(token: string): Promise<void> {
  try {
    await Keychain.setGenericPassword(USERNAME, token, {
      service: SERVICE_NAME,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    console.error('[tokenStorage] Failed to save token:', error);
    throw new Error('Failed to save authentication token');
  }
}

/**
 * Load the authentication token from secure storage
 * @returns The stored token, or null if not found
 */
export async function loadToken(): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: SERVICE_NAME,
    });

    if (credentials && credentials.password) {
      return credentials.password;
    }

    return null;
  } catch (error) {
    console.error('[tokenStorage] Failed to load token:', error);
    return null;
  }
}

/**
 * Clear the authentication token from secure storage
 */
export async function clearToken(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({
      service: SERVICE_NAME,
    });
  } catch (error) {
    console.error('[tokenStorage] Failed to clear token:', error);
    // Don't throw - clearing should be best-effort
  }
}

// Legacy exports for backwards compatibility with existing AuthContext
export const getToken = loadToken;
export const setToken = saveToken;
