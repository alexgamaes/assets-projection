---
status: partial
phase: 05-neutrality-review-release-readiness
source: [05-VERIFICATION.md]
started: 2026-05-17T07:27:21Z
updated: 2026-05-17T07:27:21Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Relative-position chart caption renders visibly
expected: The `REL_POS_CAPTION` paragraph appears below the "Position in the wealth distribution over time" chart in the running app (constant is byte-exact verified by source-read; no DOM tooling configured to assert render).
result: [pending]

### 2. CR-01 nominal-basis invariance visible in browser
expected: With Nominal basis selected, the "while real wealth grew X×" multiple stays constant relative to the real basis while the "Ending wealth (nominal)" figure increases — confirming the D-14 mislabel fix is visible end-to-end.
result: [pending]

### 3. JST survivorship caveat renders in footer
expected: Scrolling to the citation footer shows a second paragraph containing the ~0.5pp survivorship-bias caveat text (`JST_SURVIVORSHIP_CAVEAT`).
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
