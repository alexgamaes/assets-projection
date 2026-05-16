/**
 * goldenMaster.test.ts — MODEL-06 (drag-off single-tier closed-form reference)
 *
 * Compares the engine's output against the independent analytic ordinary-annuity
 * closed form for the drag-off single-tier case.
 * Tolerance criterion: relErr < 1e-9 over the 60-year max horizon (D-11).
 *
 * TDD RED: all assertions are real (not todo) and will fail until the engine exists.
 * Plan 01-03 — GREEN: implement tiers.ts, drag.ts, relativePosition.ts, engine.ts.
 */
import { describe, it, expect } from 'vitest';
import { projectionEngine } from '../engine.js';
import {
  analyticOrdinaryAnnuity,
  relErr,
  makeSyntheticParams,
  synParam,
  syntheticInputs,
} from './testUtils.js';

// ---------------------------------------------------------------------------
// Drag-off params helpers
// ---------------------------------------------------------------------------

/** Build params with dragStrength=0 (drag off) and a specific horizon. */
function dragOffParams(horizon: number) {
  return makeSyntheticParams({
    dragStrength: { ...synParam(0), note: 'drag off' },
    horizon,
  });
}

// ---------------------------------------------------------------------------
// MODEL-06: Drag-off single-tier vs analytic annuity (<1e-9, D-11)
// ---------------------------------------------------------------------------

