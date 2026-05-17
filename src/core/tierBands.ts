/**
 * tierBands.ts — Five-band Lorenz population-mass fractions per horizon year (VIZ-07).
 *
 * deriveBandShares turns the projection's per-year YearSnapshot[] into per-year
 * five-band Lorenz-mass fractions of total distribution wealth (D-01 / D-02).
 *
 * D-01: bands are Lorenz population-mass bands summing to 100% of total distribution
 *   wealth per year — NOT normalized anchor values, NOT a 2-slice top-set split.
 * D-02: five fixed population-fraction bands:
 *   Bottom 50%   = population [0, 0.5)
 *   50–90%       = population [0.5, 0.9)
 *   90–99%       = population [0.9, 0.99)
 *   99–99.9%     = population [0.99, 0.999)
 *   Top 0.1%     = population [0.999, 1]
 *
 * Per-year math (RESEARCH Pattern 1):
 *   s50   = cumulativeShareFromTop(curve, 0.5)   → wealth held by top 50%
 *   s90   = cumulativeShareFromTop(curve, 0.9)   → wealth held by top 10%
 *   s99   = cumulativeShareFromTop(curve, 0.99)  → wealth held by top 1%
 *   s999  = cumulativeShareFromTop(curve, 0.999) → wealth held by top 0.1%
 *   bottom50    = 1 - s50
 *   band50to90  = s50 - s90
 *   band90to99  = s90 - s99
 *   band99to999 = s99 - s999
 *   top01       = s999
 *
 * Normalization (Pitfall 3 float-sum correction): divide each band by their sum
 * so they sum exactly to 1.0. Guard sum <= 0 → use factor 1 (degenerate entry).
 *
 * ── G1 fix (debug session chart4-not-stacking) ────────────────────────────────
 * ROOT CAUSE: the previous implementation re-calibrated a fresh curve from each
 * snapshot's anchors INDEPENDENTLY of the engine. Endogenous evolution drives
 * top01/top1 past 10 (Pareto alpha ≤ 1, CR-02) by ~year 11 at default settings,
 * so calibrateCurve threw for ~70% of horizon years. The bare-catch fallback then
 * froze the band series at the last-calibrated (already pathologically
 * concentrated) year — so Chart 4 showed a flat ~100% top band and Chart 5's
 * donut was horizon-invariant.
 *
 * FIX: the engine already maintains a valid, continuously-evolving curve every
 * year (calibrate when in-domain, shiftScaleCurve when out-of-domain — the
 * location keeps evolving so shares keep moving). deriveBandShares now reads
 * band shares off THAT persisted `snap.curve` via cumulativeShareFromTop, so the
 * bands evolve correctly across the whole horizon and the donut tracks horizon
 * length. snap.curveDegraded (true on the shiftScaleCurve fallback path) is
 * surfaced as BandShare.degraded so the donut can render an explicit
 * "calibration unavailable" state instead of a fabricated/contradictory claim
 * (04.1-REVIEW.md CR-01 / WR-05).
 *
 * Anchor re-calibration is kept ONLY as a fallback for snapshots that lack a
 * persisted curve (legacy/synthetic test fixtures). When that fallback itself
 * throws, the entry is carried forward (year ≥ 1) or degenerate-uniform
 * (year 0), both tagged degraded — and a caught error NEVER propagates out of
 * deriveBandShares (T-04.1-01 / threat-model mitigate).
 *
 * D-12 basis-invariance: since cumulativeShareFromTop returns fractions of the
 * curve's own totalWealth (not absolute values), re-inflating anchorWealth by
 * (1+i)^year shifts all wealth values proportionally, leaving the ratio (Lorenz
 * fractions) unchanged. Verified by the D-12 test in the Wave-0 suite.
 *
 * SECURITY (threat-model T-04.1-SC): zero framework/DOM/fetch/randomness/timestamps —
 * pure numeric module. No new packages introduced this phase.
 *
 * @module tierBands
 */

import { calibrateCurve, cumulativeShareFromTop } from './distribution.js';
import type { CurveShape, YearSnapshot } from './types.js';

