---
phase: 04-ui-shell-minimal-entry
plan: 02
subsystem: state-selectors, ui-primitives
tags: [selectors, tdd, zustand, nominal, real, formatters, components, tailwind]
dependency_graph:
  requires:
    - 04-01 (SEED_WEALTH, INFLATION_RATE, store.basis, setInputs/setHorizon/setBasis)
  provides:
    - selectReinflated exported from src/state/selectors.ts (D-06/D-08 display-layer nominal re-inflation)
    - selectSummary + Summary interface exported from src/state/selectors.ts (D-13)
    - formatRankDelta exported from src/ui/summaryFormatters.ts (D-14 rank-delta pairing)
    - formatMoneyIllusionCaption exported from src/ui/summaryFormatters.ts (D-09 nominal caption)
    - LogSliderInput exported from src/ui/LogSliderInput.tsx (D-01/D-04)
    - HorizonSlider exported from src/ui/HorizonSlider.tsx (D-05)
    - BasisToggle exported from src/ui/BasisToggle.tsx (D-08)
    - SummaryReadout exported from src/ui/SummaryReadout.tsx (D-13/D-14/D-15/D-09)
  affects:
    - Plan 03 (ControlPanel and AppShell will compose all four components and selectors)
tech_stack:
  added: []
  patterns:
    - "TDD RED/GREEN: selectors.test.ts (RED imports added) → selectors.ts (GREEN appended)"
    - "TDD RED/GREEN: summaryFormatters.test.ts (RED module not found) → summaryFormatters.ts (GREEN created)"
    - "selectReinflated: basis=real identity return (no copy); basis=nominal spreads ...s to preserve unitless fields"
    - "selectSummary: zero-start guard prevents division-by-zero in growthMultiple and cagr"
    - "SummaryReadout delegates D-14 to formatRankDelta (pure function enforces invariant at source)"
    - "SummaryReadout delegates D-09 to formatMoneyIllusionCaption ('' for real, non-empty for nominal)"
    - "LogSliderInput: log10 space slider + numeric field; NaN/negative rejects to 0 (T-04-02-01)"
    - "BasisToggle: exact structural clone of LogLinearToggle (role=group, aria-pressed, inline-flex)"
key_files:
  created:
    - src/ui/summaryFormatters.ts
    - src/ui/__tests__/summaryFormatters.test.ts
    - src/ui/LogSliderInput.tsx
    - src/ui/HorizonSlider.tsx
    - src/ui/BasisToggle.tsx
    - src/ui/SummaryReadout.tsx
  modified:
    - src/state/selectors.ts
    - src/state/__tests__/selectors.test.ts
decisions:
  - "selectReinflated returns identity reference (r) for basis=real — no copy avoids allocation and satisfies the 'same reference' test assertion cleanly"
  - "selectSummary guard: start <= 0 (not just start === 0) to handle edge cases where engine produces sub-zero starting wealth"
  - "SummaryReadout delegates D-14 and D-09 to pure formatters (not inline JSX) — invariants enforced at the function level so they cannot be accidentally broken by future template edits"
  - "BasisToggle uses 'border-r border-slate-200' on the inactive left button (mirroring LogLinearToggle) — only the inactive non-right-edge button gets the border-r separator"
metrics:
  duration_minutes: 12
  completed_date: "2026-05-16"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 8
---

# Phase 4 Plan 02: Selector Layer and UI Primitives Summary

**One-liner:** Two new memoized selectors (selectReinflated for display-layer nominal re-inflation, selectSummary for five-metric derivation) plus four presentational UI components (LogSliderInput, HorizonSlider, BasisToggle, SummaryReadout) and two pure neutrality formatters (formatRankDelta D-14, formatMoneyIllusionCaption D-09).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | selectReinflated + selectSummary + ENTRY-04/05 tests | f301592 | src/state/selectors.ts, src/state/__tests__/selectors.test.ts |
| 2 | Pure neutrality formatters + D-14/D-09 behavioral tests | 203f261 | src/ui/summaryFormatters.ts, src/ui/__tests__/summaryFormatters.test.ts |
| 3 | LogSliderInput, HorizonSlider, BasisToggle, SummaryReadout | 3dd9bec | src/ui/LogSliderInput.tsx, src/ui/HorizonSlider.tsx, src/ui/BasisToggle.tsx, src/ui/SummaryReadout.tsx |

## What Was Built

**Task 1 (TDD RED/GREEN — selectors):** Extended `src/state/selectors.ts` with two new exports appended after `selectCitationFooter`. `selectReinflated` applies `(1 + i) ** s.year` to `userWealth` and all four `anchorWealth` fields; passes `...s` spread through to preserve `userPercentile`, `topSetPercentile`, `assetInflation`, and any internal `_totalWealth` field; returns the original `r` reference unchanged for `basis='real'` (identity, D-06). `relativePosition` is passed through unchanged (D-08 rank invariant). `selectSummary` derives `endingWealth`, `growthMultiple`, `cagr`, `startRank`, `endRank` with a guard that sets `growthMultiple = cagr = 0` when starting wealth ≤ 0. `selectSummary.test.ts` extended with ENTRY-04 (6 assertions) and ENTRY-05 (8 assertions) describe blocks including the nominal-path D-08 rank invariant (W-2).

