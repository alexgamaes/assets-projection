---
phase: 03-selectors-visualization-neutrality-style-guide
plan: "02"
subsystem: ui
tags: [selectors, echarts, tooltip, log-axis, chart, toggle, tdd]

# Dependency graph
requires:
  - phase: 03-01
    provides: selectors.ts stubs, HarnessPage scaffold, LogLinearToggle scaffold, selector test stubs

provides:
  - selectTimeSeriesOption: full EChartsOption with tooltip formatter (year/wealth/rank/tier)
  - deriveTier() helper: maps [0,1] percentile to named tier label
  - Full log/linear toggle with explanatory copy (D-07 compliant)
  - HarnessPage showing Chart 1 with real engine output and working toggle (vertical slice)
  - VIZ-01/02/03 selector tests green with real assertions (not just toBeDefined stubs)

affects:
  - 03-03 (neutrality style guide builds on HarnessPage + citation footer)
  - 04 (Phase 4 wires real user inputs to engine; HarnessPage is replaced)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD RED/GREEN cycle: wrote failing formatter assertions before implementing"
    - "CallbackDataParams from echarts/types/dist/shared.js for type-safe tooltip formatters"
    - "deriveTier(): threshold lookup from [0,1] userPercentile to tier string"
    - "Tooltip formatter: numeric model output only -- no user-supplied strings (T-03-03)"
    - "Log axis guard applied in both selector (Math.max(1, value)) and yAxis.min:1 (T-03-04)"

key-files:
  created: []
  modified:
    - src/state/selectors.ts (selectTimeSeriesOption full implementation + deriveTier + selectDivergenceOption tooltip)
    - src/state/__tests__/selectors.test.ts (VIZ-03 TODO stubs replaced with real assertions)
    - src/ui/HarnessPage.tsx (Chart 1 vertical slice with proper layout, h1, card treatment)
    - src/ui/LogLinearToggle.tsx (Log/Linear labels, explanatory copy, scale scope notice)

key-decisions:
  - "Use CallbackDataParams union type from ECharts for tooltip formatters — avoids custom type that TypeScript rejects as incompatible with TooltipFormatterCallback"
  - "HarnessPage imports only selectTimeSeriesOption (not divergence/relPos) — Charts 2/3 are TODO placeholders for Plan 03"
  - "LogLinearToggle buttons labeled 'Log' and 'Linear' (not 'Logarithmic') per plan must_haves D-07 spec"

# Metrics
duration: 3min
completed: 2026-05-16
---

# Phase 3, Plan 02: Selectors + Chart 1 Vertical Slice Summary

**Full selectTimeSeriesOption with tooltip formatter (year/wealth/rank/tier), TDD RED/GREEN, Chart 1 visible in browser from real engine output, Log/Linear toggle functional — 78 tests green, typecheck clean**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-16T12:01:40Z
- **Completed:** 2026-05-16T12:04:30Z
- **Tasks:** 2 (Task 1 TDD, Task 2 UI)
- **Files modified:** 4

## Accomplishments

- Task 1 (TDD): Added 4 failing VIZ-03 assertions (RED commit `c8aaa99`), then implemented full `selectTimeSeriesOption` with tooltip formatter, typography, log-axis guard, and `deriveTier()` helper (GREEN commit `4270046`). 78 tests pass.
- Task 2: Updated `LogLinearToggle` ("Log"/"Linear" labels, explanatory copy, scale scope notice with aria-pressed) and `HarnessPage` (h1 "Wealth projection — model output preview", Chart 1 card, toggle above chart, Charts 2/3 TODO placeholders).
- TypeScript typecheck passes with zero errors; formatter uses `CallbackDataParams` union type from echarts.
- Threat mitigations T-03-03 (tooltip XSS guard) and T-03-04 (log axis zero-guard) both applied.

## Task Commits

