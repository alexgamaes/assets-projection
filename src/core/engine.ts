/**
 * engine.ts — projectionEngine: the annual loop driving the walking skeleton.
 *
 * Implements RESEARCH Pattern 1 (Functional Core / Imperative Shell):
 *   projectionEngine(inputs, params) → ProjectionResult
 *
 * Annual loop (8 steps per year, D-03/D-06/D-07):
 *   1. dynamicTopSetPercentile → find p* such that top (1-p*) holds 50% of wealth (D-03)
 *   2. aggTopGrowthRate → wealth-growth rate of the top-set anchor(s) this year
 *   3. assetInflationFromTopGrowth(aggTopGrowth, dragStrength) → scalar haircut (D-01/D-02)
 *   4. stepAnchorWealth → advance all 4 anchor tiers (r_eff = r − drag, +S) (D-08)
 *   5. re-fit curve (endogenous re-calibrate OR fixed-shape-scaled shift, D-06/D-07)
 *   6. re-read user percentile off fresh curve (MODEL-02 moving tier)
 *   7. advance user wealth (same ordinary-annuity step with user's moving-tier rate)
 *   8. snapshot(anchorWealth, curve, userPct, year) → YearSnapshot
 *
 * After the loop: deriveShares(series) → relativePosition[] (MODEL-03).
 *
 * Basis enforcement (MODEL-05 / T-03-BASIS):
 *   assertReal is called on every SourcedParam in returnByTier and savings at entry.
 *   A nominal param throws /Basis violation/ so basis.test.ts assertions are satisfied.
 *
 * USER AS TEST-PARTICLE (RESEARCH Assumption A5 / CONTEXT deferred — confirmed):
 *   The user is a tracked trajectory that reads the curve but does NOT perturb the
 *   aggregate/anchors (negligible single-saver mass). The user's wealth affects only
 *   the user's own line; anchor wealths are independent of the user.
 *
 * SECURITY (T-03-DET): zero framework/DOM/fetch/timestamp/randomness — pure numeric.
 * PITFALLS P3: drag applied exactly once per year (step 3), not also baked into returnByTier.
 * PITFALLS P4: no transfer/redistribution in drag.ts or here — non-conservation asserted separately.
 * PITFALLS P10: r_eff = r − assetInflation (small−small), never large−large differences.
 *
 * G1 fix (debug session chart4-not-stacking): every snapshot now carries the
 * engine's per-year `curve` (and a `curveDegraded` flag when it came from the
 * shiftScaleCurve fallback). This lets `deriveBandShares` read VIZ-07 band
 * shares off the SAME continuously-evolving curve the engine uses, instead of
 * independently re-calibrating from anchors and freezing on CR-02 failure.
 *
 * @module engine
 */

import type { Inputs, Params, YearSnapshot, ProjectionResult } from './types.js';
import { assertReal } from './types.js';
import {
  calibrateCurve,
  dynamicTopSetPercentile,
  percentileOf,
  returnAtPercentile,
  type Curve,
} from './distribution.js';
import { assetInflationFromTopGrowth } from './drag.js';
import { stepAnchorWealth, initialAnchorWealth, type AnchorWealth } from './tiers.js';
import { deriveShares } from './relativePosition.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Compute the aggregate wealth-growth rate of the top-set anchors.
 *
 * The "top set" growth rate (D-02) is approximated from the tiers that fall at or above
 * the topSetPercentile. We use the anchor tier whose percentile is closest to and above
 * the dynamic top-set cut to represent the top-set's representative return.
 *
 * Algorithm:
 *   - topSetPercentile (p*) is the fraction below the top set (e.g. 0.90 → top 10%)
 *   - The top01 anchor (p99.9) is always in the top set; top1 (p99) may be
 *   - We weight by anchor wealth to get the top-set's growth rate as a wealth-weighted avg
 *     of the tier return rates for anchors above p*.
 *
 * For the drag-off golden master (dragStrength=0): aggTopGrowthRate is computed but
 * assetInflationFromTopGrowth returns 0 regardless, so any approximation here is exact.
 *
 * @param anchorWealth - Current anchor wealth (used for weighting).
 * @param params - Engine params (returnByTier).
 * @param topSetPercentile - The percentile cut (0–1) below the dynamic top set.
 * @returns Wealth-weighted average real return rate of the top-set anchors.
 */
function computeTopSetGrowthRate(
  anchorWealth: AnchorWealth,
  params: Params,
  topSetPercentile: number,
): number {
  // Anchor percentile positions
  const ANCHOR_PERCENTILES = {
    median: 0.50,
    top10: 0.90,
    top1: 0.99,
    top01: 0.999,
  } as const;

  type TierKey = keyof typeof ANCHOR_PERCENTILES;

  // Collect anchors that are IN the top set (percentile > topSetPercentile)
  const topSetAnchors: Array<{ wealth: number; returnRate: number }> = [];

  for (const key of ['median', 'top10', 'top1', 'top01'] as TierKey[]) {
    if (ANCHOR_PERCENTILES[key] > topSetPercentile) {
      topSetAnchors.push({
        wealth: anchorWealth[key],
        returnRate: params.returnByTier[key].value,
      });
    }
  }

  if (topSetAnchors.length === 0) {
    // Fallback: the top set is so thin no anchor lands above it — use top01 rate
    return params.returnByTier.top01.value;
  }

  // Wealth-weighted average return rate across top-set anchors
  const totalWeight = topSetAnchors.reduce((s, a) => s + a.wealth, 0);
  if (totalWeight === 0) return 0;

  const weightedRate = topSetAnchors.reduce(
    (s, a) => s + a.returnRate * (a.wealth / totalWeight),
    0,
  );

  return weightedRate;
}

