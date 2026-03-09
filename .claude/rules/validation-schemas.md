---
paths:
  - 'apps/web/app/api/**'
---

# Validation Schema Conventions (Zod)

## All API Routes MUST Use Zod

Every API route that accepts a request body MUST validate it with Zod `.parse()` or `.safeParse()`. Never use raw `await request.json()` without validation.

```typescript
// WRONG - No validation
const body = await request.json();
const { name, email } = body;

// CORRECT - Zod validation
const body = await request.json();
const { name, email } = mySchema.parse(body);
```

## When to Use `.parse()` vs `.safeParse()`

- `.parse()` — Default for most endpoints. Throws `ZodError` on invalid input.
- `.safeParse()` — Use when you need non-throwing validation, e.g., auth routes that must avoid user enumeration by returning the same response for valid and invalid input.

## DO NOT

- Use `as Record<string, unknown>` or `as any` type casts on request bodies — always validate with Zod
- Use manual `typeof field !== 'string'` checks — use Zod schemas instead
