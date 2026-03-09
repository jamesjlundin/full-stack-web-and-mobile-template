---
name: visual-audit
description: Conduct a comprehensive UI/UX audit of the entire app. Navigate all pages, identify visual issues and inconsistencies.
allowed-tools: Read, Grep, Glob, Bash, Agent
---

# Visual Audit

Systematically navigates through the app on both platforms, screenshots every screen, and produces a prioritized list of UI/UX issues.

## When to Use

- "Audit the UI"
- "Review the app design"
- "Find UX issues"
- "What needs visual improvement?"

## Procedure

### Step 1: Prepare

1. Load Chrome extension and iOS simulator tools
2. Confirm web app is running
3. Confirm iOS simulator is booted with the app
4. Discover all app routes by scanning `apps/web/app/` for `page.tsx` files

### Step 2: Web Audit

Navigate through each main section, taking screenshots.

For each page, check:

- Layout and spacing consistency
- Empty states
- Loading states
- Interactive elements (buttons, modals, dropdowns)
- Responsiveness
- Color/contrast issues

### Step 3: Mobile Audit

Navigate through the same sections on mobile:

- Check navigation (drawer, tabs)
- Check modal presentation
- Check keyboard interactions
- Check scroll behavior

### Step 4: Cross-Platform Comparison

Identify discrepancies:

- Features on one platform but not the other
- Different data shown for same entities
- Inconsistent terminology or iconography

### Step 5: Prioritized Report

Produce a report with sections:

**Critical** — Broken functionality, data not displaying, crashes
**High** — Confusing UX, missing features, wrong data format
**Medium** — Inconsistent styling, spacing issues, minor layout problems
**Low** — Polish items, animation improvements, nice-to-haves

Each item should include:

- Platform (web/mobile/both)
- Screen/page affected
- What's wrong
- Specific suggestion for improvement

## Guardrails

- This is a read-only audit — don't make code changes
- Focus on actionable issues, not subjective preferences
- Screenshot evidence for each issue when possible
- Don't spend more than 2-3 minutes per page
