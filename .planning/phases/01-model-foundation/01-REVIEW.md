---
phase: 01-model-foundation
reviewed: 2026-05-16T00:55:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - src/core/types.ts
  - src/core/distribution.ts
  - src/core/drag.ts
  - src/core/engine.ts
  - src/core/relativePosition.ts
  - src/core/tiers.ts
  - src/core/__tests__/testUtils.ts
  - src/core/__tests__/basis.test.ts
  - src/core/__tests__/distribution.test.ts
  - src/core/__tests__/goldenMaster.test.ts
  - src/core/__tests__/invariants.test.ts
  - src/core/__tests__/multiTierFixture.test.ts
  - src/core/__tests__/numericalStability.test.ts
  - vitest.config.ts
findings:
  critical: 3
  warning: 5
  info: 4
  total: 12
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-05-16T00:55:00Z
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

The model is well-documented and the 44-test suite passes. However, the suite tests
only one anchor configuration (the synthetic 50k/300k/2M/15M set). Adversarial probing
of the numerical core reveals that the calibration and distribution math break silently
on entirely plausible inputs — specifically the *high wealth concentration* this tool
exists to model. The `bisect` solver has no root-bracketing guard and silently returns
garbage; `paretoConditionalMean` produces a **negative** `totalWealth` whenever the
top0.1%/top1% wealth ratio reaches ~10 (a realistic concentration level), poisoning every
downstream share/percentile computation with no error. A documented public contract
(`userPercentile` units) is also violated by the engine and untested.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: `bisect` silently returns a wrong root when the interval is not bracketed

**File:** `src/core/distribution.ts:584-609`
**Issue:** `bisect` computes only `fa = f(a)` and never verifies a sign change between
`lo` and `hi`. If the root lies outside `[lo, hi]` (so `f(lo)` and `f(hi)` share a sign),
the loop still runs and returns `(a+b)/2` — a value with no relation to any root, with no
error. Verified empirically: `bisect(x => x*x-100, 0, 5)` (true root 10, outside bracket)
returns `4.999…`. Both callers feed user-derived data into fixed brackets:
`calibrateCurve` uses `[0.9001, 0.9999]` (line 308) and `dynamicTopSetPercentile` uses
`[0.0001, 0.9999]` (line 498). For anchor sets where the stitch root or the 50%-share
percentile falls outside these hardcoded brackets (e.g. a very low-concentration or very
high-concentration distribution), the engine produces a confidently wrong curve and
projection with no failure signal. `NaN` from `f` (see CR-02) also yields a finite-looking
junk value because `NaN > 0` is `false`.
**Fix:**
```typescript
function bisect(f, lo, hi, maxIter = 100, tol = 1e-12): number {
  let a = lo, b = hi;
  const fa = f(a);
  const fb = f(b);
  if (!Number.isFinite(fa) || !Number.isFinite(fb)) {
    throw new Error(`bisect: non-finite endpoint f(${lo})=${fa}, f(${hi})=${fb}`);
  }
  if (fa === 0) return a;
  if (fb === 0) return b;
  if (fa * fb > 0) {
    throw new Error(`bisect: root not bracketed in [${lo}, ${hi}] (f(lo)=${fa}, f(hi)=${fb})`);
  }
  // ... existing loop ...
}
```

### CR-02: `totalWealth` becomes negative/infinite for high wealth concentration (α ≤ 1)

**File:** `src/core/distribution.ts:235-237, 326-327, 445-471`
**Issue:** `paretoConditionalMean = (alpha * w) / (alpha - 1)` diverges at `alpha = 1`
and goes **negative** for `alpha < 1`. `alpha = ln(10) / ln(top01/top1)`
(line 292), so `alpha ≤ 1` whenever `top01/top1 ≥ 10`. That ratio is not exotic — it is
exactly the extreme top-heavy concentration this application is built to model
(e.g. top1=$2M, top01=$30M → α≈0.85). With α<1, `calibrateCurve` produces a **negative
`totalWealth`** (verified: `pcm(0.9, 1e6) = -9,000,000`). Downstream, `cumulativeShareFromTop`
returns negative shares, `dynamicTopSetPercentile` bisects a non-monotone garbage
function (compounding CR-01), and `relativePosition.userShare` divides by a negative
denominator. No error is raised — the model returns plausible-looking but meaningless
numbers. The test suite never exercises α≤1, so this is entirely uncaught.
**Fix:** Reject (or document-and-clamp) infinite-mean tails at calibration:
```typescript
if (!(alpha > 1)) {
  throw new Error(
    `calibrateCurve: Pareto tail index alpha=${alpha} ≤ 1 (top01/top1=${top01Wealth/top1Wealth}); ` +
    `mean wealth is undefined for alpha ≤ 1. Constrain anchors so top01/top1 < 10.`
  );
}
```
Add a test asserting this throws for `top01/top1 ≥ 10`.

### CR-03: `userPercentile` violates its documented 0–100 contract (engine writes 0–1)

**File:** `src/core/engine.ts:239,253` and `src/core/types.ts:174-175`
**Issue:** `types.ts` defines the public contract: *"User's estimated wealth percentile
in the distribution at this year (0–100)."* The engine sets
`userPercentile = percentileOf(curve, userWealth)` (line 239), and `percentileOf` →
`cdf` returns a fraction in **[0, 1]** (distribution.ts:409-411,382). So every snapshot
emits `userPercentile ∈ [0,1]`, not `[0,100]`. `deriveShares` happens to multiply by 100
for `userRank` (relativePosition.ts:49), masking the issue for that one derived field, but
any downstream consumer (plans 02/03) reading `snap.userPercentile` per the documented
type will be off by 100×. The only test touching it (`goldenMaster.test.ts:159-171`)
asserts `pct0 !== pct60`, which passes at any scale and does not catch the contract
break.
**Fix:** Make the engine honor the documented contract and add a range assertion test:
```typescript
const userPercentile = percentileOf(curve, userWealth) * 100; // 0–100 per YearSnapshot contract
```
(Then audit `returnAtPercentile`/`deriveShares` callers for the unit change, or instead
fix the docstring to say 0–1 and update `deriveShares` — but pick one and test the bound.)

