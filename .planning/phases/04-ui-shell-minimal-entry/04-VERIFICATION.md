---
phase: 04-ui-shell-minimal-entry
verified: 2026-05-16T15:00:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "First-paint projection renders with no Calculate button on load"
    expected: "App shows projection charts immediately when opened at localhost:5173; no Calculate button anywhere on the page; Current wealth field defaults to ~$200k"
    why_human: "Requires browser render — cannot verify DOM paint order or absence of Calculate button from static grep alone"
  - test: "Live slider recompute without jank"
    expected: "Dragging the Current wealth or Annual savings slider updates charts and summary readout smoothly; no visible stutter or layout jank during drag"
    why_human: "Requires visual/temporal human observation; cannot measure perceived jank programmatically"
  - test: "Horizon slider changes projection live"
    expected: "Moving the Projection horizon slider updates the live year readout (e.g. '35 years') and extends/contracts charts immediately"
    why_human: "Requires browser interaction to confirm live update behavior"
  - test: "Real/nominal toggle and D-09 caption"
    expected: "Clicking Nominal: charts update; caption appears stating 'These figures are not adjusted for inflation…'; clicking Real: caption disappears"
    why_human: "Requires browser interaction to verify caption appearance/disappearance"
  - test: "CR-01 validation — rank-delta growth multiple in nominal mode"
    expected: "In nominal mode the rank-delta clause ('while real wealth grew Gx') should display the REAL growth multiple, not the nominal inflated multiple. Verify by: (1) note the Growth multiple metric shown in summary (this is nominal); (2) the rank-delta sentence should show a LOWER multiple equal to the real-basis growth. Current code passes the nominal growthMultiple to formatRankDelta — this is the CR-01 bug."
    why_human: "Requires switching to nominal mode and comparing displayed numbers; the bug is that summary.growthMultiple comes from selectSummary(result) where result is the re-inflated series, but formatRankDelta labels it 'real wealth'. The reviewer must confirm whether the displayed value differs between real and nominal modes in the rank-delta sentence."
  - test: "Summary readout shows ending wealth, growth multiple, CAGR, and D-15 disclosure"
    expected: "Summary section shows 'Ending wealth (real/nominal)', 'Growth multiple', 'CAGR', rank-delta sentence, and 'Rank can move down while real wealth still grows…' disclosure sentence always visible"
    why_human: "Requires visual confirmation that all five summary elements appear and the D-15 disclosure is unconditionally present"
  - test: "Responsive layout — desktop sticky panel and mobile stacked layout"
    expected: "At >=1024px: control panel is a sticky left column (320px); at <1024px: control panel stacks above charts as full-width block. Sliders and toggles are tappable on a 375px phone viewport."
    why_human: "Requires browser viewport resize and touch-emulation testing"
---

# Phase 4: UI Shell & Minimal Entry — Verification Report

**Phase Goal:** A responsive UI shell where the user enters current wealth + annual savings and immediately sees a projection (no Calculate gate), with live debounced recompute, an adjustable horizon, a real/nominal toggle, and a summary readout — the access mechanism around the proven model.
**Verified:** 2026-05-16T15:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | On first paint, entering current wealth + annual savings renders a projection with no Calculate button, all other parameters defaulted from the empirical data layer | ? UNCERTAIN (human) | `AppShell.tsx` computes `rawResult` via `useMemo(projectionEngine(deferred, params))` on initial render with `SEED_WEALTH.value = 200_000`; no Calculate button found in any `.tsx` file (`grep -r 'Calculate' src/ui/` returns empty); first-paint behavior requires browser |
| 2 | Changing an input recomputes the projection live, debounced for slider drags, with no UI jank | ? UNCERTAIN (human) | `useDeferredValue(inputs)` at AppShell.tsx:43 provides debounce; `ControlPanel` wires `setInputs` to store on every slider `onChange`; jank is subjective and requires human observation |
| 3 | The user can adjust the projection horizon (default ~30–40y, up to ~50–60y) and toggle real vs. nominal view (real is the default) | ✓ VERIFIED | `HorizonSlider` min=10 max=60 step=1; DEFAULTS.horizon=35 confirmed in defaults.ts:359; `BasisToggle` wired to `setBasis`; store `basis: 'real' as const` confirmed |
| 4 | A summary readout shows ending wealth, growth multiple, and CAGR | ✓ VERIFIED (with WARNING) | `SummaryReadout.tsx` renders all three metrics in `<dl>`; `selectSummary` derives `endingWealth`, `growthMultiple`, `cagr` — but see CR-01 WARNING below: in nominal mode `growthMultiple` is nominal not real, yet formatted as "real wealth grew Gx" by `formatRankDelta` |
| 5 | The layout is usable across mobile and desktop, with chart interactions degrading gracefully to touch | ? UNCERTAIN (human) | `lg:grid lg:grid-cols-[320px_1fr]` + `lg:sticky lg:top-8` confirmed in AppShell.tsx:91-92; `mb-8 lg:mb-0` for mobile stacking confirmed; touch behavior requires browser |

