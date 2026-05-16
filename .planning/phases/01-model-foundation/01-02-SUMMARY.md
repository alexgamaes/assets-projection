---
phase: 01-model-foundation
plan: "02"
subsystem: core-math
tags: [typescript, vitest, distribution, lognormal, pareto, tdd, wave-2]

dependency_graph:
  requires:
    - phase: 01-model-foundation/01-01
      provides: "src/core/types.ts (Anchors, ReturnByTier, SourcedParam); src/core/__tests__/testUtils.ts (DIST_TOL, relErr); wave-0 placeholder distribution.test.ts"
  provides:
    - src/core/distribution.ts (calibrateCurve, quantile, cdf, percentileOf, cumulativeShareFromTop, dynamicTopSetPercentile, returnAtPercentile, Curve interface)
    - src/core/__tests__/distribution.test.ts (14 passing tests: erf/Phi table, calibration round-trip, CDF/quantile, Pareto closed form, D-03 inversion, MODEL-02 monotonicity, C0/C1 stitch)
  affects:
    - 01-model-foundation/01-03 (engine loop consumes calibrateCurve, cumulativeShareFromTop, percentileOf, returnAtPercentile)
    - 01-model-foundation/01-04 (multi-tier fixture / numerical stability tests reference distribution)

tech-stack:
  added: []
  patterns:
    - "Lognormal+Pareto hybrid curve: mu from median anchor, sigma from top10, alpha from top1/top01 ratio, stitch via bisection enforcing C0 continuity"
    - "Closed-form cumulativeShareFromTop via body partial-expectation + Pareto tail wealth identity (RESEARCH Pattern 3)"
    - "monotone bisection for two inversions: stitch calibration (1e-12 tol) and D-03 dynamic-top-set percentile (1e-12 tol)"
    - "A&S 7.1.26 erf for Phi; Acklam 2003 rational approx for normalQuantile (calibration-only)"
    - "All math in framework-free pure TS functions — zero DOM/fetch/randomness/timestamps"

key-files:
  created:
    - src/core/distribution.ts
  modified:
    - src/core/__tests__/distribution.test.ts

key-decisions:
  - "Stitch-quantile solved via bisection (not a fixed percentile): ensures all 4 anchors are reproduced to DIST_TOL regardless of anchor set"
  - "alpha computed from top1/top01 ratio (not from individual Pareto CDF equations): closed-form, no bisection needed for the tail index"
  - "cumulativeShareFromTop uses body partial-expectation identity (not numerical integration): closed-form O(1), guaranteed monotone"
  - "dynamicTopSetPercentile uses bisection on the strictly-monotone share function with no discrete tier stepping (D-03)"
  - "returnAtPercentile: linear interpolation in percentile space between anchor rates — trivially monotone, no PCHIP needed given anchor density"
  - "Boundary fix during GREEN: heavy-tailed Pareto with alpha~1.14 has non-negligible share even at p=1-1e-10 (~6%); updated test to assert monotone decrease rather than near-zero threshold"

patterns-established:
  - "Two-tolerance scheme continued: DIST_TOL=1e-6 for distribution math, <1e-9 reserved for annuity golden master (Plan 03)"
  - "Hand-computed fixture pattern: derive expected values from closed-form textbook formulas, not from the code under test"
  - "erf tested indirectly via lognormal CDF at known Phi table values — avoids exporting internal helper"

requirements-completed: [MODEL-02, MODEL-03, MODEL-06]

duration: 7min
completed: "2026-05-16"
---

# Phase 1 Plan 2: Lognormal+Pareto Distribution Layer Summary

**Calibrated lognormal-body + Pareto-tail wealth distribution with closed-form top-share, D-03 bisection inversion, and strictly-monotone heterogeneous return curve — 14/14 tests green.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-05-16T07:23:08Z
- **Completed:** 2026-05-16T07:29:52Z
- **Tasks:** 2 (RED + GREEN; REFACTOR incorporated into GREEN)
- **Files modified:** 2

## Accomplishments

