/**
 * Reporters index
 */

export * from './types.js';
export { createConsoleReporter, ConsoleReporter } from './console.js';
export { createJsonReporter, JsonReporter } from './json.js';

import { createConsoleReporter } from './console.js';
import { createJsonReporter } from './json.js';

import type { Reporter } from './types.js';

/**
 * Get a reporter by name
 */
export function getReporter(name: string): Reporter {
  switch (name.toLowerCase()) {
    case 'console':
      return createConsoleReporter();
    case 'json':
      return createJsonReporter();
    default:
      console.warn(`Unknown reporter "${name}", falling back to console`);
      return createConsoleReporter();
  }
}
