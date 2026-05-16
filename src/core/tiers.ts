/**
 * tiers.ts — Per-tier ordinary-annuity compounding step (D-08 / Claude's Discretion).
 *
 * Applies the end-of-year ordinary-annuity convention each year:
 *   W' = W·(1 + r_eff) + S
 * where r_eff = realReturn − assetInflation (the real-return net of drag haircut).
 *
 * Convention rationale (RESEARCH §"Claude's Discretion"):
 *   End-of-year ordinary annuity is chosen specifically so the analytic golden-master
 *   reference (W0·(1+r)^n + S·((1+r)^n − 1)/r) stays exact and independent. D-10/D-11.
 *
 * PITFALLS compliance:
 *   P3 — drag haircut arrives pre-computed; this function never re-derives it
 *   P10 — r_eff = r − assetInflation is structured as small−small, not large−large
 *
 * @module tiers
 */

import type { Anchors, ReturnByTier } from './types.js';

// ---------------------------------------------------------------------------
// AnchorWealth type
// ---------------------------------------------------------------------------

/**
 * Current wealth at each of the 4 anchor percentile tiers (real terms).
 * Matches the structure of YearSnapshot.anchorWealth for direct assignment.
 */
export interface AnchorWealth {
  median: number;
  top10: number;
  top1: number;
  top01: number;
}

// ---------------------------------------------------------------------------
// stepAnchorWealth
// ---------------------------------------------------------------------------

/**
 * Advance all 4 anchor-tier wealths by one year using the end-of-year ordinary-annuity
 * convention with an asset-price-inflation haircut applied once per tier.
 *
 * Per-tier compounding step:
 *   r_eff = realReturn_t − assetInflation    (small − small, PITFALLS P10)
 *   W'_t  = W_t · (1 + r_eff) + S            (end-of-year ordinary annuity, D-08)
 *
 * The savings contribution S is the same across all tiers (D-08: constant real savings).
 * This reflects the fact that each anchor represents a "representative agent" at that
 * wealth level, all contributing the same real savings S.
 *
 * INVARIANT: this function does NOT conserve wealth across tiers. Each tier grows
 * independently — the drag haircut reduces effective returns but does not transfer
 * any amount to or from other tiers. (Anti-Pattern 3 / D-12 non-conservation.)
 *
 * @param anchorWealth - Current-year wealth at each of the 4 anchor tiers.
 * @param returnByTier - Real return rates at each anchor tier (all basis='real').
 * @param assetInflation - Scalar drag haircut for this year (D-01/D-02).
 *   Applied once to every tier: r_eff = r_tier − assetInflation.
 * @param savings - Annual savings contribution in real terms (D-08; end-of-year).
 * @returns New wealth at each anchor tier after one year of compounding.
 */
export function stepAnchorWealth(
  anchorWealth: AnchorWealth,
  returnByTier: ReturnByTier,
  assetInflation: number,
  savings: number,
): AnchorWealth {
  // Helper: single-tier step W' = W·(1 + r_eff) + S
  // r_eff = r − assetInflation (structured small−small per PITFALLS P10)
  function step(w: number, r: number): number {
    const rEff = r - assetInflation;
    return w * (1 + rEff) + savings;
  }

  return {
    median: step(anchorWealth.median, returnByTier.median.value),
    top10: step(anchorWealth.top10, returnByTier.top10.value),
    top1: step(anchorWealth.top1, returnByTier.top1.value),
    top01: step(anchorWealth.top01, returnByTier.top01.value),
  };
}

// ---------------------------------------------------------------------------
// anchorWealthFromParams (initial wealth extractor)
// ---------------------------------------------------------------------------

/**
 * Extract the initial anchor wealth from the Params anchors at year 0.
 * Each anchor's value is the starting wealth for that tier.
 *
 * @param anchors - The 4 sourced anchor percentiles.
 * @returns Initial AnchorWealth for year 0.
 */
export function initialAnchorWealth(anchors: Anchors): AnchorWealth {
  return {
    median: anchors.median.value,
    top10: anchors.top10.value,
    top1: anchors.top1.value,
    top01: anchors.top01.value,
  };
}
