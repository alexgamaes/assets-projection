/**
 * distribution.ts — Lognormal-body + Pareto-upper-tail continuous wealth distribution.
 *
 * Implements the calibrated parametric curve (D-04/D-05) that is the shared substrate for:
 *   - Dynamic top-set inversion (D-03)
 *   - User moving-tier rate (MODEL-02 / D-06)
 *   - Relative-position derivation (MODEL-03)
 *
 * Calibration mapping (RESEARCH Pattern 4 / Assumption A3):
 *   median anchor  → μ (lognormal location: median = exp(μ))
 *   top10 anchor   → σ (lognormal scale: Q(0.9) = exp(μ + σ·Φ⁻¹(0.9)))
 *   top1 + top01   → α (Pareto tail index: α = ln(10)/ln(top01/top1))
 *   C0 continuity  → xm / stitchQuantile (solved via bisection)
 *
 * Tolerances:
 *   Distribution-math tests use DIST_TOL = 1e-6 (RESEARCH Open Question 2).
 *   The <1e-9 annuity golden-master criterion (D-11) applies to the engine loop, not here.
 *
 * PITFALLS compliance:
 *   P5  — C0 continuity enforced; C1 residual documented and bounded.
 *   P10 — no catastrophic cancellation; all differences are small−small.
 *   P2  — no hardcoded "18" or other Fagereng-gap constants.
 *
 * SECURITY (RESEARCH §"Security Domain" / T-02-DET):
 *   Zero framework/DOM/fetch/randomness/timestamps — pure numeric module.
 *   Import-boundary test (invariants.test.ts MODEL-01) stays green by design.
 *
 * @module distribution
 */

import type { Anchors, ReturnByTier } from './types.js';

// ---------------------------------------------------------------------------
// Exports: Curve interface
// ---------------------------------------------------------------------------

/**
 * A calibrated lognormal+Pareto wealth-distribution curve.
 *
 * The body (lognormal) covers percentiles [0, stitchQuantile].
 * The tail (Pareto) covers percentiles (stitchQuantile, 1].
 *
 * At the stitch wealth (xm): CDF is C0-continuous by construction.
 * Density continuity (C1) is achieved when the anchor set is compatible; otherwise
 * the residual density gap is bounded and documented (RESEARCH Assumption A4).
 */
export interface Curve {
  lognormal: { mu: number; sigma: number };
  pareto: { alpha: number; xm: number };
  /** The percentile at which the body transitions to the tail. */
  stitchQuantile: number;
  /**
   * Total expected wealth E[X] of the combined distribution.
   * Used as the denominator in cumulativeShareFromTop.
   */
  totalWealth: number;
}

// ---------------------------------------------------------------------------
// Internal: erf / standard normal CDF (Φ)
// ---------------------------------------------------------------------------

/**
 * Error function approximation — Abramowitz & Stegun 7.1.26.
 *
 * Precision: |error| ≤ 1.5 × 10^-7 (documented; A&S Table 7.1 / formula 7.1.26).
 * This is sufficient for DIST_TOL=1e-6 distribution tests; the <1e-9 criterion
 * (D-11) applies only to the annuity golden master, which does not use erf.
 *
 * Source: Abramowitz & Stegun, "Handbook of Mathematical Functions", formula 7.1.26.
 *
 * @param x - Input value (real)
 * @returns erf(x) ∈ (-1, 1)
 */
function erf(x: number): number {
  // Clamp to avoid overflow in the polynomial evaluation
  if (x > 6) return 1;
  if (x < -6) return -1;

  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + 0.3275911 * Math.abs(x));

  // A&S 7.1.26 polynomial (5 terms)
  const p =
    t * (0.254829592 +
      t * (-0.284496736 +
        t * (1.421413741 +
          t * (-1.453152027 +
            t * 1.061405429))));

  return sign * (1 - p * Math.exp(-x * x));
}

/**
 * Standard normal CDF: Φ(z) = P(Z ≤ z) for Z ~ N(0,1).
 * Uses the erf approximation (A&S 7.1.26).
 *
 * @param z - Standard normal quantile
 * @returns Φ(z) ∈ (0, 1)
 */
