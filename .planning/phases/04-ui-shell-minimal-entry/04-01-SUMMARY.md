---
phase: 04-ui-shell-minimal-entry
plan: 01
subsystem: state
tags: [zustand, store, defaults, sourcing, tdd, seed-wealth, inflation-rate]
dependency_graph:
  requires: []
  provides:
    - SEED_WEALTH exported from src/data/defaults.ts (value: 200_000, basis: real, full SourceRecord — D-02/D-03)
    - INFLATION_RATE exported from src/data/defaults.ts (value: 0.025, basis: nominal, full SourceRecord — D-07)
    - scf2022 SourceRecord in src/data/sources.ts (SCF 2022 US median net worth)
    - blsCpiLongRun SourceRecord in src/data/sources.ts (BLS CPI-U long-run geometric mean)
    - useProjectionStore with setInputs, setHorizon, setBasis actions and basis field
    - store seed currentWealth = SEED_WEALTH.value (200_000, not the 120_000 placeholder)
  affects:
    - src/state/selectors.ts (Plan 02 will import INFLATION_RATE for selectReinflated)
    - Any component reading store.inputs.currentWealth or store.basis
tech_stack:
  added: []
  patterns:
    - "TDD RED/GREEN: store.test.ts (RED commit a9aac92) → store.ts (GREEN commit 7279219)"
    - "Separate SEED_WEALTH / INFLATION_RATE constants outside DEFAULTS to avoid Params satisfies TypeScript rejection"
    - "SourceRecord fields inlined in defaults.ts constants (no SOURCES import) to avoid circular reference"
    - "Zustand create((set) => ...) pattern with partial-patch setInputs via spread"
key_files:
  created:
    - src/state/__tests__/store.test.ts
  modified:
    - src/data/sources.ts
    - src/data/defaults.ts
    - src/state/store.ts
decisions:
  - "SEED_WEALTH and INFLATION_RATE exported as separate frozen SourcedParam constants (not added to DEFAULTS) because DEFAULTS satisfies Params and Params does not include these fields"
  - "SourceRecord fields inlined in defaults.ts rather than imported from SOURCES to avoid circular dependency"
  - "store.test.ts uses beforeEach setState reset with the initial shape (including basis) to prevent cross-test pollution — this works even before the actions exist because Zustand setState is always available"
metrics:
  duration_minutes: 15
  completed_date: "2026-05-16"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 4
---

# Phase 4 Plan 01: Foundation Slice — Store Actions and Cited Seed Defaults Summary

**One-liner:** Zustand store extended with setInputs/setHorizon/setBasis actions, seed wealth corrected to $200k (SCF 2022), and two new cited SourcedParam constants (SEED_WEALTH, INFLATION_RATE) added alongside two new source registry entries.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wave-0 store test stubs (ENTRY-01..ENTRY-04) | a9aac92 | src/state/__tests__/store.test.ts |
| 2 | Cited data defaults — seedWealth + inflationRate | 6d9d714 | src/data/sources.ts, src/data/defaults.ts |
| 3 | Extend Zustand store with actions and cited seed | 7279219 | src/state/store.ts |

## What Was Built

**Task 1 (TDD RED):** Created `src/state/__tests__/store.test.ts` with 10 test assertions covering ENTRY-01 through ENTRY-04. Tests were initially RED because the store lacked the new actions and seed. Describe blocks follow the selectors.test.ts style, labelled by requirement ID.

**Task 2 (Data defaults):** Added two new SourceRecord entries to `src/data/sources.ts` — `scf2022` (SCF 2022 US median net worth $192,900 → $200k UX seed) and `blsCpiLongRun` (BLS CPI-U long-run 2.5% conservative anchor). Exported two new frozen `SourcedParam` constants from `src/data/defaults.ts`:
- `SEED_WEALTH` (value: 200_000, basis: 'real') — used by the store as the current wealth seed
- `INFLATION_RATE` (value: 0.025, basis: 'nominal') — reserved for Plan 02 selectReinflated selector

The sourcing gate (`src/core/__tests__/sourcing.test.ts`) stays GREEN because it only walks the `DEFAULTS` object, and the new constants are separate exports.

**Task 3 (TDD GREEN):** Rewrote `src/state/store.ts` to add the three actions (`setInputs`, `setHorizon`, `setBasis`) and the `basis` field with default `'real'`. Changed the create call from `() => ({...})` to `(set) => ({...})`. Replaced the hardcoded `currentWealth: 120_000` placeholder with `SEED_WEALTH.value` (200_000). All 10 store tests turned GREEN; full suite 99/99 passes; `tsc --noEmit` clean.

## Verification Results

- npm test: 99 passed (10 new store tests + 89 prior tests — no regressions)
- npm run typecheck: clean (tsc --noEmit no errors)
- grep -c 'currentWealth: 120_000' src/state/store.ts → 0 (placeholder removed)
- grep -c 'setInputs|setHorizon|setBasis' src/state/store.ts → 7 (>= 3 required)
- grep -c 'scf2022|blsCpiLongRun' src/data/sources.ts → 2 (>= 2 required)

## Decisions Made

1. **Separate SEED_WEALTH and INFLATION_RATE constants:** `DEFAULTS satisfies Params` rejects extra properties in TypeScript, so new UX-default parameters that don't belong in the model `Params` shape must be separate exports. This matches the `savings` precedent but placed outside the frozen DEFAULTS object.

2. **Inline SourceRecord fields in defaults.ts:** Rather than importing `SOURCES.scf2022` and `SOURCES.blsCpiLongRun` into defaults.ts, the SourceRecord fields are inlined. This avoids a potential circular dependency concern (defaults.ts already imports SOURCES for the return tier spreads). The values are kept citation-consistent with the SOURCES entries.

3. **beforeEach setState reset pattern:** The test reset in `beforeEach` sets `basis: 'real'` directly via `setState` — this works even before Task 3 adds the field, because Zustand's `setState` accepts any partial shape merge. The tests that read `basis` do type-cast to `{ basis: 'real' | 'nominal' }`.

## Deviations from Plan

None — plan executed exactly as written. The plan correctly anticipated all three implementation patterns (separate constants, inline SourceRecord, shallow clone for setHorizon).

## Known Stubs

None — SEED_WEALTH and INFLATION_RATE carry full six-field SourceRecords. No placeholder or empty values.

## Threat Flags

None — this plan adds no new network endpoints, auth paths, or file access patterns.

## Self-Check: PASSED

- [x] src/state/__tests__/store.test.ts exists
- [x] src/data/sources.ts has scf2022 and blsCpiLongRun entries
- [x] src/data/defaults.ts exports SEED_WEALTH (200_000) and INFLATION_RATE (0.025)
- [x] src/state/store.ts has setInputs, setHorizon, setBasis actions and basis field
- [x] Task commits exist: a9aac92, 6d9d714, 7279219
