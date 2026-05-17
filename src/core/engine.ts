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

// ---------------------------------------------------------------------------
// Closure A — tail-ratio asymptote net-growth floor (debug: model-alpha-domain-freeze)
// ---------------------------------------------------------------------------

/**
 * RHO_MAX — asymptote ceiling on the evolved top01/top1 anchor ratio.
 *
 * Closure A (maintainer decision LOCKED, debug session model-alpha-domain-freeze):
 * Under default `endogenous` evolution the heterogeneous per-tier returns
 * (median 2.5% … top01 12%) compound TWO divergence drivers unbounded:
 *   (1) ρ = top01/top1 — drives Pareto α = ln(10)/ln(ρ); ρ ≥ 10 ⇒ α ≤ 1
 *       (CR-02 finite-mean domain — calibrateCurve throws).
 *   (2) top1/median and top10/median — the body-vs-tail spread. When these run
 *       away the lognormal body cannot stitch C0-continuously to the Pareto
 *       tail and the stitch bisection in calibrateCurve fails to bracket a root
 *       in [0.9001, 0.9999] (the implicit CR-01 stitch-domain limit). Probed:
 *       at year-0 body shape, calibration fails once top1/median ≳ 50.
 * Either failure freezes the engine into the shape-frozen shiftScaleCurve
 * fallback ⇒ the VIZ-07 freeze + degraded years.
 *
 * Closure A floors the top tiers' NET growth (return − drag haircut) at the
 * BODY's net growth: the body-relative ratios (top10/median, top1/median) are
 * capped at their year-0 in-domain values so the curve stays calibratable, and
 * ρ is capped at RHO_MAX so the tail index stays strictly inside the CR-02
 * domain. Concentration RISES through the tail (ρ: year-0 ratio → RHO_MAX —
 * the product's core thesis) then PLATEAUS at the ceilings (asymptote: a binding
 * ratio makes that tier track the body's net growth ⇒ constant ratio ⇒
 * stationary concentration that NEVER reverts; the clamp only ever pulls a
 * would-be-LARGER ratio down to the ceiling, never below the prior value).
 *
 * RHO_MAX = 7.45 → α = ln(10)/ln(7.45) ≈ 1.146 > 1 with comfortable CR-02
 * margin (α = 1 at ρ = 10) for ALL horizons through 100. Probed: at the
 * year-0 body shape this yields a top-0.1% wealth share ≈ 0.40, reproducing
 * the closure-ab-comparison proof cited in the maintainer decision (top-0.1%
 * share 23% → ~39–40% then plateau; top01/top1 peaks ~7.45; 0 degraded years;
 * distinct per horizon).
 *
 * NOT a silent clamp on the guard: CR-02/CR-01 are untouched and remain the
 * loud detectors for any residual out-of-domain edge at extreme USER inputs
 * (Option 4 honest "beyond model domain" terminal state handles that residual).
 */
const RHO_MAX = 7.45;

/**
 * Smoothly squash a natural tail ratio ρ_nat into [rho0, rhoCap).
 *
 * rhoCap = min(RHO_MAX, max(rho0, RHO_MAX)) — the asymptote ceiling. We never
 * push concentration below where it starts: if the year-0 ratio rho0 is itself
 * ≥ RHO_MAX (an already-extreme synthetic input) the cap is rho0 and the map is
 * pure identity (the closure must NOT de-concentrate a distribution; it only
 * bounds further runaway growth — "never reverts").
 *
 * map(ρ_nat) = rho0 + (rhoCap − rho0) · tanh((ρ_nat − rho0)/(rhoCap − rho0))
 *
 * Properties (exactly the maintainer-locked asymptote-floor shape):
 *   - map(rho0)  = rho0                          (identity at the start — no
 *                                                 de-concentration; preserves
 *                                                 the year-0 calibration)
 *   - strictly increasing in ρ_nat               (concentration never reverts)
 *   - map(ρ_nat) → rhoCap as ρ_nat → ∞           (asymptote strictly < rhoCap
 *                                                 ⇒ α > ln(10)/ln(rhoCap),
 *                                                 always inside CR-02)
 *   - the increment shrinks as ρ_nat grows       (rises then plateaus; the
 *                                                 y35→y100 increment is small)
 * For ρ_nat ≤ rho0 the natural ratio is returned unchanged.
 *
 * rho0 is the engine's ACTUAL year-0 tail ratio (captured per-run, not a
 * hardcoded constant), so the closure is an exact no-op at year 0 for ANY
 * input set and only damps growth ABOVE each run's own starting concentration.
 *
 * @param rhoNat - The natural evolved top01/top1 ratio this year.
 * @param rho0   - The run's year-0 top01/top1 ratio.
 */
function squashRho(rhoNat: number, rho0: number): number {
  const rhoCap = Math.max(RHO_MAX, rho0);
  if (rhoNat <= rho0 || rhoCap <= rho0) return rhoNat;
  const span = rhoCap - rho0;
  return rho0 + span * Math.tanh((rhoNat - rho0) / span);
}

/**
 * Year-0 ratios captured from the initial in-domain calibration anchors.
 * Pinning the body-vs-tail spread at the year-0 (proven calibratable) ratios is
 * exactly "floor the top tiers' net growth at the body's net growth": once a
 * ceiling binds, that upper tier grows at the median's net rate, so the ratio
 * is constant (stationary) and the lognormal body never runs out of stitch
 * domain. Concentration still RISES via the tail (ρ → RHO_MAX) before
 * plateauing. rho0 anchors the smooth tail asymptote to THIS run's starting
 * concentration so the closure is an exact no-op at year 0 for any input.
 */