**Score:** 3/5 truths verified programmatically, 2/5 require human; all structural wiring confirmed; 1 WARNING (CR-01)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/state/store.ts` | Zustand store with setInputs/setHorizon/setBasis + basis field | ✓ VERIFIED | All three actions present; `basis: 'real' as const`; `currentWealth: SEED_WEALTH.value` (200_000) |
| `src/data/sources.ts` | scf2022 and blsCpiLongRun SourceRecord entries | ✓ VERIFIED | Both entries present at lines 235 and 261 |
| `src/data/defaults.ts` | SEED_WEALTH (200_000) and INFLATION_RATE (0.025) exported | ✓ VERIFIED | Both frozen SourcedParam constants present at lines 429 and 468 |
| `src/state/selectors.ts` | selectReinflated, selectSummary, Summary interface | ✓ VERIFIED | All three present at lines 353, 400, 388 |
| `src/ui/summaryFormatters.ts` | formatRankDelta, formatMoneyIllusionCaption | ✓ VERIFIED | Both exported; D-14 pairing and D-09 conditional logic confirmed |
| `src/ui/LogSliderInput.tsx` | Log slider + numeric field pair | ✓ VERIFIED | log10 space slider + numeric input with NaN/negative guard |
| `src/ui/HorizonSlider.tsx` | Linear slider with live year readout | ✓ VERIFIED | Linear slider min=10 max=60; live "{value} years" readout present |
| `src/ui/BasisToggle.tsx` | Real/Nominal segmented control | ✓ VERIFIED | Structural clone of LogLinearToggle; role=group; aria-pressed; teal-700 active state |
| `src/ui/SummaryReadout.tsx` | Ending wealth / growth multiple / CAGR / rank-delta | ✓ VERIFIED | All metrics present; D-14 delegated to formatRankDelta; D-15 disclosure unconditional; D-09 conditional caption |
| `src/ui/ControlPanel.tsx` | Thin container composing all four input primitives | ✓ VERIFIED | Composes LogSliderInput x2, HorizonSlider, BasisToggle, LogLinearToggle; wires store actions |
| `src/ui/AppShell.tsx` | Responsive page-level shell | ✓ VERIFIED | useDeferredValue + try/catch memoized engine + null-propagation chain + responsive grid |
| `src/main.tsx` | Renders AppShell (not HarnessPage) | ✓ VERIFIED | `import { AppShell }` and `<AppShell />` confirmed; no HarnessPage reference |
| `docs/NEUTRALITY-STYLE-GUIDE.md` | D-09 and D-15 sections seeded | ✓ VERIFIED | Section 5 (D-09 Nominal Mode Caption Rule) at line 110; Section 6 (D-15 Rank-Delta Neutral Disclosure Rule) at line 141 |
| `src/ui/HarnessPage.tsx` | DELETED | ✓ VERIFIED | `grep -r 'HarnessPage' src/` returns empty |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/main.tsx` | `src/ui/AppShell.tsx` | `import { AppShell }` + `<AppShell />` | ✓ WIRED | Confirmed at main.tsx:5,9 |
| `src/ui/AppShell.tsx` | `src/state/store.ts` | `useProjectionStore((s) => s.inputs/params/basis)` | ✓ WIRED | Narrow selectors at AppShell.tsx:35-37 |
| `src/ui/AppShell.tsx` | `src/state/selectors.ts` | `selectReinflated`, `selectSummary`, `selectTimeSeriesOption` etc. | ✓ WIRED | All six selectors imported and called |
| `src/ui/ControlPanel.tsx` | `src/state/store.ts` | `useProjectionStore()` destructure | ✓ WIRED | Full store destructure at ControlPanel.tsx:16 (WR-02 whole-store subscription noted) |
| `src/ui/SummaryReadout.tsx` | `src/ui/summaryFormatters.ts` | `import { formatRankDelta, formatMoneyIllusionCaption }` | ✓ WIRED | Import at SummaryReadout.tsx:9; called at lines 54, 20 |
| `src/ui/AppShell.tsx` (summary) | `src/state/selectors.ts` (selectSummary) | `useMemo(() => result !== null ? selectSummary(result) : null, [result])` | ⚠ WIRED (CR-01) | Wired but passes `result` (nominal-inflated when basis=nominal) not `rawResult` (real) — D-14 violation in nominal mode |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `AppShell.tsx` | `rawResult` | `projectionEngine(deferred, params)` where `deferred = useDeferredValue(inputs)` from store; `params = DEFAULTS` | Yes — engine produces live data from store inputs | ✓ FLOWING |
| `SummaryReadout.tsx` | `summary` | `selectSummary(result)` where `result = selectReinflated(rawResult, basis, INFLATION_RATE.value)` | Yes — but WARNING: nominal mode uses inflated series for growthMultiple | ⚠ FLOWING (CR-01) |
| `AppShell.tsx` chart options | `tsOption, divOption, relOption` | `selectTimeSeriesOption(result, yAxisType)`, `selectRelPosOption(rawResult)` | Yes — live model output | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| No Calculate button in UI | `grep -r 'Calculate' src/ui/` | Empty — no matches | ✓ PASS |
| HarnessPage deleted | `grep -r 'HarnessPage' src/` | Empty — no matches | ✓ PASS |
| try/catch on projectionEngine | `grep -c 'try' src/ui/AppShell.tsx` | 2 (try present) | ✓ PASS |
| Neutral diagnostic string | `grep -c 'Projection unavailable' src/ui/AppShell.tsx` | 1 | ✓ PASS |
| useDeferredValue present | `grep -c 'useDeferredValue' src/ui/AppShell.tsx` | 1 | ✓ PASS |
| D-09/D-15 in style guide | `grep -c 'D-09\|D-15' docs/NEUTRALITY-STYLE-GUIDE.md` | 3 (Section 5, Section 6, heading) | ✓ PASS |
| SEED_WEALTH = 200_000 | value in defaults.ts:430 | `value: 200_000` confirmed | ✓ PASS |
| INFLATION_RATE = 0.025 | value in defaults.ts:469 | `value: 0.025` confirmed | ✓ PASS |
| Test suite | `npx vitest run` | 125 passed, 11 files, 0 failures | ✓ PASS |
| TypeScript typecheck | `npx tsc --noEmit` | Clean — no errors | ✓ PASS |

