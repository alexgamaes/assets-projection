---
phase: 02-empirical-data-parameter-calibration
verified: 2026-05-16T03:15:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Cross-check each anchor's SourceRecord.figureUsed and SourceRecord.note against the actual primary source tables"
    expected: "The return values (median=2.5%, top10=4.5%, top1=7.0%, top01=12.0%) and wealth anchors (median=$120k, top10=$1M, top1=$5M, top01=$30M) trace faithfully to cited figures in Fagereng 2020 Table 3, Bach 2020, Saez-Zucman 2016 Table 1, JST 2019 Table 1, and McKinsey 2021 Exhibit 3. No misread or transposed figure."
    why_human: "Automated checks can only verify that figureUsed fields are non-empty and contain expected substrings (500bp, net-of-tax). Verifying that the cited numeric values are correct readings of the primary-source tables requires opening each cited paper and cross-checking the exact cell, population scope, and basis definition. This is the DATA-02 faithfulness gate explicitly marked 'manual-only' in 02-VALIDATION.md and 02-03-PLAN.md verification section."
---

# Phase 2: Empirical Data Parameter Calibration — Verification Report

**Phase Goal:** A frozen, citation-annotated default parameter set (return-by-tier curve, drag strength, tier boundaries, horizon default) traced to corrected primary literature, with a build check that refuses any parameter lacking a complete source record.
**Verified:** 2026-05-16T03:15:00Z
**Status:** human_needed (all automated checks pass; one mandatory manual-only gate required before phase is fully closed)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every default model parameter carries a complete source record (sourceName, figureUsed, basis, definition, yearVintage, retrievedDate) in a single sourced-parameter data model | VERIFIED | `SourceRecord` interface exists in `src/core/types.ts:59` with all six required fields. `SourcedParam.source` is typed `SourceRecord` (not `string\|null`). `DEFAULTS` in `src/data/defaults.ts` populates all 10 SourcedParam fields (anchors x4, returnByTier x4, dragStrength, savings). `sourcing.test.ts` enumerates and asserts completeness; 3/3 sourcing tests pass. |
| 2 | The build/test pipeline fails when any model parameter lacks a complete source record (sourcing is an enforced invariant, not a convention) | VERIFIED | `src/core/__tests__/sourcing.test.ts` contains the D-11 gate that enumerates every `SourcedParam` in `DEFAULTS` and asserts all 6 required fields are non-empty/non-whitespace. Two negative tests confirm the gate rejects whitespace-only (`'  '`) and empty-string (`''`) fields. All 58 tests pass (`npx vitest run` exit 0). `npx tsc --noEmit` also exits 0. |
| 3 | The return-by-tier anchors reflect the corrected Fagereng framing (raw ~500bp / ~10pp net-of-tax association — NOT a flat 18pp per-tier gap), triangulated across cited anchors, with no single hardcoded "18" in the engine | VERIFIED | `grep -rn '\b18\b' src/core src/data` returns zero matches in non-comment production code. `sources.ts:56-57` states the corrected framing verbatim ("Raw ~500bp (~5pp) cross-sectional 10th-90th return spread; ~10pp net-of-tax net-worth-percentile association"). The return gradient (2.5% → 4.5% → 7.0% → 12.0%) spans 9.5pp, qualitatively consistent with the corrected ~10pp net-of-tax association (not the discarded ~18pp gross figure). Per-tier notes reference `FAGERENG_CORRECTION_TRAIL` explaining why the "18pp" shorthand was discarded. |
| 4 | The drag-strength parameter has a documented derivation anchored to the McKinsey ~80% figure without implying a finite-pie transfer | VERIFIED | `DEFAULTS.dragStrength.value = 0.4325757739` is a back-solved constant. `calibration.test.ts` back-solves via bisection and asserts `assetInflationShare(0.4325757739) ≈ 0.80` (toBeCloseTo 2 decimals) and that the frozen value equals the solved value to 4 decimal places — all pass. `defaults.ts:329` note explicitly states the ~1.3x asset/GDP ratio is NOT the target (D-08). `invariants.test.ts` D-09 block re-asserts non-conservation and infinite-growth-preserved invariants on real DEFAULTS — no finite-pie artifact found (5/5 D-09 sub-tests pass). |
| 5 | The engine, running on these real defaults, produces a divergence sanity-check that no tier exceeds plausible bounds within the default horizon | VERIFIED | `calibration.test.ts` SC-5/O-3 test runs `projectionEngine` on `DEFAULTS` over the 35-year horizon, asserts all four anchor tiers are finite and positive at every year, and asserts `top01 ≤ 50 × totalAnchorWealth` at each year. Test passes. |

