# Drizzle PostgreSQL Types Reference

## Common Column Types

```typescript
import {
  pgTable,
  text,
  varchar,
  integer,
  bigint,
  boolean,
  timestamp,
  date,
  json,
  jsonb,
  uuid,
  serial,
  real,
  doublePrecision,
  numeric,
} from 'drizzle-orm/pg-core';
```

## Type Mappings

| Use Case | Drizzle Type | PostgreSQL Type |
|----------|--------------|-----------------|
| Primary key (UUID) | `uuid('id').primaryKey().defaultRandom()` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Primary key (auto-increment) | `serial('id').primaryKey()` | `SERIAL PRIMARY KEY` |
| Short text | `varchar('name', { length: 255 })` | `VARCHAR(255)` |
| Long text | `text('description')` | `TEXT` |
| Integer | `integer('count')` | `INTEGER` |
| Big integer | `bigint('amount', { mode: 'number' })` | `BIGINT` |
| Boolean | `boolean('is_active')` | `BOOLEAN` |
| Timestamp | `timestamp('created_at')` | `TIMESTAMP` |
| Timestamp with TZ | `timestamp('created_at', { withTimezone: true })` | `TIMESTAMPTZ` |
| Date only | `date('birth_date')` | `DATE` |
| JSON | `jsonb('metadata')` | `JSONB` |
| Decimal | `numeric('price', { precision: 10, scale: 2 })` | `NUMERIC(10,2)` |
| Float | `real('score')` | `REAL` |
| Double | `doublePrecision('amount')` | `DOUBLE PRECISION` |

## Common Patterns

### Standard Table with Timestamps

```typescript
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Foreign Key Relationship

```typescript
import { relations } from 'drizzle-orm';

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
```

### Indexes

```typescript
import { index, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  username: text('username').notNull(),
}, (table) => [
  uniqueIndex('users_email_idx').on(table.email),
  index('users_username_idx').on(table.username),
]);
```

### Enum Type

```typescript
import { pgEnum } from 'drizzle-orm/pg-core';

export const statusEnum = pgEnum('status', ['pending', 'active', 'archived']);

export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: statusEnum('status').default('pending').notNull(),
});
```

### JSON with Type Safety

```typescript
import { jsonb } from 'drizzle-orm/pg-core';

type Metadata = {
  tags: string[];
  settings: Record<string, unknown>;
};

export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  metadata: jsonb('metadata').$type<Metadata>(),
});
```

### Soft Delete Pattern

```typescript
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

## Migration Commands

```bash
# Generate migration from schema changes
pnpm -C packages/db migrate:generate

# Apply pending migrations
pnpm -C packages/db migrate:apply

# Check database connection
pnpm -C packages/db smoke
```
