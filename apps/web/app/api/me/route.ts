import { getCurrentUser } from "@acme/auth";
import { NextResponse } from "next/server";

import { verifyAuthToken } from "../../../lib/jwt";

export async function GET(request: Request) {
  const result = await getCurrentUser(request);

  if (result?.user) {
    const response = NextResponse.json({ user: result.user }, { status: 200 });

    if (result.headers) {
      result.headers.forEach((value, key) => {
        response.headers.append(key, value);
      });
    }

    return response;
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice("bearer ".length).trim();

    try {
      const payload = await verifyAuthToken(token);

      return NextResponse.json(
        { user: { id: payload.sub, email: payload.email } },
        { status: 200 },
      );
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const status = result?.status ?? 401;
  const response = NextResponse.json({ error: "unauthorized" }, { status });

  if (result?.headers) {
    result.headers.forEach((value, key) => {
      response.headers.append(key, value);
    });
  }

  return response;
}
