import { authHandler } from "@acme/auth";

type AuthHandlerMethod = keyof typeof authHandler;

function mapAliasPath(request: Request): Request {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/auth/email-password/sign-up")) {
    url.pathname = url.pathname.replace(
      "/api/auth/email-password/sign-up",
      "/api/auth/sign-up/email",
    );
    return new Request(url, request);
  }

  if (url.pathname.startsWith("/api/auth/email-password/sign-in")) {
    url.pathname = url.pathname.replace(
      "/api/auth/email-password/sign-in",
      "/api/auth/sign-in/email",
    );
    return new Request(url, request);
  }

  return request;
}

const delegate = (method: AuthHandlerMethod) => async (request: Request) => {
  const handler = authHandler[method];
  return handler(mapAliasPath(request));
};

export const DELETE = delegate("DELETE");
export const GET = delegate("GET");
export const PATCH = delegate("PATCH");
export const POST = delegate("POST");
export const PUT = delegate("PUT");
