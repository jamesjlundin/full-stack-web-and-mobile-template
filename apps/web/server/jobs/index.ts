/**
 * Cron job functions
 *
 * Pure, testable job logic that can be invoked from:
 * - Scheduled cron routes
 * - Manual trigger route
 * - Tests
 */

import { runHeartbeat } from './heartbeat';
import { runNightly } from './nightly';

export { runHeartbeat } from './heartbeat';
export type { HeartbeatResult } from './heartbeat';

export { runNightly } from './nightly';
export type { NightlyResult } from './nightly';

/**
 * Available job names for the manual trigger endpoint
 */
export type JobName = 'heartbeat' | 'nightly';

/**
 * Run a job by name
 *
 * @param name - Job name
 * @returns Job result
 * @throws Error if job name is unknown
 */
export async function runJob(name: JobName) {
  switch (name) {
    case 'heartbeat':
      return runHeartbeat();
    case 'nightly':
      return runNightly();
    default:
      throw new Error(`Unknown job: ${name}`);
  }
}
