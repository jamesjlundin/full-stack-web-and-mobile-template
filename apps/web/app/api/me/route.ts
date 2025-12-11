import { NextResponse } from "next/server";

export function GET() {
  // TODO: Integrate Better Auth user extraction once authentication is wired in Step 5.
  // TODO: Replace the placeholder response with the authenticated user payload.
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