/**
 * Shift-scale a curve by the change in total anchor wealth (D-07 fixed-shape-scaled path).
 *
 * The shape (lognormal μ,σ and Pareto α) is held fixed; only the scale changes.
 * We rescale xm and μ by the ratio of new/old total anchor wealth (an approximation of
 * location shift). This preserves the calibrated distribution shape while shifting
 * the wealth level.
 *
 * Note: In endogenous mode (D-06, default), the curve is fully recalibrated; this path
 * is only taken when params.distributionEvolution === 'fixed-shape-scaled'.
 *
 * @param curve - Prior-year curve (shape is frozen).
 * @param oldAnchorWealth - Anchor wealth at the start of the year.
 * @param newAnchorWealth - Anchor wealth after compounding.
 * @returns Rescaled curve (same shape, shifted location).
 */
function shiftScaleCurve(
  curve: Curve,
  oldAnchorWealth: AnchorWealth,
  newAnchorWealth: AnchorWealth,
): Curve {
  // Use median anchor as the scale reference (μ = ln(median) in lognormal)
  const oldMedian = oldAnchorWealth.median;
  const newMedian = newAnchorWealth.median;

  if (oldMedian <= 0) return curve; // degenerate: return unchanged

  const scaleFactor = newMedian / oldMedian;

  // Shift μ: ln(newMedian) = ln(oldMedian) + ln(scaleFactor)
  const newMu = curve.lognormal.mu + Math.log(scaleFactor);
  // Scale xm proportionally
  const newXm = curve.pareto.xm * scaleFactor;
  // Recompute totalWealth proportionally (E[X] scales with the location shift)
  const newTotalWealth = curve.totalWealth * scaleFactor;

  return {
    lognormal: { mu: newMu, sigma: curve.lognormal.sigma },
    pareto: { alpha: curve.pareto.alpha, xm: newXm },
    stitchQuantile: curve.stitchQuantile,
    totalWealth: newTotalWealth,
  };
}

/**
 * Build an Anchors object from an AnchorWealth (for re-calibration in endogenous mode).
 * Preserves original basis/source/note from params.anchors.
 */
function anchorWealthToAnchors(
  anchorWealth: AnchorWealth,
  params: Params,
): Params['anchors'] {
  const orig = params.anchors;
  return {
    median: { ...orig.median, value: anchorWealth.median },
    top10: { ...orig.top10, value: anchorWealth.top10 },
    top1: { ...orig.top1, value: anchorWealth.top1 },
    top01: { ...orig.top01, value: anchorWealth.top01 },
  };
}

// ---------------------------------------------------------------------------
// projectionEngine (exported)
// ---------------------------------------------------------------------------

/**
 * Project wealth trajectories for all 4 anchor tiers + the user over a multi-year horizon.
 *
 * @param inputs - User-supplied entry inputs (currentWealth, annualSavings).
 * @param params - Full engine parameter bag (anchors, returnByTier, dragStrength, horizon,
 *   distributionEvolution, savings).
 * @returns ProjectionResult with year-by-year series and derived relative-position array.
 *
 * @throws Error("Basis violation in ...") if any returnByTier param has basis='nominal' (MODEL-05).
 */