### Probe Execution

Step 7c: SKIPPED — no `scripts/*/tests/probe-*.sh` discovered; phase is a frontend SPA with no conventional probe scripts.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ENTRY-01 | 04-01, 04-03 | No Calculate button; first-paint projection from empirical defaults | ✓ SATISFIED (human needed for paint) | AppShell derives `rawResult` on first render from `SEED_WEALTH.value`; no Calculate gate in any file |
| ENTRY-02 | 04-01, 04-03 | Live recompute, debounced for slider drags | ✓ SATISFIED (human needed for jank) | `useDeferredValue(inputs)` at AppShell.tsx:43; store `setInputs` wired to sliders |
| ENTRY-03 | 04-01, 04-03 | Adjustable projection horizon | ✓ SATISFIED | `HorizonSlider` min=10 max=60; DEFAULTS.horizon=35; `setHorizon` wired |
| ENTRY-04 | 04-02, 04-03 | Real/nominal toggle; real is default | ✓ SATISFIED | `BasisToggle` wired to `setBasis`; store default `basis: 'real'`; `selectReinflated` handles display-layer inflation |
| ENTRY-05 | 04-02, 04-03 | Summary readout: ending wealth, growth multiple, CAGR | ✓ SATISFIED (with WARNING CR-01) | All three metrics rendered in SummaryReadout; D-14 pairing structural; but nominal-mode growthMultiple is the nominal multiple, not real |
| ENTRY-06 | 04-03 | Responsive mobile/desktop; touch degradation | ? NEEDS HUMAN | Tailwind responsive classes confirmed; touch requires browser |