**Score:** 5/5 truths verified by automated checks.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/core/types.ts` | SourceRecord interface + SourcedParam.source: SourceRecord | VERIFIED | `interface SourceRecord` at line 59 with 6 required + 2 optional fields. `source: SourceRecord` in `SourcedParam` at line 95. |
| `src/core/__tests__/testUtils.ts` | synParam migrated to SourceRecord shape | VERIFIED | `synParam` returns a SourcedParam with a synthetic-but-type-valid SourceRecord. No `source: null` anywhere in `src/`. |
| `src/core/distribution.ts` | CR-01 bisect bracket/finite guard + CR-02 alpha>1 guard | VERIFIED | `"root not bracketed"` at line 642, `"non-finite endpoint"` at line 636, `alpha.*≤ 1` guard at line 310. |
| `src/core/__tests__/distribution.test.ts` | Negative tests for both guards | VERIFIED | Suite 9 `CR-01/CR-02 fail-loud guards` at line 534: `.toThrow(/alpha=.*≤ 1/)` at line 545, `.toThrow(/root not bracketed/)` at line 563, positive control at line 574. |
| `src/data/sources.ts` | Citation registry with fagereng2020, bach2020, saezZucman, jst2019, mckinsey2023 | VERIFIED | All 5 entries present, each typed as `SourceRecord` via `satisfies SourceRecord`. Fagereng `figureUsed` contains "500bp" and "net-of-tax". No literal `18` in file. |
| `src/data/defaults.ts` | Object.freeze'd DEFAULTS Params with full SourceRecord per value | VERIFIED | `Object.freeze` wraps DEFAULTS and each nested object (23 occurrences). Every SourcedParam has complete SourceRecord. alpha=1.285 > 1 documented (D-03). dragStrength back-solved value 0.4325757739. |
| `src/core/__tests__/sourcing.test.ts` | D-11 completeness enforcement test + negative blank-field test | VERIFIED | 3 tests: main completeness gate + 2 negative tests. Enumerates DEFAULTS only (D-12). References 6-field REQUIRED array. |
| `src/core/__tests__/calibration.test.ts` | dragStrength back-solve harness + divergence sanity-check | VERIFIED | 4 tests covering monotonicity, bracket check, frozen-value reproduction to ~80% (toBeCloseTo 2), and SC-5 divergence bounds. |
| `src/core/__tests__/invariants.test.ts` | D-09 re-run of D-12 invariant battery on real DEFAULTS | VERIFIED | D-09 describe block at line 230 imports DEFAULTS and runs 4 invariant cases (drag=0 collapse, non-conservation, no negative wealth, monotone divergence) on real DEFAULTS. All 9 invariants.test.ts tests pass. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/data/defaults.ts` | `src/data/sources.ts SOURCES` | `SOURCES.jst2019`, `SOURCES.saezZucman`, `SOURCES.mckinsey2023` spread references | WIRED | `import { SOURCES } from './sources.js'` at line 39. Spread `...SOURCES.jst2019` used in returnByTier median/top10/top1; `...SOURCES.saezZucman` in returnByTier top01; `...SOURCES.mckinsey2023` in dragStrength. |
| `src/core/__tests__/sourcing.test.ts` | `src/data/defaults.ts DEFAULTS` | enumeration of every SourcedParam | WIRED | `import { DEFAULTS } from '../../data/defaults.js'` at line 24. Walker at line 101 explicitly yields all 10 SourcedParams. |
| `src/core/__tests__/calibration.test.ts` | `src/data/defaults.ts dragStrength` | bisect back-solve reproduces McKinsey ~80% | WIRED | `import { DEFAULTS } from '../../data/defaults.js'` at line 43. Back-solve asserts `DEFAULTS.dragStrength.value ≈ solved` to 4 decimal places at line 232. |
| `src/core/__tests__/invariants.test.ts` | `src/data/defaults.ts DEFAULTS` | D-09 invariant battery on real DEFAULTS | WIRED | `import { DEFAULTS } from '../../data/defaults.js'` at line 21. D-09 describe block at line 230 uses `defaultsInputs` with `DEFAULTS` anchor/savings values. |
| `src/core/distribution.ts calibrateCurve` | alpha derivation site | `if (!(alpha > 1)) throw` guard | WIRED | Guard confirmed at line 310: throws matching `/alpha=.*≤ 1/`. |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase produces data modules and test artifacts, not UI components with rendered state.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite passes | `npx vitest run` | 58 tests, 8 files, all pass | PASS |
| TypeScript type-check clean | `npx tsc --noEmit` | No output (exit 0) | PASS |
| No literal 18 in engine/data production code | `grep -rn '\b18\b' src/data/defaults.ts src/data/sources.ts src/core/distribution.ts src/core/engine.ts src/core/types.ts` | No output | PASS |
| dragStrength back-solve reproduces ~80% | calibration.test.ts "frozen DEFAULTS.dragStrength.value reproduces ~80%" | PASS in suite | PASS |
| Divergence sanity-check within bounds | calibration.test.ts "all anchor tiers finite and positive" | PASS in suite | PASS |
| Sourcing gate rejects blank field | sourcing.test.ts negative tests | PASS in suite | PASS |