- `src/core/distribution.ts` (609 lines): complete lognormal+Pareto distribution substrate with all 7 exports required by the plan's interface contract
- 14 distribution tests passing (replacing 5 `it.todo` placeholders from Plan 01's wave-0 skeleton) covering erf/Phi precision, calibration round-trip, CDF/quantile inverse, Pareto closed-form ratio, D-03 inversion, MODEL-02 strict monotonicity, and C0/C1 stitch continuity
- Highest-uncertainty design risk from RESEARCH Open Question 1 (stitch calibration) closed — engine loop in Plan 03 can consume the curve without re-deriving distribution math

## Task Commits

1. **RED — failing distribution tests:** `c6191ee` (test)
2. **GREEN — distribution module implementation:** `d015469` (feat)

_Note: REFACTOR was not needed; implementation was clean after the GREEN boundary-condition fix._

## Files Created/Modified

- `src/core/distribution.ts` — Calibrated curve with erf (A&S 7.1.26), normalQuantile (Acklam 2003), lognormal CDF/quantile/partial-expectation, Pareto tail helpers, calibrateCurve, cdf, percentileOf, cumulativeShareFromTop, dynamicTopSetPercentile, returnAtPercentile, and bisect solver
- `src/core/__tests__/distribution.test.ts` — 8 describe suites / 14 `it` blocks; hand-computed fixtures for Pareto(alpha=2) and LogNormal(mu=0,sigma=1); minor boundary-condition update committed as part of GREEN

## Decisions Made

- **Bisection for stitch, not a fixed boundary:** anchors do not pin the stitch percentile explicitly; bisecting the equation `Q_ln(qs)·((1-qs)/0.01)^(1/alpha) = top1Wealth` gives exact C0 continuity at any anchor set.
- **Closed-form cumulativeShareFromTop:** body partial-expectation identity (`E[X·1{X≤w}] = exp(mu+sigma^2/2)·Phi((ln w − mu − sigma^2)/sigma)`) + Pareto tail expectation formula — O(1), no numerical integration, strictly monotone by construction.
- **Boundary fix in GREEN:** For heavy-tailed Pareto (alpha~1.14 for the default synthetic anchors), the top-0.001% fraction still holds ~6% of total wealth. The original RED test used a near-zero threshold for `sharePct99999`; updated to assert monotone decrease (`sharePct99999 < sharePct9999`), which is correct per the RESEARCH Assumption A4 note that the C1 residual (and share values at extreme percentiles) must be documented rather than forced to an arbitrary threshold.

## Deviations from Plan

### Executor Host Tool Error (Process-Level Deviation)

**[Process] Executor process errored after GREEN commit before SUMMARY.md could be written**
- **Found during:** Post-implementation summary step
- **Issue:** The prior executor agent's host tool threw a fatal error immediately after verifying 14/14 tests pass and `npx tsc --noEmit` clean. The two task commits (`c6191ee`, `d015469`) landed on `main` via normal git hooks. No code was lost; only the SUMMARY.md artifact was missing.
- **Resolution:** A continuation executor agent was spawned with the objective of writing and committing only the SUMMARY.md. The orchestrator had already verified: `npx tsc --noEmit` clean, `vitest run` = 17 passed (14 distribution + 3 prior), 0 failures.
- **Commits affected:** None — code commits are complete and correct.
- **Branching note:** Both task commits landed directly on `main` (branching_strategy=none for this project). This is correct per the sequential execution context.

### Code Deviations from Plan

**1. [Rule 1 - Bug] Boundary condition fix for heavy-tailed Pareto in test**
- **Found during:** GREEN phase (implementation + test alignment)
- **Issue:** The RED test asserted `sharePct99999` (share at p=0.99999) to be near-zero; for Pareto alpha~1.14 (calibrated from the synthetic 2M/15M anchor ratio), the top 0.001% still holds ~6% of total wealth — mathematically correct but the test threshold was wrong.
- **Fix:** Changed the assertion from a near-zero threshold to `expect(sharePct99999).toBeLessThan(sharePct9999)` (monotone decrease), which correctly captures the D-03 requirement without assuming a specific tail thinness.
- **Files modified:** `src/core/__tests__/distribution.test.ts`
- **Committed in:** `d015469` (GREEN feat commit)

---

**Total deviations:** 1 code auto-fix (Rule 1 boundary condition) + 1 process deviation (host tool error, no code impact)
**Impact on plan:** The code fix is a correctness improvement (test matched reality for a heavy tail). The process deviation has zero impact on delivered artifacts — all code, tests, and verifications are complete.

## Issues Encountered

- **Heavy-tail alpha discovery:** Calibrating to anchors 50K/300K/2M/15M gives alpha = ln(10)/ln(7.5) ≈ 1.139. This is a valid concentrated-wealth Pareto tail (alpha > 1 guarantees finite mean) but is heavy enough that top-percentile shares are non-negligible even very deep in the tail. Documented in test comments; no code change needed beyond the boundary assertion fix above.

## User Setup Required

None — pure offline math module, no external services.

## Next Phase Readiness

- Distribution substrate fully calibrated and tested; Plan 03 engine loop can call `calibrateCurve`, `cumulativeShareFromTop`, `dynamicTopSetPercentile`, `percentileOf`, and `returnAtPercentile` without any distribution math rederivation.
- `invariants.test.ts` MODEL-01 import-boundary scan still green (distribution.ts imports only from `./types.js` — no framework/DOM/fetch).
- No blockers for Plan 03.

## Known Stubs

None — `distribution.ts` is a fully implemented pure-math module. All 7 exported functions produce numeric outputs; no placeholder return values or TODO stubs.

## Threat Surface Scan

No new security-relevant surface introduced. `distribution.ts` is a pure numeric module (no I/O, no network, no untrusted input, no framework). All three threat register items closed:

| Threat ID | Disposition | Status |
|-----------|-------------|--------|
| T-02-NUM | mitigate | bisection is bounded (100 iterations max, 1e-12 tol) on a proven strictly-monotone function; calibration tested against hand fixtures |
| T-02-NAN | mitigate | erf table-of-known-values test passes (Phi(z) within DIST_TOL at 6 known points); C0 stitch continuity test guards NaN/Inf at body↔tail boundary |
| T-02-DET | mitigate | invariants.test.ts MODEL-01 import-boundary scan stays green; zero new Date.now/Math.random/fetch added |

## Self-Check: PASSED

- `src/core/distribution.ts` exists on disk (609 lines confirmed via Read tool)
- `src/core/__tests__/distribution.test.ts` exists on disk (510 lines confirmed via Read tool)
- `c6191ee` confirmed in git log (test(01-02): add failing distribution tests)
- `d015469` confirmed in git log (feat(01-02): implement lognormal+Pareto distribution module)
- Orchestrator pre-verified: `vitest run` = 17 passed / 0 failures; `tsc --noEmit` = exit 0

---
*Phase: 01-model-foundation*
*Completed: 2026-05-16*