// ---------------------------------------------------------------------------
// Exports: BandShare type
// ---------------------------------------------------------------------------

/**
 * Per-year Lorenz population-mass band fractions (VIZ-07).
 *
 * All five fields are fractions in [0, 1]; they sum to 1.0 (within floating-point tolerance).
 * Field semantics (D-02):
 *   bottom50    = bottom 50% of population share of total wealth   [pop 0.0, 0.5)
 *   band50to90  = 50–90% percentile band share of total wealth     [pop 0.5, 0.9)
 *   band90to99  = 90–99% percentile band share of total wealth     [pop 0.9, 0.99)
 *   band99to999 = 99–99.9% percentile band share of total wealth   [pop 0.99, 0.999)
 *   top01       = top 0.1% share of total wealth                   [pop 0.999, 1]
 */
export interface BandShare {
  /** Year index (0 = starting year). */
  year: number;
  /** Bottom 50% of population wealth share. */
  bottom50: number;
  /** 50th–90th percentile band wealth share. */
  band50to90: number;
  /** 90th–99th percentile band wealth share. */
  band90to99: number;
  /** 99th–99.9th percentile band wealth share. */
  band99to999: number;
  /** Top 0.1% wealth share. */
  top01: number;
  /**
   * True when this year's underlying curve is out of the calibration domain
   * (endogenous evolution drove Pareto alpha ≤ 1, so the engine used the
   * shiftScaleCurve fallback) OR this entry was synthesized by the standalone
   * recalibration fallback. The band fractions are still valid and sum to 1.0,
   * but the precise concentration claim is not trustworthy — the donut renders
   * an explicit "calibration unavailable" state instead of asserting a precise
   * top-set figure (04.1-REVIEW.md CR-01 / WR-05).
   */
  degraded: boolean;
}

// ---------------------------------------------------------------------------
// Private: build Anchors-compatible object from snap.anchorWealth (fallback path)
// ---------------------------------------------------------------------------

/**
 * Build a minimal Anchors-compatible object from a snapshot's anchorWealth numbers.
 * calibrateCurve only reads .value on each anchor — this minimal wrapper is sufficient.
 * Used ONLY for the legacy fallback when a snapshot lacks a persisted engine curve.
 */
function buildAnchorsFromSnap(
  anchorWealth: YearSnapshot['anchorWealth'],
): Parameters<typeof calibrateCurve>[0] {
  const synSource = {
    sourceName: 'tierBands-internal',
    figureUsed: 'snap.anchorWealth',
    basis: 'real' as const,
    definition: 'per-year snapshot anchor wealth',
    yearVintage: 'n/a',
    retrievedDate: 'n/a',
  };
  return {
    median: { value: anchorWealth.median, basis: 'real' as const, source: synSource },
    top10: { value: anchorWealth.top10, basis: 'real' as const, source: synSource },
    top1: { value: anchorWealth.top1, basis: 'real' as const, source: synSource },
    top01: { value: anchorWealth.top01, basis: 'real' as const, source: synSource },
  };
}

// ---------------------------------------------------------------------------
// Private: degenerate uniform band entry (year-0 calibration failure fallback)
// ---------------------------------------------------------------------------

/**
 * Returns a degenerate BandShare with all five bands = 0.2 (sums to 1.0), tagged
 * degraded so the UI surfaces an explicit unavailable state rather than a
 * fabricated egalitarian distribution (04.1-REVIEW.md WR-05).
 * Used only when the fallback recalibration throws at year index 0.
 */
function degenerateBand(year: number): BandShare {
  return {
    year,
    bottom50: 0.2,
    band50to90: 0.2,
    band90to99: 0.2,
    band99to999: 0.2,
    top01: 0.2,
    degraded: true,
  };
}

// ---------------------------------------------------------------------------
// Private: compute BandShare for a single year from a calibrated curve
// ---------------------------------------------------------------------------

