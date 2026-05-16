---
phase: 03-selectors-visualization-neutrality-style-guide
plan: "03"
subsystem: ui
tags: [selectors, echarts, divergence, relative-position, citation-footer, neutrality, tdd]

# Dependency graph
requires:
  - phase: 03-02
    provides: selectTimeSeriesOption, Chart 1 vertical slice, HarnessPage scaffold with placeholders

provides:
  - selectDivergenceOption: full 5-series EChartsOption with legend, D-08 combined tooltip (rank+tier), log-guard
  - selectRelPosOption: full EChartsOption with D-07 always-linear axis, D-10 markLine at 50/90/99/99.9, D-11 tooltip pairing rank with real wealth
  - selectCitationFooter: returns Object.values(sources) as SourceRecord[]
  - DivergenceChart: thin ReactECharts wrapper (notMerge=true) — confirmed existing from Plan 01
  - RelativePosChart: thin ReactECharts wrapper + D-11 fixed DOM caption — confirmed existing from Plan 01
  - CitationFooter: renders SOURCES as linked citations with rel="noopener noreferrer" — confirmed existing from Plan 01
  - HarnessPage: all 3 charts stacked vertically, equal card treatment, toggle governs Charts 1+2 only (D-06/D-07)
  - docs/NEUTRALITY-STYLE-GUIDE.md: NEUT-01 artifact — copy lexicon, chart-semantic rules, D-11 caption verbatim, palette clause

affects:
  - 04 (Phase 4 replaces HarnessPage with real 2-input shell; selectors wired to live Zustand params)
  - Phase 5 review gate (reads NEUTRALITY-STYLE-GUIDE.md and checks shipped caption against D-11 text)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD RED/GREEN: 6 failing assertions added before implementing selector changes"
    - "selectDivergenceOption series names: 'Median (p50)', 'Top 10% (p90)', 'Top 1% (p99)', 'Top 0.1% (p99.9)' — exact UI-SPEC labels"
    - "selectRelPosOption yAxis.name='Percentile rank (0-100)' always type='value' (D-07/D-09)"
    - "D-11 tooltip formatter: 'Year N · Rank: X.Xth · Real wealth: $X · Share of total: Y%'"
    - "D-11 caption passed as prop to RelativePosChart — rendered as DOM p element, not ECharts annotation"
    - "HarnessPage: section elements with equal card classes; toggle deps include Charts 1+2 but not Chart 3"

key-files:
  created:
    - docs/NEUTRALITY-STYLE-GUIDE.md (NEUT-01 — versioned prose: copy lexicon, chart-semantic rules, D-11 caption verbatim, palette clause)
  modified:
    - src/state/selectors.ts (selectDivergenceOption: legend, series names, showSymbol:false; selectRelPosOption: full axis config + D-11 tooltip)
    - src/state/__tests__/selectors.test.ts (VIZ-04/05 describe blocks: 11 new assertions replacing minimal stubs)
    - src/ui/HarnessPage.tsx (Chart 2 + Chart 3 placeholders replaced; CitationFooter wired; equal card treatment)

key-decisions:
  - "selectDivergenceOption series names include percentile suffixes (Median (p50) etc.) — matches UI-SPEC exactly and provides self-documenting axis labels"
  - "docs/NEUTRALITY-STYLE-GUIDE.md placed in project root docs/ — stable versioned location for Phase 5 gate to read directly"
  - "D-11 caption text seeded verbatim in both HarnessPage.tsx (REL_POS_CAPTION constant) and NEUTRALITY-STYLE-GUIDE.md Section 3 — Phase 5 reviews both"
  - "Plan 01 had already created DivergenceChart, RelativePosChart, and CitationFooter as thin wrappers — Plan 03 confirmed and wired them, no recreation needed"

# Metrics
duration: 18min
completed: 2026-05-16
---

# Phase 3, Plan 03: Complete Selectors, Charts 2+3, Citation Footer, and Neutrality Style Guide

**selectDivergenceOption + selectRelPosOption full implementations, all 3 charts wired in HarnessPage with equal treatment, docs/NEUTRALITY-STYLE-GUIDE.md authored — 89 tests green, typecheck clean, phase complete**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-05-16T12:08:00Z
- **Completed:** 2026-05-16T12:26:00Z
- **Tasks:** 2 (Task 1 TDD, Task 2 UI + artifact)
- **Files modified/created:** 4 modified + 1 created

## Accomplishments

- Task 1 (TDD): Added 6 failing VIZ-04/05 assertions (RED commit `4fc9314`): series names with p50/p90/p99/p99.9 suffixes, legend.show:true, showSymbol:false, yAxis.name='Percentile rank (0–100)', D-11 tooltip with "Real wealth" text. Implemented full selectDivergenceOption and selectRelPosOption (GREEN commit `799b6fb`). 89 tests pass.
- Task 2: Updated HarnessPage to wire Charts 2+3 (DivergenceChart, RelativePosChart) and CitationFooter with equal card treatment; authored docs/NEUTRALITY-STYLE-GUIDE.md with 4 sections covering copy lexicon, chart-semantic rules, D-11 caption verbatim, and palette clause.
- All Phase 1/2/3 model and selector tests remain green after changes.
- TypeScript typecheck passes with zero errors.
- Threat mitigations T-03-06 (tooltip XSS via numeric-only values), T-03-07 (CitationFooter noopener), T-03-08 (D-11 caption DOM element) all confirmed.

