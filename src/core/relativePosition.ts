/**
 * relativePosition.ts — Wealth-share and rank derivation from the curve series (MODEL-03).
 *
 * deriveShares computes the user's relative position in the wealth distribution at each year:
 *   - userShare: the user's wealth as a fraction of total distribution wealth (from totalWealth)
 *   - userRank: the user's wealth percentile (0–100), derived from percentileOf (the curve CDF)
 *
 * Both quantities come from the YearSnapshot fields populated by the engine loop:
 *   - userWealth: user's projected wealth in real terms
 *   - userPercentile: already computed by the engine (percentileOf off the re-fit curve)
 *   - anchorWealth: used to estimate the total wealth normalization denominator
 *
 * The "total wealth" denominator for userShare is taken from the calibrated Curve's
 * totalWealth field (stored in the snapshot's topSetPercentile context). However, since
 * YearSnapshot does not carry the Curve object, we approximate total distribution wealth
 * using the Curve's totalWealth, which the engine passes directly into the snapshot.
 * The engine stores it so deriveShares is a pure function of the series.
 *
 * @module relativePosition
 */

import type { YearSnapshot, ProjectionResult } from './types.js';

// ---------------------------------------------------------------------------
// deriveShares
// ---------------------------------------------------------------------------

/**
 * Derive the user's relative wealth position from the year-by-year series.
 *
 * At each year:
 *   - userShare: user's wealth / total distribution wealth (from the curve's totalWealth).
 *     This is the user's wealth as a fraction of the mean-wealth-weighted distribution.
 *   - userRank: user's wealth percentile × 100 (0 = poorest, 100 = wealthiest).
 *     Taken directly from snapshot.userPercentile (already computed by engine via percentileOf).
 *
 * Note: YearSnapshot carries `_totalWealth` (an internal field set by the engine) for the
 * total distribution wealth denominator. If absent (older snapshots), userShare falls back to
 * a ratio against the top01 anchor wealth (a conservative upper bound).
 *
 * @param series - Year-by-year snapshots from projectionEngine.
 * @returns Relative-position array, one entry per snapshot year.
 */
export function deriveShares(
  series: YearSnapshot[],
): Array<{ year: number; userShare: number; userRank: number }> {
  return series.map((snap) => {
    // userRank: percentile × 100 for "out of 100" display convention
    const userRank = snap.userPercentile * 100;

    // userShare: fraction of total distribution wealth held by the user.
    // The engine attaches the curve's totalWealth to the snapshot as _totalWealth.
    // This is an internal field for relativePosition use (not part of the public API).
    const totalWealth = (snap as YearSnapshot & { _totalWealth?: number })._totalWealth;
    const denominator = totalWealth ?? snap.anchorWealth.top01;
    const userShare = denominator > 0 ? snap.userWealth / denominator : 0;

    return {
      year: snap.year,
      userShare,
      userRank,
    };
  });
}