/**
 * Compute raw per-year five-band fractions from cumulativeShareFromTop, then normalize.
 *
 * Per-year math (D-01 / D-02):
 *   s50   = cumulativeShareFromTop(curve, 0.5)
 *   s90   = cumulativeShareFromTop(curve, 0.9)
 *   s99   = cumulativeShareFromTop(curve, 0.99)
 *   s999  = cumulativeShareFromTop(curve, 0.999)
 *   bottom50    = 1 - s50
 *   band50to90  = s50 - s90
 *   band90to99  = s90 - s99
 *   band99to999 = s99 - s999
 *   top01       = s999
 *
 * Normalization (Pitfall 3): total = sum; f = total > 0 ? 1/total : 1; multiply each band by f.
 */
function computeBandFromCurve(
  year: number,
  curve: Parameters<typeof cumulativeShareFromTop>[0],
  degraded: boolean,
): BandShare {
  const s50 = cumulativeShareFromTop(curve, 0.5);
  const s90 = cumulativeShareFromTop(curve, 0.9);
  const s99 = cumulativeShareFromTop(curve, 0.99);
  const s999 = cumulativeShareFromTop(curve, 0.999);

  const rawBottom50 = 1 - s50;
  const rawBand50to90 = s50 - s90;
  const rawBand90to99 = s90 - s99;
  const rawBand99to999 = s99 - s999;
  const rawTop01 = s999;

  // Normalization: divide by sum to guarantee exact 1.0 (Pitfall 3 float-sum correction)
  const total = rawBottom50 + rawBand50to90 + rawBand90to99 + rawBand99to999 + rawTop01;
  const f = total > 0 ? 1 / total : 1;

  return {
    year,
    bottom50: rawBottom50 * f,
    band50to90: rawBand50to90 * f,
    band90to99: rawBand90to99 * f,
    band99to999: rawBand99to999 * f,
    top01: rawTop01 * f,
    degraded,
  };
}

// ---------------------------------------------------------------------------
// deriveBandShares (exported)
// ---------------------------------------------------------------------------

/**
 * Derive per-year five-band Lorenz population-mass fractions from the projection series.
 *
 * Returns a BandShare[] of the same length as series. Each entry contains the five
 * fixed population-fraction bands (D-02) whose values sum to 1.0 (D-01) for that year.
 *
 * Primary path (G1 fix): read shares off the engine's persisted, continuously
 * evolving per-year `snap.curve` via cumulativeShareFromTop. snap.curveDegraded
 * (engine's shiftScaleCurve fallback) propagates to BandShare.degraded.
 *
 * Fallback path: when a snapshot has no persisted curve (legacy/synthetic test
 * fixtures), recalibrate from anchors; on failure carry forward (year ≥ 1) or
 * emit a degenerate-uniform entry (year 0), both tagged degraded. A caught error
 * NEVER propagates out of deriveBandShares.
 *
 * @param series - Year-by-year snapshots from projectionEngine.
 * @returns Per-year five-band Lorenz fractions, one entry per snapshot year.
 */
export function deriveBandShares(series: YearSnapshot[]): BandShare[] {
  const result: BandShare[] = [];

  for (let i = 0; i < series.length; i++) {
    const snap = series[i]!;
    const year = snap.year;

    // Primary path: use the engine's persisted, continuously-evolving curve.
    if (snap.curve) {
      const curve: CurveShape = snap.curve;
      result.push(computeBandFromCurve(year, curve, snap.curveDegraded === true));
      continue;
    }

    // Fallback path: snapshot has no persisted curve (legacy/synthetic fixture).
    // Recalibrate from anchors; on failure carry forward / degenerate (all degraded).
    try {
      const anchors = buildAnchorsFromSnap(snap.anchorWealth);
      const curve = calibrateCurve(anchors);
      result.push(computeBandFromCurve(year, curve, false));
    } catch {
      if (i === 0) {
        result.push(degenerateBand(year));
      } else {
        const prev = result[i - 1]!;
        result.push({
          ...prev,
          year,
          degraded: true,
        });
      }
    }
  }

  return result;
}
