// Source: RESEARCH.md Pattern 6
// Phase 3: read-only from DEFAULTS; Phase 4 will add setInputs/setParams actions
import { create } from 'zustand';
import type { Inputs, Params } from '../core/types.js';
import { DEFAULTS } from '../data/defaults.js';

interface ProjectionStore {
  inputs: Inputs;
  params: Params;
}

export const useProjectionStore = create<ProjectionStore>(() => ({
  inputs: { currentWealth: 120_000, annualSavings: 6_000 },
  params: DEFAULTS,
}));
