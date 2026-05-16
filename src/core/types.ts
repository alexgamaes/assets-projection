/**
 * types.ts — Core type contracts for the assets-projection engine.
 *
 * Defines the branded nominal/real basis invariant, all parameter shapes,
 * and result structures. This is the authoritative export contract consumed
 * by all downstream plans (02/03/04).
 *
 * Pattern: Branded types (compile-time) + assertReal guard (runtime, testable).
 * Source: RESEARCH.md §"Pattern 2: Branded Basis Invariant"
 */

// ---------------------------------------------------------------------------
// Branded basis types (MODEL-05)
// ---------------------------------------------------------------------------

declare const BasisTag: unique symbol;

/** A number quantity that is expressed in real (inflation-adjusted, today's-money) terms. */
export type Real<T = number> = T & { readonly [BasisTag]: 'real' };

/** A number quantity that is expressed in nominal (not inflation-adjusted) terms. */
export type Nominal<T = number> = T & { readonly [BasisTag]: 'nominal' };

/** Cast a plain number to a Real-basis value. Use only at verified real-basis boundaries. */
export const asReal = (x: number): Real => x as Real;

/** Cast a plain number to a Nominal-basis value. */
export const asNominal = (x: number): Nominal => x as Nominal;

/**
 * Runtime basis guard — throws a descriptive error if the param is not real-basis.
 * Used at engine boundaries so a deliberate basis mismatch produces a testable failure.
 *
 * @throws Error with message "Basis violation in {ctx}: expected real, got {basis}"
 */
export function assertReal(p: { basis: 'real' | 'nominal' }, ctx: string): void {
  if (p.basis !== 'real') {
    throw new Error(`Basis violation in ${ctx}: expected real, got ${p.basis}`);
  }
}

// ---------------------------------------------------------------------------
// Parameter building blocks
// ---------------------------------------------------------------------------

/**
 * A single sourced parameter value.
 *
 * Phase-2-ready: synthetic placeholders use source:null; Phase 2 fills real citations.
 * All SourcedParams carry an explicit basis tag so assertReal() can be called at boundaries.
 */
export interface SourcedParam {
  /** The parameter value (plain number — basis declared separately). */
  value: number;
  /** Whether this value is real (inflation-adjusted) or nominal. */
  basis: 'real' | 'nominal';
  /** Citation string for empirically sourced values; null for synthetic placeholders. */
  source: string | null;
  /** Optional explanatory note. */
  note?: string;
}

// ---------------------------------------------------------------------------
// Wealth-percentile anchors & return rates
// ---------------------------------------------------------------------------

/**
 * The 4 wealth-percentile anchors.
 * Percentile semantics: median=p50, top10=p90, top1=p99, top01=p99.9
 */
export interface Anchors {
  /** p50 — median wealth anchor */
  median: SourcedParam;
  /** p90 — top-10% wealth anchor */
  top10: SourcedParam;
  /** p99 — top-1% wealth anchor */
  top1: SourcedParam;
  /** p99.9 — top-0.1% wealth anchor */
  top01: SourcedParam;
}

/**
 * Real return rates per wealth-percentile anchor tier.
 * All entries MUST have basis='real' (D-08; assertReal enforced at engine boundary).
 */
export interface ReturnByTier {
  median: SourcedParam;
  top10: SourcedParam;
  top1: SourcedParam;
  top01: SourcedParam;
}

// ---------------------------------------------------------------------------
// Engine parameter bag (injected, never fetched)
// ---------------------------------------------------------------------------

/**
 * Full parameter object passed to the projection engine.
 * Core never fetches or imports params — they are always injected by the caller.
 *
 * CONTEXT.md decisions:
 *   D-08: savings is real (constant in today's-money).
 *   D-09: horizon ≤ 60 years (document; engine must support up to 60).
 *   D-07: distributionEvolution switch; 'endogenous' (default) or 'fixed-shape-scaled'.
 */
export interface Params {
  /** The 4 wealth-percentile calibration anchors. */
  anchors: Anchors;
  /** Real return rates per tier (all basis='real'). */
  returnByTier: ReturnByTier;
  /**
   * Scalar drag-strength coefficient (D-02).
   * dragStrength=0 ⇒ no asset-price-inflation haircut (independent per-tier baseline).
   * Must be basis='real' (dimensionless multiplier applied to a real-return quantity).
   */
  dragStrength: SourcedParam;
  /**
   * Projection horizon in years. Maximum 60 (D-09).
   * Plain number — no basis tag needed for an integer year count.
   */
  horizon: number;
  /**
   * How the distribution curve evolves over time (D-07).
   * 'endogenous': re-fit the lognormal+Pareto curve each year to the 4 evolved anchor points (D-06).
   * 'fixed-shape-scaled': calibrate shape once at year 0, then shift/scale by aggregate growth.
   */
  distributionEvolution: 'endogenous' | 'fixed-shape-scaled';
  /**
   * Annual savings contribution, constant in real (today's-money) terms (D-08).
   * Must be basis='real'.
   */
  savings: SourcedParam;
}

// ---------------------------------------------------------------------------
// User inputs (minimal two-field entry point)
// ---------------------------------------------------------------------------

/**
 * User-supplied entry inputs.
 * Plain numbers at the UI boundary — basis enforcement happens at the engine boundary
 * via assertReal on the Params that use them.
 */
export interface Inputs {
  /** User's current wealth in real (today's-money) terms. */
  currentWealth: number;
  /** User's annual savings in real (today's-money) terms. */
  annualSavings: number;
}

// ---------------------------------------------------------------------------
// Result shapes
// ---------------------------------------------------------------------------

/**
 * Snapshot of the wealth distribution and user position at a single year.
 * Used to build the full time series in ProjectionResult.
 */
export interface YearSnapshot {
  /** Year index (0 = starting year). */
  year: number;
  /** Wealth at each of the 4 anchor percentile tiers (real terms). */
  anchorWealth: {
    median: number;
    top10: number;
    top1: number;
    top01: number;
  };
  /** User's projected wealth (real terms). */
  userWealth: number;
  /**
   * User's estimated wealth percentile in the distribution at this year (0–100).
   * Derived by inverting the calibrated lognormal+Pareto curve.
   */
  userPercentile: number;
  /**
   * The percentile cutoff of the dynamic top set at this year (D-03).
   * The "top set" is the smallest fraction whose cumulative wealth ≥ 50% of total.
   * E.g. 90 means the top 10% hold ≥50% of total wealth; 99 means the top 1% do.
   */
  topSetPercentile: number;
  /**
   * Asset-price-inflation haircut applied to all tiers this year (D-01/D-02).
   * Equals dragStrength × (aggregate wealth-growth rate of the dynamic top set).
   * Zero when dragStrength=0.
   */
  assetInflation: number;
}

/**
 * Full engine output for one (inputs, params) call.
 */
export interface ProjectionResult {
  /** Year-by-year snapshots from year 0 to params.horizon (inclusive). */
  series: YearSnapshot[];
  /**
   * Derived relative-position series (one entry per year).
   * userShare: user's wealth as a fraction of total distribution wealth.
   * userRank: user's percentile rank (0–100, higher = wealthier).
   */
  relativePosition: Array<{ year: number; userShare: number; userRank: number }>;
}
