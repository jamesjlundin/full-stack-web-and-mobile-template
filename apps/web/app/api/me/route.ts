import { getCurrentUser } from "@acme/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const result = await getCurrentUser(request);

  if (!result) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const status = result.user ? 200 : result.status ?? 401;
  const response = NextResponse.json(
    result.user ? { user: result.user } : { error: "unauthorized" },
    { status },
  );

  if (result.headers) {
    result.headers.forEach((value, key) => {
      response.headers.append(key, value);
    });
  }

  return response;
}
