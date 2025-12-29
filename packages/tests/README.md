# Integration Tests

This package contains integration tests that hit real API routes. These tests require a running database and web server.

## Prerequisites

- Docker (for local PostgreSQL)
- Node.js 20+
- pnpm 9+

## Environment Variables

The following environment variables are needed:

| Variable             | Description                                           | Required |
| -------------------- | ----------------------------------------------------- | -------- |
| `DATABASE_URL`       | PostgreSQL connection string                          | Yes      |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars)                            | Yes      |
| `APP_BASE_URL`       | App base URL (e.g., `http://localhost:3000`)          | Yes      |
| `TEST_BASE_URL`      | Base URL for tests (default: `http://localhost:3000`) | No       |
| `OPENAI_API_KEY`     | OpenAI API key (optional; mock fallback if absent)    | No       |
| `AI_MODEL`           | AI model to use (default: `gpt-4o-mini`)              | No       |

## Running Tests Locally

1. **Start the database:**

   ```bash
   pnpm db:up
   ```

2. **Run database migrations:**

   ```bash
   pnpm -C packages/db migrate:apply
   ```

3. **Start the web server** (in a separate terminal):

   ```bash
   pnpm -C apps/web dev
   # or for production build:
   pnpm -C apps/web build && pnpm -C apps/web start
   ```

4. **Wait for the server to be ready:**

   ```bash
   npx wait-on http://localhost:3000/api/health
   ```

5. **Run the integration tests:**
   ```bash
   pnpm test:integration
   ```

## Test Suites

### auth.cookie.test.ts

- Signs up a new user via `/api/auth/email-password/sign-up`
- Signs in and captures session cookies
- Accesses `/api/me` with cookies (expects 200)
- Accesses `/api/me` without cookies (expects 401)

### auth.token.test.ts

- Creates a new user
- Obtains a JWT token via `/api/auth/token`
- Accesses `/api/me` with Bearer token (expects 200)
- Verifies invalid tokens return 401

### cors.preflight.test.ts

- Sends OPTIONS request to `/api/chat/stream`
- Verifies CORS preflight response headers

### stream.test.ts

- POSTs to `/api/chat/stream` with a prompt
- Verifies streaming response with multiple chunks
- Confirms SSE content-type header

## CI Configuration

The CI workflow:

1. Spins up a PostgreSQL service
2. Runs database migrations
3. Builds and starts the web server
4. Waits for the server to be ready
5. Runs integration tests

See `.github/workflows/ci.yml` for the full configuration.
