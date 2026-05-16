---
phase: 01-model-foundation
plan: "01"
subsystem: core-scaffold
tags: [typescript, vitest, types, basis-invariant, tdd, wave-0]
dependency_graph:
  requires: []
  provides:
    - src/core/types.ts (branded basis types + full engine contract interfaces)
    - src/core/__tests__/testUtils.ts (relErr, analyticOrdinaryAnnuity, makeSyntheticParams)
    - src/core/__tests__/basis.test.ts (MODEL-05 basis-mismatch assertion, GREEN)
    - src/core/__tests__/invariants.test.ts (MODEL-01 import-boundary scan, GREEN)
    - Wave-0 test skeleton (4 placeholder files, todos for Plans 02/03/04)
    - package.json + tsconfig.json + vitest.config.ts (strict TypeScript + Vitest 3.2.4)
  affects: []
tech_stack:
  added:
    - typescript@5.9.3
    - vitest@3.2.4
    - "@vitest/coverage-v8@3.2.4"
    - tsx@4.22.0
    - "@types/node@25.8.0"
  patterns:
    - Branded nominal/real types via unique symbol (RESEARCH Pattern 2)
    - assertReal runtime guard for testable basis violations
    - TDD RED/GREEN cycle for all behavioral tests
    - SourcedParam shape with source:null for Phase-2-ready citations
key_files:
  created:
    - src/core/types.ts
    - src/core/__tests__/testUtils.ts
    - src/core/__tests__/basis.test.ts
    - src/core/__tests__/invariants.test.ts
    - src/core/__tests__/goldenMaster.test.ts
    - src/core/__tests__/distribution.test.ts
    - src/core/__tests__/multiTierFixture.test.ts
    - src/core/__tests__/numericalStability.test.ts
    - package.json
    - package-lock.json
    - tsconfig.json
    - vitest.config.ts
    - .gitignore
  modified: []
decisions:
  - "Hybrid basis enforcement: branded compile-time types (Real<T>/Nominal<T> via unique symbol) + assertReal() runtime guard so MODEL-05 satisfies both type-level and test-failure halves"
  - "Two-tolerance scheme: <1e-9 for drag-off annuity golden master (D-11), DIST_TOL=1e-6 for distribution-curve tests (RESEARCH Open Question 2 resolution)"
  - "@types/node added as dev dep (Rule 3 auto-fix): required for node: protocol imports in the import-boundary scan test; Microsoft first-party, no gate required"
  - "analyticOrdinaryAnnuity is fully independent of engine code — must never import from src/core/engine (D-10: golden master must not share engine bugs)"
metrics:
  duration_minutes: 12
  completed_date: "2026-05-16"
  tasks_completed: 2
  tasks_total: 2
  files_created: 13
  files_modified: 0
---

# Phase 1 Plan 1: TypeScript+Vitest Scaffold + Core Types Summary

**One-liner:** Greenfield TypeScript 5.9.3 + Vitest 3.2.4 scaffold with branded nominal/real basis types, assertReal runtime guard, analytic golden-master utility, and 7-file Wave-0 test skeleton.

## What Was Built

### Task 2: Project Scaffold
- `package.json` with `"type":"module"`, 4 pinned dev deps (typescript@5.9.3, vitest@3.2.4, @vitest/coverage-v8@3.2.4, tsx@4.22.0), scripts: test/test:cov/typecheck.
- `tsconfig.json`: strict=true, noUncheckedIndexedAccess=true, verbatimModuleSyntax=true, moduleResolution=bundler, target=ES2022, noEmit=true.
- `vitest.config.ts`: include glob `src/core/__tests__/**/*.test.ts`, v8 coverage provider scoped to `src/core/**`.
- `.gitignore`: node_modules, coverage, dist.

### Task 3: Core Types + Test Utilities + Wave-0 Skeleton (TDD RED/GREEN)

**RED phase (e836bc2):** basis.test.ts and invariants.test.ts written with real assertions. Confirmed failing (types.ts did not exist → ERR_MODULE_NOT_FOUND for basis.test.ts; invariants.test.ts passed vacuously with no source files to scan).

**GREEN phase (785b9fa):**

