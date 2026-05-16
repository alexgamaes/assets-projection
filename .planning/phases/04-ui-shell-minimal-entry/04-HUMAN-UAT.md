---
status: partial
phase: 04-ui-shell-minimal-entry
source: [04-VERIFICATION.md]
started: "2026-05-16T22:01:15Z"
updated: "2026-05-16T22:01:15Z"
---

## Current Test

[awaiting human testing]

## Tests

### 1. First-paint projection and no Calculate button
expected: On load, a projection chart renders immediately with current wealth defaulted to ~$200k; no Calculate button anywhere.
result: [pending]

### 2. Live slider recompute without jank
expected: Dragging the current-wealth slider rapidly updates charts/summary smoothly (debounced via useDeferredValue), no stutter.
result: [pending]

### 3. Nominal mode toggle and D-09 caption
expected: Clicking "Nominal" updates charts and shows the D-09 not-inflation-adjusted caption; "Real" hides it.
result: [pending]

### 4. CR-01 — rank-delta growth multiple basis correctness
expected: In the summary rank-delta sentence, the "real wealth grew Gx" value should NOT change between Real and Nominal modes. Code review CR-01 indicates it currently DOES change (nominal multiple mislabeled as real) — must be fixed before Phase 5 NEUT-02 sign-off.
result: [pending]

### 5. D-15 disclosure always visible
expected: The D-15 rank-delta disclosure sentence is visible in both Real and Nominal modes.
result: [pending]

### 6. Responsive layout and touch degradation
expected: Below 1024px the control panel stacks full-width above charts; above 1024px it is a sticky left column. On a 375×667 touch viewport all controls are tappable and chart tooltips work on tap.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
