---
phase: 02-empirical-data-parameter-calibration
reviewed: 2026-05-16T03:10:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/core/distribution.ts
  - src/core/engine.ts
  - src/core/types.ts
  - src/data/defaults.ts
  - src/data/sources.ts
  - src/core/__tests__/calibration.test.ts
  - src/core/__tests__/sourcing.test.ts
  - src/core/__tests__/invariants.test.ts
  - src/core/__tests__/distribution.test.ts
  - src/core/__tests__/testUtils.ts
findings:
  critical: 0
  warning: 5
  info: 3
  total: 8
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-05-16T03:10:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Phase 2 (empirical parameter calibration) was reviewed adversarially with focus on
numerical-model correctness, citation/data-integrity, and the engine's calibration
fallback. The full suite (58 tests across 8 files) passes, and the back-solve test
reproduces the frozen `dragStrength = 0.4325757739` constant. The fail-loud guards
(CR-01 bisect bracket/finite check, CR-02 alpha>1) are correctly implemented and
exercised by both positive and negative tests.

No BLOCKER-class defects were found: there are no injection/secret/crash issues, and
the math is internally consistent and well-tested. However, several WARNING-class
issues degrade data-integrity confidence and robustness — most notably a formula
mismatch between the documented derivation of the frozen, **sourced** calibration
constant and the code that actually produced it, and an unscoped `catch {}` in the
engine that can silently mask genuine bugs as "expected" calibration degradation.

## Warnings

### WR-01: Frozen calibration constant's documented formula contradicts the code that produced it

**File:** `src/data/defaults.ts:341-343`, `src/core/__tests__/calibration.test.ts:13-18`, `src/core/__tests__/calibration.test.ts:116-122` vs `src/core/__tests__/calibration.test.ts:170-177`

**Issue:** `dragStrength = 0.4325757739` is a shipped, sourced value whose
`SourceRecord.note` documents the back-solve share formula as
`Σ_year[totalAnchorWealth(year-1) × assetInflation(year)] / (totalAnchorWealth(horizon) − totalAnchorWealth(0))`.
The calibration.test.ts file header (lines 13-18) and the `assetInflationShare`
docstring (lines 116-122) instead document the numerator as
`Σ_year[totalAnchorWealth(year) × assetInflation(year)]` (no `year-1`). The actual
implementation (lines 170-177) uses `totalAnchorWealth(prevSnap)` i.e. `year-1`.
So two of three documented statements of the formula disagree with the code, on a
parameter whose entire justification is "reproducible via the documented formula."
CLAUDE.md mandates "every shipped value must cite a real source" and the note's
claim of reproducibility is the auditable artifact. A future maintainer following
the test-header formula would back-solve a *different* constant and wrongly conclude
the frozen value is corrupted.

**Fix:** Make all three statements identical. Either correct the calibration.test.ts
header and `assetInflationShare` docstring to read `totalAnchorWealth(year-1)`
(matching defaults.ts and the implementation), or change all to a single canonical
wording. Recommended: align the docstrings to the implementation —
```
//   assetInflationShare(d) =
//       Σ_year [ totalAnchorWealth(year-1) × assetInflation(year) ]
//       ──────────────────────────────────────────────────────────
//       totalAnchorWealth(horizon) − totalAnchorWealth(0)
```

### WR-02: `assetInflationShare` proxy metric overstates fidelity to the McKinsey ~80% citation

**File:** `src/core/__tests__/calibration.test.ts:170-179`, `src/data/defaults.ts:337-349`

**Issue:** The numerator multiplies the *prior-year aggregate of all four anchor
tiers* by the scalar `assetInflation`, but `assetInflation` is actually applied
per-tier to each tier's own wealth (`tiers.ts:71-74`), and the denominator
(`totalAnchorWealth(horizon) − totalAnchorWealth(0)`) includes savings-driven growth
that is not asset-price inflation. The constant is internally reproducible against
*this specific harness*, but the `SourceRecord` asserts it "maps to McKinsey 'share
of net-worth growth from asset-price inflation' (~80%)". The mapping is a modeling
proxy with at least two known approximations (aggregate-vs-per-tier haircut basis;
savings contaminating the growth denominator). Per CLAUDE.md data-integrity
constraint ("don't assume stuff"), the citation note presents a proxy as a direct
empirical match without flagging these approximations.

