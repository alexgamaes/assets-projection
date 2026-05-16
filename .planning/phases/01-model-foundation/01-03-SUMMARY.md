---
phase: 01-model-foundation
plan: "03"
subsystem: core-engine
tags: [typescript, vitest, engine, drag, tiers, relativePosition, tdd, wave-3, golden-master]

dependency_graph:
  requires:
    - phase: 01-model-foundation/01-01
      provides: "src/core/types.ts (Inputs, Params, YearSnapshot, ProjectionResult, assertReal); src/core/__tests__/testUtils.ts (relErr, analyticOrdinaryAnnuity, makeSyntheticParams)"
    - phase: 01-model-foundation/01-02
      provides: "src/core/distribution.ts (calibrateCurve, dynamicTopSetPercentile, percentileOf, returnAtPercentile)"
  provides:
    - src/core/drag.ts (assetInflationFromTopGrowth — scalar haircut, no transfer function)
    - src/core/tiers.ts (stepAnchorWealth, initialAnchorWealth — ordinary-annuity compounding)
    - src/core/relativePosition.ts (deriveShares — userShare + userRank from series)
    - src/core/engine.ts (projectionEngine — 8-step annual loop, walking skeleton)
    - src/core/__tests__/goldenMaster.test.ts (11 passing tests: drag-off annuity <1e-9, FP stability spots, basis violation, structural shape)
  affects:
    - 01-model-foundation/01-04 (invariant battery and multi-tier fixture tests consume engine + all 4 modules)

tech_stack:
  added: []
  patterns:
    - "8-step annual loop: dynamicTopSetPercentile → aggTopGrowth → scalar drag haircut → stepAnchorWealth → refit curve → moving-tier percentile → user compound → snapshot"
    - "end-of-year ordinary-annuity convention W'=W*(1+r_eff)+S with r_eff=r-assetInflation (small-small, PITFALLS P10)"
    - "User as test-particle: reads curve, does not perturb anchors (RESEARCH Assumption A5)"
    - "assertReal basis guard at engine boundary (MODEL-05): nominal param throws /Basis violation/"
    - "Endogenous re-fit (D-06): calibrateCurve called each year on evolved anchor wealths; fixed-shape-scaled path (D-07) also implemented via shiftScaleCurve"
    - "Wealth-weighted top-set growth rate from anchors above dynamicTopSetPercentile"

key_files:
  created:
    - src/core/drag.ts
    - src/core/tiers.ts
    - src/core/relativePosition.ts
    - src/core/engine.ts
  modified:
    - src/core/__tests__/goldenMaster.test.ts

decisions:
  - "Top-set growth rate approximated as wealth-weighted average of anchor return rates for anchors above dynamicTopSetPercentile; with dragStrength=0 the result is exact (haircut is 0 regardless)"
  - "User wealth compounds using inputs.annualSavings (not params.savings.value) for the user step; anchor tiers use params.savings.value — decouples user savings from the synthetic anchor savings to allow independent user inputs"
  - "shiftScaleCurve shifts mu by ln(newMedian/oldMedian) and scales xm proportionally — simple, deterministic, no re-bisection needed for the D-07 fixed-shape path"
  - "deriveShares uses _totalWealth internal field on snapshot (attached by engine) for the userShare denominator; falls back to top01 anchor wealth if absent"
  - "Comment in engine.ts using 'Math.random' pattern triggered import-boundary regex (Rule 1 auto-fix: reworded comment to avoid false positive)"

metrics:
  duration_minutes: 15
  completed_date: "2026-05-16"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 1 Plan 3: Engine Vertical Slice (Walking Skeleton) Summary

**One-liner:** projectionEngine 8-step annual loop with scalar drag haircut, endogenous curve refit, moving-tier user percentile, and ordinary-annuity compounding — proven against the analytic closed form to relErr < 1e-9 over 60 years.

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-05-16
- **Tasks:** 2 (RED + GREEN; REFACTOR = no-op, code already clean)
- **Files modified:** 5 (4 created, 1 updated)

## Accomplishments

**drag.ts:** `assetInflationFromTopGrowth(topSetGrowthRate, dragStrength) = dragStrength * topSetGrowthRate` — scalar linear formula (D-02). No transfer function by construction. Anti-Pattern 3 compliance: only computes a scalar rate; never touches tier balances.

**tiers.ts:** `stepAnchorWealth` advances all 4 anchor tiers by one year using the end-of-year ordinary-annuity convention `W' = W*(1+r_eff)+S` where `r_eff = r − assetInflation` (small−small, PITFALLS P10). `initialAnchorWealth` extracts year-0 wealth from anchors. INVARIANT: no quantity is conserved across tiers; each grows independently.

**relativePosition.ts:** `deriveShares(series)` maps each YearSnapshot to `{year, userShare, userRank}`. `userRank` = percentile×100 (taken from snapshot's `userPercentile`). `userShare` = `userWealth / _totalWealth` where `_totalWealth` is attached to each snapshot by the engine (the calibrated curve's total expected wealth at that year).

**engine.ts:** `projectionEngine(inputs, params)` — the walking skeleton:
1. Basis guard: `assertReal` on all returnByTier fields and savings (MODEL-05)
2. Year-0 calibration: `calibrateCurve(anchors)` + `initialAnchorWealth`
3. Loop year 0..horizon (horizon+1 snapshots inclusive):
   - `dynamicTopSetPercentile(curve)` → p* (D-03, closed-form bisection)
   - `computeTopSetGrowthRate` → wealth-weighted avg return of anchors above p*
   - `assetInflationFromTopGrowth(aggRate, dragStrength)` → scalar haircut
   - User percentile + return read off **current** curve (MODEL-02 moving tier)
   - Snapshot recorded
   - `stepAnchorWealth` → new anchor wealths (D-08, drag applied once — step 3)
   - `calibrateCurve` (endogenous) or `shiftScaleCurve` (fixed-shape-scaled, D-07)
   - User wealth compounded with moving-tier rate
