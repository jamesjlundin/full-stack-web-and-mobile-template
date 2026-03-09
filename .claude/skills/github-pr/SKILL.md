---
name: github-pr
description: Review, create, and manage GitHub PRs using the gh CLI. View diffs, checks, comments, and create PRs with proper formatting.
triggers:
  - /github-pr
  - When reviewing pull requests
  - When creating pull requests
  - When checking PR status or CI checks
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Edit
  - Write
---

# GitHub PR Management

Use the `gh` CLI for all GitHub PR operations. This avoids MCP overhead while providing full PR workflow support.

## Common Workflows

### Review a PR

```bash
# View PR details
gh pr view <number>

# View PR diff
gh pr diff <number>

# View PR checks/CI status
gh pr checks <number>

# View PR review comments
gh pr view <number> --comments

# Checkout PR locally for testing
gh pr checkout <number>
```

### Create a PR

```bash
# Create with title and body
gh pr create --title "Title" --body "$(cat <<'EOF'
## Summary
- Change description

## Test plan
- [ ] Test steps

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# Create as draft
gh pr create --draft --title "WIP: Title" --body "Description"
```

### Manage PRs

```bash
# List open PRs
gh pr list

# Merge a PR
gh pr merge <number> --squash

# Close a PR
gh pr close <number>

# Add reviewers
gh pr edit <number> --add-reviewer username

# View PR as JSON for programmatic access
gh pr view <number> --json title,body,state,reviews,checks
```

### Check CI Status

```bash
# View all checks for current branch
gh pr checks

# View specific run details
gh run view <run-id>

# View run logs
gh run view <run-id> --log-failed
```

## Best Practices

- Always use `--json` flag when you need structured data for analysis
- Use `gh pr diff` to review changes before approving
- Check `gh pr checks` before merging to ensure CI passes
- When creating PRs, always include a test plan section
