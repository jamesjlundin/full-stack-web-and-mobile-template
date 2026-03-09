---
paths:
  - 'apps/web/**'
---

# Web App Conventions (Next.js)

## Structure

- API routes: apps/web/app/api/
- Public pages: apps/web/app/(public)/
- Protected pages: apps/web/app/app/

## Next.js Image Component (Required)

ALWAYS use next/image instead of `<img>` tags.

```typescript
import Image from 'next/image';

// For known dimensions
<Image src={imageUrl} alt="Description" width={300} height={200} />

// For fill container (requires relative parent)
<div className="relative h-48 w-full">
  <Image src={imageUrl} alt="Description" fill className="object-cover" />
</div>

// For dynamic/external URLs from user uploads, use unoptimized
<Image src={uploadedUrl} alt="Description" fill unoptimized />
```

## API Route Pattern (Required)

All API route handlers MUST use the `withRateLimit` wrapper pattern. This is the single standard for every endpoint.

### Standard Pattern

```typescript
import { getCurrentUser } from '@acme/auth';
import { createRateLimiter } from '@acme/security';
import { NextResponse } from 'next/server';

import { withRateLimit } from '../_lib/withRateLimit';

const limiter = createRateLimiter({ limit: 100, windowMs: 60_000 });
const routeId = '/api/your-route';

async function handlePost(request: Request) {
  try {
    const userResult = await getCurrentUser(request);
    if (!userResult?.user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    // ... business logic ...
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export const POST = withRateLimit(routeId, limiter, handlePost);
```

### Dynamic Routes (with `[id]` params)

```typescript
import { type RouteContext, withRateLimit } from '../../_lib/withRateLimit';

async function handleGet(request: Request, ctx?: RouteContext) {
  const { id } = await ctx!.params;
  // ... business logic ...
}

export const GET = withRateLimit(routeId, limiter, handleGet);
```

### Rate Limit Tiers

- Standard endpoints: `{ limit: 100, windowMs: 60_000 }`
- AI/expensive endpoints (rag, agent): `{ limit: 20, windowMs: 60_000 }`
- Auth endpoints: `{ limit: 5, windowMs: 60_000 }`

### DO NOT

- Use bare `export async function GET/POST/PUT/DELETE` — always wrap with `withRateLimit`
- Use `withUserRateLimit` — it has been removed; use `withRateLimit` + auth check inside the handler
- Use closure wrappers to thread route context — `withRateLimit` passes `ctx` through automatically

### Exempt Routes (no rate limiting needed)

- `health/` — uptime checks
- `config/` — public app config
- `cron/*` — server-to-server with secret validation
- `auth/[...any]` — handled by Better Auth internally
- `debug/*` — dev-only endpoints

### Handler Naming Convention

- `handleGet`, `handlePost`, `handlePut`, `handleDelete`, `handlePatch`
- For domain-specific names: `handleSignIn`, `handleSignUp` are acceptable
- For PUT+PATCH aliases: `export const PATCH = withRateLimit(routeId, limiter, handlePut);`
