import { authHandler } from '@acme/auth';

/**
 * Safely reads a JSON field from a request body.
 * Clones the request to preserve the original body for forwarding.
 * Returns undefined if the body cannot be parsed or field doesn't exist.
 */
export async function tryReadJsonField<T>(request: Request, field: string): Promise<T | undefined> {
  const clonedRequest = request.clone();
  try {
    const body = await clonedRequest.json();
    return body[field] as T | undefined;
  } catch {
    // If we can't parse the body, return undefined
    return undefined;
  }
}

/**
 * Forwards a POST request to Better Auth with URL pathname rewriting.
 * Handles the duplex streaming setup required for request forwarding.
 */
export async function proxyBetterAuthPost(request: Request, pathname: string): Promise<Response> {
  const url = new URL(request.url);
  url.pathname = pathname;

  const newRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    duplex: 'half',
  } as RequestInit);

  return authHandler.POST(newRequest);
}
