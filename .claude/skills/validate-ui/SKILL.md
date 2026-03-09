---
name: validate-ui
description: Validate recent UI changes across web and mobile. Test affected features for correct behavior.
allowed-tools: Read, Grep, Glob, Bash, Agent
---

# Validate UI

Visually verifies UI changes across web (Chrome extension) and mobile (iOS simulator).

## When to Use

- "Validate the UI"
- "Use chrome and simulator to verify"
- "Test the changes visually"
- After implementing a feature or bug fix that affects UI

## Procedure

### Step 1: Identify What Changed

Review recent changes to determine:

- Which screens/pages were modified
- Which features were added or fixed
- Whether changes affect web, mobile, or both

### Step 2: Validate Web (Chrome Extension)

1. Load Chrome extension tools (`mcp__claude-in-chrome__*`)
2. Check current tabs with `tabs_context_mcp`
3. Navigate to the web app (check port in project config or running processes)
4. Walk through each affected page/flow:
   - Take screenshots of key states
   - Test interactive elements (buttons, modals, dropdowns)
   - Verify data displays correctly
   - Check for layout shift when opening modals/menus
5. Report any issues found

### Step 3: Validate Mobile (iOS Simulator)

1. Load iOS simulator tools (`mcp__ios-simulator__*`)
2. Ensure the simulator is booted and app is running
3. Navigate to each affected screen:
   - Take screenshots
   - Test tap interactions
   - Test scroll behavior
   - Verify keyboard doesn't cover submit buttons
4. Report any issues found

### Step 4: Cross-Platform Comparison

Compare web and mobile for:

- Feature parity — same data and options available
- Consistent behavior — same actions produce same results
- Appropriate platform conventions — web uses shadcn, mobile uses native patterns

### Step 5: Report

Summarize validation results:

- **Pass** — what looks correct on each platform
- **Issues** — what needs fixing, with screenshots if possible
- **Suggestions** — any UX improvements noticed during testing

## Guardrails

- Don't try to start dev servers — they should already be running
- If Chrome extension or simulator is unresponsive, inform the user rather than retrying indefinitely
- If the user is not logged in, ask them to log in before proceeding
- Don't make code changes during validation — only report findings
