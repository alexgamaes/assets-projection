---
phase: 02-empirical-data-parameter-calibration
plan: 04
subsystem: core/calibration
tags: [calibration, sourcing, back-solve, invariants, d-07, d-08, d-09, d-11, data-04]

requires:
  - phase: 02-03-SUMMARY.md
    provides: frozen DEFAULTS with dragStrength=0.0 provisional placeholder
  - phase: 02-02-SUMMARY.md
    provides: SourceRecord interface + SourcedParam.source typed contract
  - phase: 02-01-SUMMARY.md
    provides: CR-01 bisect bracket/finite guard that makes back-solve reliable

provides:
  - src/core/__tests__/sourcing.test.ts (D-11 completeness enforcement + negative tests)
  - src/core/__tests__/calibration.test.ts (back-solve harness + divergence sanity-check)
  - src/core/__tests__/invariants.test.ts D-09 block (D-12 battery re-run on real DEFAULTS)
  - src/data/defaults.ts dragStrength.value frozen to back-solved 0.4325757739

affects: [02-04-calibration, phase-03-ui, phase-04-entry, phase-05-validation]

tech-stack:
  added: []
  patterns:
    - "Back-solve pattern (D-07): derive constant from reproducible procedure; freeze + reproduce in test"
    - "McKinsey share formula (O-1/D-08): cumulative asset-inflation contribution / total net-worth growth"
    - "D-09 parametric battery re-run: re-use sumAnchors + relErr helpers with DEFAULTS replacing syntheticParams"
    - "Negative test discipline: two negative tests (whitespace + empty string) prove Pitfall 6 is enforced"

key-files:
  created:
    - src/core/__tests__/sourcing.test.ts
    - src/core/__tests__/calibration.test.ts
  modified:
    - src/core/__tests__/invariants.test.ts
    - src/data/defaults.ts

key-decisions:
  - "D-11 enforced: enumerateSourcedParams() walker covers all 10 SourcedParams in DEFAULTS; assertComplete() rejects empty/whitespace (Pitfall 6)"
  - "D-07: dragStrength=0.4325757739 back-solved via bisectLocal() from McKinsey ~80% asset-inflation share target"
  - "D-08: back-solve target = McKinsey ~80% share-of-net-worth-growth; NOT the ~1.3x asset/GDP ratio"
  - "O-1 pinned: share formula = Σ[totalAnchorWealth(year-1) × assetInflation(year)] / (totalYn - totalY0)"
  - "O-2 pinned: calibrated real DEFAULTS used as 2000-2021-like baseline (self-consistent)"
  - "D-09 confirmed: all four Phase 1 D-12 invariants hold on back-solved real DEFAULTS (no finite-pie artifact)"

metrics:
  duration: ~8min
  completed: "2026-05-16"
  tasks_completed: 4
  files_modified: 4
---

# Phase 2 Plan 04: Enforcement and Calibration Layer Summary

Added the enforcement and calibration layer completing Phase 2: sourcing completeness is now a build-enforced invariant (D-11/DATA-04), dragStrength is a frozen back-solved constant at 0.4325757739 (D-07/D-08 — McKinsey ~80% asset-inflation share of net-worth growth), and the Phase 1 D-12 non-conservation/infinite-growth invariants hold on the real back-solved defaults (D-09 — no finite-pie artifact).

## Performance

- **Duration:** ~8 minutes
- **Started:** 2026-05-16T09:57:38Z
- **Completed:** 2026-05-16T10:05:56Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- `sourcing.test.ts`: D-11 completeness enforcement gate with `enumerateSourcedParams()` walking all 10 DEFAULTS SourcedParams; `assertComplete()` rejecting empty/whitespace (Pitfall 6); two negative tests (whitespace-only + empty string) proving test-the-test discipline
- `calibration.test.ts`: dragStrength back-solve harness with local `bisectLocal()` + O-1-pinned `assetInflationShare()` formula; bracket validity; frozen-value reproduction (toBeCloseTo 0.80, 2); divergence sanity-check (SC-5/O-3 — all tiers finite/positive, top01 < 50× total)
- `invariants.test.ts` D-09 block: four-case D-12 battery re-run on DEFAULTS (drag=0 collapse, non-conservation, no negative wealth, monotone divergence)
- `defaults.ts` dragStrength.value: frozen from 0.0 placeholder to 0.4325757739 with documented procedure in note (D-07/D-08)

## Task Commits

Each task was committed atomically:

