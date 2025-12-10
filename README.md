# full-stack-web-and-mobile-template

This repository is a Turborepo-powered monorepo scaffold for future web, mobile, and API applications.
- Workspaces are managed with pnpm and include `apps/*` and `packages/*` folders.
- Placeholder apps: Next.js web, bare React Native mobile, and route-handler-based API (no code yet).
- Shared packages will hold config, database tooling, auth helpers, shared types, and an API client.
- Start the local database with `pnpm db:up` (stops with `pnpm db:down`); Postgres listens on port 5432.
- Environment variables live in `.env` (see `.env.example` for keys).
- Development commands will be added later via Turborepo tasks (`pnpm dev`, `pnpm build`, etc.).
