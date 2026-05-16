---
phase: 1
slug: model-foundation
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-15
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 |
| **Config file** | `vitest.config.ts` (created in Plan 01 / Wave 1) |
| **Quick run command** | `npx vitest run src/core/__tests__/goldenMaster.test.ts` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** `npx vitest run` (Plan 01 Task 1/2 use `--passWithNoTests`)
- **After every plan wave:** `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite green, zero `it.todo` remaining
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | MODEL-06 | T-01-SC | Dev-dep legitimacy human-verified before install (never auto-approve) | manual gate | `npmjs.com` page review | N/A | ⬜ pending |
| 01-01-02 | 01 | 1 | MODEL-01 | T-01-DET | Strict scaffold; suite runnable | unit | `npx tsc --noEmit && npx vitest run --passWithNoTests` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | MODEL-05 / MODEL-01 / MODEL-06 | T-01-BASIS / T-01-DET | Basis-mismatch throws; core/ import-pure | unit | `npx vitest run src/core/__tests__/basis.test.ts src/core/__tests__/invariants.test.ts` | ❌ W0 | ⬜ pending |
| 01-02 | 02 | 2 | MODEL-02 / MODEL-03 / MODEL-06 | T-02-NUM / T-02-NAN | Calibration + closed-form top-share + monotone return curve, no NaN at stitch | unit | `npx vitest run src/core/__tests__/distribution.test.ts` | ❌ W0 | ⬜ pending |
| 01-03 | 03 | 3 | MODEL-01..04 / MODEL-06 | T-03-FP / T-03-ZS / T-03-BASIS | Drag-off engine matches analytic annuity <1e-9 over 60y; no transfer | unit (golden master) | `npx vitest run src/core/__tests__/goldenMaster.test.ts` | ❌ W0 | ⬜ pending |
| 01-04 | 04 | 4 | MODEL-04 / MODEL-05 / MODEL-06 | T-04-ZS / T-04-BASIS / T-04-FP | D-12 battery: baseline collapse, non-conservation, infinite-growth, basis fail, 60y FP, multi-tier fixture | unit + golden fixture | `npx vitest run --coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Created in **Plan 01 (Wave 1)** — all test files exist before downstream plans fill them:

- [ ] `package.json` + `tsconfig.json` (strict, `noUncheckedIndexedAccess`) + `vitest.config.ts` — greenfield scaffold; install `typescript@5.9.3 vitest@3.2.4 @vitest/coverage-v8@3.2.4 tsx@4.22.0`
- [ ] `src/core/types.ts` — branded basis types, `assertReal`, `SourcedParam`, full Inputs/Params/ProjectionResult contract
- [ ] `src/core/__tests__/testUtils.ts` — `relErr`, `analyticOrdinaryAnnuity` (independent), synthetic builders, `DIST_TOL=1e-6`
- [ ] `src/core/__tests__/basis.test.ts` — MODEL-05 (real assertions in Plan 01; end-to-end extended Plan 04)
- [ ] `src/core/__tests__/invariants.test.ts` — MODEL-01 import-scan/determinism (real in Plan 01) + MODEL-04 D-12 (filled Plan 04)
- [ ] `src/core/__tests__/goldenMaster.test.ts` — MODEL-06 (todo placeholders Plan 01; real Plan 03)
- [ ] `src/core/__tests__/distribution.test.ts` — MODEL-02 (todo Plan 01; real Plan 02)
- [ ] `src/core/__tests__/multiTierFixture.test.ts` — MODEL-03 (todo Plan 01; real Plan 04)
- [ ] `src/core/__tests__/numericalStability.test.ts` — MODEL-06 60y FP (todo Plan 01; real Plan 04)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dev-dependency legitimacy | (supply-chain T-01-SC) | slopcheck unavailable in env (RESEARCH Package Legitimacy Audit); all packages [ASSUMED] | Verify typescript/vitest/@vitest-coverage-v8/tsx on npmjs.com are genuine first-party at the pinned versions; type "approved" |

*All numerical/engine behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (Plan 01 Task 1 is the mandated supply-chain human gate; Task 2/3 automated)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (Plan 01 creates all 7 test files + testUtils + scaffold)
- [x] No watch-mode flags
- [x] Feedback latency < 10s (~5s suite)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
