---
phase: 05-neutrality-review-release-readiness
plan: "01"
subsystem: selector-layer / ui-composition
tags: [cr-01, d-14, neutrality, tdd, bugfix]
dependency_graph:
  requires: []
  provides: [realGrowthMultiple-field, two-arg-selectSummary, d14-invariant-regression-test]
  affects: [src/state/selectors.ts, src/ui/AppShell.tsx, src/ui/SummaryReadout.tsx, src/state/__tests__/selectors.test.ts]
tech_stack:
  added: []
  patterns: [tdd-red-green, pure-function-regression-test, two-arg-selector]
key_files:
  modified:
    - src/state/selectors.ts
    - src/state/__tests__/selectors.test.ts
    - src/ui/AppShell.tsx
    - src/ui/SummaryReadout.tsx
decisions:
  - "selectSummary two-arg form (result, rawResult): keeps basis logic in selector layer, not composition layer"
  - "realGrowthMultiple computed from raw.series only (basis-invariant by construction)"
  - "formatRankDelta template unchanged — defect was upstream data flow, not the formatter string"
metrics:
  duration: "~4 min"
  completed: "2026-05-17"
  tasks_completed: 2
  files_modified: 4
---

# Phase 05 Plan 01: CR-01 Fix — Basis-Invariant realGrowthMultiple Summary

**One-liner:** Fixed D-14 violation by adding `realGrowthMultiple` (always real-basis) to `Summary` and threading `rawResult` into `selectSummary(result, rawResult)`, so the "while real wealth grew G×" clause is basis-invariant in both real and nominal modes.

## What Was Built

Fixed the carried mandatory defect CR-01: in nominal basis the SummaryReadout D-14 clause ("while real wealth grew [G]×") was passing the re-inflated (nominal) growth multiple, violating Style Guide §6/D-14. The fix adds a `realGrowthMultiple` field to `Summary`, makes `selectSummary` two-arg, wires `rawResult` through AppShell, and updates SummaryReadout to use the real multiple.

### Task 1 — Add realGrowthMultiple + two-arg selectSummary + regression test

**TDD cycle executed:**

- **RED:** Added failing `CR-01/D-14` test case to `ENTRY-05: selectSummary` describe block asserting `nominal.realGrowthMultiple toBeCloseTo real.realGrowthMultiple` (precision 10) and `nominal.endingWealth > real.endingWealth`. Committed: `a2f1e91`.
- **GREEN:** Added `realGrowthMultiple: number` to `Summary` interface with `// ALWAYS real-basis — feeds the §6/D-14 clause` comment. Changed `selectSummary` to two-arg `selectSummary(r: ProjectionResult, raw: ProjectionResult)`. Computes `realGrowthMultiple` from `raw.series` first/last `userWealth` using `rStart > 0 ? rEnd / rStart : 0` guard. Updated all 7 existing call sites in `selectors.test.ts` to two-arg form. 72/72 tests green. Committed: `11f9e22`.

### Task 2 — Wire through AppShell + SummaryReadout + typecheck

- **AppShell.tsx:** Changed `summary` useMemo to `selectSummary(result, rawResult)` guarded on both non-null, with `rawResult` in dependency array — mirrors existing `relOption`/`shareOption` rawResult-threading idiom.
- **SummaryReadout.tsx:** Changed D-14 clause from `summary.growthMultiple` to `summary.realGrowthMultiple` in `formatRankDelta(...)` call. `formatRankDelta` template unchanged (defect was data flow, not template).
- `npm run typecheck` exits 0 — all call sites updated.
- Full Vitest suite 168/168 green. Committed: `27705d0`.

## Verification

- `grep -n "realGrowthMultiple" src/state/selectors.ts` shows interface field (L403) and computed value (L681).
- `npx vitest run src/state/__tests__/selectors.test.ts` — 72/72 passed including CR-01/D-14 case.
- `grep -n "selectSummary(result, rawResult)" src/ui/AppShell.tsx` matches L97.
- `grep -n "summary.realGrowthMultiple" src/ui/SummaryReadout.tsx` matches L55.
- `grep -c "summary.growthMultiple" src/ui/SummaryReadout.tsx` → 1 (only the display "Growth multiple" metric at L41, not the D-14 clause).
- `npm run typecheck` exits 0.
- `npx vitest run` — 168/168 passed.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 RED | a2f1e91 | test(05-01): add failing CR-01/D-14 regression test for basis-invariant realGrowthMultiple |
| Task 1 GREEN | 11f9e22 | feat(05-01): add realGrowthMultiple to Summary + two-arg selectSummary (CR-01) |
| Task 2 | 27705d0 | feat(05-01): wire realGrowthMultiple through AppShell + SummaryReadout (CR-01 complete) |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — all wiring is live data. `realGrowthMultiple` is computed from `rawResult.series` first/last `userWealth`, which is the real engine output.

## Threat Flags

None — this plan introduces no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries. CR-01 is a pure internal data-flow correction in a client-side static SPA.

## TDD Gate Compliance

Gate sequence validated:
1. `test(05-01)` commit `a2f1e91` exists (RED gate).
2. `feat(05-01)` commit `11f9e22` exists after it (GREEN gate).
3. No refactor step needed — implementation was clean on first pass.

## Self-Check: PASSED

- `src/state/selectors.ts` — modified (realGrowthMultiple field + two-arg selectSummary)
- `src/state/__tests__/selectors.test.ts` — modified (new CR-01/D-14 test + all call sites updated)
- `src/ui/AppShell.tsx` — modified (selectSummary(result, rawResult))
- `src/ui/SummaryReadout.tsx` — modified (summary.realGrowthMultiple)
- Commits a2f1e91, 11f9e22, 27705d0 — all exist in git log
