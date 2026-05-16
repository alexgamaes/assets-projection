// Source: RESEARCH.md Pattern 6
// Phase 4: setInputs, setHorizon, setBasis actions added; seed from SEED_WEALTH (D-02/D-03)
import { create } from 'zustand';
import type { Inputs, Params } from '../core/types.js';
import { DEFAULTS, SEED_WEALTH } from '../data/defaults.js';

interface ProjectionStore {
  inputs: Inputs;
  params: Params;
  basis: 'real' | 'nominal';
  setInputs: (patch: Partial<Inputs>) => void;
  setHorizon: (h: number) => void;
  setBasis: (b: 'real' | 'nominal') => void;
}

export const useProjectionStore = create<ProjectionStore>((set) => ({
  inputs: { currentWealth: SEED_WEALTH.value, annualSavings: DEFAULTS.savings.value },
  params: DEFAULTS,
  basis: 'real' as const,
  // Partial-patch merge — preserves fields not included in the patch (ENTRY-02)
  setInputs: (patch) => set((s) => ({ inputs: { ...s.inputs, ...patch } })),
  // Shallow clone of frozen DEFAULTS is safe — never mutates in-place (T-04-01-01)
  setHorizon: (h) => set((s) => ({ params: { ...s.params, horizon: h } })),
  setBasis: (b) => set({ basis: b }),
}));
