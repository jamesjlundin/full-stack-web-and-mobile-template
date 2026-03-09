---
name: bug-batch
description: Investigate, fix, and verify multiple bugs or issues across web and mobile.
allowed-tools: Read, Grep, Glob, Write, Edit, Bash, Agent
---

# Bug Batch

Processes multiple bug reports in a single session with investigation, fixes, and verification.

## When to Use

- "I have a list of bugs..."
- "Here are some issues I found..."
- "Fix these bugs: ..."
- Multiple bug reports in one message

## Procedure

### Step 1: Parse Bug List

Extract each distinct bug from the user's message. For each bug, identify:

- **Symptom** — what the user sees
- **Platform** — web, mobile, or both
- **Area** — which screen/feature is affected
- **Screenshots** — any attached images

### Step 2: Triage

Order bugs by dependency (fix root causes before symptoms). Group related bugs that may share a root cause.

### Step 3: Investigate Each Bug

For each bug:

1. **Find the relevant code** — use the symptom to locate the component/API
2. **Identify root cause** — read the code, check for the described behavior
3. **Check the other platform** — if bug is reported on mobile, check if web has the same issue (and vice versa)
4. **Plan the fix** — determine what needs to change

### Step 4: Fix

For independent bugs, use parallel agents:

```
Agent: "Fix bug 1: [description] in [files]"
Agent: "Fix bug 2: [description] in [files]"
```

For related bugs or bugs that touch the same files, fix sequentially to avoid conflicts.

Each fix must:

- Address both platforms if applicable
- Follow existing code patterns
- Not introduce regressions in related features

### Step 5: Verify

After all fixes:

```bash
pnpm typecheck
pnpm lint
pnpm format
```

### Step 6: Report

For each bug, report:

- Root cause found
- Fix applied (files changed)
- Whether the other platform was also affected and fixed
- Any related issues discovered during investigation

## Guardrails

- Don't assume a bug only affects one platform — always check both
- If a bug's root cause is unclear, report findings and ask the user
- Don't refactor or improve code beyond what's needed for the fix
- Run typecheck/lint/format before reporting completion
