/**
 * basis.test.ts — MODEL-05
 *
 * Asserts that a nominal param consumed where real is expected throws a Basis violation.
 *
 * Tests:
 *   1. Unit-level: assertReal() throws on basis='nominal' (Plan 01 — existing, stays green)
 *   2. Unit-level: assertReal() does not throw on basis='real' (Plan 01 — existing, stays green)
 *   3. End-to-end: projectionEngine() with a nominal returnByTier param throws /Basis violation/
 *      (Plan 04 — MODEL-05 end-to-end case; confirms basis guard runs at the engine boundary)
 *
 * This file satisfies the MODEL-05 requirement that "a nominal/real mismatch is a hard test
 * failure" both at the unit level (assertReal directly) and at the engine integration level
 * (projectionEngine rejects a nominal returnByTier at its entry point).
 *
 * RESEARCH Pattern 2: Hybrid basis enforcement:
 *   - Compile-time: Real<T>/Nominal<T> branded types catch mismatches at the type level
 *   - Runtime (testable): assertReal() at engine boundary ensures a deliberate mismatch
 *     produces a testable thrown Error, satisfying MODEL-05's "a test fails" requirement
 */
import { describe, it, expect } from 'vitest';
import { assertReal } from '../types.js';
import { projectionEngine } from '../engine.js';
import { makeSyntheticParams, synParam, syntheticInputs } from './testUtils.js';

describe('Basis invariant (MODEL-05)', () => {
  it('assertReal throws "Basis violation" when basis is nominal', () => {
    expect(() => assertReal({ basis: 'nominal' }, 'returnByTier.median')).toThrow(
      /Basis violation in returnByTier\.median: expected real, got nominal/
    );
  });

  it('assertReal does not throw when basis is real', () => {
    expect(() => assertReal({ basis: 'real' }, 'x')).not.toThrow();
  });

  // End-to-end engine boundary test (MODEL-05 Plan 04 requirement):
  // projectionEngine() must reject a params object where a returnByTier field has basis='nominal'.
  // The assertReal() calls at the engine entry point (engine.ts lines ~197-201) enforce this.
  //
  // The test deliberately passes a 'nominal'-tagged median return. The engine must throw
  // /Basis violation/ before performing any computation — this is the key correctness gate
  // against the Pitfall 1 failure mode (nominal figure consumed where real is expected).
  it('projectionEngine throws /Basis violation/ when returnByTier.median has basis=nominal', () => {
    const params = makeSyntheticParams({
      returnByTier: {
        // Deliberately nominal-tagged — this must cause an immediate throw at the engine boundary
        median: { ...synParam(0.05, 'nominal'), note: 'intentionally nominal for basis test' },
        top10: synParam(0.04),
        top1: synParam(0.07),
        top01: synParam(0.12),
      },
    });

    expect(() => projectionEngine(syntheticInputs, params)).toThrow(/Basis violation/);
  });

  it('projectionEngine throws /Basis violation/ when savings has basis=nominal', () => {
    const params = makeSyntheticParams({
      savings: { ...synParam(1_000, 'nominal'), note: 'intentionally nominal for basis test' },
    });

    expect(() => projectionEngine(syntheticInputs, params)).toThrow(/Basis violation/);
  });
});