---

### Probe Execution

No conventional probe scripts found (`find scripts -path '*/tests/probe-*.sh'` returns nothing). Spot-checks above serve as the runnable verification layer.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DATA-01 | 02-02, 02-03 | Every default model parameter stored with complete citation | SATISFIED | `SourceRecord` type in `types.ts`; `DEFAULTS` with complete SourceRecord per value; `sourcing.test.ts` enforces completeness. |
| DATA-02 | 02-01, 02-03 | Return-by-tier anchors calibrated from corrected Fagereng framing (~500bp / ~10pp net-of-tax, not 18pp) | SATISFIED (automated) / MANUAL-NEEDED (faithfulness) | No literal "18" in engine/data. Corrected framing in `sources.ts` and all anchor notes. Per-tier gradient (9.5pp) consistent with corrected ~10pp. Manual cross-check of figures against cited tables required (see Human Verification section). |
| DATA-03 | 02-03, 02-04 | Asset-price-inflation drag grounded in McKinsey ~80% without finite-pie implication | SATISFIED | dragStrength back-solved to reproduce ~80% asset-inflation share; D-09 invariants confirm no zero-sum artifact; ~1.3x ratio explicitly excluded. |
| DATA-04 | 02-04 | Engine rejects/refuses any parameter lacking a source record | SATISFIED | `sourcing.test.ts` D-11 gate fails on any missing/empty/whitespace required field; negative tests prove gate rejects `''` and `'  '`. |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/core/__tests__/calibration.test.ts` | 13-18 vs 170-177 | WR-01 (from REVIEW.md): File header documents formula as `totalAnchorWealth(year)` but implementation uses `totalAnchorWealth(prevSnap)` (year-1). Two of three formula statements disagree with the implementation. | Warning | A future maintainer following the header formula would derive a different constant and wrongly conclude the frozen value is corrupted. Does NOT affect correctness or test passage — the implementation and frozen value are internally consistent. |
| `src/core/engine.ts` | ~274-284 | WR-03 (from REVIEW.md): Unscoped `catch {}` in endogenous re-calibration silently swallows non-domain errors | Warning | Would silently mask future regressions as "expected" domain exhaustion; identified in code review but not a blocker for the phase goal. |

No `TBD`, `FIXME`, or `XXX` markers found in phase-modified files.

---

### Human Verification Required

#### 1. DATA-02 Primary-Source Figure Faithfulness

**Test:** Open each cited primary source and cross-check the exact figure used in the corresponding SourceRecord:
- Fagereng et al. (2020), Econometrica 88(1): confirm that the ~500bp raw cross-sectional spread and ~10pp net-of-tax net-worth-percentile association are correct readings of the paper (Table 3 / main empirical finding).
- JST 2019 (QJE 134:3): confirm real geometric mean equities ~6.9%, housing ~6.9%, bonds ~2.5%, cash ~1% for the 16-country average.
- Bach et al. (2020), AER 110(9): confirm that top-decile return premium is primarily systematic-risk and leverage channels.
- Saez & Zucman (2016/2019): confirm top-0.1% threshold range ~$25-40M (2016-2019 vintage) and that private-business-equity gains dominate top-tail returns.
- McKinsey (2021): confirm ~80% of 2000-2021 advanced-economy net-worth growth attributed to asset-price inflation (not the ~1.3x asset/GDP ratio).

**Expected:** Each SourceRecord.figureUsed and SourceRecord.note accurately represents the cited figure's population scope, percentile definition, gross/net basis, and real/nominal treatment. No misread, transposed, or secondary-source figure.

**Why human:** Automated checks can only verify non-emptiness and substring presence ("500bp", "net-of-tax"). Verifying the numeric values are correct readings of primary-source tables requires a researcher to open each PDF and cross-reference against the specific table cell. The 02-03-PLAN.md verification section and 02-VALIDATION.md both explicitly flag this as "manual-only." Passing grep does not satisfy DATA-02 faithfulness.

---

### Gaps Summary

No gaps blocking the phase goal. All five success criteria are satisfied by automated evidence. The `human_needed` status is driven solely by the DATA-02 manual faithfulness gate, which was anticipated by the planner (explicitly marked manual-only in 02-VALIDATION.md) and is not a defect found during verification.

The two WARNING-class code-review findings (WR-01 formula doc inconsistency, WR-03 unscoped catch) do not block the phase goal but should be addressed before Phase 3 builds on this foundation.

---

_Verified: 2026-05-16T03:15:00Z_
_Verifier: Claude (gsd-verifier)_
