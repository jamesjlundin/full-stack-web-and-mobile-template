import setCookieParser from 'set-cookie-parser';

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000';

export interface RequestOptions {
  headers?: Record<string, string>;
  cookies?: string;
}

export interface JsonResponse<T = unknown> {
  status: number;
  data: T;
  headers: Headers;
  cookies: string[];
}

/**
 * Build the full URL from a path
 */
function buildUrl(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Build headers with optional cookies and custom headers
 */
function buildHeaders(opts?: RequestOptions): Headers {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');

  if (opts?.cookies) {
    headers.set('Cookie', opts.cookies);
  }

  if (opts?.headers) {
    for (const [key, value] of Object.entries(opts.headers)) {
      headers.set(key, value);
    }
  }

  return headers;
}

/**
 * Parse Set-Cookie headers and return cookie string for subsequent requests
 */
export function parseCookies(response: Response): string[] {
  const setCookieHeader = response.headers.get('set-cookie');
  if (!setCookieHeader) {
    return [];
  }

  const cookies = setCookieParser.parse(setCookieParser.splitCookiesString(setCookieHeader));
  return cookies.map((c) => `${c.name}=${c.value}`);
}

/**
 * Convert cookie array to cookie header string
 */
export function cookiesToString(cookies: string[]): string {
  return cookies.join('; ');
}

/**
 * POST JSON to a URL
 */
export async function postJson<T = unknown>(
  path: string,
  body: unknown,
  opts?: RequestOptions,
): Promise<JsonResponse<T>> {
  const url = buildUrl(path);
  const headers = buildHeaders(opts);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const cookies = parseCookies(response);
  const data = (await response.json().catch(() => null)) as T;

  return {
    status: response.status,
    data,
    headers: response.headers,
    cookies,
  };
}

/**
 * GET JSON from a URL
 */
export async function getJson<T = unknown>(
  path: string,
  opts?: RequestOptions,
): Promise<JsonResponse<T>> {
  const url = buildUrl(path);
  const headers = buildHeaders(opts);
  // Remove Content-Type for GET requests
  headers.delete('Content-Type');

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  const cookies = parseCookies(response);
  const data = (await response.json().catch(() => null)) as T;

  return {
    status: response.status,
    data,
    headers: response.headers,
    cookies,
  };
}

/**
 * Send OPTIONS request (for CORS preflight)
 */
export async function options(
  path: string,
  customHeaders?: Record<string, string>,
): Promise<{
  status: number;
  headers: Headers;
}> {
  const url = buildUrl(path);
  const headers = new Headers();

  if (customHeaders) {
    for (const [key, value] of Object.entries(customHeaders)) {
      headers.set(key, value);
    }
  }

  const response = await fetch(url, {
    method: 'OPTIONS',
    headers,
  });

  return {
    status: response.status,
    headers: response.headers,
  };
}

/**
 * Stream text from a URL, reading chunks until done or limit reached
 */
export async function streamText(
  path: string,
  init?: RequestInit & { maxChunks?: number },
): Promise<{
  status: number;
  chunks: string[];
  headers: Headers;
}> {
  const url = buildUrl(path);
  const maxChunks = init?.maxChunks ?? 10;

  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const chunks: string[] = [];

  if (!response.body) {
    return { status: response.status, chunks, headers: response.headers };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    let chunkCount = 0;
    while (chunkCount < maxChunks) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      if (text.trim()) {
        chunks.push(text);
        chunkCount++;
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { status: response.status, chunks, headers: response.headers };
}

/**
 * Generate a random email for testing
 */
export function randomEmail(): string {
  const id = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now();
  return `test-${id}-${timestamp}@example.com`;
}

/**
 * Generate a random password for testing
 */
export function randomPassword(): string {
  return `TestPass${Math.random().toString(36).substring(2, 12)}!`;
}
