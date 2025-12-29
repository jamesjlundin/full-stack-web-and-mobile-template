/**
 * HTTP client adapter for remote tool invocation.
 * Provides a typed wrapper for calling tools via HTTP API.
 * Server-side route integration is deferred to a future step.
 */

// =============================================================================
// Types
// =============================================================================

/**
 * HTTP call result (mirrors MCP format for consistency)
 */
export interface HttpCallResult<T = unknown> {
  ok: boolean;
  result?: T;
  error?: string;
  validation_errors?: Array<{
    path: (string | number)[];
    message: string;
  }>;
}

/**
 * HTTP client options
 */
export interface HttpClientOptions {
  /** Custom headers to include with requests */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Optional trace ID for correlation */
  traceId?: string;
}

/**
 * HTTP tool client interface
 */
export interface HttpToolClient {
  /**
   * Call a tool via HTTP POST
   *
   * @param name - Tool name to invoke
   * @param input - Input data for the tool
   * @returns Promise resolving to result or error
   */
  callTool<T = unknown>(name: string, input: unknown): Promise<HttpCallResult<T>>;

  /**
   * List available tools from the server
   *
   * @returns Promise resolving to array of tool metadata
   */
  listTools(): Promise<
    Array<{
      name: string;
      description?: string;
      input_schema: Record<string, unknown>;
    }>
  >;
}

// =============================================================================
// Client Implementation
// =============================================================================

/**
 * Build an HTTP client for remote tool invocation.
 * POSTs to ${baseUrl}/api/tools/${name} to invoke tools.
 *
 * @param baseUrl - Base URL of the tool server (e.g., "http://localhost:3000")
 * @param options - Optional client configuration
 * @returns HTTP tool client
 *
 * @example
 * ```typescript
 * import { buildHttpClient } from '@acme/tools/adapters/http';
 *
 * const client = buildHttpClient('http://localhost:3000');
 *
 * // Call a tool
 * const result = await client.callTool('echo', { text: 'hello' });
 * if (result.ok) {
 *   console.log(result.result);
 * }
 *
 * // List available tools
 * const tools = await client.listTools();
 * ```
 */
export function buildHttpClient(baseUrl: string, options: HttpClientOptions = {}): HttpToolClient {
  const { headers = {}, timeout = 30000, traceId } = options;

  // Normalize base URL (remove trailing slash)
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  // Build common headers
  const commonHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (traceId) {
    commonHeaders['X-Trace-ID'] = traceId;
  }

  return {
    async callTool<T = unknown>(name: string, input: unknown): Promise<HttpCallResult<T>> {
      const url = `${normalizedBaseUrl}/api/tools/${encodeURIComponent(name)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify({ input }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = (await response.json()) as HttpCallResult<T>;

        // Handle HTTP errors
        if (!response.ok && !data.error) {
          return {
            ok: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        return data;
      } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            return {
              ok: false,
              error: `Request timeout after ${timeout}ms`,
            };
          }

          return {
            ok: false,
            error: err.message,
          };
        }

        return {
          ok: false,
          error: String(err),
        };
      }
    },

    async listTools(): Promise<
      Array<{
        name: string;
        description?: string;
        input_schema: Record<string, unknown>;
      }>
    > {
      const url = `${normalizedBaseUrl}/api/tools`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: commonHeaders,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = (await response.json()) as {
          tools: Array<{
            name: string;
            description?: string;
            input_schema: Record<string, unknown>;
          }>;
        };

        return data.tools || [];
      } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout}ms`);
          }
          throw err;
        }

        throw new Error(String(err));
      }
    },
  };
}