4. `deriveShares(series)` → relativePosition

**goldenMaster.test.ts (11 tests green):**
- Drag-off single-tier median anchor: `relErr(engine, analyticOrdinaryAnnuity(50000, 0.02, 1000, 60)) < 1e-9`
- Intermediate years (1, 30) spot-check: `< 1e-9`
- r=0 branch: `< 1e-9`
- All 4 tiers simultaneously drag-off: each `< 1e-9`
- `series.length === horizon+1`
- All 7 snapshot fields present
- `assetInflation === 0` when `dragStrength=0`
- `userPercentile` differs year 0 vs year 60 (MODEL-02 moving tier confirmed)
- Basis violation throw: `assertReal` with `basis:'nominal'` → `/Basis violation/`
- `assetInflationFromTopGrowth(g, 0) === 0`
- `assetInflationFromTopGrowth(g, 0.3) === 0.3*g`

## Task Commits

1. **RED — failing tests:** `ea0ea4f` (test(01-03): add failing golden-master + drag unit tests)
2. **GREEN — engine implementation:** `52e64c0` (feat(01-03): implement engine vertical slice)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Import-boundary regex false positive on engine.ts comment**
- **Found during:** GREEN verification (full test suite run)
- **Issue:** The `MODEL-01` import-boundary scanner in `invariants.test.ts` uses the pattern `Math\.random\b` to detect forbidden non-determinism. A JSDoc comment in engine.ts contained the phrase "zero framework/DOM/fetch/Date.now/Math.random — pure numeric" which triggered the pattern as a false positive.
- **Fix:** Reworded the comment to "zero framework/DOM/fetch/timestamp/randomness — pure numeric" to avoid matching the scanner regex without losing the documented intent.
- **Files modified:** `src/core/engine.ts` (comment only)
- **Committed in:** `52e64c0` (same GREEN commit)

### Design Decisions Made During Implementation

**2. User savings source:** The user's wealth compounding step uses `inputs.annualSavings` (not `params.savings.value`). This decouples the user's actual savings from the synthetic anchor savings, allowing the user to express their real savings while anchors use the model's synthetic value. The golden master tests use `syntheticInputs.annualSavings = 1000` which matches `params.savings.value = 1000` (defaults aligned), so the test results are consistent.

**3. Snapshot timing:** The snapshot is recorded BEFORE advancing wealth for the next year. Year 0 snapshot = initial state; year N snapshot = state at the START of year N (after N annual steps from year 0). This matches the ordinary-annuity convention: `analyticOrdinaryAnnuity(W0, r, S, n)` gives the wealth after n steps, which is `series[n].anchorWealth` in the engine output.

## Known Stubs

None — `projectionEngine` is fully implemented. All 4 module files produce numeric outputs from real computation; no placeholder return values or TODO stubs.

## TDD Gate Compliance

- RED gate commit: `ea0ea4f` (`test(01-03): add failing golden-master + drag unit tests (RED)`)
  - Tests failed with `Cannot find module '../engine.js'` — confirmed RED gate
- GREEN gate commit: `52e64c0` (`feat(01-03): implement engine vertical slice (GREEN)`)
  - All 11 goldenMaster.test.ts tests green; full suite 28 passed / 0 failed
- REFACTOR: not needed — implementation was clean after the Rule 1 comment fix

## Threat Surface Scan

No new security-relevant surface introduced. All three threat register items addressed:

| Threat ID | Disposition | Status |
|-----------|-------------|--------|
| T-03-FP | mitigate | Golden master relErr < 1e-9 vs independent `analyticOrdinaryAnnuity` over 60y; drag as r_eff=r-assetInflation (small-small, not large-large differences) |
| T-03-ZS | mitigate | `drag.ts` contains only the scalar formula `dragStrength * topSetGrowthRate`; no tier-balance mutations present. Import-boundary scan GREEN (no unauthorized imports). |
| T-03-BASIS | mitigate | `assertReal` called on all 4 `returnByTier` fields + `savings` at engine entry; basis-violation test confirms throw with nominal param |
| T-03-DET | mitigate | `invariants.test.ts` MODEL-01 import-boundary scan GREEN; engine.ts imports only `./types.js`, `./distribution.js`, `./drag.js`, `./tiers.js`, `./relativePosition.js` — no Date.now/Math.random/fetch/DOM |

## Self-Check: PASSED

Files confirmed present on disk:
- `/Users/gama/Documents/personal/assets-projection/src/core/drag.ts` — FOUND
- `/Users/gama/Documents/personal/assets-projection/src/core/tiers.ts` — FOUND
- `/Users/gama/Documents/personal/assets-projection/src/core/relativePosition.ts` — FOUND
- `/Users/gama/Documents/personal/assets-projection/src/core/engine.ts` — FOUND
- `/Users/gama/Documents/personal/assets-projection/src/core/__tests__/goldenMaster.test.ts` — FOUND (updated)

Commits confirmed in git log: `ea0ea4f` (RED), `52e64c0` (GREEN).

Final verification: `npx vitest run` → 28 passed / 0 failed; `npx tsc --noEmit` → exit 0.

---
*Phase: 01-model-foundation*
*Completed: 2026-05-16*
