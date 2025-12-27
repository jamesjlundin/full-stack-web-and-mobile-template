# CLAUDE.md

This is the operating manual for AI agents working in this repository.

## Project Snapshot

- **Monorepo**: Turborepo + pnpm workspaces
- **Language**: TypeScript everywhere (strict mode)
- **Apps**: `apps/web` (Next.js 16), `apps/mobile` (React Native bare)
- **Database**: PostgreSQL + Drizzle ORM, Neon serverless compatible
- **Auth**: Better Auth (sessions for web, JWT for mobile)
- **AI**: Vercel AI SDK with OpenAI
- **Rate Limiting**: Upstash Redis
- **CI/CD**: GitHub Actions → migrations → Vercel deploy hook

## Commands

```bash
# Development
pnpm install                      # Install all dependencies
pnpm dev                          # Run all apps in parallel
pnpm -C apps/web dev              # Run web only
pnpm db:up                        # Start local PostgreSQL (Docker)

# Quality
pnpm typecheck                    # TypeScript check all packages
pnpm lint                         # ESLint all packages
pnpm eslint . --fix               # Auto-fix lint issues
npx prettier --write .            # Format all files

# Database
pnpm -C packages/db migrate:generate  # Generate migration from schema changes
pnpm -C packages/db migrate:apply     # Apply migrations

# Testing
pnpm test:integration             # Run integration tests (needs web running)
pnpm -C apps/mobile test          # Mobile unit tests
```

## Do/Don't Rules

### DO
- Run `pnpm typecheck` and `pnpm lint` before committing
- Use workspace packages (`@acme/*`) for shared code
- Add rate limiting to new API endpoints via `@acme/security`
- Use Drizzle schema in `packages/db/src/schema.ts` for DB changes
- Follow existing patterns in each package

### DON'T
- Don't commit `.env` files (use `.env.example` for templates)
- Don't add secrets to code; use environment variables
- Don't bypass rate limiting in production code
- Don't create new packages without clear justification
- Don't mix web-only code into shared packages

## Workflow Defaults

1. Make small, focused changes
2. Run tests before submitting
3. Explain non-obvious changes in commit messages
4. Prefer editing existing files over creating new ones
5. Follow existing code patterns in each package

## Routing Index

Open reference docs **only when relevant** to your current task:

| If working on...                | Open...                        |
|---------------------------------|--------------------------------|
| Package structure, data flows   | `docs/ai/ARCHITECTURE.md`      |
| Adding/running tests            | `docs/ai/TESTING.md`           |
| Auth logic, sessions, JWT       | `packages/auth/src/index.ts`   |
| Database schema, migrations     | `packages/db/src/schema.ts`    |
| AI prompts, streaming           | `packages/ai/src/`             |
| API endpoints                   | `apps/web/app/api/`            |
| CI/CD pipeline                  | `.github/workflows/`           |
| Mobile native code              | `apps/mobile/ios/`, `android/` |

## Where Things Live

```
apps/
  web/                 # Next.js app (API routes, UI, middleware)
    app/api/           # API endpoints
    app/(public)/      # Public pages (login, register)
    app/app/           # Protected pages (requires auth)
  mobile/              # React Native app
    src/screens/       # App screens
    src/auth/          # Auth context, token storage

packages/
  db/                  # Drizzle schema, migrations, client
  auth/                # Better Auth config, helpers
  ai/                  # AI/LLM integration (prompts, tools)
  api-client/          # Shared fetch client with streaming
  security/            # Rate limiting utilities
  types/               # Shared TypeScript types
  tests/               # Integration tests
  config/              # Shared ESLint, Prettier configs
  evals/               # AI evaluation framework
  obs/                 # Observability utilities
  rag/                 # RAG/embeddings support
  tools/               # AI tool definitions
  tools-testing/       # Tool testing utilities

.github/workflows/
  ci.yml               # PR checks: typecheck, lint, build, tests
  deploy.yml           # Main branch: migrations → Vercel deploy
  ios-testflight.yml   # iOS TestFlight upload
```

## Code Style

- **Prettier**: single quotes, semicolons, 100 char width, trailing commas
- **ESLint**: import ordering (alphabetized, grouped), no unused imports
- **Naming**: camelCase for variables/functions, PascalCase for types/components
