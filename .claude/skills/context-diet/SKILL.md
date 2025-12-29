---
name: context-diet
description: Optimize Claude Code context window usage. Identify what to keep in context vs fetch on-demand. Use when context is bloated, responses are slow, hitting token limits, or want to slim down context.
allowed-tools: Read, Grep, Glob
---

# Context Diet

Optimizes context window usage for efficient Claude Code sessions.

## When to Use

- "Too much context"
- "Slim down context"
- "Hitting token limits"
- "Session feels slow"
- "What should I keep in context?"

## Context Budget

| Priority      | Keep in Context         | Fetch on Demand        |
| ------------- | ----------------------- | ---------------------- |
| Always        | CLAUDE.md (~500 tokens) | Full file contents     |
| Task-specific | Current file            | Related files          |
| Reference     | Function signatures     | Implementation details |

## This Repo's Essential Files

### Always Relevant (Keep Short Reference)

| File                     | What to Know               | Size        |
| ------------------------ | -------------------------- | ----------- |
| `CLAUDE.md`              | Commands, rules, structure | ~500 tokens |
| Active file being edited | Full content               | Varies      |

### Fetch When Needed

| Task     | Files to Fetch                           |
| -------- | ---------------------------------------- |
| API work | `apps/web/app/api/_lib/`, specific route |
| Database | `packages/db/src/schema.ts`              |
| Auth     | `packages/auth/src/index.ts`             |
| Tests    | Specific test file only                  |
| Mobile   | Specific screen/component                |

### Skip (Already Known)

- Standard TypeScript patterns
- React/Next.js conventions
- Node.js fundamentals
- Common library usage

## Procedure

### Step 1: Assess Current Task

What's the user working on?

- Single file edit → Keep only that file
- Cross-package feature → Keep interface files, fetch impl
- Debugging → Keep error context, fetch related

### Step 2: Identify Essential Context

For the current task, what's truly needed?

```markdown
## Essential for This Task

1. {file1} - {why needed}
2. {file2} - {why needed}

## Can Fetch If Needed

- {file3} - Only if {condition}
- {file4} - Only if {condition}

## Skip

- {file5} - Already known / not relevant
```

### Step 3: Context Shortlist

Generate a minimal file list:

```markdown
## Context Shortlist

### Must Have (read fully)

- `{path}` - Active editing

### Reference Only (read signatures)

- `{path}` - Import types
- `{path}` - Check pattern

### Fetch If Blocked

- `{path}` - Implementation details
```

### Step 4: Recommend Actions

```markdown
## Recommendations

### To Reduce Context Now

1. {action} - saves ~{tokens}
2. {action} - saves ~{tokens}

### For Future Sessions

- Start with: "I'm working on {task}. Files: {shortlist}"
- Use subagents for exploration
- Split large tasks into focused sessions
```

## Context Patterns

### Bad (Context Bloat)

```
"Read the entire codebase"
"Show me all the packages"
"Give me everything about auth"
```

### Good (Focused)

```
"I'm editing apps/web/app/api/users/route.ts"
"Show me the getCurrentUser function signature"
"What tables are in the schema?"
```

## Token Estimates

| Item                    | ~Tokens   |
| ----------------------- | --------- |
| Average TypeScript file | 500-1500  |
| Large component         | 1000-2000 |
| Schema file             | 800-1200  |
| Full CLAUDE.md          | 500       |
| Test file               | 400-800   |

## Guardrails

- DO NOT recommend skipping CLAUDE.md
- Always include the file being actively edited
- Prefer interfaces over implementations
- Suggest subagents for broad exploration
- Be specific about what "fetch if needed" means
