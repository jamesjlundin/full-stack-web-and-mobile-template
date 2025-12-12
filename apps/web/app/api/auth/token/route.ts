import { NextResponse } from "next/server";

import { signAuthToken } from "../../../../lib/jwt";

type SignInResponse = {
  token?: string;
  user?: { id: string; email: string };
};

const authBaseURL = process.env.BETTER_AUTH_URL as string;

if (!authBaseURL) {
  throw new Error("BETTER_AUTH_URL is not set");
}

async function authenticateUser(email: string, password: string) {
  const response = await fetch(`${authBaseURL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: authBaseURL,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json().catch(() => null)) as SignInResponse | null;

  if (!data?.user?.id || !data.user.email) {
    return null;
  }

  return { id: data.user.id, email: data.user.email };
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as Record<string, unknown>;

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const user = await authenticateUser(email, password);

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = await signAuthToken({ email: user.email, sub: user.id });

  return NextResponse.json({ token, user });
}
