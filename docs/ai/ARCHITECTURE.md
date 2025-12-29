# Architecture Reference

## Package Dependency Graph

```
apps/web ──────┬─→ @acme/auth ──→ @acme/db
               ├─→ @acme/ai
               ├─→ @acme/security
               ├─→ @acme/api-client
               ├─→ @acme/obs
               ├─→ @acme/rag
               └─→ @acme/tools

apps/mobile ───→ @acme/api-client

packages/tests ─→ (hits apps/web via HTTP)
```

## Package Responsibilities

| Package            | Responsibility                      | Key Exports                 |
| ------------------ | ----------------------------------- | --------------------------- |
| `@acme/db`         | Schema, migrations, DB client       | `db`, `schema`, tables      |
| `@acme/auth`       | Auth config, session/JWT handling   | `auth`, `createToken`       |
| `@acme/ai`         | LLM integration, prompts, streaming | `streamText`, prompts       |
| `@acme/security`   | Rate limiting                       | `rateLimit`, `rateLimiters` |
| `@acme/api-client` | HTTP client with streaming          | `ApiClient`                 |
| `@acme/types`      | Shared TypeScript types             | Type definitions            |
| `@acme/config`     | ESLint/Prettier shared configs      | Config files                |

## Key Data Flows

### Web Authentication

```
Browser → middleware.ts → check session cookie → allow/redirect
```

### Mobile Authentication

```
App → POST /api/auth/login → JWT returned → stored in Keychain
App → requests with Authorization: Bearer <token>
```

### AI Streaming

```
Client → POST /api/agent/stream → @acme/ai streamText → SSE response
```

### Database Migrations

```
Edit schema.ts → pnpm migrate:generate → pnpm migrate:apply
CI: migrate:apply runs before Vercel deploy
```

## Invariants

- All database access through `@acme/db`
- Auth logic centralized in `@acme/auth`
- API routes apply rate limiting via `@acme/security`
- Mobile never accesses DB directly (API only)
- Shared types go in `@acme/types`, not duplicated

## Adding a New Package

1. Create `packages/<name>/` with `package.json`, `tsconfig.json`
2. Name it `@acme/<name>` in package.json
3. Add to consuming packages: `"@acme/<name>": "workspace:*"`
4. Run `pnpm install` from root