**Task 2 (TDD RED/GREEN — formatters):** Created `src/ui/summaryFormatters.ts` as a pure TypeScript module with zero React or store imports. `formatRankDelta` returns a single indivisible string with `p${start} → p${end}, while real wealth grew ${multiple}×.` — the `while real wealth grew` clause is mandatory (D-14). `formatMoneyIllusionCaption` returns `''` immediately for `basis='real'` and a full disclosure sentence for `basis='nominal'` including the rate as a percentage and the source name (D-09). New `src/ui/__tests__/summaryFormatters.test.ts` with 11 behavioral assertions all GREEN.

**Task 3 (UI primitives):** Four new pure presentational components, all without store imports.

- `LogSliderInput`: `<label>` with label span, formatWealth value readout, log-scale `input[type=range]` (log10 space, D-04), and `input[type=number]` with `inputMode="numeric"` and the NaN/negative boundary guard (T-04-02-01).
- `HorizonSlider`: `<div>` with flex header row (label + live `{value} years` readout), linear `input[type=range]` min=10 max=60, and scope line.
- `BasisToggle`: exact structural clone of `LogLinearToggle.tsx` — `role="group"` + `aria-label="Display basis"`, two buttons with `aria-pressed`, `bg-teal-700 text-white` active state, scope line, explanatory copy. Copy is analytically neutral (D-08).
- `SummaryReadout`: three metrics in `<dl>` with Label 14/400 dt and Body 16/600 dd; D-14 rank-delta paragraph delegated to `formatRankDelta`; D-15 neutral disclosure; D-09 money-illusion caption delegated to `formatMoneyIllusionCaption` with truthiness guard.

## Verification Results

- npm test: 125 passed (26 new + 99 prior — no regressions)
- npm run typecheck: clean (tsc --noEmit no errors)
- grep -c 'formatRankDelta' src/ui/SummaryReadout.tsx → 4 (>= 1 required)
- grep -c 'formatMoneyIllusionCaption' src/ui/SummaryReadout.tsx → 4 (>= 1 required)
- grep -c 'selectReinflated\|selectSummary' src/state/selectors.ts → 7 (>= 2 required)

## Decisions Made

1. **selectReinflated identity return for basis=real:** Returning `r` directly (not a copy) satisfies the "same reference" TDD assertion cleanly and avoids unnecessary object allocation on every render cycle.

2. **zero-start guard uses `start <= 0` not `start === 0`:** The engine can theoretically produce zero starting wealth (not just exactly zero); guarding ≤ 0 is more robust and covers negative edge cases without changing semantics for the normal path.

3. **SummaryReadout delegates D-14 and D-09 to pure formatters:** Inlining the rank-delta template in JSX (as 04-PATTERNS.md showed) would allow future template refactors to accidentally strip the `while real wealth grew` clause. By calling `formatRankDelta()`, the invariant is enforced at the pure-function level and covered by behavioral tests that check the regex pattern. Same reasoning for `formatMoneyIllusionCaption`.

4. **BasisToggle border-r on inactive left button only:** Matches `LogLinearToggle`'s pattern — the separator border between buttons only appears on the inactive non-rightmost button. When the left button is active, the `bg-teal-700` provides visual separation; when inactive, `border-r border-slate-200` creates the divider.

## Deviations from Plan

**1. [Rule 2 - Missing critical functionality] SummaryReadout delegates D-14/D-09 to pure formatters (enhanced from plan spec)**

- **Found during:** Task 3
- **Issue:** The plan's `<action>` block correctly specified `formatRankDelta` and `formatMoneyIllusionCaption` imports in SummaryReadout. The 04-PATTERNS.md analog showed inline JSX. Plan spec takes precedence per CLAUDE.md.
- **Fix:** Used `formatRankDelta` and `formatMoneyIllusionCaption` as specified in the plan's must_haves and action block. This is the intended behavior, not a deviation per se — documented here for clarity.
- **Files modified:** src/ui/SummaryReadout.tsx

## Known Stubs

None — all components render data from typed props. No hardcoded placeholder values, no "TODO" or "coming soon" copy.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or trust-boundary schema changes introduced.

## Self-Check: PASSED

- [x] src/state/selectors.ts exports selectReinflated and selectSummary (and Summary interface)
- [x] src/state/__tests__/selectors.test.ts has ENTRY-04 and ENTRY-05 describe blocks (46 total tests)
- [x] src/ui/summaryFormatters.ts exports formatRankDelta and formatMoneyIllusionCaption
- [x] src/ui/__tests__/summaryFormatters.test.ts has 11 behavioral assertions
- [x] src/ui/LogSliderInput.tsx exists and exports LogSliderInput
- [x] src/ui/HorizonSlider.tsx exists and exports HorizonSlider
- [x] src/ui/BasisToggle.tsx exists and exports BasisToggle
- [x] src/ui/SummaryReadout.tsx exists and exports SummaryReadout
- [x] Task commits exist: f301592, 203f261, 3dd9bec