**Fix:** Add an explicit caveat to `DEFAULTS.dragStrength.source.note` stating the
share metric is a model proxy (aggregate-tier haircut basis; denominator includes
real saving), and that 0.80 is a plausibility-magnitude target, not a
definitional reconstruction of the McKinsey decomposition. (`mckinsey2023.note`
already hedges "magnitude/plausibility anchor" — mirror that hedge on the frozen
value's own note.)

### WR-03: Unscoped `catch {}` in endogenous re-calibration can silently mask real bugs

**File:** `src/core/engine.ts:274-284`

**Issue:** `try { nextCurve = calibrateCurve(...) } catch { nextCurve = shiftScaleCurve(...) }`
catches *every* throwable, not only the intended CR-02 (`alpha ≤ 1`) /
CR-01 (`root not bracketed`) domain-exhaustion errors. A future regression that
makes `calibrateCurve` throw a `TypeError`, a `RangeError` from `Math.pow`, or any
other programming error would be silently swallowed and the engine would continue
on the fixed-shape-scaled path, producing plausible-but-wrong trajectories with no
diagnostic. This is precisely the "fallback could silently mask calibration errors"
risk. The header comment claims this is "not a silent clamp" — but an unfiltered
catch is exactly a silent clamp for any non-anticipated failure.

**Fix:** Inspect the error and only fall back on the known domain-exhaustion
messages; re-throw anything else:
```ts
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  const isDomainExhaustion =
    /Pareto tail index alpha=.*≤ 1/.test(msg) || /root not bracketed/.test(msg);
  if (!isDomainExhaustion) throw err;
  nextCurve = shiftScaleCurve(curve, anchorWealth, newAnchorWealth);
}
```

### WR-04: `computeTopSetGrowthRate` has two silent degenerate fallbacks

**File:** `src/core/engine.ts:101-104`, `src/core/engine.ts:107-108`

**Issue:** When no anchor lands in the top set the function silently returns
`params.returnByTier.top01.value` (line 103); when `totalWeight === 0` it returns
`0` (line 108). Both feed directly into the drag haircut and thus every downstream
tier's `r_eff`. Neither path emits any diagnostic, and the "empty top set" branch
is reachable when `dynamicTopSetPercentile` returns its `hi` clamp (0.9999 >
all four anchor percentiles incl. 0.999) under extreme concentration — i.e.
exactly the long-horizon endogenous-evolution regime this phase exercises. A
representative-rate substitution silently changes the drag and is indistinguishable
from correct behavior in the output.

**Fix:** At minimum, document the `topSetPercentile ≥ 0.999` reachability in the
fallback comment (currently it claims "so thin no anchor lands above it" without
noting the dynamicTopSetPercentile `hi`-clamp interaction). Preferably, when the
top set is empty use the wealth-weighted average of the top-most anchor(s) by a
defined rule rather than bare `top01`, and add an invariant test asserting which
branch fires under the DEFAULTS 35-year horizon.

### WR-05: `shiftScaleCurve` silently returns the curve unchanged on non-positive median

**File:** `src/core/engine.ts:143`

**Issue:** `if (oldMedian <= 0) return curve;` returns the prior curve unmodified
with no diagnostic. Under DEFAULTS the median tier's `r_eff` is negative
(`2.5% − ~drag`), and the median wealth declines toward its annuity floor; an
adversarial parameter set (higher dragStrength, lower savings) could drive
`oldMedian` to ≤ 0, after which the wealth distribution curve freezes permanently
while anchor wealths keep evolving — a silent decoupling of the curve from the
state it is supposed to track. Test `invariants.test.ts:315` only asserts median
`>= 0` (not `> 0`), so a zero-median state is explicitly considered reachable.

**Fix:** Use a sign-safe scale reference that cannot go non-positive (e.g. the
top01 anchor, which is asserted `> 0` everywhere), or fail loud with a diagnostic
naming the degenerate median rather than returning a stale curve.

## Info

### IN-01: `_totalWealth` snapshot field is structurally typed, bypassing the public contract

**File:** `src/core/engine.ts:249-257`, `src/core/relativePosition.ts:54`

**Issue:** The engine attaches `_totalWealth` via an inline intersection type and
`relativePosition.ts` reads it back via `(snap as YearSnapshot & {...})`. It is not
part of the `YearSnapshot` interface in `types.ts`, so the cross-module data
contract is invisible to the authoritative type file that the phase docstring calls
"the authoritative export contract consumed by all downstream plans."

**Fix:** Promote `_totalWealth` to an explicit optional field on `YearSnapshot`
(documented as engine-internal) so the producer/consumer coupling is type-checked.

### IN-02: `returnAtPercentile` documents log-linear but implements plain linear interpolation

**File:** `src/core/distribution.ts:563-567`, `src/core/distribution.ts:595-596`

**Issue:** The header says "Log-linear interpolation in percentile space" and
"log-linear in percentile (not log-log)", but the implementation is straight linear
in percentile and linear in rate (`r_lo + t * (r_hi - r_lo)`), with `t` linear in
percentile. There is no logarithm anywhere. The behavior is fine and monotone; the
naming is simply misleading for future maintainers.

**Fix:** Rename the comments to "piecewise-linear interpolation in percentile space"
to match the code.

### IN-03: Dead unreachable return retained without `istanbul ignore` or assertion

**File:** `src/core/distribution.ts:600-601`

**Issue:** `return anchors[anchors.length - 1]![1];` is documented "Unreachable
given the clamp above" and is genuinely unreachable. It is harmless but is dead code
that will never be covered; an explicit `throw new Error('unreachable: percentile outside clamped range')`
would convert a future logic regression (e.g. if the clamp bounds change) into a
loud failure instead of silently returning the top rate.

**Fix:** Replace the dead `return` with a fail-loud `throw`, consistent with the
module's stated assertReal/fail-loud philosophy (distribution.ts:28-35).

---

_Reviewed: 2026-05-16T03:10:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
