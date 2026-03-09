---
paths:
  - 'packages/**'
---

# Shared Package Conventions

- Shared code should live in workspace packages (@acme/\*)
- Keep web-only logic out of shared packages
- Prefer editing existing packages over creating new ones

## @acme/types

The `@acme/types` package is dependency-free and should stay that way. It contains:

- Shared TypeScript type definitions
- Pure utility functions used by both web and mobile

### DO NOT

- Add runtime dependencies (like `zod`) to `@acme/types`
- Extract code that's only used in one app — wait until there's a second consumer
- Put web-only logic (e.g., Next.js-specific code, React hooks) into shared packages

## Database Migrations (Drizzle)

When working in packages/db, ALWAYS use drizzle-kit generate to create migrations. Never manually write migration files.

### Creating a Migration

1. Modify the schema in packages/db/src/

2. Generate the migration:

```bash
pnpm -C packages/db migrate:generate
```

3. Review the generated SQL

4. Apply the migration:

```bash
pnpm -C packages/db migrate:apply
```

### DO NOT

- Manually create migration SQL files
- Manually edit the journal or snapshot files
- Delete snapshot files (they're needed for future migrations)
- Skip running migrate:generate and write SQL by hand
