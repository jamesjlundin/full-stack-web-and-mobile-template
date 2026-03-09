---
paths:
  - 'apps/web/**'
  - 'apps/mobile/**'
---

# UI Quality Rules

## Web: Scrollbar Layout Shift

When adding or modifying dialogs, modals, dropdowns, or popovers, ensure opening them does not cause background page content to shift horizontally. This is caused by the scrollbar appearing/disappearing when `overflow: hidden` is toggled on `<body>`.

Fix: Use `scrollbar-gutter: stable` on the html/body, or compensate with `padding-right` equal to scrollbar width when hiding overflow.

## Mobile: Keyboard Avoidance

Submit/save buttons in modals and forms must remain fully visible above the iOS keyboard when it opens. Use `KeyboardAvoidingView` with appropriate `keyboardVerticalOffset` and ensure sticky footer buttons have sufficient `paddingBottom`.

## Empty States

All empty state screens must have meaningful icons and copy. Never render raw fallback text like `<>` or broken icon references.

## Modal Scroll Behavior (Mobile)

Content inside bottom-sheet modals must scroll independently from the modal dismiss gesture. Only dragging on the modal header/handle should dismiss. Scrolling inside the content area should scroll the content.
