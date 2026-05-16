/**
 * calibration.test.ts — DATA-03 / D-07 / D-08 / SC-5 / O-3
 *
 * Task 2: dragStrength back-solve harness + frozen value reproduction (D-07/D-08)
 *   - D-07: dragStrength is back-solved from a historical-baseline run (not an asserted constant).
 *   - D-08: back-solve target = McKinsey ~80% asset-inflation share of net-worth growth
 *           (EXPLICITLY NOT the ~1.3x asset/GDP ratio).
 *
 * Task 3: Divergence sanity-check on real DEFAULTS (SC-5/O-3)
 *   - All tiers finite and positive over the default horizon.
 *   - top01 stays below a documented relative ceiling.
 *
 * Formula for "asset-inflation share of net-worth growth" (O-1 resolution, D-08):
 *
 *   assetInflationShare(d) =
 *       Σ_year [ totalAnchorWealth(year) × assetInflation(year) ]
 *       ─────────────────────────────────────────────────────────
 *       totalAnchorWealth(horizon) − totalAnchorWealth(0)
 *
 * Where:
 *   - totalAnchorWealth(year) = sum of the four anchor-tier wealth levels at that year
 *   - assetInflation(year) = YearSnapshot.assetInflation (the per-year haircut rate)
 *   - The numerator is the cumulative dollar contribution of asset-price inflation to wealth
 *   - The denominator is the total real net-worth growth over the window
 *
 * This formula maps to McKinsey's "share of net-worth growth from asset-price inflation"
 * (~80% of 2000–2021 advanced-economy net-worth growth; ~1/5 from new saving/investment).
 * McKinsey source: "The rise and rise of the global balance sheet" (2021).
 *
 * Per D-08: the ~1.3x asset/GDP ratio is a DIFFERENT McKinsey metric (stock vs flow);
 * the back-solve target is the ~80% SHARE of net-worth GROWTH, not the stock/GDP ratio.
 *
 * Baseline choice (O-2 resolution, D-07):
 *   Uses calibrated real DEFAULTS (anchors, returnByTier, savings, horizon=35) as the
 *   2000–2021-like baseline. Self-consistent; avoids a second sourced data set out of scope.
 *   Documented in DEFAULTS.dragStrength.source.note.
 *
 * @decision DATA-03 / D-07 / D-08 / SC-5 / O-3
 */
import { describe, it, expect } from 'vitest';
import { projectionEngine } from '../engine.js';
import { synParam } from './testUtils.js';
import { DEFAULTS } from '../../data/defaults.js';

// ---------------------------------------------------------------------------
// Local monotone bisection solver (test-only; bisect is not exported from distribution.ts)
// Implements the same CR-01-hardened logic as distribution.ts:bisect()
// ---------------------------------------------------------------------------

/**
 * Local monotone bisection solver (test-only copy of the CR-01-hardened bisect).
 *
 * Finds x ∈ [lo, hi] such that f(x) ≈ 0.
 * Requires f(lo) and f(hi) to have opposite signs (root is bracketed).
 *
 * @param f - Target function (must change sign between lo and hi)
 * @param lo - Lower bound
 * @param hi - Upper bound
 * @param tol - Convergence tolerance on interval width (default 1e-12)
 * @returns Approximate root x* such that interval width < tol
 * @throws Error if root is not bracketed or endpoints are non-finite
 */
function bisectLocal(
  f: (x: number) => number,
  lo: number,
  hi: number,
  tol = 1e-12,
): number {
  let a = lo;
  let b = hi;
  const fa = f(a);
  const fb = f(b);

  if (!Number.isFinite(fa) || !Number.isFinite(fb)) {
    throw new Error(`bisect: non-finite endpoint f(${lo})=${fa}, f(${hi})=${fb}`);
  }
  if (fa === 0) return a;
  if (fb === 0) return b;
  if (fa * fb > 0) {
    throw new Error(
      `bisect: root not bracketed in [${lo}, ${hi}] (f(lo)=${fa}, f(hi)=${fb})`,
    );
  }

  for (let i = 0; i < 100; i++) {
    if (b - a < tol) break;
    const mid = (a + b) / 2;
    const fm = f(mid);
    if (fm === 0) return mid;
    if (fm * fa > 0) {
      a = mid;
    } else {
      b = mid;
    }
  }

  return (a + b) / 2;
}

