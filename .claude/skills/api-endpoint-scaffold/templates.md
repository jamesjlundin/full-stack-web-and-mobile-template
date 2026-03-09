# API Endpoint Templates

## Basic Authenticated Endpoint

```typescript
// apps/web/app/api/{path}/route.ts
import { getCurrentUser } from '@acme/auth';
import { createRateLimiter } from '@acme/security';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withRateLimit } from '../_lib/withRateLimit';

const RequestSchema = z.object({
  // Define your request schema
});

const limiter = createRateLimiter({ limit: 100, windowMs: 60_000 });
const routeId = '/api/{path}';

async function handlePost(request: Request) {
  try {
    // 1. Authentication
    const result = await getCurrentUser(request);
    if (!result?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // 3. Business logic
    const data = parsed.data;
    // ... your logic here

    // 4. Response
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withRateLimit(routeId, limiter, handlePost);
```

## Rate-Limited Endpoint (AI/Expensive)

```typescript
// apps/web/app/api/{path}/route.ts
import { getCurrentUser } from '@acme/auth';
import { createRateLimiter } from '@acme/security';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withRateLimit } from '../_lib/withRateLimit';

const RequestSchema = z.object({
  // Define your request schema
});

// Stricter rate limit for expensive operations
const limiter = createRateLimiter({
  limit: 20,
  windowMs: 60_000,
});
const routeId = '/api/{path}';

async function handlePost(request: Request) {
  // 1. Authentication
  const result = await getCurrentUser(request);
  if (!result?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse and validate request
  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // 3. Business logic
  const data = parsed.data;
  // ... your logic here

  return NextResponse.json({ success: true, data: {} });
}

export const POST = withRateLimit(routeId, limiter, handlePost);
```

## GET Endpoint (No Body)

```typescript
// apps/web/app/api/{path}/route.ts
import { getCurrentUser } from '@acme/auth';
import { createRateLimiter } from '@acme/security';
import { NextResponse } from 'next/server';

import { withRateLimit } from '../_lib/withRateLimit';

const limiter = createRateLimiter({ limit: 100, windowMs: 60_000 });
const routeId = '/api/{path}';

async function handleGet(request: Request) {
  try {
    const result = await getCurrentUser(request);
    if (!result?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query params
    const { searchParams } = new URL(request.url);
    const param = searchParams.get('param');

    // Business logic
    // ... your logic here

    return NextResponse.json({ data: {} });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withRateLimit(routeId, limiter, handleGet);
```

## Dynamic Route Endpoint

```typescript
// apps/web/app/api/{collection}/[id]/route.ts
import { getCurrentUser } from '@acme/auth';
import { createRateLimiter } from '@acme/security';
import { db, schema } from '@acme/db';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { type RouteContext, withRateLimit } from '../../_lib/withRateLimit';

const limiter = createRateLimiter({ limit: 100, windowMs: 60_000 });
const routeId = '/api/{collection}/[id]';

async function handleGet(request: Request, ctx?: RouteContext) {
  try {
    const result = await getCurrentUser(request);
    if (!result?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await ctx!.params;

    // Fetch from database
    const [item] = await db
      .select()
      .from(schema.tableName)
      .where(eq(schema.tableName.id, id))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data: item });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withRateLimit(routeId, limiter, handleGet);
```

## Integration Test Template

```typescript
// packages/tests/src/{feature}.test.ts
import { describe, it, expect } from 'vitest';
import { http, getTestToken } from './http';

describe('{Feature} API', () => {
  describe('POST /api/{path}', () => {
    it('requires authentication', async () => {
      const response = await http.post('/api/{path}', {});
      expect(response.status).toBe(401);
    });

    it('validates request body', async () => {
      const token = await getTestToken();
      const response = await http.post(
        '/api/{path}',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      expect(response.status).toBe(400);
    });

    it('succeeds with valid request', async () => {
      const token = await getTestToken();
      const response = await http.post(
        '/api/{path}',
        {
          field: 'value',
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
