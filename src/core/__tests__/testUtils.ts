/**
 * testUtils.ts — Shared test utilities for the assets-projection engine.
 *
 * Exports:
 *   - relErr: the ONE documented relative-error helper (D-11 criterion: relErr < 1e-9)
 *   - analyticOrdinaryAnnuity: independent textbook closed form (MUST NOT import engine code)
 *   - DIST_TOL: documented tolerance for distribution-math tests (RESEARCH Open Question 2)
 *   - makeSyntheticParams: synthetic round-number Params builder (synthetic SourceRecord placeholders per D-12)
 *   - syntheticInputs: obviously-synthetic Inputs fixture
 *
 * PITFALLS compliance:
 *   P2 — no hardcoded "18" anywhere (Fagereng "~18pp" gap is a Phase 2 concern; synthetic
 *         anchors use obviously-round values).
 */
import type { Inputs, Params, SourceRecord, SourcedParam } from '../types.js';

// ---------------------------------------------------------------------------
// Tolerance constants
// ---------------------------------------------------------------------------

/**
 * Relative-error tolerance for distribution-curve math (lognormal / Pareto CDF/quantile).
 * Looser than the annuity golden-master criterion because hand-rolled erf achieves ~1e-7
 * absolute accuracy, not 1e-9.
 *
 * Source: RESEARCH.md Open Question 2 (resolved) — two-tolerance scheme: <1e-9 for the
 * drag-off annuity golden master (D-11), <1e-6 for distribution-curve tests.
 */
export const DIST_TOL = 1e-6;

// ---------------------------------------------------------------------------
// Relative-error helper (D-11)
// ---------------------------------------------------------------------------

/**
 * Relative error between actual and expected values.
 * The ONE documented tolerance helper — D-11 criterion is relErr(actual, expected) < 1e-9.
 *
 * Formula: |actual - expected| / max(|expected|, 1e-12)
 * The 1e-12 floor prevents division-by-zero when expected ≈ 0.
 *
 * Source: RESEARCH.md §"Don't Hand-Roll" (one shared relErr helper, not ad-hoc epsilons).
 */
export function relErr(actual: number, expected: number): number {
  return Math.abs(actual - expected) / Math.max(Math.abs(expected), 1e-12);
}

// ---------------------------------------------------------------------------
// Analytic golden-master reference (D-10/D-11)
// ---------------------------------------------------------------------------

/**
 * Independent textbook closed form for the end-of-year ordinary-annuity future value.
 *
 * Convention (Claude's Discretion — CONTEXT.md): end-of-year ordinary annuity:
 *   W_{n+1} = W_n · (1 + r) + S
 * This exactly matches the engine's compounding step so the drag-off single-tier path
 * can be compared bit-for-bit to this formula at <1e-9 relative error (D-11).
 *
 * Formula:
 *   FV = W0·(1+r)^n + (r === 0 ? S·n : S·((1+r)^n − 1)/r)
 *
 * MUST NOT import from src/core/engine or any other engine module (D-10: reference that
 * shares the engine's loop structure can share its bug — the golden master must be independent).
 *
 * Source: standard time-value-of-money formulae (compound interest + ordinary annuity).
 *   [CITED: standard financial math; see RESEARCH.md §"Don't Hand-Roll"]
 *
 * @param W0 - Initial wealth at year 0 (real terms)
 * @param r  - Real return rate per year (e.g. 0.05 for 5%)
 * @param S  - Annual savings contribution in real terms (end-of-year)
 * @param n  - Number of years to project
 */
export function analyticOrdinaryAnnuity(W0: number, r: number, S: number, n: number): number {
  const growth = Math.pow(1 + r, n);
  const annuity = r === 0 ? S * n : (S * (growth - 1)) / r;
  return W0 * growth + annuity;
}

// ---------------------------------------------------------------------------
// Synthetic fixture helpers
// ---------------------------------------------------------------------------

/**
 * A synthetic-but-type-valid SourceRecord for use in test fixtures (D-12 compliant).
 *
 * The type no longer allows null (D-10); D-12 permits synthetic citations in fixtures —
 * the Wave D sourcing-completeness gate targets only the production module (src/data/defaults.ts),
 * not the test fixture tree. These values are obviously synthetic (no real paper uses
 * "synthetic" as sourceName); they satisfy the SourceRecord shape without being real citations.
 *
 * PITFALLS P2: no literal "18" in any string below.
 */
export const SYNTH_SOURCE_RECORD = {
  sourceName: 'synthetic',
  figureUsed: 'synthetic fixture value',
  basis: 'real' as const,
  definition: 'synthetic test fixture — not a real citation',
  yearVintage: 'n/a (synthetic)',
  retrievedDate: 'n/a (synthetic)',
} as const;

/** Helper to build a synthetic SourcedParam with a synthetic-but-type-valid SourceRecord. */
export function synParam(value: number, basis: 'real' | 'nominal' = 'real', note?: string): SourcedParam {
  return { value, basis, source: { ...SYNTH_SOURCE_RECORD, basis }, note };
}

/**
 * Build obviously-synthetic Params for tests.
 * All values are round numbers chosen to be unambiguously synthetic (not from any paper).
 * PITFALLS P2: no value "18" anywhere — Fagereng's "~18pp gap" must not leak into fixtures.
 *
 * Default synthetic values:
 *   - anchors: median=50_000, top10=300_000, top1=2_000_000, top01=15_000_000
 *   - returnByTier: median=0.02, top10=0.04, top1=0.07, top01=0.12
 *   - dragStrength: 0.30
 *   - horizon: 60 (max supported per D-09)
 *   - distributionEvolution: 'endogenous'
 *   - savings: 1000 (real terms, end-of-year ordinary annuity)
 *
 * @param overrides - Partial Params to override individual fields.
 */
export function makeSyntheticParams(overrides: Partial<Params> = {}): Params {
  const defaults: Params = {
    anchors: {
      median: synParam(50_000, 'real', 'synthetic p50 anchor'),
      top10: synParam(300_000, 'real', 'synthetic p90 anchor'),
      top1: synParam(2_000_000, 'real', 'synthetic p99 anchor'),
      top01: synParam(15_000_000, 'real', 'synthetic p99.9 anchor'),
    },
    returnByTier: {
      median: synParam(0.02, 'real', 'synthetic 2% real return'),
      top10: synParam(0.04, 'real', 'synthetic 4% real return'),
      top1: synParam(0.07, 'real', 'synthetic 7% real return'),
      top01: synParam(0.12, 'real', 'synthetic 12% real return'),
    },
    dragStrength: synParam(0.30, 'real', 'synthetic drag coefficient'),
    horizon: 60,
    distributionEvolution: 'endogenous',
    savings: synParam(1000, 'real', 'synthetic annual savings in real terms'),
  };

  return { ...defaults, ...overrides };
}

/**
 * Obviously-synthetic Inputs fixture.
 * Pairs with makeSyntheticParams() for engine-level tests.
 */
export const syntheticInputs: Inputs = {
  currentWealth: 100_000,
  annualSavings: 1_000,
};