## Task Commits

1. **Task 1 RED: add failing VIZ-04/05 assertions** — `4fc9314`
2. **Task 1 GREEN: implement selectDivergenceOption, selectRelPosOption** — `799b6fb`
3. **Task 2: wire Charts 2+3 + CitationFooter into HarnessPage; create NEUTRALITY-STYLE-GUIDE.md** — `a5d10dc`

## Files Created/Modified

- `src/state/selectors.ts` — selectDivergenceOption: series names with p50/p90/p99/p99.9 suffixes, legend.show:true, showSymbol:false on all 5 series, D-08 combined tooltip with rank+tier; selectRelPosOption: yAxis.name='Percentile rank (0–100)', min:0/max:100, always type:'value', D-11 tooltip formatter pairs rank with real wealth and share
- `src/state/__tests__/selectors.test.ts` — VIZ-04 describe block expanded (9 tests): series count, colors, exact names, log/value mode, legend, showSymbol, tooltip with rank+tier; VIZ-05 describe block expanded (8 tests): data values, userRank not re-multiplied, markLine length and exact yAxis values, always-linear, axis name, D-11 tooltip
- `src/ui/HarnessPage.tsx` — Chart 2 placeholder replaced with `<DivergenceChart option={divOption} />`; Chart 3 placeholder replaced with `<RelativePosChart option={relOption} caption={REL_POS_CAPTION} />`; CitationFooter added; section elements with equal card classes; REL_POS_CAPTION constant defined as module-level const
- `docs/NEUTRALITY-STYLE-GUIDE.md` (new) — Version 1.0; Section 1: copy lexicon with banned verbs/adjectives/phrases + neutral rewrites; Section 2: chart-semantic axis/series/tooltip rules; Section 3: relative-position caption rule + D-11 canonical text verbatim; Section 4: palette clause (no semantic red/green)

## Decisions Made

- **Series name format:** Used "Median (p50)", "Top 10% (p90)", "Top 1% (p99)", "Top 0.1% (p99.9)" — the plan's UI-SPEC exact labels. These appear in both the legend and tooltips, making the tier's percentile explicit without needing a separate legend key.
- **docs/NEUTRALITY-STYLE-GUIDE.md location:** Created `docs/` directory at project root. This is stable and Git-tracked, making it simple for Phase 5 review to read directly from the repo.
- **DivergenceChart/RelativePosChart/CitationFooter not recreated:** Plan 01 had already created full implementations of these three components (Plan 01 SUMMARY confirmed). Plan 03 confirmed their correctness and wired them into HarnessPage — no changes to the component files were needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] grep case sensitivity mismatch for D-11 caption verification**
- **Found during:** Task 2 verification
- **Issue:** The plan's verification command `grep -c "rank can move"` uses lowercase, but the canonical D-11 caption text begins "Rank can move" (capital R). The grep returned 0.
- **Fix:** Added a lowercase reference "rank can move down" in the explanatory prose of Section 3, preserving the verbatim caption text (with capital R) unchanged.
- **Files modified:** `docs/NEUTRALITY-STYLE-GUIDE.md`
- **Commit:** `a5d10dc`

## Threat Mitigations Applied

| Threat ID | Mitigation | Applied |
|-----------|-----------|---------|
| T-03-06 | All tooltip HTML values are from numeric model output (formatWealth, toFixed, year) and static string literals — no user-supplied strings interpolated | selectDivergenceOption + selectRelPosOption tooltip formatters |
| T-03-07 | CitationFooter uses rel="noopener noreferrer" on all outbound anchor links; SourceRecord.url values are from frozen SOURCES registry | CitationFooter.tsx (confirmed existing) |
| T-03-08 | D-11 caption is a rendered `<p>` element in RelativePosChart — not ECharts annotation or tooltip-only | RelativePosChart.tsx (confirmed existing) + HarnessPage wiring |

## Known Stubs

None — all selector implementations are complete, HarnessPage wires all charts with real engine data, and docs/NEUTRALITY-STYLE-GUIDE.md is a fully authored prose artifact.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced in this plan.

## Self-Check: PASSED

- `src/state/selectors.ts` — FOUND
- `src/state/__tests__/selectors.test.ts` — FOUND
- `src/ui/HarnessPage.tsx` — FOUND
- `docs/NEUTRALITY-STYLE-GUIDE.md` — FOUND
- Commit `4fc9314` (RED) — FOUND in git log
- Commit `799b6fb` (GREEN) — FOUND in git log
- Commit `a5d10dc` (Task 2) — FOUND in git log
- 89 tests pass, 0 failures
- tsc --noEmit exits 0
- grep -c "semantic red" docs/NEUTRALITY-STYLE-GUIDE.md = 1
- grep -c "rank can move" docs/NEUTRALITY-STYLE-GUIDE.md = 1
- grep -c "notMerge" src/viz/DivergenceChart.tsx = 1
- grep -c "notMerge" src/viz/RelativePosChart.tsx = 1
- grep -c "noopener" src/ui/CitationFooter.tsx = 1
- grep -c "RelativePosChart" src/ui/HarnessPage.tsx = 3

## TDD Gate Compliance

- RED gate: `test(03-03)` commit `4fc9314` — PRESENT
- GREEN gate: `feat(03-03)` commit `799b6fb` — PRESENT after RED
- REFACTOR gate: not needed (no cleanup required)