## Warnings

### WR-01: `dynamicTopSetPercentile` can fail to bracket the 50% share root

**File:** `src/core/distribution.ts:495-505`
**Issue:** Bisection is hardcoded to `[0.0001, 0.9999]`. For a sufficiently equal
distribution the top 0.01% may hold *less* than 50% of wealth, so `share(p) - 0.5` does
not change sign on the interval. Per CR-01, `bisect` then silently returns `0.9999`
(or junk), and `topSetPercentile` / `assetInflation` are silently wrong. Add an explicit
bracket/feasibility check (depends on CR-01 fix) and a test with near-uniform anchors.

### WR-02: Degenerate-anchor inputs are never validated at the engine boundary

**File:** `src/core/engine.ts:193-207`, `src/core/distribution.ts:277-335`
**Issue:** `assertReal` is the only entry guard. `calibrateCurve` will happily accept
`median ≤ 0` (`Math.log` → `NaN`/`-Infinity`), `top10 ≤ median` (negative σ, inverted
distribution — verified `f(0.9001)` and `f(0.9999)` both negative → unbracketed),
`top01 ≤ top1` (negative α), or zero/negative anchors, all producing `NaN`/garbage
curves with no error. Since CLAUDE.md mandates Zod validation at boundaries, add a
`calibrateCurve` precondition check: `0 < median < top10 < top1 < top01` and finite.

### WR-03: `numericalStability` "60-year drift" test never advances the curve

**File:** `src/core/__tests__/numericalStability.test.ts:52-73`
**Issue:** The drift test uses `dragStrength: 0`. With drag 0, `assetInflation` is 0 every
year and the anchor recursion `W*(1+r)+S` is fully decoupled from the
distribution/erf/bisection machinery. The test therefore validates only the trivial pure
annuity recursion, not the 60-year stability of the actual coupled pipeline (calibrate →
top-set → drag → refit) it claims to cover. Add a drag-on long-horizon stability check
against an independent reference, or document that coupled-path stability is unverified.

### WR-04: Drag uses forward return rate, not realized growth — undocumented modeling gap

**File:** `src/core/engine.ts:225-234`, `computeTopSetGrowthRate:74-116`
**Issue:** The docstring (drag.ts:40, types.ts:185-187) defines `assetInflation` as
`dragStrength × (aggregate wealth-growth rate of the dynamic top set)`. The implementation
feeds `computeTopSetGrowthRate`, which returns a wealth-weighted average of the *gross
return rates* (`returnByTier[key].value`), ignoring the savings contribution `S` that is
also part of realized top-set wealth growth. For low-wealth top sets this diverges from
the documented "wealth-growth rate". This may be intentional, but it is undocumented and
the only test (`multiTierFixture.test.ts:187-204`) is satisfied because the top set is a
single high-wealth anchor where S is negligible. Document the rate-vs-growth choice or
align the implementation with the docstring.

### WR-05: `shiftScaleCurve` silently freezes the curve on non-positive median

**File:** `src/core/engine.ts:134-160`
**Issue:** `if (oldMedian <= 0) return curve;` returns the prior curve unchanged. Under
strong drag the median tier `r_eff` can be negative for long horizons; if median wealth
ever reaches ≤ 0 the `fixed-shape-scaled` distribution silently stops evolving with no
diagnostic, producing a misleading projection. At minimum log/flag the degenerate case;
preferably guard against it explicitly.

## Info

### IN-01: `relativePosition` fallback denominator is dead code

**File:** `src/core/relativePosition.ts:54-56`
**Issue:** `_totalWealth` is unconditionally set by the engine (engine.ts:256), so the
`?? snap.anchorWealth.top01` fallback can never execute. The "older snapshots" scenario in
the docstring does not exist. Remove the dead fallback or make `_totalWealth` a typed
required field instead of an untyped cast.

### IN-02: `_totalWealth` is an untyped structural-cast back-channel

**File:** `src/core/engine.ts:249,256`, `src/core/relativePosition.ts:54`
**Issue:** The engine smuggles `_totalWealth` onto `YearSnapshot` via
`YearSnapshot & { _totalWealth: number }` and `relativePosition` reads it via a parallel
cast. This is a fragile cross-module contract invisible to the type system. Promote it to
an explicit (optional or internal) typed field on the snapshot/result type.

### IN-03: Unreachable return path documented but not enforced

**File:** `src/core/distribution.ts:565-566`
**Issue:** `returnAtPercentile` has a `// Unreachable given the clamp above` final return.
It is genuinely unreachable only because of the clamp at line 553; a refactor of the
clamp would silently change behavior. Consider replacing with
`throw new Error('unreachable')` to fail loudly if the invariant is ever broken.

### IN-04: Sub-median users are clamped to the median return rate

**File:** `src/core/distribution.ts:551-552`
**Issue:** `returnAtPercentile` clamps any percentile ≤ 0.5 to the median rate. A user
starting below median wealth receives the median tier's return, contradicting the app's
core thesis that lower-wealth holders earn empirically lower returns. The docstring notes
the clamp, so this is a deliberate (debatable) modeling choice — flagged so it is a
conscious decision, not an oversight, before plans 02–04 build UX on it.

---

_Reviewed: 2026-05-16T00:55:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
