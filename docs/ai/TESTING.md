# Testing Reference

## Test Locations

| Type              | Location                       | Command                    |
| ----------------- | ------------------------------ | -------------------------- |
| Integration tests | `packages/tests/src/*.test.ts` | `pnpm test:integration`    |
| Mobile unit tests | `apps/mobile/__tests__/`       | `pnpm -C apps/mobile test` |

## Running Integration Tests

Integration tests require a running web server:

```bash
# Terminal 1: Start database and web server
pnpm db:up
pnpm -C packages/db migrate:apply
pnpm -C apps/web dev

# Terminal 2: Run tests
pnpm test:integration
```

Or run in CI mode (server starts automatically):

```bash
pnpm -C apps/web build
pnpm -C apps/web start &
npx wait-on http://localhost:3000/api/health
pnpm test:integration
```

## Existing Test Suites

- `auth.cookie.test.ts` - Web session authentication
- `auth.token.test.ts` - Mobile JWT authentication
- `cors.preflight.test.ts` - CORS configuration
- `stream.test.ts` - AI streaming endpoint
- `password-reset.test.ts` - Password reset flow

## Adding Integration Tests

1. Create `packages/tests/src/<feature>.test.ts`
2. Use helpers from `packages/tests/src/http.ts`
3. Tests run against `http://localhost:3000`

```typescript
import { describe, it, expect } from "vitest";
import { http } from "./http";

describe("my feature", () => {
  it("should work", async () => {
    const res = await http.get("/api/my-endpoint");
    expect(res.status).toBe(200);
  });
});
```

## CI Test Environment

CI sets these env vars automatically:

- `ALLOW_DEV_TOKENS=true` - Enables test token echoing
- `DISABLE_RATE_LIMIT=true` - Disables rate limiting
- `DATABASE_URL` - Points to CI Postgres service

## Common Issues

| Problem                  | Solution                                  |
| ------------------------ | ----------------------------------------- |
| Tests fail on connection | Ensure web server is running on port 3000 |
| Auth tests fail          | Check `BETTER_AUTH_SECRET` is set         |
| Rate limit errors        | Set `DISABLE_RATE_LIMIT=true` in test env |
| DB not found             | Run `pnpm db:up` and `migrate:apply`      |