interface ClosureACeilings {
  r10: number; // top10 / median ratio (year-0)
  r1: number; // top1  / median ratio (year-0)
  rho0: number; // top01 / top1 ratio (year-0)
}

function closureACeilings(initial: AnchorWealth): ClosureACeilings {
  return {
    r10: initial.top10 / initial.median,
    r1: initial.top1 / initial.median,
    rho0: initial.top1 > 0 ? initial.top01 / initial.top1 : RHO_MAX,
  };
}

/**
 * Apply the Closure-A net-growth floor to an evolved AnchorWealth.
 *
 * Floor mechanism — "floor the top tiers' NET growth at the BODY's net growth":
 *   - top10 = ceilings.r10 · median   (body-shoulder tier tracks the body's net
 *                                      growth exactly ⇒ ratio pinned at the
 *                                      year-0 in-domain value: σ never collapses
 *                                      and never reverts. This is the literal
 *                                      net-growth floor — top10's net growth is
 *                                      floored AND ceiled at the body's, so the
 *                                      ratio is stationary.)
 *   - top1  = ceilings.r1  · median   (top-1% tier tracks the body's net growth
 *                                      ⇒ stitch domain preserved, stationary,
 *                                      never reverts.)
 *   - top01 ≤ RHO_MAX · top1          (one-sided asymptote cap: top-0.1% net
 *                                      growth rises freely until ρ hits RHO_MAX
 *                                      then is floored at top1's net growth ⇒
 *                                      concentration RISES via the tail then
 *                                      PLATEAUS strictly inside CR-02; never
 *                                      reverts — the clamp only pulls a
 *                                      would-be-larger ρ down to RHO_MAX.)
 * The median (the body anchor) is NEVER modified, so absolute wealth keeps
 * evolving every year; only the divergence drivers are bounded. Pinning the
 * body-relative ratios is exact net-growth-flooring at the body (Closure A,
 * maintainer-locked): top10/top1 grow at the median's net rate ⇒ the lognormal
 * body shape is stationary and always calibratable; the only concentration
 * dynamic is the tail ρ rising 6.0 → RHO_MAX (the product's core thesis) then
 * plateauing. Probed at DEFAULTS: 0 degraded years for horizons 35/60/100,
 * top-0.1% share 0.233 → ~0.40 monotone-then-plateau, distinct per horizon.
 *
 * Caller MUST gate this on `distributionEvolution === 'endogenous' &&
 * dragStrength > 0` so the drag-off analytic golden master (D-11/MODEL-06) and
 * the dragStrength=0 collapse invariant are byte-for-byte preserved.
 *
 * @param a - Evolved anchor wealth (post stepAnchorWealth).
 * @param c - Year-0 body-relative ratio ceilings.
 * @returns Anchor wealth with the net-growth floor applied.
 */
function applyClosureAFloor(a: AnchorWealth, c: ClosureACeilings): AnchorWealth {
  if (a.median <= 0) return a; // degenerate: nothing to bound against
  // Body-shoulder and top-1% tiers track the body's net growth exactly
  // (ratio pinned at the year-0 in-domain value): stationary, never reverts,
  // lognormal body always calibratable. This IS the net-growth floor at the
  // body for those tiers.
  const top10 = c.r10 * a.median;
  const top1 = c.r1 * a.median;
  // Top-0.1%: the natural evolved tail ratio is smoothly squashed toward
  // RHO_MAX (asymptote, never reached). Concentration keeps creeping up every
  // year (distinct per horizon, strictly monotone, never reverts) and
  // plateaus — a true asymptote, not a hard flat clamp. Only applied when the
  // natural ratio would EXCEED top1's pinned level relative to RHO_0 (i.e. the
  // tail is concentrating); otherwise top01 passes through. Floor at top1's net
  // growth direction is implicit: squashRho is strictly increasing so top01
  // never drops below its prior in-domain trajectory.
  const rhoNat = top1 > 0 ? a.top01 / top1 : c.rho0;
  const top01 = squashRho(rhoNat, c.rho0) * top1;
  return { median: a.median, top10, top1, top01 };
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

  // Closure A (debug session model-alpha-domain-freeze): year-0 body-relative
  // ratio ceilings, captured once from the initial in-domain calibration.
  const closureCeilings = closureACeilings(anchorWealth);

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
    const steppedAnchorWealth = stepAnchorWealth(anchorWealth, params.returnByTier, assetInflation, savings);

    // Step 4b: Closure A tail-ratio asymptote net-growth floor (debug session
    // model-alpha-domain-freeze, maintainer decision LOCKED). Gated on
    // endogenous AND dragStrength>0 so the drag-off analytic golden master
    // (D-11/MODEL-06) and the dragStrength=0 collapse invariant are byte-for-byte
    // preserved. The floored anchors become BOTH the next-year state AND the
    // input to the calibrateCurve whose curve is attached to the snapshot —
    // the exact path deriveBandShares (VIZ-07) consumes — so the corrected
    // dynamics flow through with no wiring gap.
    const newAnchorWealth =
      params.distributionEvolution === 'endogenous' && dragStrength > 0
        ? applyClosureAFloor(steppedAnchorWealth, closureCeilings)
        : steppedAnchorWealth;

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
