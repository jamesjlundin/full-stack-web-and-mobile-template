---
name: ci-fixer
description: Debug and fix CI/CD pipeline failures. Analyze workflow logs, identify issues, and apply fixes. Use when CI is failing, build errors occur, tests fail in CI, or pipeline is broken.
allowed-tools: Read, Grep, Glob, Bash
---

# CI Fixer

Diagnoses and fixes CI/CD pipeline failures.

## When to Use

- "CI is failing"
- "Build broke"
- "Tests fail in CI but pass locally"
- "Pipeline error"
- "Deploy failed"

## CI Workflows

| Workflow             | Trigger      | Purpose                      |
| -------------------- | ------------ | ---------------------------- |
| `ci.yml`             | PR, push     | Typecheck, lint, build, test |
| `deploy.yml`         | push to main | Migrations, Vercel deploy    |
| `evals.yml`          | PR, push     | LLM evaluations              |
| `ios-testflight.yml` | manual       | iOS deployment               |

## Common Failures

### 1. TypeScript Errors

**Symptom:** `tsc --noEmit` fails

**Diagnosis:**

```bash
pnpm typecheck
```

**Fixes:**

- Add missing type annotations
- Fix type mismatches
- Update type imports

### 2. ESLint Errors

**Symptom:** `eslint .` fails

**Diagnosis:**

```bash
pnpm lint
```

**Auto-fix:**

```bash
pnpm eslint . --fix
pnpm format
```

### 3. Build Failures

**Symptom:** `pnpm -C apps/web build` fails

**Common causes:**

- Missing environment variables
- Import errors
- TypeScript errors not caught by tsc

**Diagnosis:**

```bash
pnpm -C apps/web build
```

### 4. Integration Test Failures

**Symptom:** `pnpm test:integration` fails

**Common causes:**

- Database not running
- Server not started
- Rate limiting (disable in CI)
- Missing test user

**CI-specific:**

- Uses GitHub Actions PostgreSQL service
- `DISABLE_RATE_LIMIT=true`
- `ALLOW_DEV_TOKENS=true`

### 5. Migration Failures

**Symptom:** `migrate:apply` fails in deploy

**Common causes:**

- Schema mismatch
- Missing migration file
- Database connection error

**Diagnosis:**

```bash
pnpm -C packages/db migrate:apply
```

### 6. Dependency Issues

**Symptom:** `pnpm install` fails

**Fixes:**

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Procedure

### Step 1: Identify Failing Workflow

Check which workflow failed and what step.

### Step 2: Read Workflow File

```
Read: .github/workflows/{workflow}.yml
```

### Step 3: Reproduce Locally

Run the exact commands from the workflow:

```bash
# For ci.yml
pnpm install
pnpm tsc --noEmit
pnpm eslint .
pnpm -C apps/web build
pnpm -C packages/db migrate:apply
pnpm test:integration
```

### Step 4: Check Environment

CI uses specific environment variables:

- `DATABASE_URL` - PostgreSQL connection
- `DISABLE_RATE_LIMIT=true`
- `ALLOW_DEV_TOKENS=true`

### Step 5: Apply Fix

Based on diagnosis, apply appropriate fix.

### Step 6: Verify

Run full CI check locally:

```bash
pnpm typecheck && pnpm lint && pnpm -C apps/web build
```

## Environment Differences

| Local                 | CI                        |
| --------------------- | ------------------------- |
| Docker PostgreSQL     | GitHub Actions service    |
| Docker Redis          | GitHub Actions service    |
| Manual server start   | wait-on + background      |
| Rate limiting enabled | `DISABLE_RATE_LIMIT=true` |
| Real tokens           | `ALLOW_DEV_TOKENS=true`   |

## Guardrails

- DO NOT modify workflow files without understanding impact
- DO NOT bypass failing checks without fixing root cause
- Always reproduce failure locally before fixing
- If fix is unclear, describe findings and ask for guidance