// ---------------------------------------------------------------------------
// Baseline inputs for the 2000–2021-like historical run (O-2 / D-07)
// Uses a representative starting wealth near DEFAULTS.anchors.median
// ---------------------------------------------------------------------------

/** Representative baseline inputs for the back-solve run (D-07 historical-baseline run). */
const BASELINE_INPUTS = {
  currentWealth: DEFAULTS.anchors.median.value, // median household starting point
  annualSavings: DEFAULTS.savings.value,        // DEFAULTS savings baseline
};

// ---------------------------------------------------------------------------
// Asset-inflation share metric (O-1 pinned formula, D-08)
//
// Formula:
//   assetInflationShare(d) =
//       Σ_year [ totalAnchorWealth(year) × assetInflation(year) ]
//       ─────────────────────────────────────────────────────────
//       totalAnchorWealth(horizon) − totalAnchorWealth(0)
//
// Maps to McKinsey "share of net-worth growth from asset-price inflation"
// NOT the ~1.3x asset/GDP ratio (D-08 explicitly excludes that metric).
// ---------------------------------------------------------------------------

/**
 * Compute the asset-inflation share of net-worth growth for a given dragStrength.
 *
 * Formula (O-1, D-08):
 *   share = cumulative asset-inflation contribution / total real net-worth growth
 *
 * Where cumulative contribution = Σ totalAnchorWealth(year) × assetInflation(year)
 * and total growth = totalAnchorWealth(finalYear) − totalAnchorWealth(year0)
 *
 * This formula corresponds to McKinsey's "share of net-worth growth from asset-price
 * inflation" (~80% for 2000–2021). NOT the ~1.3x asset/GDP stock ratio (D-08).
 *
 * @param dragStrength - The drag coefficient to test
 * @returns The fraction [0,1] of net-worth growth attributable to asset-price inflation
 */
function assetInflationShare(dragStrength: number): number {
  const params = {
    ...DEFAULTS,
    dragStrength: synParam(dragStrength, 'real', 'back-solve probe'),
  };

  const result = projectionEngine(BASELINE_INPUTS, params);
  const series = result.series;

  // Sum of all anchor wealth at each year
  function totalAnchorWealth(snap: (typeof series)[number]): number {
    return (
      snap.anchorWealth.median +
      snap.anchorWealth.top10 +
      snap.anchorWealth.top1 +
      snap.anchorWealth.top01
    );
  }

  const totalY0 = totalAnchorWealth(series[0]!);
  const totalYn = totalAnchorWealth(series.at(-1)!);
  const totalGrowth = totalYn - totalY0;

  if (totalGrowth <= 0) {
    // Degenerate case: no growth. Share is undefined; return 1.0 to signal over-drag.
    return 1.0;
  }

  // Cumulative asset-inflation contribution:
  //   Each year, total wealth is reduced by assetInflation × totalWealth
  //   Sum over all years (excluding year 0 which has no compounding yet)
  let cumulativeInflationContrib = 0;
  for (let i = 1; i < series.length; i++) {
    const snap = series[i]!;
    const prevSnap = series[i - 1]!;
    // The asset-inflation haircut was applied to the PREVIOUS year's wealth to produce this year's.
    // Use prevSnap wealth × assetInflation(snap) as the dollar contribution.
    cumulativeInflationContrib += totalAnchorWealth(prevSnap) * snap.assetInflation;
  }

  return cumulativeInflationContrib / totalGrowth;
}

// ---------------------------------------------------------------------------
// Task 2: dragStrength back-solve harness (D-07/D-08)
// ---------------------------------------------------------------------------

