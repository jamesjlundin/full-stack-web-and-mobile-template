---
name: db-schema-change
description: Handle Drizzle database schema changes safely. Generate and apply migrations, add tables and columns. Use when modifying database schema, adding tables, creating migrations, or making database changes.
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
---

# Database Schema Change

Safely modify PostgreSQL schema using Drizzle ORM.

## When to Use

- "Add a new table for..."
- "Add column to..."
- "Create migration for..."
- "Modify database schema"
- "Add foreign key to..."

## Important Files

| File                             | Purpose               |
| -------------------------------- | --------------------- |
| `packages/db/src/schema.ts`      | Main schema exports   |
| `packages/db/src/auth-schema.ts` | Better Auth tables    |
| `packages/db/src/rag-schema.ts`  | RAG embeddings tables |
| `packages/db/drizzle/`           | Generated migrations  |

## Procedure

### Step 1: Understand Current Schema

Read the schema file to understand existing tables:

```
Read: packages/db/src/schema.ts
```

### Step 2: Plan the Change

Before making changes, confirm with user:

- Table name and column definitions
- Data types (see [types.md](./types.md))
- Relationships (foreign keys)
- Indexes needed
- Whether data migration is required

### Step 3: Modify Schema

Edit the appropriate schema file:

```typescript
// packages/db/src/schema.ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const newTable = pgTable('new_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Step 4: Generate Migration

Run migration generator:

```bash
pnpm -C packages/db migrate:generate
```

### Step 5: Review Migration

Read the generated migration in `packages/db/drizzle/` and verify:

- Correct SQL statements
- No data loss for existing tables
- Proper indexes created

### Step 6: Apply Migration (Local)

```bash
pnpm -C packages/db migrate:apply
```

### Step 7: Verify

```bash
pnpm typecheck
pnpm lint
```

## Checklist

- [ ] Schema change planned with user
- [ ] Schema file updated
- [ ] Migration generated
- [ ] Migration reviewed (no data loss)
- [ ] Migration applied locally
- [ ] TypeScript compiles
- [ ] Existing tests still pass

## Guardrails

- NEVER drop columns without explicit user confirmation
- NEVER run migrations on production directly (CI handles this)
- ALWAYS generate migration before applying
- ALWAYS review generated SQL before applying
- If migration involves data transformation, create separate script
- Ask user before destructive changes (DROP, TRUNCATE)
