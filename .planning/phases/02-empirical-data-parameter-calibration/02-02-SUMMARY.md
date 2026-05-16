---
phase: 02-empirical-data-parameter-calibration
plan: 02
subsystem: core/types
tags: [types, sourcing, breaking-change, d-10, d-12]
dependency_graph:
  requires: [02-01-SUMMARY.md]
  provides: [SourceRecord interface, SourcedParam.source: SourceRecord, migrated Phase 1 fixtures]
  affects: [src/core/types.ts, src/core/__tests__/testUtils.ts, src/core/__tests__/basis.test.ts, src/core/__tests__/distribution.test.ts, src/core/__tests__/goldenMaster.test.ts, src/core/__tests__/invariants.test.ts, src/core/__tests__/multiTierFixture.test.ts, src/core/__tests__/numericalStability.test.ts]
tech_stack:
  added: []
  patterns: [SourceRecord structured citation (D-10), synthetic SourceRecord fixture helper (D-12), JSDoc-per-field documentation convention]
key_files:
  created: []
  modified:
    - src/core/types.ts
    - src/core/__tests__/testUtils.ts
    - src/core/__tests__/basis.test.ts
    - src/core/__tests__/distribution.test.ts
    - src/core/__tests__/goldenMaster.test.ts
    - src/core/__tests__/invariants.test.ts
    - src/core/__tests__/multiTierFixture.test.ts
    - src/core/__tests__/numericalStability.test.ts
decisions:
  - "D-10 implemented: SourceRecord replaces string | null — six required fields (sourceName, figureUsed, basis, definition, yearVintage, retrievedDate) plus optional note/url"
  - "A2 honored: SourceRecord.basis reuses 'real' | 'nominal' union for machine-checkability consistent with assertReal()"
  - "D-12 honored: synthetic SourceRecord constant (SYNTH_SOURCE_RECORD) used in all test fixtures — Wave D completeness gate targets production module only"
  - "synParam() exported from testUtils.ts so all test files can route SourcedParam construction through a single helper"
metrics:
  duration: ~5 minutes
  completed_date: "2026-05-16"
  tasks_completed: 2
  files_modified: 8
---

# Phase 2 Plan 02: SourceRecord Type Foundation Summary

Introduced the `SourceRecord` structured citation interface (D-10) into `types.ts`, evolving `SourcedParam.source` from `string | null` to a typed 6-field contract, and migrated all 6 Phase 1 test files to compile and stay green under the breaking change.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add SourceRecord and evolve SourcedParam in types.ts | 51c134c | src/core/types.ts |
| 2 | Migrate Phase 1 fixtures (synParam) to the SourceRecord shape | 0d4e502 | src/core/__tests__/testUtils.ts, basis.test.ts, distribution.test.ts, goldenMaster.test.ts, invariants.test.ts, multiTierFixture.test.ts, numericalStability.test.ts |

## What Was Built

**SourceRecord interface** (`src/core/types.ts`):
- Exported `interface SourceRecord` with six required fields: `sourceName`, `figureUsed`, `basis: 'real' | 'nominal'`, `definition`, `yearVintage`, `retrievedDate`
- Two optional fields: `note?` (carries the D-06 correction trail) and `url?` (Phase 3 VIZ-06 footer link)
- `basis` reuses the engine's `'real' | 'nominal'` union (A2 — machine-checkable, consistent with `assertReal`)
- JSDoc-per-field documentation following the file's established convention; D-10 cited inline

**Evolved SourcedParam** (`src/core/types.ts`):
- `source: SourceRecord` replaces `source: string | null`
- No remaining `string | null` on the source field anywhere in `src/`

**Fixture migration** (`src/core/__tests__/testUtils.ts`):
- Added `SYNTH_SOURCE_RECORD` constant: an obviously-synthetic `SourceRecord` (sourceName: 'synthetic', etc.) that satisfies the type without being a real citation (D-12 compliant)
- `synParam()` now exported (was previously private) and produces `{ value, basis, source: { ...SYNTH_SOURCE_RECORD, basis } }`
- All 6 Phase 1 test files updated to use `synParam()` or `{ ...synParam(v), note }` spread pattern for inline SourcedParam construction
- All 47 Phase 1 tests remain green with no assertions weakened

## Deviations from Plan

None — plan executed exactly as written. The migration scope (6 test files) matched the TypeScript error list from Task 1's verification step, and all were routed through `synParam()` as the plan directed.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are pure type-level contracts and test fixtures. T-02-03 (Tampering — `SourcedParam.source` contract) is mitigated: the structured `SourceRecord` now prevents an uncited `null` from being expressed as a valid value. T-02-04 (Repudiation — breaking change) mitigated: the fixture migration keeps the full suite green, preventing silent contract drift.

## Known Stubs

None. The `SourceRecord` type is the complete locked shape Wave C/D and Phase 3 VIZ-06 depend on. No production `SourceRecord` values exist yet — those are Wave C's responsibility (`src/data/sources.ts` and `src/data/defaults.ts`). The type contract is complete; data population is the next wave.

## Verification Results

- `npx tsc --noEmit`: exits 0 (no `source: null` or `source: string | null` anywhere in src/)
- `npx vitest run`: 47/47 tests pass (6 test files)
- `grep -n "interface SourceRecord" src/core/types.ts`: line 59 — interface exists with six required + two optional fields
- `grep -RnE "source:\s*null" src/core src/data 2>/dev/null | grep -v "^\s*//"`: only a comment in testUtils.ts header, no code-level null
- `grep -RnE "\b18\b" src/core/__tests__/testUtils.ts`: only in comment lines documenting the no-literal-18 rule

## Self-Check: PASSED

- [x] `src/core/types.ts` — modified, `SourceRecord` at line 59, `source: SourceRecord` in SourcedParam at line 95 ✓
- [x] `src/core/__tests__/testUtils.ts` — modified, `SYNTH_SOURCE_RECORD` exported, `synParam()` exported ✓
- [x] Commit `51c134c` — Task 1 (types.ts) ✓
- [x] Commit `0d4e502` — Task 2 (fixture migration, 7 files) ✓
- [x] `npx tsc --noEmit` — exits 0 ✓
- [x] `npx vitest run` — 47/47 tests pass ✓