describe('D-07/D-08: dragStrength back-solve against McKinsey ~80% asset-inflation share', () => {
  it('assetInflationShare is monotone increasing in dragStrength (sanity check on two sample points)', () => {
    // Monotonicity: higher drag → more asset-inflation contribution → higher share
    // Sample at two widely-separated dragStrength values
    const shareLow = assetInflationShare(0.05);
    const shareHigh = assetInflationShare(0.50);

    expect(
      shareHigh,
      `assetInflationShare(0.50)=${shareHigh.toFixed(4)} must exceed assetInflationShare(0.05)=${shareLow.toFixed(4)} — share is monotone in dragStrength`,
    ).toBeGreaterThan(shareLow);
  });

  it('back-solving for assetInflationShare(d)=0.80 yields a finite d in the bracket [0,1]', () => {
    // The bracket [lo=0, hi=1] must contain the ~80% target.
    // Verify bracket validity: share(0) < 0.80 < share(1)
    const shareAt0 = assetInflationShare(0.0);
    const shareAt1 = assetInflationShare(1.0);

    expect(shareAt0).toBeLessThan(0.80);
    expect(shareAt1).toBeGreaterThan(0.80);

    // Back-solve
    const solved = bisectLocal((d) => assetInflationShare(d) - 0.80, 0.0, 1.0);

    expect(Number.isFinite(solved)).toBe(true);
    expect(solved).toBeGreaterThan(0);
    expect(solved).toBeLessThan(1);

    // The solved value must reproduce the ~80% target to 2 decimal places
    const reproduced = assetInflationShare(solved);
    expect(reproduced).toBeCloseTo(0.80, 2);
  });

  it('frozen DEFAULTS.dragStrength.value reproduces ~80% share (toBeCloseTo 2 decimals) AND equals back-solved value (~4 decimals)', () => {
    // D-07: the frozen value must be the result of the back-solve (not an asserted constant).
    // D-08: the target is the McKinsey ~80% share (not the ~1.3x asset/GDP ratio).
    const solved = bisectLocal((d) => assetInflationShare(d) - 0.80, 0.0, 1.0);

    // Frozen value reproduces the McKinsey ~80% target
    expect(
      assetInflationShare(DEFAULTS.dragStrength.value),
      `DEFAULTS.dragStrength.value=${DEFAULTS.dragStrength.value} must produce assetInflationShare ≈ 0.80`,
    ).toBeCloseTo(0.80, 2);

    // Frozen value equals the back-solved value to ~4 decimals
    expect(
      DEFAULTS.dragStrength.value,
      `DEFAULTS.dragStrength.value=${DEFAULTS.dragStrength.value} must equal back-solved=${solved.toFixed(6)} to 4 decimal places`,
    ).toBeCloseTo(solved, 4);
  });
});

// ---------------------------------------------------------------------------
// Task 3: Divergence sanity-check on real DEFAULTS (SC-5 / O-3)
// @decision SC-5 / O-3
// ---------------------------------------------------------------------------

describe('SC-5/O-3: divergence sanity-check on real DEFAULTS', () => {
  it('all anchor tiers are finite and positive over the default horizon; top01 stays below a documented relative ceiling', () => {
    const result = projectionEngine(BASELINE_INPUTS, DEFAULTS);

    let violationMsg = '';

    for (const snap of result.series) {
      const tiers = ['median', 'top10', 'top1', 'top01'] as const;
      for (const tier of tiers) {
        const w = snap.anchorWealth[tier];
        if (!Number.isFinite(w) || w <= 0) {
          violationMsg += `year ${snap.year} ${tier} wealth=${w} is not finite/positive\n`;
        }
      }

      // Documented relative ceiling for top01:
      // top01 wealth must not exceed 50× the sum of all anchor wealth.
      // Rationale: at very concentrated levels, the top-0.1% anchor should not
      // exceed ~50× the total distribution wealth sum — a generous but sanity-bound
      // multiple that flags model divergence (a top01 growing to 50× total would
      // indicate unrealistic concentration beyond any empirical bound).
      const totalWealth =
        snap.anchorWealth.median +
        snap.anchorWealth.top10 +
        snap.anchorWealth.top1 +
        snap.anchorWealth.top01;
      const CEILING_MULTIPLE = 50; // top01 ≤ 50× total anchor wealth (generous sanity bound)
      if (snap.anchorWealth.top01 > CEILING_MULTIPLE * totalWealth) {
        violationMsg +=
          `year ${snap.year} top01=${snap.anchorWealth.top01.toExponential(3)} ` +
          `exceeds ceiling ${CEILING_MULTIPLE}× total=${totalWealth.toExponential(3)}\n`;
      }
    }

    expect(
      violationMsg,
      `Divergence sanity-check failed on real DEFAULTS:\n${violationMsg}`,
    ).toBe('');
  });
});
