---
phase: 04-ui-shell-minimal-entry
plan: 03
subsystem: ui
tags: [react, zustand, tailwind, echarts, responsive, appshell, neutrality]

requires:
  - phase: 04-01
    provides: SEED_WEALTH, INFLATION_RATE, store.basis, setInputs/setHorizon/setBasis, projectionEngine
  - phase: 04-02
    provides: selectReinflated, selectSummary, LogSliderInput, HorizonSlider, BasisToggle, SummaryReadout, formatRankDelta, formatMoneyIllusionCaption
provides:
  - AppShell: responsive page-level shell composing control panel + all three charts + summary readout + citation footer
  - ControlPanel: thin container composing all four input primitives (LogSliderInput x2, HorizonSlider, BasisToggle, LogLinearToggle)
  - HarnessPage.tsx retired: main.tsx now renders AppShell directly
  - NEUTRALITY-STYLE-GUIDE.md sections 5-6: D-09 nominal caption rule and D-15 rank-delta disclosure rule seeded for Phase 5 gate
  - ENTRY-01..ENTRY-06 delivered: first-paint projection, live slider recompute, horizon control, real/nominal toggle, summary readout, responsive layout
affects:
  - Phase 05 (NEUT-02 reviewer will gate D-09 and D-15 wording from style guide)

tech-stack:
  added: []
  patterns:
    - "AppShell: useDeferredValue(inputs) → try/catch useMemo(projectionEngine) → null guard → memoized selectors chain"
    - "Engine error containment: rawResult=null on throw; JSX renders neutral diagnostic string, never stack trace (T-04-03-03)"
    - "Chart 3 (rank) uses rawResult (real-basis-independent, D-08); Charts 1-2 + summary use selectReinflated output"
    - "ControlPanel: props-driven yAxisType (shared scale toggle lifted to AppShell for single source of truth)"
    - "Responsive layout: lg:grid lg:grid-cols-[320px_1fr] + lg:sticky lg:top-8 (desktop) / full-width stack (mobile)"

key-files:
  created:
    - src/ui/AppShell.tsx
    - src/ui/ControlPanel.tsx
    - docs/NEUTRALITY-STYLE-GUIDE.md (sections 5-6 appended)
  modified:
    - src/main.tsx (HarnessPage → AppShell import swap)
  deleted:
    - src/ui/HarnessPage.tsx (Phase 3 harness retired)

key-decisions:
  - "ControlPanel receives yAxisType as prop (lifted to AppShell) — avoids duplicate state for a cross-cutting display concern"
  - "rawResult null-guard is the only error gate; engine errors render ENGINE_ERROR_MSG constant, no error boundary swallowing"
  - "Chart 3 (RelativePos) uses rawResult not selectReinflated output — rank is real-basis-independent (D-08 invariant)"
  - "HarnessPage.tsx deleted after grep confirms zero remaining importers — clean retirement, not dead file"

patterns-established:
  - "useDeferredValue over debounce: sub-ms engine recompute makes deferral sufficient to keep sliders responsive"
  - "Null-propagation chain: rawResult → result → options/summary — each level null-checks before deriving the next"
  - "ENGINE_ERROR_MSG as named constant: T-04-03-03 compliance verifiable by grep (no inline string divergence)"

requirements-completed: [ENTRY-01, ENTRY-02, ENTRY-03, ENTRY-04, ENTRY-05, ENTRY-06]

duration: ~20min
completed: 2026-05-16
---

# Phase 4 Plan 03: AppShell + ControlPanel Vertical Slice Summary

**Responsive projection shell (AppShell + ControlPanel) replacing Phase 3 HarnessPage: first-paint chart on load, live slider recompute via useDeferredValue, engine error containment with neutral diagnostic, and D-09/D-15 neutrality copy seeded in style guide.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-05-16
- **Completed:** 2026-05-16
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint, all complete)
- **Files modified:** 5 (2 created, 1 modified, 1 deleted, 1 extended)

## Accomplishments

- Delivered ENTRY-01..ENTRY-06: app renders projection on first paint with no Calculate button; sliders recompute live; real/nominal toggle re-inflates money surfaces (Chart 3 unaffected per D-08); responsive layout sticky at >=1024px, stacked at <1024px
- Engine error path fully contained (T-04-03-03): try/catch in useMemo sets rawResult=null; JSX renders exact constant "Projection unavailable: the model could not produce a result from the current parameters." — no stack trace exposure
- D-09 and D-15 neutrality copy seeded in docs/NEUTRALITY-STYLE-GUIDE.md for Phase 5 NEUT-02 gate

## Task Commits

