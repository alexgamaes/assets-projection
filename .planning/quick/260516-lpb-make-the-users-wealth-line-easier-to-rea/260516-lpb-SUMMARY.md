---
phase: quick-260516-lpb
plan: 01
subsystem: state/selectors
tags: [visualization, echarts, user-experience, legibility]
dependency_graph:
  requires: []
  provides: [user-series-width-3.5, user-series-end-label]
  affects: [src/state/selectors.ts]
tech_stack:
  added: []
  patterns: [echarts-endLabel, series-lineStyle-width]
key_files:
  created: []
  modified:
    - src/state/selectors.ts
    - src/state/__tests__/selectors.test.ts
decisions:
  - endLabel formatter is a function returning literal string 'You' — no user input surface, canvas-rendered (not innerHTML), no XSS risk
  - Color for endLabel reuses COLORS.user (#0F766E) — no new hue, D-03 satisfied
  - Tier series (median/top10/top1/top01) in selectDivergenceOption retain width:2 unchanged
metrics:
  duration: "~5 minutes"
  completed: "2026-05-16"
  tasks_completed: 2
  files_modified: 2
---

# Quick Task 260516-lpb: Make User Wealth Line Easier to Read — Summary

## One-liner

User series widened to 3.5px and end-of-line "You" label added via ECharts `endLabel` across all three selectors (time-series, divergence, relative-position), with COLORS.user (#0F766E) unchanged.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| RED | Add failing assertions for width=3.5 and endLabel | 9650b5d | src/state/__tests__/selectors.test.ts |
| GREEN | Widen user series and add end-of-line You label | 070728b | src/state/selectors.ts |

## Changes Made

### src/state/selectors.ts

Three selectors updated — no other logic touched:

- `selectTimeSeriesOption`: user series `lineStyle.width` changed from `2` to `3.5`; `endLabel: { show: true, formatter: () => 'You', color: COLORS.user, fontSize: 12, fontWeight: 600 }` added
- `selectDivergenceOption`: same width and endLabel change on user series (series[0] only); tier series[1..4] remain at width:2
- `selectRelPosOption`: same width and endLabel change on user series

### src/state/__tests__/selectors.test.ts

7 new `it(...)` assertions added inside existing describe blocks:
- VIZ-01: lineStyle.width === 3.5, endLabel.show === true
- VIZ-04: lineStyle.width === 3.5 (user), lineStyle.width === 2 (tier series[1..4]), endLabel.show === true
- VIZ-05: lineStyle.width === 3.5, endLabel.show === true

## Verification

- `tsc --noEmit`: 0 errors
- `vitest run`: 132 tests pass (11 test files) — exceeds 125+ requirement
- COLORS.user: unchanged at #0F766E (teal-700)
- No new hue introduced: D-03 satisfied
- Tier series in divergence chart: all remain at width:2

## Deviations from Plan

None — plan executed exactly as written. TDD RED/GREEN cycle followed: failing tests committed first, implementation committed second.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary crossings introduced. endLabel formatter returns a string literal, not user-supplied input. ECharts renders to canvas (not innerHTML).

## Self-Check: PASSED

- src/state/selectors.ts: modified (user series width=3.5, endLabel in all 3 selectors)
- src/state/__tests__/selectors.test.ts: modified (7 new assertions)
- Commits: 9650b5d (RED), 070728b (GREEN) — both verified in git log
- tsc --noEmit: clean
- vitest run: 132/132 pass
