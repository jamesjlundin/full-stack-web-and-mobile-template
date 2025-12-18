import { NextResponse } from "next/server";

function getAuthBaseURL(): string {
  const url = process.env.BETTER_AUTH_URL;
  if (!url) {
    throw new Error("BETTER_AUTH_URL is not set");
  }
  return url;
}

export async function POST(request: Request) {
  const authBaseURL = getAuthBaseURL();
  const body = await request.text();

  const headers = new Headers({
    "content-type": "application/json",
    origin: request.headers.get("origin") ?? authBaseURL,
  });

  const cookie = request.headers.get("cookie");

  if (cookie) {
    headers.set("cookie", cookie);
  }

  const response = await fetch(`${authBaseURL}/api/auth/sign-in/email`, {
    method: "POST",
    headers,
    body,
  });

  const responseText = await response.text();
  const proxy = new NextResponse(responseText, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      proxy.headers.append("set-cookie", value);
    }
  });

  return proxy;
}