describe('MODEL-06: Golden master (drag-off single-tier vs analytic annuity)', () => {
  it('drag-off single tier matches analyticOrdinaryAnnuity to relErr < 1e-9 over 60 years (D-11)', () => {
    const params = dragOffParams(60);
    const result = projectionEngine(syntheticInputs, params);

    // The user line with drag=0 should match the analytic annuity for the user's
    // initial wealth and savings at the user's starting return rate.
    // Since the user is a test-particle reading the curve, with drag=0 their rate
    // is constant (percentile doesn't move enough to change return tier dramatically).
    //
    // We use the median tier as the canonical "single-tier" drag-off test because
    // syntheticInputs.currentWealth = 100_000 > median=50_000 → user is near top10 tier.
    // Instead, test the median ANCHOR tier directly: W0=50_000, r=0.02, S=1000.
    const W0 = 50_000; // median anchor initial wealth
    const r = 0.02;    // median tier return rate
    const S = 1_000;   // synthetic savings
    const n = 60;

    const expected = analyticOrdinaryAnnuity(W0, r, S, n);
    const actual = result.series.at(-1)!.anchorWealth.median;

    expect(relErr(actual, expected)).toBeLessThan(1e-9);
  });

  it('drag-off intermediate years match analytic annuity: year 1 and year 30 (FP-stability spot check)', () => {
    const params = dragOffParams(60);
    const result = projectionEngine(syntheticInputs, params);

    const W0 = 50_000;
    const r = 0.02;
    const S = 1_000;

    // Year 1
    const expected1 = analyticOrdinaryAnnuity(W0, r, S, 1);
    const actual1 = result.series[1]!.anchorWealth.median;
    expect(relErr(actual1, expected1)).toBeLessThan(1e-9);

    // Year 30
    const expected30 = analyticOrdinaryAnnuity(W0, r, S, 30);
    const actual30 = result.series[30]!.anchorWealth.median;
    expect(relErr(actual30, expected30)).toBeLessThan(1e-9);
  });

  it('r=0 branch: drag-off single tier with zero return matches analyticOrdinaryAnnuity(W0, 0, S, n)', () => {
    const params = makeSyntheticParams({
      dragStrength: synParam(0),
      horizon: 20,
      returnByTier: {
        median: { ...synParam(0), note: 'zero return r=0 test' },
        top10: synParam(0),
        top1: synParam(0),
        top01: synParam(0),
      },
    });
    const result = projectionEngine(syntheticInputs, params);

    const W0 = 50_000;
    const S = 1_000;
    const n = 20;
    const expected = analyticOrdinaryAnnuity(W0, 0, S, n); // S*n pure savings accumulation
    const actual = result.series.at(-1)!.anchorWealth.median;

    expect(relErr(actual, expected)).toBeLessThan(1e-9);
  });

  it('drag-off with varying per-tier returns: each tier independently matches its own analytic annuity', () => {
    const params = dragOffParams(60);
    const result = projectionEngine(syntheticInputs, params);
    const lastSnapshot = result.series.at(-1)!;

    // Anchor initial wealths from makeSyntheticParams defaults
    const anchors = {
      median: { W0: 50_000, r: 0.02 },
      top10: { W0: 300_000, r: 0.04 },
      top1: { W0: 2_000_000, r: 0.07 },
      top01: { W0: 15_000_000, r: 0.12 },
    };
    const S = 1_000;
    const n = 60;

    for (const [tier, { W0, r }] of Object.entries(anchors) as [keyof typeof anchors, { W0: number; r: number }][]) {
      const expected = analyticOrdinaryAnnuity(W0, r, S, n);
      const actual = lastSnapshot.anchorWealth[tier];
      expect(relErr(actual, expected), `tier ${tier}: relErr too large`).toBeLessThan(1e-9);
    }
  });

  // -------------------------------------------------------------------------
  // Engine shape / structural assertions
  // -------------------------------------------------------------------------

  it('engine returns series.length === horizon+1 (year 0 through horizon inclusive)', () => {
    const params = dragOffParams(10);
    const result = projectionEngine(syntheticInputs, params);
    expect(result.series).toHaveLength(11); // years 0..10
  });

  it('each snapshot carries anchorWealth for all 4 tiers, userWealth, userPercentile, topSetPercentile, assetInflation', () => {
    const params = dragOffParams(5);
    const result = projectionEngine(syntheticInputs, params);

    for (const snap of result.series) {
      expect(snap).toHaveProperty('year');
      expect(snap).toHaveProperty('anchorWealth.median');
      expect(snap).toHaveProperty('anchorWealth.top10');
      expect(snap).toHaveProperty('anchorWealth.top1');
      expect(snap).toHaveProperty('anchorWealth.top01');
      expect(snap).toHaveProperty('userWealth');
      expect(snap).toHaveProperty('userPercentile');
      expect(snap).toHaveProperty('topSetPercentile');
      expect(snap).toHaveProperty('assetInflation');
    }
  });

  it('with dragStrength=0 all snapshots have assetInflation === 0', () => {
    const params = dragOffParams(10);
    const result = projectionEngine(syntheticInputs, params);

    for (const snap of result.series) {
      expect(snap.assetInflation).toBe(0);
    }
  });

  it('user percentile differs between year 0 and year 60 under heterogeneous returns', () => {
    // With different per-tier return rates (heterogeneous), the anchor wealths diverge
    // and the user's percentile in the distribution should shift over 60 years (MODEL-02).
    const params = makeSyntheticParams({ horizon: 60 }); // dragStrength=0.3 default
    const result = projectionEngine(syntheticInputs, params);

    const pct0 = result.series[0]!.userPercentile;
    const pct60 = result.series.at(-1)!.userPercentile;

    // With higher-tier anchors growing faster, a lower-tier user's percentile will drift.
    // The specific direction depends on the anchor calibration; just assert they are different.
    expect(pct0).not.toBeCloseTo(pct60, 6);
  });

  it('projectionEngine throws /Basis violation/ when a returnByTier param has basis nominal', () => {
    const bad = makeSyntheticParams({
      returnByTier: {
        median: synParam(0.02, 'nominal'),
        top10: synParam(0.04),
        top1: synParam(0.07),
        top01: synParam(0.12),
      },
    });
    expect(() => projectionEngine(syntheticInputs, bad)).toThrow(/Basis violation/);
  });
});

// ---------------------------------------------------------------------------
// assetInflationFromTopGrowth (drag.ts) — unit tests
// ---------------------------------------------------------------------------

describe('assetInflationFromTopGrowth (drag.ts)', () => {
  it('assetInflationFromTopGrowth(g, 0) === 0 (drag off, linear identity)', async () => {
    const { assetInflationFromTopGrowth } = await import('../drag.js');
    expect(assetInflationFromTopGrowth(0.15, 0)).toBe(0);
    expect(assetInflationFromTopGrowth(0, 0)).toBe(0);
  });

  it('assetInflationFromTopGrowth(g, 0.3) === 0.3 * g (linear, D-02)', async () => {
    const { assetInflationFromTopGrowth } = await import('../drag.js');
    expect(assetInflationFromTopGrowth(0.1, 0.3)).toBeCloseTo(0.03, 15);
    expect(assetInflationFromTopGrowth(0.25, 0.3)).toBeCloseTo(0.075, 15);
  });
});
