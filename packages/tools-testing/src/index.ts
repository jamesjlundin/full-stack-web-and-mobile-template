/**
 * @acme/tools-testing - Test fixtures and mock tools for @acme/tools.
 *
 * Provides:
 * - Deterministic mock tools (echo, math.add)
 * - Auto-registration of test tools
 * - Type exports for test tools
 */

// Re-export everything from register (includes tools)
export {
  registerTestTools,
  echoContract,
  echoImpl,
  echoInputSchema,
  echoOutputSchema,
  mathAddContract,
  mathAddImpl,
  mathAddInputSchema,
  mathAddOutputSchema,
} from './register.js';

export type {
  EchoInput,
  EchoOutput,
  EchoTransform,
  EchoContract,
  MathAddInput,
  MathAddOutput,
  MathAddContract,
} from './register.js';