Each task was committed atomically:

1. **Task 1: ControlPanel + AppShell + main.tsx wiring (ENTRY-01..ENTRY-06)** - `9acd657` (feat)
2. **Task 2: Seed D-09 and D-15 copy into the neutrality style guide** - `5f8f38e` (docs)
3. **Task 3: Human-verify checkpoint** - APPROVED by user (no code changes; checkpoint satisfied)

## Files Created/Modified

- `src/ui/AppShell.tsx` - Page-level responsive shell: useDeferredValue + memoized engine call + null-propagation chain → three charts + summary readout + citation footer
- `src/ui/ControlPanel.tsx` - Thin container composing LogSliderInput x2, HorizonSlider, BasisToggle, LogLinearToggle; wires store actions
- `src/main.tsx` - Import swapped from HarnessPage to AppShell (single-line change)
- `src/ui/HarnessPage.tsx` - DELETED (Phase 3 harness retired after grep confirmed zero remaining importers)
- `docs/NEUTRALITY-STYLE-GUIDE.md` - Sections 5-6 appended: D-09 nominal caption rule (verbatim template, inflation rate/source constraints, Phase 5 gate note) and D-15 rank-delta disclosure rule (pairing requirement, verbatim disclosure sentence, neutrality test)

## Decisions Made

1. **yAxisType lifted to AppShell, passed to ControlPanel as prop:** Keeps a single source of truth for the shared log/linear scale toggle; ControlPanel remains a pure container with no local state.

2. **rawResult null-guard is the sole error gate:** No React error boundary in AppShell — projectionEngine errors are caught at the useMemo call site and surface as a neutral diagnostic paragraph. This satisfies T-04-03-03 without introducing boundary swallowing that would obscure other runtime errors.

3. **Chart 3 uses rawResult, not the reinflated result:** Rank percentiles are computed in real-basis space and are invariant to the nominal re-inflation layer (D-08). Passing rawResult directly to selectRelPosOption avoids double-transformation and is the explicit contract from the plan.

4. **HarnessPage.tsx deleted immediately after import swap:** A grep scan confirmed no other file imported HarnessPage before deletion. Leaving it as a dead file would create false import paths for future developers; deletion is the clean retirement.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- `npm run build`: GREEN — 638 modules transformed, dist/ emitted (268ms, Vite 8.0.13)
- `npx tsc --noEmit`: GREEN — no type errors
- `npx vitest run`: GREEN — 125 passed (11 test files, 0 regressions)
- `grep -c 'try' src/ui/AppShell.tsx`: >= 1 (try/catch on projectionEngine present)
- `grep -c 'Projection unavailable' src/ui/AppShell.tsx`: >= 1 (neutral diagnostic constant present)
- `grep -r 'HarnessPage' src/`: no output (file deleted, import replaced)
- `grep -r 'Calculate' src/ui/`: no output (no Calculate button anywhere)
- `grep -c 'useDeferredValue' src/ui/AppShell.tsx`: >= 1 (debounce present)
- `grep -c 'D-09\|D-15' docs/NEUTRALITY-STYLE-GUIDE.md`: >= 2
- Human checkpoint: APPROVED — all 8 visual/responsive/touch checks (ENTRY-01..ENTRY-06, D-12) passed

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None — AppShell renders live model output from the first paint. No placeholder values, no "TODO" copy, no hardcoded empty collections.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or trust-boundary schema changes introduced. T-04-03-03 (info disclosure via stack trace) explicitly mitigated by the try/catch null-guard pattern.

## Next Phase Readiness

- Full vertical slice is live: inputs → memoized engine → memoized chart options → rendered charts
- Phase 5 NEUT-02 reviewer has the D-09 and D-15 copy targets in docs/NEUTRALITY-STYLE-GUIDE.md
- No blockers for Phase 5

---
*Phase: 04-ui-shell-minimal-entry*
*Completed: 2026-05-16*

## Self-Check: PASSED

- [x] src/ui/AppShell.tsx exists
- [x] src/ui/ControlPanel.tsx exists
- [x] src/ui/HarnessPage.tsx deleted (grep confirmed zero importers before deletion)
- [x] src/main.tsx updated to import AppShell
- [x] docs/NEUTRALITY-STYLE-GUIDE.md has D-09 and D-15 sections
- [x] Commits exist on main: 9acd657 (feat 04-03 task 1), 5f8f38e (docs 04-03 task 2)
- [x] npm run build: GREEN
- [x] npx tsc --noEmit: GREEN
- [x] npx vitest run: 125 passed, 0 failures
- [x] Human checkpoint: APPROVED