1. **Task 1: D-11 sourcing-completeness enforcement test** - `4c7db29` (feat)
2. **Task 2+3: dragStrength back-solve + divergence sanity-check** - `852e4d1` (feat)
3. **Task 4: D-09 D-12 invariant battery on real DEFAULTS** - `5b6531a` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `src/core/__tests__/sourcing.test.ts` — D-11 enforcement: REQUIRED six-field list, enumerateSourcedParams() walker, assertComplete() with Pitfall 6 rejection, two negative tests (whitespace + empty string)
- `src/core/__tests__/calibration.test.ts` — dragStrength back-solve harness (bisectLocal, assetInflationShare with O-1 formula, D-08 comment distinguishing McKinsey ~80% share from ~1.3x ratio), frozen-value reproduction, divergence sanity-check
- `src/core/__tests__/invariants.test.ts` — Added D-09 describe block (4 new tests re-running D-12 battery on DEFAULTS)
- `src/data/defaults.ts` — dragStrength.value changed from 0.0 placeholder to 0.4325757739; note updated with back-solve procedure, O-1 formula, and McKinsey ~80% target documentation

## Deviations from Plan

**1. [Note - TDD RED phase] Tests passed immediately (no RED failure on Task 1 and Task 4)**

For Task 1 (`sourcing.test.ts`): since `DEFAULTS` was populated with complete SourceRecords in Plan 03, the completeness test passed immediately. The negative tests (testing that blank/whitespace fields fail) provided the RED verification that the gate is working. This is the correct behavior — the "fail-fast rule" from the TDD guide applies: the feature (complete DEFAULTS) exists, and the gate correctly validates it.

For Task 4 (`invariants.test.ts` D-09 block): all four D-12 invariants hold on DEFAULTS because the engine is correct and the calibrated defaults satisfy the invariants. The tests passed on first write. The RED phase was confirmed via the Task 2 calibration test (frozen value `0.0` correctly failed the back-solve reproduction assertion).

For Task 2 (`calibration.test.ts`): RED phase was confirmed — the test with `DEFAULTS.dragStrength.value=0.0` failed the `toBeCloseTo(0.80, 2)` assertion as expected. GREEN achieved by freezing `0.4325757739`.

**2. [Design note] Tasks 2 and 3 committed together**

Tasks 2 (back-solve harness) and 3 (divergence sanity-check) were committed as one atomic commit since both live in `calibration.test.ts` which was created as a single file in one TDD cycle. The calibration.test.ts file contains clearly separated `describe` blocks per the plan structure.

## Known Stubs

None. All stubs from Plan 03 resolved:
- `dragStrength.value`: previously 0.0 (provisional placeholder), now 0.4325757739 (frozen back-solved constant)
- All DEFAULTS parameters have complete SourceRecords (enforced by the D-11 gate)

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are test files and one data constant update.

T-02-08 mitigated: D-11 enumeration test enforces build-time completeness; negative tests prove the gate rejects `''`/whitespace (Pitfall 6). HIGH severity — build fails if any shipped SourceRecord has a missing/empty field.

T-02-09 mitigated: dragStrength is back-solved against McKinsey ~80% target via reproducible bisect procedure; calibration.test.ts re-derives it and asserts the frozen value reproduces the target (Pattern 3 — credibility in the procedure).

T-02-10 mitigated: D-09 re-runs the D-12 non-conservation/infinite-growth battery on the real back-solved defaults (Pitfall 4). HIGH severity — all four invariants pass; no tier's loss equals another's gain.

T-02-SC: no new packages installed.

## Verification Results

- `npx tsc --noEmit`: exits 0
- `npx vitest run`: 58/58 tests pass (8 test files; +11 new tests vs Plan 03 baseline of 47)
- `grep -RnE "\b18\b" src/core src/data`: only in comment strings documenting the rule; no numeric literals (PASS)
- Sourcing-completeness gate green (DATA-04 enforced; negative tests prove Pitfall 6 rejection)
- dragStrength back-solve reproduces McKinsey ~80% (`toBeCloseTo(0.80, 2)` passes) and equals bisect-solved value to 4 decimal places
- D-12 invariant battery green on real DEFAULTS (no finite-pie artifact, D-09)
- Divergence sanity-check green; all tiers finite/positive; top01 < 50× total anchor wealth

## Self-Check: PASSED

- [x] `src/core/__tests__/sourcing.test.ts` — created, 3 tests pass ✓
- [x] `src/core/__tests__/calibration.test.ts` — created, 4 tests pass ✓
- [x] `src/core/__tests__/invariants.test.ts` — modified, 9/9 tests pass (was 5) ✓
- [x] `src/data/defaults.ts` — dragStrength.value = 0.4325757739 (frozen back-solved constant) ✓
- [x] Commit `4c7db29` — Task 1 (sourcing.test.ts) ✓
- [x] Commit `852e4d1` — Task 2+3 (calibration.test.ts + defaults.ts) ✓
- [x] Commit `5b6531a` — Task 4 (invariants.test.ts D-09 block) ✓
- [x] `npx tsc --noEmit` — exits 0 ✓
- [x] `npx vitest run` — 58/58 tests pass ✓
- [x] No literal 18 in src/core source files or src/data ✓
