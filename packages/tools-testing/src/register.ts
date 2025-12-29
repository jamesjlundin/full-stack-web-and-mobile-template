/**
 * Tool registration for test fixtures.
 * Registers the mock tools (echo, math.add) with the @acme/tools registry.
 */

import { registerTool, hasTool } from '@acme/tools';

import { echoContract, echoImpl } from './tools/echo.js';
import { mathAddContract, mathAddImpl } from './tools/math.add.js';

/**
 * Register all test tools with the registry.
 * Safe to call multiple times - skips already registered tools.
 */
export function registerTestTools(): void {
  // Register echo tool
  if (!hasTool(echoContract.name)) {
    registerTool(echoContract, echoImpl);
  }

  // Register math.add tool
  if (!hasTool(mathAddContract.name)) {
    registerTool(mathAddContract, mathAddImpl);
  }
}

// Auto-register tools when this module is imported
registerTestTools();

// Re-export tools for convenience
export { echoContract, echoImpl, echoInputSchema, echoOutputSchema } from './tools/echo.js';
export type { EchoInput, EchoOutput, EchoTransform, EchoContract } from './tools/echo.js';

export {
  mathAddContract,
  mathAddImpl,
  mathAddInputSchema,
  mathAddOutputSchema,
} from './tools/math.add.js';
export type { MathAddInput, MathAddOutput, MathAddContract } from './tools/math.add.js';
