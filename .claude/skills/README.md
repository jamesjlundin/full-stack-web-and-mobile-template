# Claude Code Skills

This directory contains project-specific Skills for Claude Code that enhance AI-assisted development workflows.

## What are Skills?

Skills are organized folders of instructions, scripts, and resources that Claude can discover and load dynamically to perform better at specific tasks. They extend Claude's capabilities by packaging repo-specific expertise into composable resources.

## Available Skills

### Navigation & Understanding

| Skill            | Purpose                        | Trigger                      |
| ---------------- | ------------------------------ | ---------------------------- |
| `repo-navigator` | Map repo structure, find files | "where is", "find", "locate" |

### Implementation Work

| Skill                   | Purpose                                      | Trigger                      |
| ----------------------- | -------------------------------------------- | ---------------------------- |
| `api-endpoint-scaffold` | Create API endpoints with auth/rate limiting | "add endpoint", "create API" |
| `db-schema-change`      | Safely modify database schema                | "add table", "migration"     |

### Quality Gates

| Skill         | Purpose                             | Trigger                  |
| ------------- | ----------------------------------- | ------------------------ |
| `pr-review`   | Review PRs for quality and security | "review", "check PR"     |
| `test-writer` | Write integration/unit tests        | "write test", "add test" |

### Operations

| Skill           | Purpose               | Trigger                     |
| --------------- | --------------------- | --------------------------- |
| `ci-fixer`      | Debug CI/CD failures  | "CI failing", "build error" |
| `deploy-helper` | Guide safe deployment | "deploy", "release"         |

### Safety & Security

| Skill             | Purpose              | Trigger                      |
| ----------------- | -------------------- | ---------------------------- |
| `secrets-scanner` | Scan for secrets/PII | "scan secrets", "check keys" |

### Power-User Workflows

| Skill             | Purpose                    | Trigger                         |
| ----------------- | -------------------------- | ------------------------------- |
| `context-diet`    | Optimize context window    | "too much context", "slim down" |
| `swarm-workflow`  | Split work across sessions | "parallel work", "swarm"        |
| `review-to-merge` | Structured review pipeline | "review pipeline", "handoff"    |

## How Skills Work

1. Claude loads skill **descriptions** at startup (~100 tokens each)
2. When your request matches a skill description, Claude offers to use it
3. On approval, Claude loads the full SKILL.md instructions
4. Supporting files (templates, scripts) load only when referenced

## Skill Structure

```
skill-name/
├── SKILL.md          # Main instructions (required)
├── templates.md      # Code templates (optional)
├── checklist.md      # Review checklists (optional)
└── scripts/          # Helper scripts (optional)
    └── helper.sh
```

## Best Practices

1. **Be specific in requests** - Trigger words help Claude match skills
2. **One task at a time** - Skills work best for focused work
3. **Trust the guardrails** - Skills have built-in safety constraints
4. **Use scripts** - Helper scripts automate repetitive checks

## Adding New Skills

1. Create a new directory under `.claude/skills/`
2. Add `SKILL.md` with YAML frontmatter:
   ```yaml
   ---
   name: my-skill
   description: What it does. Use when [trigger condition].
   allowed-tools: Read, Grep, Glob # Optional tool restrictions
   ---
   ```
3. Keep SKILL.md under 500 lines; split into reference files
4. Test by asking Claude to perform the skill's task

## Usage Examples

### Navigation & Understanding

```
User: "Where is the user authentication handled?"
→ Claude uses repo-navigator to find packages/auth/src/index.ts

User: "Show me the structure of this monorepo"
→ Claude maps packages and apps, runs repo-inventory.sh
```

### Implementation Work

```
User: "Create a POST endpoint for /api/users/preferences"
→ Claude uses api-endpoint-scaffold to create:
  - apps/web/app/api/users/preferences/route.ts
  - packages/tests/src/preferences.test.ts

User: "Add a notifications table to the database"
→ Claude uses db-schema-change to:
  - Update packages/db/src/schema.ts
  - Generate migration
  - Apply migration locally
```

### Quality Gates

```
User: "Review my changes before I push"
→ Claude uses pr-review to check:
  - Security concerns
  - Pattern compliance
  - Test coverage

User: "Write tests for the new preferences endpoint"
→ Claude uses test-writer to create integration tests
```

### Operations

```
User: "CI is failing on my PR"
→ Claude uses ci-fixer to:
  - Identify the failing step
  - Reproduce locally
  - Suggest fixes

User: "Is this ready to deploy?"
→ Claude uses deploy-helper to run pre-deploy checklist
```

### Safety & Security

```
User: "Check if there are any hardcoded secrets"
→ Claude uses secrets-scanner to:
  - Scan for API keys and credentials
  - Check .env files aren't committed
  - Generate security report
```

### Power-User Workflows

```
User: "This feature is too big for one session"
→ Claude uses swarm-workflow to:
  - Break task into independent units
  - Create branch plan
  - Define interfaces for parallel work

User: "I'm hitting context limits"
→ Claude uses context-diet to:
  - Identify essential files
  - Create minimal file shortlist
  - Recommend what to fetch on-demand

User: "Set up a review pipeline for this critical change"
→ Claude uses review-to-merge to:
  - Create implementation artifact
  - Define verification steps
  - Prepare handoff documentation
```

## Maintenance

- Update skills when repo patterns change
- Remove skills that become obsolete
- Add skills for repeated workflows you notice
