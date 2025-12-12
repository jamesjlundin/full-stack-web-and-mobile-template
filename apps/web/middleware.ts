import { NextResponse, type NextRequest } from "next/server";

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const meUrl = new URL("/api/me", request.nextUrl.origin);
  const response = await fetch(meUrl.toString(), {
    headers: { cookie: request.headers.get("cookie") ?? "" },
    credentials: "include",
  });

  return response.status !== 401;
}

export async function middleware(request: NextRequest) {
  const normalizedPathname = request.nextUrl.pathname.replace("/(protected)", "");
  const requiresRewrite = normalizedPathname !== request.nextUrl.pathname;

  const authenticated = await isAuthenticated(request);

  if (!authenticated) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (requiresRewrite) {
    const url = request.nextUrl.clone();
    url.pathname = normalizedPathname;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
