---
name: review-to-merge
description: Structured implementer-verifier-reviewer pipeline for high-quality code. Artifact-based handoffs between roles. Use when needing rigorous review process, handoff between roles, or review pipeline for critical changes.
allowed-tools: Read, Grep, Glob, Bash
---

# Review-to-Merge Pipeline

Structured multi-role review process for critical changes.

## When to Use

- "Critical change needs review"
- "Set up review pipeline"
- "Handoff to reviewer"
- "Verify this implementation"
- "Need sign-off process"

## Pipeline Roles

### 1. Implementer

- Writes the code
- Creates initial tests
- Documents changes
- Produces implementation artifact

### 2. Verifier

- Runs all tests
- Checks edge cases
- Validates against requirements
- Produces verification artifact

### 3. Reviewer

- Reviews code quality
- Checks security
- Validates patterns
- Produces review artifact

## Artifact Templates

### Implementation Artifact

```markdown
# Implementation Artifact

## Change Summary

{Brief description of what was implemented}

## Files Modified

| File   | Change Type         | Lines Changed |
| ------ | ------------------- | ------------- |
| {path} | {add/modify/delete} | +{n}/-{n}     |

## Requirements Addressed

- [x] {requirement 1}
- [x] {requirement 2}

## Tests Added

- {test file}: {what it tests}

## Known Limitations

- {limitation 1}

## Ready for Verification

- [ ] Code compiles: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint`
- [ ] Unit tests pass: `pnpm -C apps/mobile test`
- [ ] Integration tests pass: `pnpm test:integration`

## Handoff Notes

{Any context the verifier needs}
```

### Verification Artifact

```markdown
# Verification Artifact

## Implementation Reviewed

{Link to implementation artifact or PR}

## Test Results

| Test Suite  | Status      | Notes   |
| ----------- | ----------- | ------- |
| TypeScript  | {PASS/FAIL} | {notes} |
| ESLint      | {PASS/FAIL} | {notes} |
| Integration | {PASS/FAIL} | {notes} |
| Mobile      | {PASS/FAIL} | {notes} |

## Edge Cases Tested

- [x] {edge case 1}: {result}
- [x] {edge case 2}: {result}

## Requirements Verification

- [x] {requirement 1}: Verified by {how}
- [x] {requirement 2}: Verified by {how}

## Issues Found

| Severity       | Issue         | Location    | Status       |
| -------------- | ------------- | ----------- | ------------ |
| {High/Med/Low} | {description} | {file:line} | {Open/Fixed} |

## Verification Status

{PASSED | FAILED | BLOCKED}

## Handoff Notes

{Any context the reviewer needs}
```

### Review Artifact

```markdown
# Review Artifact

## Implementation Reviewed

{Link to PR}

## Code Quality

| Aspect          | Rating | Notes   |
| --------------- | ------ | ------- |
| Readability     | {1-5}  | {notes} |
| Maintainability | {1-5}  | {notes} |
| Performance     | {1-5}  | {notes} |
| Security        | {1-5}  | {notes} |
| Testing         | {1-5}  | {notes} |

## Checklist

- [ ] Auth properly implemented
- [ ] Rate limiting applied
- [ ] Input validated
- [ ] No secrets in code
- [ ] Error handling appropriate
- [ ] Follows repo patterns

## Findings

### Critical (Block Merge)

{none or list}

### Recommendations

{list of suggestions}

### Positive Observations

{what was done well}

## Final Decision

{APPROVE | REQUEST_CHANGES | NEEDS_DISCUSSION}

## Conditions for Merge

{any conditions that must be met}
```

## Procedure

### Step 1: Implementer Phase

1. Implement the feature/fix
2. Write tests
3. Run quality checks:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test:integration
   ```
4. Create Implementation Artifact
5. Create PR as draft

### Step 2: Verifier Phase

1. Pull the branch
2. Run full test suite
3. Test edge cases manually
4. Validate against requirements
5. Create Verification Artifact
6. If issues found, return to Implementer
7. If passed, proceed to Reviewer

### Step 3: Reviewer Phase

1. Review code changes
2. Check security implications
3. Validate patterns and quality
4. Create Review Artifact
5. If approved, mark PR ready for merge
6. If changes requested, return to Implementer

### Step 4: Merge

1. Verify all artifacts complete
2. Verify CI passes
3. Squash and merge to main
4. Monitor deployment

## Guardrails

- Each role must complete their artifact
- No skipping phases for "small" changes
- Verifier cannot be same as Implementer
- Reviewer has final say on merge
- All artifacts stored in PR comments
- Critical findings block merge until resolved
