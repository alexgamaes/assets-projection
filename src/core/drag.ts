/**
 * drag.ts — Scalar asset-price-inflation haircut (D-01/D-02).
 *
 * The drag is a single scalar real-return haircut applied once per tier per year:
 *   assetInflation_n = dragStrength × (aggregate wealth-growth rate of the dynamic top set)
 *
 * Threat register T-03-ZS: NO transfer function exists here. This file may only COMPUTE
 * a scalar haircut — it must NEVER subtract one tier's gain from another's balance.
 * Non-conservation is a tested invariant (D-12, Plan 04).
 *
 * Code-review invariant: grep this file for 'anchorWealth' assignments — there must be none.
 * The only output is the scalar `assetInflation` (a number).
 *
 * PITFALLS compliance:
 *   P3 — drag applied exactly once per year (engine step 3, not also in return inputs)
 *   P4 — no finite-pie redistribution; non-conservation asserted in invariants.test.ts
 *   P10 — drag is r_eff = r - assetInflation (small-small), not computed as large-large diff
 *
 * @module drag
 */

// ---------------------------------------------------------------------------
// assetInflationFromTopGrowth (D-01/D-02 scalar haircut)
// ---------------------------------------------------------------------------

/**
 * Compute the asset-price-inflation haircut for a given year.
 *
 * Formula (D-02, linear):
 *   assetInflation = dragStrength × topSetGrowthRate
 *
 * Properties:
 *   - dragStrength = 0 → assetInflation = 0 (exact collapse to independent baseline, D-10)
 *   - Linear in dragStrength (D-02); no threshold or transfer function
 *   - Output is a SCALAR applied uniformly to all tiers (D-01: "applied once to every tier")
 *
 * INVARIANT (Anti-Pattern 3 / Pitfall 4): this function does NOT move wealth between tiers.
 * It returns only a scalar haircut rate; the engine applies it as r_eff = r − assetInflation.
 *
 * @param topSetGrowthRate - Aggregate wealth-growth rate of the dynamic top set (real, year n).
 *   This is the weighted-average real return of the top-set anchor(s), before the haircut.
 *   Computed in the engine as the growth rate of the top-set anchor wealth from year n to n+1.
 * @param dragStrength - Scalar drag coefficient ∈ [0, 1] (dimensionless; D-02).
 *   dragStrength = 0 → no drag; dragStrength = 1 → full top-set growth as haircut.
 * @returns Scalar asset-price-inflation haircut rate (non-negative for non-negative inputs).
 */
export function assetInflationFromTopGrowth(
  topSetGrowthRate: number,
  dragStrength: number,
): number {
  // D-02: linear scalar formula. Structurally simple — no transfer function.
  // PITFALLS P10: this is small × small (both args are rates/multipliers, not large balances).
  return dragStrength * topSetGrowthRate;
}