`src/core/types.ts` — authoritative export contract:
- `Real<T>` / `Nominal<T>` branded via `declare const BasisTag: unique symbol`
- `asReal()` / `asNominal()` constructors
- `assertReal(p, ctx)` throwing `"Basis violation in {ctx}: expected real, got {basis}"`
- `SourcedParam { value, basis, source, note? }` — Phase-2-ready (source:null for synthetics)
- `Anchors`, `ReturnByTier` — 4-percentile structs (p50/p90/p99/p99.9)
- `Params` with full D-07/D-08/D-09 doc comments
- `Inputs`, `YearSnapshot`, `ProjectionResult`

`src/core/__tests__/testUtils.ts` — shared test utilities:
- `relErr(actual, expected)`: the ONE documented relative-error helper (`|a-e|/max(|e|,1e-12)`)
- `analyticOrdinaryAnnuity(W0, r, S, n)`: independent textbook closed form; handles r=0 branch exactly
- `DIST_TOL = 1e-6`: documented tolerance for distribution-math tests
- `makeSyntheticParams(overrides?)` + `syntheticInputs`: round numbers, zero hardcoded "18"

**Wave-0 placeholder test files** (4 files with `it.todo` mapped 1:1 to phase requirements):
- `goldenMaster.test.ts`: MODEL-06 (drag-off annuity, r=0 branch, multi-tier)
- `distribution.test.ts`: MODEL-02 (calibration, CDF/quantile, cumulativeShareFromTop, C0/C1 stitch)
- `multiTierFixture.test.ts`: MODEL-03 + MODEL-04 (hand-derived 2-tier fixture, drag ON)
- `numericalStability.test.ts`: MODEL-06 (60-year FP stability, drag-cancellation)

## Verification Results

```
npx vitest run    → 6 files, 3 passed, 22 todo, 0 failures
npx tsc --noEmit  → exit 0 (strict + noUncheckedIndexedAccess)
```

Basis-mismatch test GREEN:
- `assertReal({basis:'nominal'}, 'returnByTier.median')` throws `/Basis violation in returnByTier\.median: expected real, got nominal/`
- `assertReal({basis:'real'}, 'x')` does not throw

Import-boundary test GREEN (vacuously — no source files yet violate the pattern; stays true through Plans 02-04 by design).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @types/node@25.8.0 dev dep for node: imports**
- **Found during:** Task 3 — `npx tsc --noEmit` failed with TS2307: Cannot find module 'node:fs' | 'node:path'
- **Issue:** `invariants.test.ts` import-boundary scan uses `import { readFileSync, readdirSync, statSync } from 'node:fs'` and `import { join } from 'node:path'` — valid Node.js ES module imports, but TypeScript's strict mode requires `@types/node` to resolve the `node:` protocol type declarations.
- **Fix:** `npm install --save-dev @types/node@25.8.0` (pinned to exact version). Microsoft-maintained first-party package; no supply-chain gate required (not in RESEARCH [ASSUMED] list; well-established ecosystem type package).
- **Also fixed:** Implicit-any TS errors on `forEach` callback parameters — added explicit `(text: string, idx: number)` type annotations.
- **Files modified:** `package.json`, `package-lock.json`, `src/core/__tests__/invariants.test.ts`

## TDD Gate Compliance

- RED gate commit: e836bc2 (`test(01-01): add failing basis + invariants tests (RED)`)
- GREEN gate commit: 785b9fa (`feat(01-01): implement types.ts + testUtils + Wave-0 test skeleton (GREEN)`)
- REFACTOR: not needed — implementation was clean

## Known Stubs

None — `src/core/types.ts` defines interfaces and functions only. The `SourcedParam.source` field being `string | null` is the designed API (null = synthetic placeholder; Phase 2 fills real citations). No functional stubs that block this plan's objective.

## Threat Surface Scan

No new security-relevant surface introduced. This plan creates:
- Pure TypeScript type definitions and test utilities — no I/O, no network, no untrusted input.
- All threats in the plan's threat register (T-01-SC, T-01-DET, T-01-BASIS) are addressed:
  - T-01-SC: Supply-chain gate was human-approved (4 pinned deps verified against npmjs.com). The @types/node deviation is an auto-fix (first-party Microsoft, not [ASSUMED]).
  - T-01-DET: `invariants.test.ts` MODEL-01 import-boundary scan is GREEN.
  - T-01-BASIS: `basis.test.ts` assertReal basis-mismatch test is GREEN.

## Self-Check: PASSED

All 12 key files confirmed present on disk. All 3 task commits confirmed in git log (f7c21e5, e836bc2, 785b9fa). `npx vitest run` exits 0. `npx tsc --noEmit` exits 0.
