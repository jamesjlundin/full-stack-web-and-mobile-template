/**
 * JSON reporter for evaluation results
 */

import type { Reporter, EvalResults } from "./types.js";

/**
 * JSON reporter that outputs results as JSON to stdout
 */
export class JsonReporter implements Reporter {
  name = "json";
  private pretty: boolean;

  constructor(pretty: boolean = true) {
    this.pretty = pretty;
  }

  report(results: EvalResults): void {
    const output = this.pretty
      ? JSON.stringify(results, null, 2)
      : JSON.stringify(results);

    console.log(output);
  }
}

/**
 * Create a JSON reporter instance
 */
export function createJsonReporter(pretty?: boolean): Reporter {
  return new JsonReporter(pretty);
}
