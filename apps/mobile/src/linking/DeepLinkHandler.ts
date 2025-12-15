import {Linking} from 'react-native';

/**
 * Deep link configuration for password reset flow.
 *
 * The app uses URL schemes for deep linking. Configure the scheme via:
 * - iOS: Info.plist CFBundleURLSchemes (default: "app-template")
 * - Android: AndroidManifest.xml intent-filter data scheme
 *
 * Expected deep link format for password reset:
 * {MOBILE_APP_SCHEME}://reset?token={token}
 *
 * Example: app-template://reset?token=abc123
 */

export type DeepLinkHandler = {
  type: 'reset';
  token: string;
};

/**
 * Parse a deep link URL and extract relevant parameters.
 *
 * @param url - The deep link URL to parse
 * @returns Parsed deep link data or null if not recognized
 */
export function parseDeepLink(url: string): DeepLinkHandler | null {
  try {
    // Handle both URL-style and custom scheme URLs
    // Custom schemes like "app-template://reset?token=..." don't work with URL constructor
    // so we need to manually parse them

    // Extract the path and query from the URL
    const schemeEndIndex = url.indexOf('://');
    if (schemeEndIndex === -1) {
      return null;
    }

    const afterScheme = url.substring(schemeEndIndex + 3);
    const [path, queryString] = afterScheme.split('?');

    // Handle password reset deep link
    if (path === 'reset' && queryString) {
      const params = new URLSearchParams(queryString);
      const token = params.get('token');

      if (token) {
        return {
          type: 'reset',
          token,
        };
      }
    }

    return null;
  } catch {
    console.error('[DeepLinkHandler] Failed to parse deep link:', url);
    return null;
  }
}

/**
 * Set up deep link listener and handle initial URL.
 *
 * @param onDeepLink - Callback function to handle parsed deep links
 * @returns Cleanup function to remove the listener
 */
export function setupDeepLinkListener(
  onDeepLink: (link: DeepLinkHandler) => void,
): () => void {
  // Handle initial URL (app opened via deep link while not running)
  Linking.getInitialURL()
    .then(url => {
      if (url) {
        const parsed = parseDeepLink(url);
        if (parsed) {
          onDeepLink(parsed);
        }
      }
    })
    .catch(err => {
      console.error('[DeepLinkHandler] Failed to get initial URL:', err);
    });

  // Handle URLs while app is running
  const subscription = Linking.addEventListener('url', event => {
    const parsed = parseDeepLink(event.url);
    if (parsed) {
      onDeepLink(parsed);
    }
  });

  // Return cleanup function
  return () => {
    subscription.remove();
  };
}
