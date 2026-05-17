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
 * Structured citation record for a single empirical figure (D-10).
 *
 * Replaces the freeform `string | null` placeholder in SourcedParam.source.
 * Every shipped SourcedParam must carry a complete SourceRecord — the six
 * required fields make the citation auditable and machine-checkable by the
 * Wave D sourcing-completeness gate. The optional `note` and `url` fields
 * carry the correction trail and Phase 3 VIZ-06 footer link respectively.
 *
 * This is an authoritative export contract consumed by Phases 3 and 4 (D-10).
 * Reuses the `'real' | 'nominal'` union for `basis` so it stays consistent
 * with `assertReal()` and the engine's branded-basis vocabulary (A2).
 */
export interface SourceRecord {
  /** Full citation: author(s), year, and publication. E.g. "Fagereng et al. (2020), Econometrica". */
  sourceName: string;
  /** The exact figure taken from the source, including units. E.g. "net-of-tax 10pp 10th→90th net-worth association". */
  figureUsed: string;
  /** Whether the cited figure is real (inflation-adjusted) or nominal — reuses the engine's branded union (D-10/A2). */
  basis: 'real' | 'nominal';
  /** Population scope, percentile definition, gross/net treatment, and time period — guards against mis-defined parameters (Pitfall 1). */
  definition: string;
  /** Data vintage: the observation period of the underlying data. E.g. "Norway admin records, 2004–2015". */
  yearVintage: string;
  /** ISO date the figure was read from the primary source. E.g. "2026-05-16". */
  retrievedDate: string;
  /**
   * Optional correction trail or methodological caveat (D-06).
   * Carries the discarded-estimate explanation (e.g. why a misread cross-percentile
   * association was replaced by a per-tier return estimate) and survivorship/geo-vs-arith notes.
   */
  note?: string;
  /** Optional primary-source URL. Rendered in the Phase 3 VIZ-06 citation footer. */
  url?: string;
}

/**
 * A single sourced parameter value.
 *
 * Phase-2-ready: source is a structured SourceRecord (D-10) replacing the
 * former `string | null` placeholder. All SourcedParams carry an explicit
 * basis tag so assertReal() can be called at boundaries.
 */
export interface SourcedParam {
  /** The parameter value (plain number — basis declared separately). */
  value: number;
  /** Whether this value is real (inflation-adjusted) or nominal. */
  basis: 'real' | 'nominal';
  /** Structured citation record (D-10). Every SourcedParam must carry a complete SourceRecord. */
  source: SourceRecord;
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
// Calibrated distribution curve (structural mirror)
// ---------------------------------------------------------------------------

/**
 * Structural shape of a calibrated lognormal+Pareto curve.
 *
 * This MUST stay structurally identical to the `Curve` interface declared in
 * `distribution.ts`. It is duplicated here (rather than imported) deliberately:
 * `distribution.ts` imports `Anchors`/`ReturnByTier` from this module, so an
 * `import type { Curve }` the other direction would create a types↔distribution
 * import cycle. A pure structural mirror keeps the dependency graph acyclic
 * while letting `YearSnapshot` carry the engine's per-year curve (G1 fix).
 */
export interface CurveShape {
  lognormal: { mu: number; sigma: number };
  pareto: { alpha: number; xm: number };
  /** The percentile at which the body transitions to the tail. */
  stitchQuantile: number;
  /** Total expected wealth E[X] of the combined distribution. */
  totalWealth: number;
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
   * User's estimated wealth position in the distribution at this year,
   * expressed as a cumulative-density fraction in [0, 1] (0 = poorest,
   * 1 = richest) — NOT a 0–100 percentile. This is the raw `percentileOf`
   * CDF value the engine compounds against (`returnAtPercentile` expects
   * the same [0, 1] domain). Consumers wanting a conventional 0–100
   * percentile must multiply by 100 (see `relativePosition.ts`, which
   * derives `userRank = userPercentile * 100`).
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
  /**
   * The engine's calibrated lognormal+Pareto curve for THIS year (G1 fix).
   *
   * The engine maintains a valid, continuously-evolving curve every year: it
   * `calibrateCurve`s when the anchor ratios are in-domain and falls back to
   * `shiftScaleCurve` (fixed-shape scaled shift) when endogenous evolution
   * drives the Pareto tail index alpha ≤ 1 (CR-02). Persisting this curve lets
   * `deriveBandShares` (VIZ-07 Chart 4 / Chart 5) read per-year Lorenz band
   * shares off the SAME evolving curve the rest of the engine uses, instead of
   * independently re-calibrating from anchors and freezing on calibration
   * failure (root cause of debug session `chart4-not-stacking`).
   *
   * Optional so legacy/synthetic snapshots constructed in tests remain valid;
   * `deriveBandShares` falls back to anchor re-calibration when absent.
   */
  curve?: CurveShape;
  /**
   * True when this year's curve came from the `shiftScaleCurve` fallback rather
   * than a fresh `calibrateCurve` (endogenous out-of-domain, CR-02 alpha ≤ 1).
   * The bands are still valid and evolving (shift-scale preserves the curve
   * shape), but the underlying anchors are outside the calibration domain — the
   * donut surfaces this as an explicit degraded state instead of asserting a
   * precise concentration claim (CR-01 / WR-05).
   */
  curveDegraded?: boolean;
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
