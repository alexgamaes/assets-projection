---
phase: 01-model-foundation
verified: 2026-05-16T01:15:00Z
status: human_needed
score: 5/5 roadmap success criteria verified
overrides_applied: 0
human_verification:
  - test: "Confirm userPercentile 0–1 vs 0–100 contract discrepancy is a known accepted deviation"
    expected: "Developer acknowledges that types.ts documents userPercentile as 0–100 but engine stores 0–1; either the docstring is corrected or the value is multiplied by 100 in the engine before being a public issue for Phase 3 chart selectors"
    why_human: "Engine is internally self-consistent (returnAtPercentile also expects 0–1), but the typed public contract says 0–100. Phase 3 selectors will read YearSnapshot.userPercentile directly. The downstream risk cannot be assessed programmatically — it depends on whether the developer intends 0–1 or 0–100 as the external contract."
  - test: "Confirm CR-01 / CR-02 bisect silent-failure and negative-totalWealth risks are tracked for Phase 1 closure or explicitly deferred to Phase 2"
    expected: "Developer either: (a) accepts that the synthetic-fixture test suite passes and plans CR-01/CR-02 fixes before Phase 3 consumes the engine with real anchor data, OR (b) adds the fixes now. The bugs are silent on the synthetic fixture set but will misfire on high-concentration anchor inputs (top01/top1 ≥ 10 → α ≤ 1)."
    why_human: "CR-01 and CR-02 are in the live codebase and confirmed by the code reviewer as data-dependent silent failures. They do not affect the current test suite (all 44 tests pass) but will surface when Phase 2 populates real empirical anchor data. Deciding when to fix them requires human judgment."
---

# Phase 1: Model Foundation — Verification Report

