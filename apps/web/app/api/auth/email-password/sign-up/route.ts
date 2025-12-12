import { NextResponse } from "next/server";

const authBaseURL = process.env.BETTER_AUTH_URL as string;

if (!authBaseURL) {
  throw new Error("BETTER_AUTH_URL is not set");
}

export async function POST(request: Request) {
  const body = await request.text();

  const headers = new Headers({
    "content-type": "application/json",
    origin: request.headers.get("origin") ?? authBaseURL,
  });

  const cookie = request.headers.get("cookie");

  if (cookie) {
    headers.set("cookie", cookie);
  }

  const response = await fetch(`${authBaseURL}/api/auth/sign-up/email`, {
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