1. **Task 1 RED: add failing VIZ-03 tooltip formatter assertions** — `c8aaa99`
2. **Task 1 GREEN: implement selectTimeSeriesOption with tooltip formatter** — `4270046`
3. **Task 2: update HarnessPage and LogLinearToggle for Chart 1 vertical slice** — `734d356`

## Files Created/Modified

- `src/state/selectors.ts` — full `selectTimeSeriesOption` (grid, axis typography, tooltip formatter, log zero-guard, showSymbol:false); `deriveTier()` internal helper; `selectDivergenceOption` upgraded with combined tooltip formatter; `CallbackDataParams` import for type safety
- `src/state/__tests__/selectors.test.ts` — VIZ-03 describe block: 4 TODO stubs replaced with real assertions (formatter is function, returns string with year, contains rank/tier match); VIZ-01 series length assertion added
- `src/ui/HarnessPage.tsx` — h1 "Wealth projection — model output preview" (Display 28/600); mt-8 mb-4 toggle placement; Chart 1 card (bg-slate-50 border border-slate-200 p-4 rounded); h2 "Projected wealth over time" (Heading 20/600); Charts 2/3 placeholder divs; max-w-4xl mx-auto px-4 py-16 layout
- `src/ui/LogLinearToggle.tsx` — "Log"/"Linear" button labels; aria-pressed on each segment; active bg-teal-700 text-white; explanatory paragraph (log vs linear definition); "Scale applies to the two wealth charts." scope notice

## Decisions Made

- **CallbackDataParams for tooltip formatters:** Using `CallbackDataParams | CallbackDataParams[]` union type (imported from `echarts/types/dist/shared.js`) is the correct approach — the plain object type `Array<{dataIndex, value, ...}>` is rejected by TypeScript as incompatible with `TooltipFormatterCallback<TopLevelFormatterParams>`.
- **HarnessPage imports only selectTimeSeriesOption in Plan 02:** Charts 2 and 3 are placeholder divs per plan objective. Plan 03 adds `selectDivergenceOption` and `selectRelPosOption` to HarnessPage.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type mismatch in tooltip formatter parameter**
- **Found during:** Task 1 verification (typecheck)
- **Issue:** Custom type `Array<{dataIndex, value, seriesName, color}>` was incompatible with ECharts `TooltipFormatterCallback<TopLevelFormatterParams>`, causing tsc to reject the formatter function
- **Fix:** Imported `CallbackDataParams` from `echarts/types/dist/shared.js` and used `CallbackDataParams | CallbackDataParams[]` union type — the correct ECharts-native approach
- **Files modified:** `src/state/selectors.ts`
- **Commit:** `4270046`

## Threat Mitigations Applied

| Threat ID | Mitigation | Applied |
|-----------|-----------|---------|
| T-03-03 | Tooltip strings built exclusively from numeric model output (no user-supplied strings interpolated) | selectTimeSeriesOption + selectDivergenceOption tooltip formatters |
| T-03-04 | Log axis zero-guard: Math.max(1, value) on series data AND yAxis.min=1 | selectTimeSeriesOption + selectDivergenceOption |

## Self-Check: PASSED

- `src/state/selectors.ts` — FOUND
- `src/state/__tests__/selectors.test.ts` — FOUND
- `src/ui/HarnessPage.tsx` — FOUND
- `src/ui/LogLinearToggle.tsx` — FOUND
- `src/viz/TimeSeriesChart.tsx` — FOUND
- Commit `c8aaa99` (RED) — FOUND
- Commit `4270046` (GREEN) — FOUND
- Commit `734d356` (Task 2) — FOUND
- 78 tests pass, 0 failures
- tsc --noEmit exits 0

## TDD Gate Compliance

- RED gate: `test(03-02)` commit `c8aaa99` — PRESENT
- GREEN gate: `feat(03-02)` commit `4270046` — PRESENT after RED
- REFACTOR gate: not needed (no cleanup required)
