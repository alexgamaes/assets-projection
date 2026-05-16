/**
 * basis.test.ts — MODEL-05
 * Asserts that a nominal param consumed where real is expected throws a Basis violation.
 */
import { describe, it, expect } from 'vitest';
import { assertReal } from '../types.js';

describe('Basis invariant (MODEL-05)', () => {
  it('assertReal throws "Basis violation" when basis is nominal', () => {
    expect(() => assertReal({ basis: 'nominal' }, 'returnByTier.median')).toThrow(
      /Basis violation in returnByTier\.median: expected real, got nominal/
    );
  });

  it('assertReal does not throw when basis is real', () => {
    expect(() => assertReal({ basis: 'real' }, 'x')).not.toThrow();
  });
});