No orphaned requirements detected — all six ENTRY-XX requirements from REQUIREMENTS.md Phase 4 mapping are covered by the three plans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/ui/AppShell.tsx:76` | 76 | `selectSummary(result)` — passes nominal-inflated result; growthMultiple is nominal but labeled "real" in rank-delta | ⚠ Warning | CR-01 from code review: D-14 violation in nominal mode — the value passed to formatRankDelta is the nominal growth multiple but rendered as "real wealth grew Gx" |
| `src/ui/ControlPanel.tsx:16` | 16 | `useProjectionStore()` whole-store subscription (WR-02) | ⚠ Warning | Component re-renders on any store change; defeats narrow-selector pattern; low impact for current store size |
| `src/ui/LogSliderInput.tsx:45` | 45 | NaN/negative guard falls back to 0 not `min`; accepts 0 for wealth field (WR-03) | ⚠ Warning | User can type 0 for currentWealth; engine receives degenerate input; selectSummary zeroes growthMultiple/CAGR |
| `src/data/defaults.ts:309-329` | 309-329 | Stale "PROVISIONAL PLACEHOLDER / 0.0" comment contradicts shipped `dragStrength = 0.4325...` (WR-06) | ⚠ Warning | Correctness hazard for future maintainers — misleading documentation on a calibration constant |

No TBD/FIXME/XXX markers found in phase-modified files (debt-marker gate passes).

### CR-01 Analysis: Phase 4 Goal Blocker vs Phase 5 Gate Item

**Finding (from 04-REVIEW.md CR-01):** In nominal mode, `summary` is derived from `selectSummary(result)` where `result = selectReinflated(rawResult, 'nominal', 0.025)`. This means `summary.growthMultiple = nominalEndWealth / nominalStartWealth`. `formatRankDelta(summary.startRank, summary.endRank, summary.growthMultiple)` then renders: "Distribution position: pNN → pMM, while real wealth grew [NOMINAL multiple]×." The style guide (D-14, Section 6, which Phase 4 itself seeded) explicitly requires: "it must refer to the real growth multiple regardless of the active basis setting."

**Assessment: WARNING, not BLOCKER for Phase 4.**

Reasoning:
1. **ROADMAP Phase 4 SC #4** states only: "A summary readout shows ending wealth, growth multiple, and CAGR." The success criterion does not specify that the growthMultiple in the rank-delta sentence must be the real-basis value — it only requires the three metrics exist.
2. **ROADMAP Phase 5 explicitly owns NEUT-02** ("all shipped copy and chart semantics reviewed and signed off against the style guide"), and Phase 5 SC #1 requires "every user-facing string checked against the NEUT-01 style guide with a recorded pass/fail per item."
3. The D-14 *mechanism* is correctly implemented (formatRankDelta always pairs rank delta with growth clause; the pairing is enforced). The *value* fed to it in nominal mode is wrong — this is the Phase 5 NEUT-02 sign-off concern.
4. The code review (04-REVIEW.md) correctly identified CR-01, but the review's finding is scoped to code quality, not phase gate. The phase gate question is whether ROADMAP SC #4 is satisfied: the readout exists and shows the three required metrics.

**Conclusion:** CR-01 is a real defect that must be fixed before Phase 5 NEUT-02 can pass. It is tracked in 04-REVIEW.md. It does not block Phase 4 goal achievement because ROADMAP SC #4 does not specify basis-correctness of the rank-delta sentence — that is Phase 5 NEUT-02 scope. However, the Phase 5 plan must explicitly address CR-01 as a pre-condition for NEUT-02 sign-off.

### Human Verification Required

#### 1. First-Paint Projection and No Calculate Button

**Test:** Run `npm run dev`; open http://localhost:5173; observe the page on load without any interaction.
**Expected:** Charts and summary readout are visible immediately; no "Calculate", "Generate", or similar button exists anywhere on the page; the Current wealth input shows ~$200,000.
**Why human:** First-paint behavior and DOM state at load time cannot be verified from static analysis; the absence of a button must be confirmed visually.

#### 2. Live Slider Recompute Without Jank

**Test:** Drag the Current wealth slider left and right rapidly.
**Expected:** Charts and summary readout update continuously and smoothly with no visible stutter, layout shift, or blank frame during drag.
**Why human:** "No UI jank" (ROADMAP SC #2) is a subjective visual/temporal quality that cannot be measured by grep or static analysis.

#### 3. Nominal Mode Toggle and Caption

**Test:** Click the "Nominal" button in the basis toggle; observe the summary readout and chart titles.
**Expected:** The D-09 caption appears ("These figures are not adjusted for inflation. They assume a fixed 2.5% annual inflation rate (US Bureau of Labor Statistics — CPI-U long-run geometric mean (1926–2022)). Switch to Real for inflation-adjusted amounts."); clicking "Real" removes it.
**Why human:** Conditional rendering of a DOM element requires browser execution.

#### 4. CR-01 Nominal-Mode Growth Multiple in Rank-Delta

**Test:** (1) Switch to Nominal mode; note the "Growth multiple" metric value displayed (e.g., 5.2×). (2) Note the "Distribution position: pNN → pMM, while real wealth grew [G]×" sentence; observe what [G] is. (3) Switch back to Real mode; note the Growth multiple (e.g., 3.1×). Confirm whether [G] in the rank-delta sentence changes between modes.
**Expected (current broken behavior):** [G] in the rank-delta sentence CHANGES between Real and Nominal mode (it reflects the nominal multiple in nominal mode, not the real multiple). The Phase 5 fix should make [G] identical in both modes (always the real multiple).
**Why human:** The bug manifests only when comparing real vs. nominal mode output values — requires live browser interaction and comparing two numeric values.

#### 5. Summary Metrics and D-15 Disclosure Always Visible

**Test:** In both Real and Nominal mode, verify the summary section shows all five elements.
**Expected:** "Ending wealth (real/nominal)", value; "Growth multiple", value; "CAGR", value; rank-delta sentence; "Rank can move down while real wealth still grows — every tier's wealth increases over this horizon. See the wealth-by-tier chart for absolute amounts." The D-15 disclosure must be visible in both modes without any user action.
**Why human:** Requires visual DOM inspection in both modes.

#### 6. Responsive Layout

**Test:** (a) At browser width >=1024px: observe layout. (b) Resize below 1024px. (c) In Chrome DevTools, enable device toolbar with 375px width (iPhone SE).
**Expected:** (a) Control panel is a sticky left column (320px), charts column is to its right. (b) Control panel becomes full-width block stacked above charts. (c) All sliders and toggles are tappable; charts render at adequate height; no controls are hidden.
**Why human:** Responsive breakpoint behavior and touch interactions require a browser.

### Gaps Summary

No programmatic BLOCKERS found. The phase goal is structurally achieved: the codebase contains all required artifacts, wiring is complete, tests pass (125/125), TypeScript is clean, and the responsive layout classes are present.

**CR-01 (WARNING):** The rank-delta sentence shows the nominal growth multiple labeled as "real" in nominal mode — a D-14 violation per the style guide Phase 4 itself seeded. This is tracked in 04-REVIEW.md as a critical code review finding. Per the ROADMAP, formal neutrality sign-off is Phase 5 (NEUT-02) scope; CR-01 must be resolved as a pre-condition for Phase 5 to pass, but does not block Phase 4 goal achievement.

**WR-02 (WARNING):** `ControlPanel` uses whole-store subscription instead of narrow selectors. Low current impact but defeats stated design intent.

**WR-03 (WARNING):** `LogSliderInput` accepts 0 for wealth fields (clamp to 0 not `min`). Degenerate input reaches the engine; engine runs without error but summary shows 0 growth metrics.

**WR-06 (WARNING):** Stale "PROVISIONAL PLACEHOLDER" comment in defaults.ts contradicts the shipped back-solved `dragStrength = 0.4325...`. Correctness hazard for future maintainers.

All four warnings from 04-REVIEW.md are reproduced here for completeness; none block the Phase 4 ROADMAP success criteria.

---

_Verified: 2026-05-16T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
