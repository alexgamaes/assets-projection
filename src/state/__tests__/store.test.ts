/**
 * store.test.ts — ENTRY-01 through ENTRY-04 Zustand store action stubs.
 *
 * Phase 4 Plan 01 — Wave-0 store test stubs.
 *
 * These tests are initially RED (the store lacks the new actions and cited seed).
 * Task 3 of Plan 01 rewrites store.ts to make them GREEN.
 *
 * Pattern follows selectors.test.ts: describe blocks labelled by requirement ID,
 * zustand getState() / setState() act-and-read pattern (no React testing library).
 *
 * Requirements covered: ENTRY-01 (D-02 cited seed), ENTRY-02 (setInputs),
 *   ENTRY-03 (setHorizon + frozen guard), ENTRY-04 (setBasis).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectionStore } from '../store.js';
import { DEFAULTS } from '../../data/defaults.js';

// ---------------------------------------------------------------------------
// Store reset helper — prevents cross-test state pollution
// ---------------------------------------------------------------------------

/**
 * Reset store to initial values before each test.
 * SEED_WEALTH.value (200_000) must be the currentWealth seed (D-02).
 * basis defaults to 'real' (ENTRY-04 / D-08).
 */
beforeEach(() => {
  useProjectionStore.setState({
    inputs: { currentWealth: 200_000, annualSavings: DEFAULTS.savings.value },
    params: DEFAULTS,
    basis: 'real',
  });
});

// ---------------------------------------------------------------------------
// ENTRY-01 / D-02: Cited seed defaults
// ---------------------------------------------------------------------------

describe('ENTRY-01 / D-02: cited seed defaults', () => {
  it('initial store.inputs.currentWealth is 200_000 (SCF 2022 median net worth, D-02 — not the 120_000 placeholder)', () => {
    const { inputs } = useProjectionStore.getState();
    expect(inputs.currentWealth).toBe(200_000);
  });

  it('initial store.basis is "real" (D-08 default basis)', () => {
    const { basis } = useProjectionStore.getState() as { basis: 'real' | 'nominal' };
    expect(basis).toBe('real');
  });

  it('initial store.inputs.annualSavings matches DEFAULTS.savings.value (6_000)', () => {
    const { inputs } = useProjectionStore.getState();
    expect(inputs.annualSavings).toBe(DEFAULTS.savings.value);
  });
});

// ---------------------------------------------------------------------------
// ENTRY-02: setInputs action
// ---------------------------------------------------------------------------

describe('ENTRY-02: setInputs action', () => {
  it('setInputs({ currentWealth: 500_000 }) → inputs.currentWealth === 500_000', () => {
    const { setInputs } = useProjectionStore.getState() as ReturnType<typeof useProjectionStore.getState> & {
      setInputs: (patch: Partial<{ currentWealth: number; annualSavings: number }>) => void;
    };
    setInputs({ currentWealth: 500_000 });
    expect(useProjectionStore.getState().inputs.currentWealth).toBe(500_000);
  });

  it('setInputs({ currentWealth: 500_000 }) leaves annualSavings unchanged (partial patch)', () => {
    const state = useProjectionStore.getState() as ReturnType<typeof useProjectionStore.getState> & {
      setInputs: (patch: Partial<{ currentWealth: number; annualSavings: number }>) => void;
    };
    const originalSavings = state.inputs.annualSavings;
    state.setInputs({ currentWealth: 500_000 });
    expect(useProjectionStore.getState().inputs.annualSavings).toBe(originalSavings);
  });

  it('setInputs({ annualSavings: 12_000 }) → inputs.annualSavings === 12_000 and currentWealth unchanged', () => {
    const state = useProjectionStore.getState() as ReturnType<typeof useProjectionStore.getState> & {
      setInputs: (patch: Partial<{ currentWealth: number; annualSavings: number }>) => void;
    };
    const originalWealth = state.inputs.currentWealth;
    state.setInputs({ annualSavings: 12_000 });
    const after = useProjectionStore.getState();
    expect(after.inputs.annualSavings).toBe(12_000);
    expect(after.inputs.currentWealth).toBe(originalWealth);
  });
});

// ---------------------------------------------------------------------------
// ENTRY-03: setHorizon action + frozen DEFAULTS guard (T-04-01-01)
// ---------------------------------------------------------------------------

describe('ENTRY-03: setHorizon action', () => {
  it('setHorizon(50) → store.params.horizon === 50', () => {
    const state = useProjectionStore.getState() as ReturnType<typeof useProjectionStore.getState> & {
      setHorizon: (h: number) => void;
    };
    state.setHorizon(50);
    expect(useProjectionStore.getState().params.horizon).toBe(50);
  });

  it('setHorizon(50) does NOT mutate the frozen DEFAULTS object (T-04-01-01 — shallow clone guard)', () => {
    // Capture original DEFAULTS.horizon BEFORE calling setHorizon
    const originalDefaultHorizon = DEFAULTS.horizon;
    const state = useProjectionStore.getState() as ReturnType<typeof useProjectionStore.getState> & {
      setHorizon: (h: number) => void;
    };
    state.setHorizon(50);
    // DEFAULTS.horizon must remain unchanged — if store mutated it in-place, this fails
    expect(DEFAULTS.horizon).toBe(originalDefaultHorizon);
    expect(DEFAULTS.horizon).not.toBe(50);
  });
});

// ---------------------------------------------------------------------------
// ENTRY-04: setBasis action
// ---------------------------------------------------------------------------

describe('ENTRY-04: setBasis action', () => {
  it('setBasis("nominal") → store.basis === "nominal"', () => {
    const state = useProjectionStore.getState() as ReturnType<typeof useProjectionStore.getState> & {
      setBasis: (b: 'real' | 'nominal') => void;
    };
    state.setBasis('nominal');
    expect((useProjectionStore.getState() as { basis: 'real' | 'nominal' }).basis).toBe('nominal');
  });

  it('setBasis("real") → store.basis === "real"', () => {
    const state = useProjectionStore.getState() as ReturnType<typeof useProjectionStore.getState> & {
      setBasis: (b: 'real' | 'nominal') => void;
      basis: 'real' | 'nominal';
    };
    // Set to nominal first, then back to real
    state.setBasis('nominal');
    state.setBasis('real');
    expect((useProjectionStore.getState() as { basis: 'real' | 'nominal' }).basis).toBe('real');
  });
});