export function projectionEngine(inputs: Inputs, params: Params): ProjectionResult {
  // -------------------------------------------------------------------------
  // Basis guard (MODEL-05 / T-03-BASIS)
  // -------------------------------------------------------------------------
  assertReal(params.returnByTier.median, 'returnByTier.median');
  assertReal(params.returnByTier.top10, 'returnByTier.top10');
  assertReal(params.returnByTier.top1, 'returnByTier.top1');
  assertReal(params.returnByTier.top01, 'returnByTier.top01');
  assertReal(params.savings, 'savings');

  // -------------------------------------------------------------------------
  // Year 0: calibrate curve + initialize state
  // -------------------------------------------------------------------------
  let curve = calibrateCurve(params.anchors);
  // Year 0 is always a fresh, in-domain calibration → never degraded.
  let curveDegraded = false;
  let anchorWealth = initialAnchorWealth(params.anchors);

  // User is a test-particle: starts with inputs.currentWealth (A5)
  let userWealth = inputs.currentWealth;

  const savings = params.savings.value;
  const dragStrength = params.dragStrength.value;
  const horizon = params.horizon;

  const series: YearSnapshot[] = [];

  // -------------------------------------------------------------------------
  // Main loop: year 0 through horizon (inclusive → horizon+1 snapshots)
  // -------------------------------------------------------------------------
  for (let year = 0; year <= horizon; year++) {
    // Step 1: Dynamic top set (D-03)
    const topSetPercentile = dynamicTopSetPercentile(curve);

    // Step 2: Top-set aggregate growth rate (D-02 driver)
    // For year 0 we use the anchor return rates directly (no prior-year change);
    // for subsequent years this represents the growth rate applied in the prior step.
    // NOTE: The top-set growth rate is the FORWARD rate (the return that will be applied
    // this year), not the rate that was already applied. This ensures drag is based on
    // the same returns being haircut — avoiding P3 double-counting.
    const aggTopGrowthRate = computeTopSetGrowthRate(anchorWealth, params, topSetPercentile);

    // Step 3: Scalar drag haircut (D-01/D-02)
    const assetInflation = assetInflationFromTopGrowth(aggTopGrowthRate, dragStrength);

    // Step 6 (user rate): read user's return off the CURRENT curve (before re-fit)
    // This implements MODEL-02 moving-tier read. The user percentile is computed first
    // so we can apply the correct return for this year's compounding step (step 7).
    const userPercentile = percentileOf(curve, userWealth);
    const userReturnRate = returnAtPercentile(userPercentile, params.returnByTier);

    // Take year-0 snapshot BEFORE advancing wealth (year 0 = starting state)
    // Then advance (compound) for years > 0 in the next iteration.
    // Actually: the loop records state BEFORE the annual step, but
    // year 0 snapshot uses the initial wealth directly (no compounding yet).

    // Build snapshot for this year.
    // _totalWealth is an internal field used by deriveShares.
    // curve / curveDegraded (G1 fix): persist the engine's evolving per-year curve so
    // deriveBandShares (VIZ-07) reads band shares off the SAME curve instead of
    // independently re-calibrating from anchors and freezing on CR-02 failure.
    const snap: YearSnapshot & { _totalWealth: number } = {
      year,
      anchorWealth: { ...anchorWealth },
      userWealth,
      userPercentile,
      topSetPercentile,
      assetInflation,
      curve: {
        lognormal: { ...curve.lognormal },
        pareto: { ...curve.pareto },
        stitchQuantile: curve.stitchQuantile,
        totalWealth: curve.totalWealth,
      },
      curveDegraded,
      _totalWealth: curve.totalWealth,
    };
    series.push(snap);

    // If this is the last year (horizon), stop — don't compound past the snapshot.
    if (year === horizon) break;

    // Step 4: Advance all 4 anchor tiers (D-08 ordinary annuity, drag applied once — step 3)
    const newAnchorWealth = stepAnchorWealth(anchorWealth, params.returnByTier, assetInflation, savings);

    // Step 5: Re-fit curve to evolved anchors (D-06) or shift-scale fixed shape (D-07).
    // Endogenous fallback: heterogeneous returns cause the top01/top1 ratio to grow over
    // time, eventually driving Pareto alpha ≤ 1 (CR-02 guard). When that happens,
    // calibrateCurve throws. We fall back to shiftScaleCurve (fixed-shape-scaled shift)
    // to keep the engine running — the shape is frozen from the last valid calibration,
    // but the LOCATION continues to evolve (so band shares keep moving, not freeze).
    // This is not a silent clamp: the guard fires on direct miscalibration; the engine
    // fallback is an explicit, named degradation path for evolved-distribution out-of-domain.
    // nextDegraded tracks whether the next year's curve is a fallback (CR-01/WR-05).
    let nextCurve: Curve;
    let nextDegraded: boolean;
    if (params.distributionEvolution === 'endogenous') {
      try {
        nextCurve = calibrateCurve(anchorWealthToAnchors(newAnchorWealth, params));
        nextDegraded = false;
      } catch {
        // Endogenous re-calibration failed (e.g. CR-02: alpha ≤ 1 from evolved ratio).
        // Fall back to shift-scale to preserve engine continuity (see engine.ts header).
        // The curve's location still evolves year-over-year, so VIZ-07 band shares
        // continue to change with the horizon instead of freezing — but the anchors
        // are out-of-domain, so this year is flagged degraded for the donut's
        // explicit "calibration unavailable" state.
        nextCurve = shiftScaleCurve(curve, anchorWealth, newAnchorWealth);
        nextDegraded = true;
      }
    } else {
      // 'fixed-shape-scaled' is a deliberate modeling choice, not a degradation.
      nextCurve = shiftScaleCurve(curve, anchorWealth, newAnchorWealth);
      nextDegraded = false;
    }

    // Step 7: Advance user wealth (same ordinary-annuity convention; user's moving-tier rate)
    // r_eff = userReturnRate − assetInflation (small−small, PITFALLS P10)
    const userREff = userReturnRate - assetInflation;
    const newUserWealth = userWealth * (1 + userREff) + inputs.annualSavings;

    // Update state for next iteration
    anchorWealth = newAnchorWealth;
    curve = nextCurve;
    curveDegraded = nextDegraded;
    userWealth = newUserWealth;
  }

  // -------------------------------------------------------------------------
  // Derive relative position from the series (MODEL-03)
  // -------------------------------------------------------------------------
  const relativePosition = deriveShares(series);

  return { series, relativePosition };
}
