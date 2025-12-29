# API Endpoint Templates

## Basic Authenticated Endpoint

```typescript
// apps/web/app/api/{path}/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@acme/auth";
import { z } from "zod";

const RequestSchema = z.object({
  // Define your request schema
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const result = await getCurrentUser(request);
    if (!result?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate request
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // 3. Business logic
    const data = parsed.data;
    // ... your logic here

    // 4. Response
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

## Rate-Limited Endpoint

```typescript
// apps/web/app/api/{path}/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, type CurrentUserResult } from "@acme/auth";
import { createRateLimiter } from "@acme/security";
import { withUserRateLimit } from "../_lib/withUserRateLimit";
import { z } from "zod";

const RequestSchema = z.object({
  // Define your request schema
});

// Configure rate limit: 10 requests per minute
const limiter = createRateLimiter({
  limit: 10,
  windowMs: 60 * 1000,
});

async function handlePost(request: NextRequest, user: CurrentUserResult) {
  // Parse and validate request
  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Business logic
  const data = parsed.data;
  // ... your logic here

  return NextResponse.json({ success: true, data: {} });
}

export const POST = withUserRateLimit("/api/{path}", limiter, handlePost);
```

## GET Endpoint (No Body)

```typescript
// apps/web/app/api/{path}/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@acme/auth";

export async function GET(request: NextRequest) {
  try {
    const result = await getCurrentUser(request);
    if (!result?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query params
    const { searchParams } = new URL(request.url);
    const param = searchParams.get("param");

    // Business logic
    // ... your logic here

    return NextResponse.json({ data: {} });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

## Integration Test Template

```typescript
// packages/tests/src/{feature}.test.ts
import { describe, it, expect } from "vitest";
import { http, getTestToken } from "./http";

describe("{Feature} API", () => {
  describe("POST /api/{path}", () => {
    it("requires authentication", async () => {
      const response = await http.post("/api/{path}", {});
      expect(response.status).toBe(401);
    });

    it("validates request body", async () => {
      const token = await getTestToken();
      const response = await http.post(
        "/api/{path}",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      expect(response.status).toBe(400);
    });

    it("succeeds with valid request", async () => {
      const token = await getTestToken();
      const response = await http.post(
        "/api/{path}",
        {
          field: "value",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
```

## Dynamic Route Endpoint

```typescript
// apps/web/app/api/{collection}/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@acme/auth";
import { db, schema } from "@acme/db";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const result = await getCurrentUser(request);
    if (!result?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch from database
    const [item] = await db
      .select()
      .from(schema.tableName)
      .where(eq(schema.tableName.id, id))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: item });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```
