---
name: pr-review
description: Review pull requests for code quality, security, and adherence to repo patterns. Use when reviewing PRs, checking code changes, performing code review, or validating changes before merge.
allowed-tools: Read, Grep, Glob, Bash
---

# PR Review

Reviews code changes for quality, security, and pattern compliance.

## When to Use

- "Review this PR"
- "Check these changes"
- "Code review for..."
- "Is this safe to merge?"
- "Review my changes"

## Procedure

### Step 1: Get Change Summary

```bash
git diff main...HEAD --stat
git log main..HEAD --oneline
```

### Step 2: Review Each Changed File

For each file, check against the [checklist.md](./checklist.md).

Priority order:
1. Security concerns (auth, validation, secrets)
2. Database changes (migrations, schema)
3. API changes (breaking changes, rate limiting)
4. Logic correctness
5. Code style and patterns

### Step 3: Check Test Coverage

```bash
# See what tests exist for changed files
git diff main...HEAD --name-only | grep -E '\.(ts|tsx)$' | while read f; do
  echo "=== $f ==="
  basename="${f%.*}"
  find packages/tests -name "*${basename##*/}*" 2>/dev/null
done
```

### Step 4: Run Quality Checks

```bash
pnpm typecheck
pnpm lint
pnpm test:integration
```

### Step 5: Generate Review Report

Output format:

```markdown
## PR Review: {title}

### Summary
- Files changed: {count}
- Lines added/removed: +{added}/-{removed}
- Risk level: {Low|Medium|High}

### Findings

#### 🔴 Critical (Must Fix)
- {issue with file:line reference}

#### 🟡 Suggestions
- {suggestion with file:line reference}

#### ✅ Looks Good
- {positive observation}

### Checklist
- [ ] Auth properly implemented
- [ ] Rate limiting applied
- [ ] Input validated
- [ ] No secrets in code
- [ ] Tests added/updated
- [ ] TypeScript compiles
- [ ] ESLint passes

### Recommendation
{APPROVE | REQUEST_CHANGES | NEEDS_DISCUSSION}
```

## Guardrails

- DO NOT approve PRs with security vulnerabilities
- DO NOT approve PRs that break existing tests
- Flag any database schema changes for careful review
- Flag any auth/permission changes for security review
- If unsure about a change, ask for clarification
