/**
 * summaryFormatters.test.ts — behavioral tests for D-14 and D-09 neutrality invariants.
 *
 * Plan 04-02 Task 2: pure formatter functions that enforce display-layer safety rules.
 *   D-14: rank delta ALWAYS paired with wealth-growth clause (cannot appear alone)
 *   D-09: money-illusion caption only shown when basis === 'nominal'; empty string for 'real'
 */
import { describe, it, expect } from 'vitest';
import { formatRankDelta, formatMoneyIllusionCaption } from '../summaryFormatters.js';

// ---------------------------------------------------------------------------
// formatRankDelta — D-14 rank-delta pairing invariant
// ---------------------------------------------------------------------------

describe('formatRankDelta (D-14 rank-delta + wealth-growth pairing)', () => {
  it('returns a string containing both rank positions and wealth growth multiple', () => {
    const result = formatRankDelta(75, 71, 2.3);
    expect(typeof result).toBe('string');
    // D-14: rank delta AND wealth growth must both appear in the same string
    expect(result).toMatch(/p75.*p71.*2\.3[×x]/i);
  });

  it('no-movement case: rank delta and growth multiple still paired (p50 → p50)', () => {
    const result = formatRankDelta(50, 50, 1.8);
    expect(result).toMatch(/p50.*p50.*1\.8[×x]/i);
  });

  it('return value always contains the growth multiple (D-14 invariant: cannot split)', () => {
    const result = formatRankDelta(60, 55, 3.7);
    // Must contain the multiple — rank numbers are never shown without wealth growth
    expect(result).toMatch(/3\.7[×x]/i);
    expect(result).toMatch(/p60/i);
    expect(result).toMatch(/p55/i);
  });

  it('return value is a non-empty string', () => {
    const result = formatRankDelta(30, 28, 1.5);
    expect(result.length).toBeGreaterThan(0);
  });

  it('growth multiple formatted with 1 decimal place', () => {
    const result = formatRankDelta(80, 75, 2.0);
    // Should contain "2.0×" (1 decimal, D-14 formatting requirement)
    expect(result).toMatch(/2\.0[×x]/i);
  });
});

// ---------------------------------------------------------------------------
// formatMoneyIllusionCaption — D-09 nominal-only caption invariant
// ---------------------------------------------------------------------------

describe('formatMoneyIllusionCaption (D-09 money-illusion caption)', () => {
  it("basis='real' returns empty string (caption must not render)", () => {
    const result = formatMoneyIllusionCaption('real', 0.025, 'BLS CPI-U');
    expect(result).toBe('');
  });

  it("basis='real' returns empty string regardless of inflationRate value", () => {
    expect(formatMoneyIllusionCaption('real', 0.999, 'Any Source')).toBe('');
    expect(formatMoneyIllusionCaption('real', 0, 'Empty Source')).toBe('');
  });

  it("basis='nominal' returns a non-empty string", () => {
    const result = formatMoneyIllusionCaption('nominal', 0.025, 'BLS CPI-U');
    expect(result.length).toBeGreaterThan(0);
  });

  it("basis='nominal', 0.025 → contains '2.5%' and 'BLS CPI-U' (D-09)", () => {
    const result = formatMoneyIllusionCaption('nominal', 0.025, 'BLS CPI-U');
    expect(result).toMatch(/2\.5%/);
    expect(result).toMatch(/BLS CPI-U/);
  });

  it("basis='nominal', 0.03 → contains '3.0%' (D-09 rate formatting)", () => {
    const result = formatMoneyIllusionCaption('nominal', 0.03, 'BLS CPI-U');
    expect(result).toMatch(/3\.0%/);
  });

  it("basis='nominal' caption includes the inflationSourceName (D-09 sourcing)", () => {
    const sourceName = 'Federal Reserve H.15';
    const result = formatMoneyIllusionCaption('nominal', 0.02, sourceName);
    expect(result).toMatch(/Federal Reserve H\.15/);
  });
});
