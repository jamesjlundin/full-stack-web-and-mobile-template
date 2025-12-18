import auth from "@acme/auth";
import { NextResponse } from "next/server";

import { signAuthToken } from "../../../../lib/jwt";

async function authenticateUser(email: string, password: string) {
  try {
    const result = await auth.api.signInEmail({
      body: { email, password },
    });

    if (!result?.user?.id || !result.user.email) {
      return null;
    }

    return { id: result.user.id, email: result.user.email };
  } catch {
    return null;
  }
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