function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/**
 * Inverse standard normal CDF (probit function) via rational approximation.
 * Used only during calibration to locate the stitch point.
 *
 * Algorithm: Beasley-Springer-Moro (rational approximation; Peter Acklam's method).
 * Precision: |error| ≤ 3 × 10^-9 for p ∈ (10^-7, 1-10^-7) — adequate for calibration.
 *
 * Source: Acklam, P.J. (2003) "An algorithm for computing the inverse normal cumulative
 * distribution function", doi:10.1145/1063212.1063214 (adapted rational approximation).
 *
 * @param p - Probability ∈ (0, 1)
 * @returns z such that Φ(z) = p
 */
function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  // Rational approximation coefficients (Acklam 2003)
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
              1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
              6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
              -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
              3.754408661907416e0];

  let z: number;
  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    // Lower tail
    const q = Math.sqrt(-2 * Math.log(p));
    z = (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
        ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  } else if (p <= pHigh) {
    // Central region
    const q = p - 0.5;
    const r = q * q;
    z = (((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q /
        (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1);
  } else {
    // Upper tail (symmetry)
    const q = Math.sqrt(-2 * Math.log(1 - p));
    z = -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
         ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }

  return z;
}

// ---------------------------------------------------------------------------
// Internal: Lognormal helpers
// ---------------------------------------------------------------------------

/**
 * Lognormal CDF: P(X ≤ w) where X ~ LogNormal(μ, σ).
 * Formula: Φ((ln w − μ) / σ)
 */
function lognormalCDF(mu: number, sigma: number, w: number): number {
  if (w <= 0) return 0;
  return normalCDF((Math.log(w) - mu) / sigma);
}

/**
 * Lognormal quantile function: the wealth w at percentile p.
 * Formula: exp(μ + σ·Φ⁻¹(p))
 */
function lognormalQuantile(mu: number, sigma: number, p: number): number {
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;
  return Math.exp(mu + sigma * normalQuantile(p));
}

/**
 * Lognormal partial expectation: E[X · 1{X ≤ w}] for X ~ LogNormal(μ, σ).
 *
 * Formula (standard lognormal partial-expectation identity):
 *   E[X · 1{X ≤ w}] = exp(μ + σ²/2) · Φ((ln w − μ − σ²) / σ)
 *
 * Source: en.wikipedia.org/wiki/Log-normal_distribution (partial expectation section).
 *
 * @param mu - Lognormal location parameter
 * @param sigma - Lognormal scale parameter
 * @param w - Upper integration limit (wealth)
 */
function lognormalPartialExpectation(mu: number, sigma: number, w: number): number {
  if (w <= 0) return 0;
  const meanFactor = Math.exp(mu + (sigma * sigma) / 2);
  const shiftedArg = (Math.log(w) - mu - sigma * sigma) / sigma;
  return meanFactor * normalCDF(shiftedArg);
}

/**
 * Lognormal mean: E[X] = exp(μ + σ²/2)
 */
function lognormalMean(mu: number, sigma: number): number {
  return Math.exp(mu + (sigma * sigma) / 2);
}

// ---------------------------------------------------------------------------
// Internal: Pareto helpers
// ---------------------------------------------------------------------------

/**
 * Pareto CDF (upper tail fraction): P(X > w) for the body-scaled Pareto in the tail.
 *
 * In our parameterization, the tail covers P(X > w) = (1 - stitchQuantile) * (xm/w)^alpha
 * for w ≥ xm, where xm is the Pareto minimum (= stitch wealth).
 *
 * This is a SCALED Pareto (the full distribution assigns mass (1-qs) to the tail).
 * P_tail(X ≤ w) for w ≥ xm = qs + (1-qs) * [1 - (xm/w)^alpha]
 *
 * @param alpha - Pareto tail index (must be > 1 for finite mean)
 * @param xm - Pareto minimum scale (= stitch wealth)
 * @param qs - Stitch percentile (probability mass below stitch)
 * @param w - Wealth value (must be ≥ xm)
 */
function paretoTailMass(alpha: number, xm: number, qs: number, w: number): number {
  if (w < xm) return 1 - qs; // All tail mass above xm
  return (1 - qs) * Math.pow(xm / w, alpha);
}

/**
 * Pareto tail conditional mean: E[X | X > w] for the Pareto component.
 * Formula: alpha * w / (alpha - 1)  (for alpha > 1, w ≥ xm)
 *
 * Source: en.wikipedia.org/wiki/Pareto_distribution
 */
function paretoConditionalMean(alpha: number, w: number): number {
  return (alpha * w) / (alpha - 1);
}

/**
 * Pareto tail expected wealth above w: E[X · 1{X > w}] for the scaled Pareto tail.
 *
 * Formula: E[X|X>w] * P(X>w) = (alpha*w/(alpha-1)) * (1-qs) * (xm/w)^alpha
 *        = (1-qs) * alpha * xm^alpha * w^(1-alpha) / (alpha-1)
 *
 * Structure: (1-qs) * alpha / (alpha-1) * xm^alpha * w^(1-alpha)
 * This avoids cancellation (PITFALLS P10): xm^alpha * w^(1-alpha) is a positive term.
 */
function paretoTailWealthAbove(alpha: number, xm: number, qs: number, w: number): number {
  if (w < xm) {
    // All tail wealth above xm: E[X_pareto] * (1-qs) where E[X_pareto] = alpha*xm/(alpha-1)
    return (1 - qs) * paretoConditionalMean(alpha, xm);
  }
  const tailMass = paretoTailMass(alpha, xm, qs, w);
  return paretoConditionalMean(alpha, w) * tailMass;
}

// ---------------------------------------------------------------------------
// calibrateCurve
// ---------------------------------------------------------------------------

/**
 * Calibrate a lognormal+Pareto curve to the 4 anchor percentiles.
 *
 * Parameter mapping (RESEARCH Pattern 4 / Assumption A3):
 *   1. μ  ← ln(anchors.median.value)          [median = exp(μ) for LogNormal]
 *   2. σ  ← (ln(top10) − μ) / Φ⁻¹(0.9)       [top10 at 90th pctile]
 *   3. α  ← ln(10) / ln(top01 / top1)          [ratio of tail anchors]
 *   4. Stitch (qs, xm) solved via bisection:
 *        P_full(X > top1) = 0.01
 *        C0: xm = Q_lognormal(qs) (same wealth from both sides)
 *        Combined: (1-qs) * (Q_ln(qs)/top1)^α = 0.01
 *        Solve for qs ∈ (0, 0.9999) via monotone bisection.
 *
 * @param anchors - The 4 sourced anchor percentiles (median / top10 / top1 / top01).
 * @returns Calibrated Curve ready for quantile / cdf / cumulativeShareFromTop.
 */
export function calibrateCurve(anchors: Anchors): Curve {
  const medianWealth = anchors.median.value;
  const top10Wealth = anchors.top10.value;
  const top1Wealth = anchors.top1.value;
  const top01Wealth = anchors.top01.value;

  // Step 1: μ — lognormal location (median pins this exactly)
  const mu = Math.log(medianWealth);

  // Step 2: σ — lognormal scale (top10 anchor at p90)
  const sigma = (Math.log(top10Wealth) - mu) / normalQuantile(0.9);

  // Step 3: α — Pareto tail index from the top1/top01 ratio
  // Derived from: P(X>top1)/P(X>top01) = 10 = (top01/top1)^α
  // → α = ln(10) / ln(top01/top1)
  const alpha = Math.log(10) / Math.log(top01Wealth / top1Wealth);

  // Step 4: Find stitch quantile qs such that the Pareto tail (starting at Q_ln(qs))
  // exactly passes through the top1 anchor at p=0.99.
  //
  // Pareto quantile at p=0.99 (tail percentile): Q_pareto(0.99) = xm * ((1-qs)/0.01)^(1/α)
  // C0 continuity: xm = Q_ln(qs) = exp(μ + σ·Φ⁻¹(qs))
  //
  // Combined equation (one unknown: qs):
  //   Q_ln(qs) · ((1-qs)/0.01)^(1/α) = top1Wealth
  //
  // This ensures Q_full(0.99) = top1Wealth exactly.
  // Combined with α from the ratio, Q_full(0.999) = top01Wealth also holds.
  //
  // The root is bounded in (0.9, 0.999): p90 anchor is in the body, p99 in the tail.
  // Bisect on [lo, hi] = [0.9001, 0.9999].
  const stitchQuantile = bisect(
    (qs) => {
      const xmStitch = lognormalQuantile(mu, sigma, qs);
      return xmStitch * Math.pow((1 - qs) / 0.01, 1 / alpha) - top1Wealth;
    },
    0.9001,
    0.9999,
    100,
    1e-12,
  );

  const xm = lognormalQuantile(mu, sigma, stitchQuantile);

  // Step 5: Compute totalWealth = E[X] of the combined distribution
  //   E[X] = (body mean up to xm) + (Pareto tail mean above xm)
  //   Body partial expectation up to xm: E[X·1{X≤xm}] = lognormalPartialExpectation(μ,σ,xm)
  //   Pareto tail: (1-qs) * E[X_pareto] = (1-qs) * α*xm/(α-1)
  const bodyMean = lognormalPartialExpectation(mu, sigma, xm);
  const tailMean = (1 - stitchQuantile) * paretoConditionalMean(alpha, xm);
  const totalWealth = bodyMean + tailMean;

  return {
    lognormal: { mu, sigma },
    pareto: { alpha, xm },
    stitchQuantile,
    totalWealth,
  };
}

// ---------------------------------------------------------------------------
// quantile
// ---------------------------------------------------------------------------

/**
 * Wealth at percentile p in the calibrated lognormal+Pareto curve.
 *
 * Body (p ≤ stitchQuantile): lognormal quantile directly.
 * Tail (p > stitchQuantile): Pareto quantile from the stitch wealth.
 *   (1 - qs) * (xm/w)^α = 1 - p  →  w = xm * ((1-p)/(1-qs))^(-1/α)
 *
 * @param curve - Calibrated Curve
 * @param p - Percentile ∈ (0, 1)
 * @returns Wealth at percentile p
 */
export function quantile(curve: Curve, p: number): number {
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;

  const { lognormal: { mu, sigma }, pareto: { alpha, xm }, stitchQuantile } = curve;

  if (p <= stitchQuantile) {
    return lognormalQuantile(mu, sigma, p);
  } else {
    // Pareto tail inversion: P(X > w) = (1-qs)*(xm/w)^α = 1-p
    // → (xm/w)^α = (1-p)/(1-qs)
    // → w = xm * ((1-p)/(1-qs))^(-1/α) = xm * ((1-qs)/(1-p))^(1/α)
    return xm * Math.pow((1 - stitchQuantile) / (1 - p), 1 / alpha);
  }
}

// ---------------------------------------------------------------------------
// cdf
// ---------------------------------------------------------------------------

/**
 * Percentile (CDF) of wealth w in the calibrated lognormal+Pareto curve.
 *
 * Body (w ≤ xm): lognormal CDF.
 * Tail (w > xm): stitchQuantile + (1-stitchQuantile) * [1 - (xm/w)^α]
 *
 * @param curve - Calibrated Curve
 * @param w - Wealth value
 * @returns P(X ≤ w) ∈ [0, 1]
 */
export function cdf(curve: Curve, w: number): number {
  if (w <= 0) return 0;

  const { lognormal: { mu, sigma }, pareto: { alpha, xm }, stitchQuantile } = curve;

  if (w <= xm) {
    return lognormalCDF(mu, sigma, w);
  } else {
    // (1-qs)*(xm/w)^α is the tail mass above w; subtract from (1-qs)
    // P(X ≤ w) = qs + (1-qs) * [1 - (xm/w)^α]
    const tailMassBelowW = (1 - stitchQuantile) * (1 - Math.pow(xm / w, alpha));
    return stitchQuantile + tailMassBelowW;
  }
}

// ---------------------------------------------------------------------------
// percentileOf (alias of cdf — MODEL-02 / D-06 readability)
// ---------------------------------------------------------------------------

/**
 * Returns the percentile of wealth w in the distribution.
 * Alias of cdf(curve, w) — exists for engine-readability in the moving-tier read (D-06).
 *
 * @param curve - Calibrated Curve
 * @param w - User's current wealth
 * @returns Percentile ∈ [0, 1] (e.g. 0.5 = median, 0.9 = top 10%)
 */
export function percentileOf(curve: Curve, w: number): number {
  return cdf(curve, w);
}

// ---------------------------------------------------------------------------
// cumulativeShareFromTop
// ---------------------------------------------------------------------------

/**
 * Fraction of total wealth held by the top (1−p) mass — i.e. those above the p-th percentile.
 *
 * This is the key closed-form for the D-03 dynamic-top-set computation.
 * It is strictly monotone decreasing in p (larger p = smaller top fraction = smaller share).
 *
 * Decomposition:
 *   share = [wealthAbove_lognormalBody(p) + wealthAbove_paretoTail(p)] / totalWealth
 *
 * Case 1: p ≤ stitchQuantile (wealth above p straddles body and tail)
 *   - Lognormal body above Q(p): totalBodyMean − E[X·1{X≤Q(p)}]
 *     where totalBodyMean = E[X·1{X≤xm}] (body partial up to stitch)
 *   - Full Pareto tail (all of it): (1-qs)*E[X_pareto]
 *   wealthAbove = (totalBodyMean − lognormalPartialExpectation(p)) + tailMean
 *
 * Case 2: p > stitchQuantile (wealth above p is pure Pareto tail)
 *   - Lognormal body contributes 0 above this point
 *   - Pareto tail above Q(p): E[X·1{X>Q(p)}] = paretoTailWealthAbove(Q(p))
 *   wealthAbove = paretoTailWealthAbove(Q(p))
 *
 * Source: RESEARCH Pattern 3; lognormal partial-expectation identity from
 *   en.wikipedia.org/wiki/Log-normal_distribution;
 *   Pareto tail-share from en.wikipedia.org/wiki/Pareto_distribution.
 *
 * @param curve - Calibrated Curve
 * @param p - Percentile cut (fraction below); top (1-p) fraction is measured.
 * @returns Wealth share ∈ [0, 1] held by the top (1-p) fraction.
 */
export function cumulativeShareFromTop(curve: Curve, p: number): number {
  if (p <= 0) return 1;
  if (p >= 1) return 0;

  const { lognormal: { mu, sigma }, pareto: { alpha, xm }, stitchQuantile, totalWealth } = curve;

  // Body partial expectation up to xm (the full body contribution to total wealth)
  const bodyTotalMean = lognormalPartialExpectation(mu, sigma, xm);
  // Pareto tail mean: (1-qs)*E[X_pareto] = (1-qs)*alpha*xm/(alpha-1)
  const tailTotalMean = (1 - stitchQuantile) * paretoConditionalMean(alpha, xm);

  let wealthAbove: number;

  if (p <= stitchQuantile) {
    // Wealth above p-th percentile in the body
    const wP = lognormalQuantile(mu, sigma, p);
    const bodyPartialUpToWp = lognormalPartialExpectation(mu, sigma, wP);
    const bodyWealthAbove = bodyTotalMean - bodyPartialUpToWp;
    // All tail wealth is above the stitch, which is above Q(p)
    wealthAbove = bodyWealthAbove + tailTotalMean;
  } else {
    // All lognormal body is below p; only the Pareto tail contributes above p
    const wP = quantile(curve, p); // Pareto quantile (above stitch)
    wealthAbove = paretoTailWealthAbove(alpha, xm, stitchQuantile, wP);
  }

  return wealthAbove / totalWealth;
}

// ---------------------------------------------------------------------------
// dynamicTopSetPercentile
// ---------------------------------------------------------------------------

/**
 * Find the percentile p* such that cumulativeShareFromTop(curve, p*) = 0.5.
 *
 * Interpretation (D-03): the "dynamic top set" is the smallest group of top-percentile
 * holders whose cumulative wealth equals 50% of total distribution wealth. p* is the
 * percentile cut — those above p* form the dynamic top set.
 *
 * Algorithm: monotone bisection on the strictly-decreasing cumulativeShareFromTop.
 * The share function is continuous and strictly monotone, so bisection converges to
 * the unique interpolated percentile — NO discrete tier stepping (D-03).
 *
 * Self-tightening property (tested): as the distribution becomes more concentrated
 * (e.g. larger top01/median ratio), p* increases (top set shrinks to a smaller fraction).
 *
 * @param curve - Calibrated Curve
 * @returns p* ∈ (0, 1) such that cumulativeShareFromTop(curve, p*) ≈ 0.5
 */
export function dynamicTopSetPercentile(curve: Curve): number {
  // cumulativeShareFromTop is strictly decreasing in p.
  // We want share(p*) = 0.5 → bisect for the zero of (share - 0.5).
  return bisect(
    (p) => cumulativeShareFromTop(curve, p) - 0.5,
    0.0001,
    0.9999,
    100,
    1e-12,
  );
}

// ---------------------------------------------------------------------------
// returnAtPercentile
// ---------------------------------------------------------------------------

/**
 * Real return rate at a given wealth percentile, interpolated from the 4 anchor tiers.
 *
 * Implements the heterogeneous return curve (MODEL-02): return = f(wealth percentile).
 * The interpolation is monotone log-linear between adjacent anchor percentiles, which
 * guarantees strict monotonicity (higher percentile → higher or equal return).
 *
 * Anchor percentile map (from Anchors semantics):
 *   p50   = 0.5   → returnByTier.median.value
 *   p90   = 0.9   → returnByTier.top10.value
 *   p99   = 0.99  → returnByTier.top1.value
 *   p99.9 = 0.999 → returnByTier.top01.value
 *
 * Extrapolation:
 *   Below p50: clamp to median rate.
 *   Above p99.9: clamp to top01 rate.
 *
 * Log-linear interpolation in percentile space:
 *   t = (p − p_lo) / (p_hi − p_lo)    [linear in percentile]
 *   return = r_lo + t * (r_hi − r_lo)  [linear in rate — rates are small, direct is fine]
 *
 * Note: log-linear in percentile (not log-log) keeps the implementation simple and
 * guarantees monotonicity trivially: r values at anchors are strictly increasing,
 * and linear interpolation between them preserves strict increase.
 *
 * PITFALLS P2: no hardcoded "18" or any fixed return gap — all values come from anchors.
 *
 * @param percentile - Wealth percentile ∈ [0, 1]
 * @param returnByTier - Return rates at the 4 anchor tiers (all basis='real').
 * @returns Interpolated real return rate.
 */
export function returnAtPercentile(percentile: number, returnByTier: ReturnByTier): number {
  // Anchor breakpoints (percentile, rate) pairs in ascending order
  const anchors: [number, number][] = [
    [0.5, returnByTier.median.value],
    [0.9, returnByTier.top10.value],
    [0.99, returnByTier.top1.value],
    [0.999, returnByTier.top01.value],
  ];

  // Clamp to domain
  if (percentile <= anchors[0]![0]) return anchors[0]![1];
  if (percentile >= anchors[anchors.length - 1]![0]) return anchors[anchors.length - 1]![1];

  // Find the surrounding segment and interpolate linearly
  for (let i = 0; i < anchors.length - 1; i++) {
    const [p_lo, r_lo] = anchors[i]!;
    const [p_hi, r_hi] = anchors[i + 1]!;
    if (percentile <= p_hi) {
      const t = (percentile - p_lo) / (p_hi - p_lo);
      return r_lo + t * (r_hi - r_lo);
    }
  }

  // Unreachable given the clamp above
  return anchors[anchors.length - 1]![1];
}

// ---------------------------------------------------------------------------
// Internal: bisection solver
// ---------------------------------------------------------------------------

/**
 * Monotone bisection solver: finds x ∈ [lo, hi] such that f(x) ≈ 0.
 * Assumes f is monotone (either strictly increasing or strictly decreasing).
 *
 * @param f - Target function (must change sign between lo and hi)
 * @param lo - Lower bound
 * @param hi - Upper bound
 * @param maxIter - Maximum iterations (default 100)
 * @param tol - Convergence tolerance on interval width (default 1e-12)
 * @returns Approximate root x* such that |f(x*)| < tolerance or interval < tol.
 */
function bisect(
  f: (x: number) => number,
  lo: number,
  hi: number,
  maxIter = 100,
  tol = 1e-12,
): number {
  let a = lo;
  let b = hi;
  const fa = f(a);

  for (let i = 0; i < maxIter; i++) {
    if (b - a < tol) break;
    const mid = (a + b) / 2;
    const fm = f(mid);
    if (fm === 0) return mid;
    // Same sign as fa → root is in [mid, b]
    if (fm * fa > 0) {
      a = mid;
    } else {
      b = mid;
    }
  }

  return (a + b) / 2;
}
