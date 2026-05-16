/**
 * summaryFormatters.ts — pure framework-free display formatters for the SummaryReadout.
 *
 * D-14: formatRankDelta always pairs the rank delta with the wealth-growth clause.
 *       The rank numbers (p75 → p71) must NEVER appear without the growth multiple.
 * D-09: formatMoneyIllusionCaption returns a non-empty string only when basis === 'nominal'.
 *       Returns '' for 'real' so the caller can safely use `{caption && <p>{caption}</p>}`.
 *
 * No React imports. No store imports. Pure TypeScript — testable in Vitest without jsdom.
 */

/**
 * formatRankDelta — D-14 rank-delta + wealth-growth pairing.
 *
 * Returns a single indivisible string containing both the rank delta and the
 * wealth-growth clause. The "while real wealth grew X×" clause is mandatory and
 * must appear in the same string as the rank positions. This invariant is enforced
 * here at the pure-function level so SummaryReadout cannot accidentally split them.
 *
 * @param startRank  - relativePosition[0].userRank (0–100)
 * @param endRank    - relativePosition[last].userRank (0–100)
 * @param growthMultiple - summary.growthMultiple (end / start wealth)
 */
export function formatRankDelta(
  startRank: number,
  endRank: number,
  growthMultiple: number,
): string {
  return (
    `Distribution position: p${startRank.toFixed(0)} → p${endRank.toFixed(0)}, ` +
    `while real wealth grew ${growthMultiple.toFixed(1)}×.`
  );
}

/**
 * formatMoneyIllusionCaption — D-09 nominal-only money-illusion disclosure.
 *
 * Returns an empty string when basis === 'real' so callers can use the truthiness
 * pattern: `{caption && <p>{caption}</p>}` — nothing renders in the real-basis case.
 *
 * @param basis              - active display basis ('real' | 'nominal')
 * @param inflationRate      - decimal rate, e.g. 0.025 for 2.5%
 * @param inflationSourceName - SourceRecord.sourceName from INFLATION_RATE.source
 */
export function formatMoneyIllusionCaption(
  basis: 'real' | 'nominal',
  inflationRate: number,
  inflationSourceName: string,
): string {
  if (basis === 'real') return '';
  return (
    `These figures are not adjusted for inflation. ` +
    `They assume a fixed ${(inflationRate * 100).toFixed(1)}% annual inflation rate ` +
    `(${inflationSourceName}). Switch to Real for inflation-adjusted amounts.`
  );
}
