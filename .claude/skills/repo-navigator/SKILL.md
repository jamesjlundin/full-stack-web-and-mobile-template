---
name: repo-navigator
description: Navigate and map this monorepo structure. Find files, packages, and dependencies. Use when asked to locate code, understand package relationships, find where something is defined, or explore repo structure.
allowed-tools: Read, Grep, Glob
---

# Repo Navigator

Maps this Turborepo monorepo and locates code quickly.

## When to Use

- "Where is X defined?"
- "Find files related to..."
- "What packages exist?"
- "Show me the structure"
- "How do packages depend on each other?"

## Quick Reference

### Package Locations

| Package    | Path                   | Purpose                          |
| ---------- | ---------------------- | -------------------------------- |
| Web App    | `apps/web/`            | Next.js 16 frontend + API routes |
| Mobile App | `apps/mobile/`         | React Native bare                |
| Database   | `packages/db/`         | Drizzle ORM, schema, migrations  |
| Auth       | `packages/auth/`       | Better Auth config               |
| AI         | `packages/ai/`         | Vercel AI SDK integration        |
| API Client | `packages/api-client/` | Shared fetch client              |
| Security   | `packages/security/`   | Rate limiting                    |
| Types      | `packages/types/`      | Shared TypeScript types          |
| Tests      | `packages/tests/`      | Integration tests                |
| Tools      | `packages/tools/`      | AI tool definitions              |
| RAG        | `packages/rag/`        | Embeddings support               |
| Evals      | `packages/evals/`      | LLM evaluation framework         |
| Obs        | `packages/obs/`        | Observability utilities          |

### Key File Locations

| Looking for...    | Check...                             |
| ----------------- | ------------------------------------ |
| API endpoints     | `apps/web/app/api/`                  |
| Database schema   | `packages/db/src/schema.ts`          |
| Auth config       | `packages/auth/src/index.ts`         |
| Rate limiting     | `packages/security/src/rateLimit.ts` |
| Shared types      | `packages/types/src/index.ts`        |
| Integration tests | `packages/tests/src/`                |
| Mobile screens    | `apps/mobile/src/screens/`           |
| CI workflows      | `.github/workflows/`                 |

## Procedure

### 1. Understand the Request

Identify what the user is looking for:

- Specific file/function → use Grep with pattern
- Package overview → use Glob for structure
- Dependency → check package.json imports

### 2. Search Strategy

**For specific code:**

```
Grep pattern: "export (function|const|class) {name}"
Glob pattern: "**/*.ts" or "**/*.tsx"
```

**For package structure:**

```
Glob: "{apps,packages}/*/package.json"
```

**For imports/usage:**

```
Grep: "from '@acme/{package}'"
Grep: "import.*{name}"
```

### 3. Report Findings

Output format:

```
## Found: {description}

**Location:** `{path}:{line}`

**Context:**
- Package: {package-name}
- Exports: {what it exports}
- Used by: {importers}
```

## Common Searches

### Find API endpoint

```
Glob: apps/web/app/api/**/*.ts
Grep: "export (async function|const) (GET|POST|PUT|DELETE)"
```

### Find database table

```
Read: packages/db/src/schema.ts
Grep: "export const {tableName}"
```

### Find component

```
Glob: apps/web/components/**/*.tsx
Glob: apps/mobile/src/components/**/*.tsx
```

### Find where package is used

```
Grep: "@acme/{package-name}"
```

## Guardrails

- DO NOT modify any files
- DO NOT execute commands
- Report file paths with line numbers when found
- If not found, suggest alternative search terms
