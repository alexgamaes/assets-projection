---
status: resolved
phase: 01-model-foundation
source: [01-VERIFICATION.md, 01-REVIEW.md]
started: 2026-05-16T00:00:00Z
updated: 2026-05-16T00:00:00Z
---

## Current Test

[awaiting human decision]

## Tests

### 1. CR-03 — userPercentile contract mismatch (Phase 3 downstream risk)
expected: `types.ts` documents `userPercentile` as "0–100" but the engine stores the raw `percentileOf()` value in [0,1]. Engine is internally consistent (all tests pass), but Phase 3 chart selectors reading the documented contract get values 100x too small. Decide: fix docstring to "0–1" OR multiply by 100 in engine.
result: resolved — docstring corrected to state the [0,1] CDF-fraction contract (commit follows). Engine left unchanged (internally consistent; `returnAtPercentile` and `relativePosition.ts` already operate on [0,1] and ×100 respectively). tsc clean, 44/44 tests pass.

### 2. CR-01 / CR-02 — latent bisect + alpha≤1 silent failures (Phase 2 data risk)
expected: Dormant on the synthetic anchor set (all tests pass); activate on real empirical data in Phase 2. CR-01: `bisect()` has no root-bracketing guard — returns confidently wrong values silently if the root lies outside the hardcoded bracket. CR-02: `paretoConditionalMean` returns negative for alpha ≤ 1 (top01/top1 ≥ 10), producing negative `totalWealth` and silently poisoning all downstream share/percentile math. Decide: fix now (recommended), or explicitly document that Phase 2 calibration must keep alpha > 1 and validate bracket before loading real data.
result: deferred (developer decision 2026-05-16) — carried forward as a documented Phase 2 PRECONDITION. Phase 2 parameter calibration MUST keep alpha > 1 (i.e. top01/top1 < 10) and MUST validate bisect bracket coverage before loading any real empirical anchors. Recommended: address CR-01/CR-02 with bracket-guard + alpha-domain assertions as the first task of Phase 2 before calibration. See 01-REVIEW.md CR-01/CR-02 for exact locations.

## Summary

total: 2
passed: 1
issues: 0
pending: 0
skipped: 0
blocked: 0
deferred: 1

## Notes

CR-03 fixed (docstring contract corrected, doc-only, non-breaking). CR-01/CR-02
deferred by developer decision as documented Phase 2 preconditions (alpha > 1 +
bisect bracket validation before loading real anchors).

## Gaps
