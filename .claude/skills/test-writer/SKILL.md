---
name: test-writer
description: Write integration and unit tests for this codebase. Generate test files following repo patterns. Use when adding tests, improving coverage, writing test cases, or creating test suites.
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
---

# Test Writer

Creates tests following this repo's testing patterns.

## When to Use

- "Write tests for..."
- "Add test coverage for..."
- "Create integration test"
- "Test this endpoint"
- "Add unit tests for mobile"

## Test Locations

| Type | Location | Framework |
|------|----------|-----------|
| Integration tests | `packages/tests/src/` | Vitest |
| Mobile unit tests | `apps/mobile/__tests__/` | Jest |
| Tools testing | `packages/tools-testing/` | Custom |
| Evals | `packages/evals/` | Custom |

## Procedure

### Step 1: Identify What to Test

Determine test type needed:
- **API endpoint** → Integration test in `packages/tests/src/`
- **React Native component** → Unit test in `apps/mobile/__tests__/`
- **Shared package** → Integration or unit test in package

### Step 2: Read Existing Tests

Study patterns in existing tests:
```
Read: packages/tests/src/auth.cookie.test.ts
Read: packages/tests/src/stream.test.ts
```

### Step 3: Write Test File

Use templates from [templates.md](./templates.md).

Key patterns:
- Use `describe` for grouping
- Use `it` for test cases
- Import helpers from `./http.ts`
- Use `getTestToken()` for auth

### Step 4: Run Tests

```bash
# Integration tests (requires web server)
pnpm -C apps/web dev &  # Start server
pnpm test:integration

# Mobile unit tests
pnpm -C apps/mobile test

# Single test file
pnpm -C packages/tests vitest run src/{file}.test.ts
```

### Step 5: Check Coverage

Ensure tests cover:
- Happy path (success case)
- Authentication (401 for protected routes)
- Validation (400 for bad input)
- Authorization (403 for forbidden)
- Edge cases

## Test Categories

### Must Test

- [ ] API endpoints (auth, validation, success)
- [ ] Database operations (CRUD)
- [ ] Authentication flows
- [ ] Rate limiting behavior
- [ ] Error handling

### Should Test

- [ ] Input edge cases
- [ ] Concurrent requests
- [ ] Token expiration
- [ ] Mobile-specific flows

## Guardrails

- ALWAYS follow existing test patterns
- ALWAYS clean up test data after tests
- NEVER hardcode credentials in tests
- NEVER skip authentication tests
- Use environment variables for config
- Tests must be deterministic (no random failures)
