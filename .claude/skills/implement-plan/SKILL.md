---
name: implement-plan
description: Implement a plan with phased execution, parallel agents, and verification.
allowed-tools: Read, Grep, Glob, Write, Edit, Bash, Agent
---

# Implement Plan

Executes a structured implementation plan with phased execution and verification.

## When to Use

- "Implement the following plan:"
- "Execute this plan"
- User pastes a structured plan with phases/steps

## Procedure

### Step 1: Parse the Plan

Read the plan and identify:

- **Phases** — ordered stages
- **Files to modify** — the specific files listed
- **Dependencies** — which phases must complete before others start
- **Independent work** — phases that can run in parallel

### Step 2: Read Before Modifying

For each file listed in the plan, read it first to understand current state. Never modify a file you haven't read.

### Step 3: Execute Phases

Execute phases in dependency order. Within each phase:

1. **Sequential phases**: Execute one at a time
2. **Parallel phases**: Use parallel agents with clear scoped tasks

Each agent must run `pnpm typecheck` before reporting completion.

### Step 4: Verify

After all phases complete:

```bash
pnpm typecheck
pnpm lint
pnpm format
```

Fix any errors before reporting completion.

### Step 5: Report

Summarize what was done:

- Files created/modified (grouped by phase)
- Any deviations from the plan and why
- Any follow-up items identified

## Guardrails

- If a phase fails, stop and report — don't continue to dependent phases
- If the plan references files that don't exist, check with the user
- Always run typecheck/lint/format before considering done
- Respect existing patterns in each file