**Phase Goal:** A pure, framework-free, deterministic projection engine that computes year-by-year per-tier wealth — including heterogeneous returns, asset-price-inflation drag, and relative-position derivation — proven correct by numerical unit tests against synthetic citeable fixtures, with no UI or I/O dependency.
**Verified:** 2026-05-16T01:15:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running the engine test suite produces a verified year-by-year projection from `(inputs, params)` with zero framework/DOM/fetch imports in `core/` | VERIFIED | `npx vitest run` → 44 passed / 0 failed; MODEL-01 import-boundary scan (invariants.test.ts) GREEN — scans all `src/core/*.ts` non-test files for `react|react-dom|from 'fs|from 'node:|fetch(|Date.now|Math.random|document.|window.` and finds zero violations |
| 2 | The engine projects every wealth tier (not just the user's line), and a test confirms the user's trajectory uses the return rate for their moving tier | VERIFIED | goldenMaster.test.ts line ~159: `userPercentile differs between year 0 and year 60 under heterogeneous returns` GREEN; engine.ts loop steps 4+6 advance all 4 anchor tiers and re-read user percentile from the re-fit curve each year (MODEL-02/MODEL-03) |
| 3 | A unit test confirms drag=0 collapses to independent per-tier baseline, aggregate real wealth can grow unbounded, and no tier is forced to negative real wealth by drag alone (non-conservation, no transfer function) | VERIFIED | invariants.test.ts: (a) `dragStrength=0 collapses each tier to analytic annuity <1e-9` GREEN; (b) `aggregate real wealth is NOT conserved and grows with drag>0` GREEN; (c) `no tier is forced to negative real wealth` GREEN — all 4 tiers positive across all 61 snapshots at drag=0.30 |
| 4 | Every parameter object carries an explicit nominal/real basis field; a test fails if a value of one basis is consumed where the other is expected | VERIFIED | basis.test.ts: `projectionEngine throws /Basis violation/ when returnByTier.median has basis=nominal` GREEN; `projectionEngine throws /Basis violation/ when savings has basis=nominal` GREEN; assertReal unit tests GREEN; SourcedParam.basis field is mandatory in types.ts |
| 5 | Engine output matches a closed-form compounding reference within a documented relative-error tolerance over the maximum horizon | VERIFIED | numericalStability.test.ts: `relErr < 1e-9 at sampled years {1,10,30,45,60}` GREEN for all 4 tiers; goldenMaster.test.ts: `drag-off single tier matches analyticOrdinaryAnnuity to relErr < 1e-9 over 60 years` GREEN; analyticOrdinaryAnnuity is an independent textbook closed form (does not import engine code) |

**Score: 5/5 roadmap success criteria verified**

---

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| MODEL-01 | Pure, framework-free, deterministic projection engine | SATISFIED | invariants.test.ts import-boundary scan GREEN; `npx tsc --noEmit` exits 0; engine.ts imports only `./types.js`, `./distribution.js`, `./drag.js`, `./tiers.js`, `./relativePosition.js` |
| MODEL-02 | Heterogeneous return curve; user's trajectory uses moving-tier rate | SATISFIED | distribution.ts exports `returnAtPercentile` (monotone interpolation across 4 anchor percentiles, strictly increasing — distribution.test.ts GREEN); engine re-reads userPercentile from re-fit curve each year; goldenMaster.test.ts `userPercentile differs year 0 vs year 60` GREEN |
| MODEL-03 | Engine projects full wealth distribution across all tiers | SATISFIED | engine.ts projects all 4 anchor tiers each year; relativePosition.ts derives userShare+userRank; multiTierFixture.test.ts 4-tier 5-year drag-ON fixture GREEN; series contains anchorWealth for all 4 tiers in every snapshot |
| MODEL-04 | Drag computed from top-tier growth; infinite-growth; non-conservation; no transfer | SATISFIED | invariants.test.ts: drag=0 collapse, non-conservation, infinite-growth, monotone divergence — all GREEN; drag.ts contains only scalar formula `dragStrength * topSetGrowthRate` with no tier-balance mutations |
| MODEL-05 | Nominal/real basis is a schema-level invariant | SATISFIED | types.ts: `assertReal()` runtime guard; SourcedParam.basis mandatory field; basis.test.ts: unit-level + end-to-end engine throw tests GREEN; 4 assertReal calls at engine entry |
| MODEL-06 | Numerical unit tests with citeable synthetic fixtures | SATISFIED | 44 tests across 6 files: golden master <1e-9, drag=0 baseline, non-conservation, infinite-growth, 60-year FP stability, hand-derived multi-tier fixture — all GREEN; zero `it.todo` remaining |

All 6 requirement IDs from PLAN frontmatter are satisfied. No orphaned requirements: REQUIREMENTS.md maps MODEL-01 through MODEL-06 exclusively to Phase 1.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | Pinned dev deps + scripts | VERIFIED | typescript@5.9.3, vitest@3.2.4, @vitest/coverage-v8@3.2.4, tsx@4.22.0, @types/node@25.8.0; scripts: test/test:cov/typecheck |
| `tsconfig.json` | Strict TS config with noUncheckedIndexedAccess | VERIFIED | strict:true, noUncheckedIndexedAccess:true, noEmit:true, verbatimModuleSyntax:true, moduleResolution:bundler |
| `src/core/types.ts` | Branded Real/Nominal types, assertReal, all interface shapes | VERIFIED | 203 lines; exports Real/Nominal/asReal/asNominal/assertReal/SourcedParam/Anchors/ReturnByTier/Params/Inputs/YearSnapshot/ProjectionResult |
| `src/core/distribution.ts` | calibrateCurve, quantile, cdf, percentileOf, cumulativeShareFromTop, dynamicTopSetPercentile, returnAtPercentile, Curve | VERIFIED | 609+ lines; all 7 required exports present; A&S 7.1.26 erf; lognormal+Pareto calibration; bisection inversion |
| `src/core/drag.ts` | assetInflationFromTopGrowth — scalar, no transfer | VERIFIED | 55 lines; single formula `dragStrength * topSetGrowthRate`; no tier-balance mutations |
| `src/core/tiers.ts` | stepAnchorWealth — end-of-year ordinary annuity | VERIFIED | Exports stepAnchorWealth and initialAnchorWealth; convention `W' = W*(1+r_eff)+S` |
| `src/core/relativePosition.ts` | deriveShares — userShare + userRank | VERIFIED | Exports deriveShares; userRank = userPercentile*100; userShare = userWealth/_totalWealth |
| `src/core/engine.ts` | projectionEngine — 8-step annual loop | VERIFIED | 290 lines; assertReal at boundary; 8-step loop with endogenous refit + fixed-shape-scaled path |
| `src/core/__tests__/testUtils.ts` | relErr, analyticOrdinaryAnnuity, DIST_TOL, makeSyntheticParams | VERIFIED | All exports present; analyticOrdinaryAnnuity does NOT import engine code; no "18" |
| `src/core/__tests__/basis.test.ts` | MODEL-05 basis-mismatch assertion | VERIFIED | 4 tests: 2 unit-level + 2 end-to-end engine boundary; all GREEN |
| `src/core/__tests__/goldenMaster.test.ts` | Drag-off annuity <1e-9 | VERIFIED | 11 tests; drag-off single-tier, intermediate years, r=0 branch, 4-tier simultaneous, shape checks — all GREEN |
| `src/core/__tests__/invariants.test.ts` | MODEL-01 import scan + MODEL-04 D-12 battery | VERIFIED | 5 tests (1 import-boundary + 4 invariants); all GREEN |
| `src/core/__tests__/numericalStability.test.ts` | 60y FP stability relErr<1e-9 | VERIFIED | 4 tests at sampled years {1,10,30,45,60} + finite output + cancellation check + haircut monotonicity; all GREEN |
| `src/core/__tests__/multiTierFixture.test.ts` | Hand-derived 4-tier drag-ON coupling fixture | VERIFIED | 6 tests; baked expected values with step-by-step derivation comments; drag-on + drag-off baseline; all GREEN |
| `src/core/__tests__/distribution.test.ts` | 14 distribution tests | VERIFIED | erf/Phi table, calibration round-trip, CDF/quantile, Pareto closed form, D-03 inversion, MODEL-02 monotonicity, C0/C1 stitch — all GREEN |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/core/__tests__/testUtils.ts` | `src/core/types.ts` | `import type { Inputs, Params, SourcedParam }` | WIRED | Line 15 in testUtils.ts |
| `vitest.config.ts` | `src/core/__tests__` | test include glob | WIRED | `include: ['src/core/__tests__/**/*.test.ts']` |
| `src/core/distribution.ts` | `src/core/types.ts` | `import type { Anchors, ReturnByTier }` | WIRED | Line 31 in distribution.ts |
| `src/core/__tests__/distribution.test.ts` | `src/core/distribution.ts` | `import { calibrateCurve, ... }` | WIRED | Distribution tests import from `../distribution.js` |
| `src/core/engine.ts` | `src/core/distribution.ts` | `calibrateCurve / dynamicTopSetPercentile / percentileOf / returnAtPercentile` | WIRED | Lines 38-44 in engine.ts |
| `src/core/engine.ts` | `src/core/drag.ts` | `assetInflationFromTopGrowth` | WIRED | Line 45 in engine.ts |
| `src/core/engine.ts` | `src/core/tiers.ts` | `stepAnchorWealth / initialAnchorWealth` | WIRED | Line 46 in engine.ts |
| `src/core/engine.ts` | `src/core/relativePosition.ts` | `deriveShares` | WIRED | Line 47 in engine.ts |
| `src/core/__tests__/goldenMaster.test.ts` | `src/core/engine.ts` | `projectionEngine` | WIRED | Line 12 in goldenMaster.test.ts |
| `src/core/__tests__/invariants.test.ts` | `src/core/engine.ts` | `projectionEngine` | WIRED | Line 19 in invariants.test.ts |
| `src/core/__tests__/basis.test.ts` | `src/core/engine.ts` | `projectionEngine` | WIRED | Line 23 in basis.test.ts |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 44 tests pass | `npx vitest run --reporter=verbose` | 44 passed / 0 failed / 0 todo across 6 files | PASS |
| TypeScript strict check | `npx tsc --noEmit` | exit 0 | PASS |
| Zero it.todo remaining | `grep -rl 'it\.todo\|test\.todo' src/core/__tests__ \| wc -l` | 0 | PASS |
| No decimal/big/fast-check deps | `grep '"(decimal\|big\|fast-check)"' package.json` | no matches | PASS |
| No "18" in testUtils | `grep -n '"18"' src/core/__tests__/testUtils.ts` | no matches | PASS |

---

### Anti-Patterns Found

No `TBD`, `FIXME`, or `XXX` markers in any `src/core/` file. No `TODO` or `PLACEHOLDER` in source files. No stub patterns (`return null`, `return {}`, `return []`) in implementation code.

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/core/engine.ts:143` | `if (oldMedian <= 0) return curve;` silent freeze | Warning (WR-05 in REVIEW) | `fixed-shape-scaled` path silently stops evolving if median goes negative under extreme drag; no test covers this path |
| `src/core/relativePosition.ts:54-56` | Dead fallback `?? snap.anchorWealth.top01` | Info (IN-01 in REVIEW) | Unreachable code; `_totalWealth` is always set by engine |
| `src/core/engine.ts` | `_totalWealth` untyped structural back-channel cast | Info (IN-02 in REVIEW) | Fragile cross-module contract; works but invisible to type system |

No unreferenced debt markers found. Anti-pattern scan: clean.

---

### Code Review Blocker Assessment

The code review (01-REVIEW.md) identified 3 critical issues. These are evaluated against the **phase goal** (engine correctness proven by the current test suite) rather than the review findings per se.

**CR-01: bisect silently returns wrong root when interval is not bracketed**
- File: `src/core/distribution.ts:584-609`
- Impact on phase goal: The synthetic test fixture anchors (50K/300K/2M/15M) produce a valid bracketed stitch root and a valid 50%-share root. All 44 tests pass. The bug is **latent** — it fires only when anchor data places the root outside the hardcoded bracket.
- Assessment: Does not block phase goal achievement (tests pass on all tested inputs). BLOCKER for Phase 2+ when real empirical anchor data is loaded, because high-concentration inputs could silently produce garbage curves.
- Disposition: WARNING — should be fixed before Phase 2 data is introduced.

**CR-02: totalWealth becomes negative for alpha ≤ 1 (top01/top1 ≥ 10)**
- File: `src/core/distribution.ts:235-237, 326-327`
- Impact on phase goal: Synthetic anchors give alpha ≈ 1.139 (top01/top1 = 15M/2M = 7.5 → alpha = ln(10)/ln(7.5) ≈ 1.56). Wait — reviewer states `alpha = ln(10)/ln(top01/top1)`. With top01=15M, top1=2M: ratio=7.5, alpha=ln(10)/ln(7.5)=2.303/2.015≈1.14 > 1. All 44 tests pass on this fixture. The bug fires when top01/top1 ≥ 10.
- Assessment: Does not block phase goal (synthetic anchors are safe). BLOCKER for Phase 2+ with real data if empirical top01/top1 ratio ≥ 10.
- Disposition: WARNING — should be fixed before Phase 2 data is introduced.

**CR-03: userPercentile violates documented 0–100 contract (engine writes 0–1)**
- File: `src/core/engine.ts:239,253` and `src/core/types.ts:174-175`
- Impact: `types.ts` docstring says "0–100"; engine stores `percentileOf(...)` which returns [0,1]. Internally consistent: `returnAtPercentile` receives 0–1 (correct); `deriveShares` multiplies by 100 for `userRank` (correct). But the public `YearSnapshot.userPercentile` field carries a [0,1] value despite the docstring saying 0–100.
- Assessment: This is a **contract documentation bug** that creates a downstream risk for Phase 3 chart selectors that read `YearSnapshot.userPercentile`. The engine is self-consistent but the public contract is wrong.
- Disposition: Human verification required (see below) — needs a developer decision on the intended contract before Phase 3 consumes the field.

---

### Human Verification Required

#### 1. userPercentile 0–1 vs 0–100 contract decision (CR-03)

**Test:** Read `src/core/types.ts` lines 174-175 (YearSnapshot docstring) and compare against `src/core/engine.ts` line 239 (`percentileOf` returns [0,1]) and `src/core/relativePosition.ts` line ~49 (`userPercentile * 100` for userRank).

**Expected:** Developer decides which is correct:
- **Option A:** Keep [0,1] as the internal value; update the types.ts docstring from "0–100" to "0–1 (fraction)". Ensure Phase 3 selectors read the field correctly.
- **Option B:** Multiply by 100 in the engine (`const userPercentile = percentileOf(curve, userWealth) * 100`) and audit `returnAtPercentile` caller to pass `userPercentile / 100` instead.

**Why human:** The engine is internally self-consistent at [0,1] — tests all pass. The risk is downstream (Phase 3) not current. Developer needs to decide the intended public API before Phase 3 chart selectors are built.

#### 2. CR-01 / CR-02 fix timeline decision

**Test:** Review `src/core/distribution.ts` around lines 584-609 (bisect) and lines 235-237 (paretoConditionalMean). Confirm whether fixes are planned for Phase 1 (before proceeding) or Phase 2 (before real anchor data is loaded).

**Expected:** Developer acknowledges the two latent bugs and records a disposition: (a) fix now (recommended), or (b) defer explicitly to Phase 2 with a note that real anchor data must be validated to keep alpha > 1 and roots within bisection brackets.

**Why human:** Both bugs are silent — they produce no error, no test failure, and no visible symptom on synthetic anchors. Deciding whether to fix pre-Phase-2 or accept the risk requires developer judgment about Phase 2 anchor data characteristics.

---

### Gaps Summary

No gaps blocking the phase goal under the current synthetic test fixtures. The phase goal — "proven correct by numerical unit tests against synthetic citeable fixtures" — is fully satisfied: 44/44 tests pass, zero todos remain, TypeScript strict check passes, all 5 roadmap success criteria are met.

The human verification items concern:
1. A public contract documentation bug (CR-03) that risks misuse by Phase 3 consumers
2. Two latent correctness bugs (CR-01, CR-02) that are dormant on synthetic data but will activate on realistic high-concentration empirical anchor data in Phase 2

These are forward-risk items, not current goal failures.

---

_Verified: 2026-05-16T01:15:00Z_
_Verifier: Claude (gsd-verifier)_
