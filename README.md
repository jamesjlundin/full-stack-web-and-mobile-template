# full-stack-web-and-mobile-template

Starter Turborepo monorepo for web, mobile, and API projects.

## What's inside
- pnpm workspaces under `apps/*` and `packages/*`
- Example apps: Next.js web, React Native mobile, minimal API routes
- Shared packages for config, database tooling, auth helpers, types, and an API client

## Getting started
- Copy `.env.example` to `.env` and fill required values
- Start Postgres with Docker: `pnpm db:up` (stop with `pnpm db:down`); database listens on 5432
- Turborepo tasks such as `pnpm dev` or `pnpm build` will be added alongside new services

## Local PostgreSQL without Docker
If Docker is unavailable, install Postgres locally:

```bash
sudo ./scripts/setup-postgres.sh
```

The script enables password auth on localhost, restarts the service, and ensures the `acme` role/database exist at `postgres://acme:acme@localhost:5432/acme`.
