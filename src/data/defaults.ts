/**
 * defaults.ts — Frozen, citation-annotated default parameter set.
 *
 * DATA-01 / D-04 / D-05 / D-06: Every shipped SourcedParam carries a complete
 * SourceRecord tracing to a primary-source table-level definition. Per-tier return
 * anchors are triangulated central/midpoint estimates across the corrected literature.
 *
 * Calibration decisions:
 *   D-04: Central/midpoint triangulated estimate per tier; source records the drawn-from range.
 *   D-05: Fagereng's corrected ~10pp net-of-tax net-worth-percentile ASSOCIATION sizes the
 *         median→top GRADIENT only (qualitative justification). Per-tier LEVELS are
 *         triangulated from Bach 2020 (systematic risk / leverage channel), Saez-Zucman
 *         (top-tail private equity), and JST 2019 (long-run real asset-class returns).
 *         No confusing numeral appears anywhere (the discarded gross-of-tax association figure
 *         described in notes without the confusing numeral).
 *   D-06: Each anchor's note records the discarded gross-of-tax association misreading
 *         and why it was replaced by a per-tier triangulated estimate.
 *   D-03: alpha precondition verified below. Chosen anchors: top01/top1 = 30M/5M = 6.0
 *         → alpha = ln(10)/ln(6.0) ≈ 1.2851 > 1. CR-02 guard in calibrateCurve will
 *         throw loudly if a future edit violates this.
 *   D-07/D-08: dragStrength is a provisional placeholder. The actual value is derived by
 *         back-solving the engine against the McKinsey ~80% asset-inflation-share target
 *         in calibration.test.ts (Plan 04). The value here is marked as provisional in
 *         its note; Plan 04 freezes the back-solved constant.
 *
 * Architecture boundary (HARD): this module MUST NOT be imported by src/core/*.
 * It is injected into the engine by tests/composition root only. The import-boundary
 * scan in invariants.test.ts enforces this at CI time.
 *
 * alpha > 1 verification (D-03):
 *   top01.value = 30_000_000, top1.value = 5_000_000
 *   ratio = 30_000_000 / 5_000_000 = 6.0  (<10 → satisfies D-03)
 *   alpha = Math.log(10) / Math.log(6.0) ≈ 1.2851  (>1 → Pareto mean is defined)
 *
 * Sources: DATA-01, DATA-02, DATA-03, D-04, D-05, D-06, D-07, D-08, D-10, D-11
 */

import type { Params, SourcedParam } from '../core/types.js';
import { SOURCES } from './sources.js';

// ---------------------------------------------------------------------------
// D-03 precondition documentation (alpha > 1)
// ---------------------------------------------------------------------------
//
// Chosen wealth anchors (real USD, ~2019–2020 era):
//   median = 120_000   (SCF 2019 US median net worth ~$121k, real 2020 dollars)
//   top10  = 1_000_000 (SCF 2019 top-10% threshold ~$1.0–1.2M; midpoint conservative)
//   top1   = 5_000_000 (SCF 2019 top-1% threshold ~$5M; midpoint of $5–7M range)
//   top01  = 30_000_000(Saez-Zucman top-0.1% threshold ~$25–40M; conservative midpoint)
//
// alpha = Math.log(10) / Math.log(top01 / top1)
//       = Math.log(10) / Math.log(30_000_000 / 5_000_000)
//       = Math.log(10) / Math.log(6.0)
//       ≈ 2.3026 / 1.7918
//       ≈ 1.2851  > 1  ✓  (D-03 satisfied)
//
// The CR-02 guard in calibrateCurve() will throw if any future edit
// causes top01/top1 ≥ 10 (alpha ≤ 1).

// ---------------------------------------------------------------------------
// Shared correction-trail note fragment (D-06)
// ---------------------------------------------------------------------------
// Referenced in every anchor's note to provide the discarded-misreading trail.
// Describes the discarded figure WITHOUT the numeral that caused confusion
// so the scoped grep gate `! grep -rn '\b18\b' src/core src/data` passes.
const FAGERENG_CORRECTION_TRAIL =
  'D-06 correction trail: the PROJECT.md shorthand described Fagereng\'s ' +
  'gross-of-tax net-worth-percentile association (the larger association figure) ' +
  'as a "per-tier return gap" — this misreading inflates the gradient by ' +
  'roughly 2× and was corrected in this phase. The correct interpretation: ' +
  'the raw cross-sectional 10th–90th return SPREAD is ~500bp (~5pp); ' +
  'the net-of-tax net-worth-percentile ASSOCIATION (~10pp) is qualitative ' +
  'gradient justification only, NOT a per-tier rate. Per-tier levels are ' +
  'triangulated from Bach 2020, Saez-Zucman, and JST (see sources.ts).';

// ---------------------------------------------------------------------------
// DEFAULTS — frozen Params with complete SourceRecord per shipped value
// ---------------------------------------------------------------------------

export const DEFAULTS: Params = Object.freeze({
  // -------------------------------------------------------------------------
  // anchors — wealth-level calibration points for the lognormal+Pareto curve
  //
  // D-04: Central/midpoint estimates triangulated across SCF (median/top10/top1)
  // and Saez-Zucman capitalization estimates (top01). Conservative ends chosen
  // where D-04 leaves latitude (Pitfall 4 survivorship adjustment).
  // -------------------------------------------------------------------------
  anchors: Object.freeze({
    median: Object.freeze({
      value: 120_000,
      basis: 'real' as const,
      source: Object.freeze({
        sourceName:
          'Federal Reserve Survey of Consumer Finances (SCF) 2019; ' +
          'Federal Reserve Distributional Financial Accounts (DFA) 2020',
        figureUsed:
          'US median household net worth ≈ $121k (SCF 2019, 2019 dollars); ' +
          'adjusted to ~$120k real (2020 dollars) for calibration midpoint',
        basis: 'real' as const,
        definition:
          'US household survey (SCF 2019): median of net-worth distribution; ' +
          'net worth = total assets − total liabilities at market value; ' +
          'real (2019/2020 dollars); all US households; ' +
          'SCF wealth concept includes financial assets, home equity, business equity',
        yearVintage: 'US SCF 2019 survey (2019 dollars)',
        retrievedDate: '2026-05-16',
        note:
          'D-04 range: SCF 2019 reports US median net worth ~$121k; ' +
          'DFA Q4-2019 reports ~$100k (different coverage/methodology). ' +
          'Midpoint of $100k–$130k range → $115k–$120k; chose $120k (midpoint of SCF-anchored range). ' +
          FAGERENG_CORRECTION_TRAIL,
        url: 'https://www.federalreserve.gov/publications/2020-bulletin-changes-in-us-family-finances-2016-2019.htm',
      }),
    }),

    top10: Object.freeze({
      value: 1_000_000,
      basis: 'real' as const,
      source: Object.freeze({
        sourceName:
          'Federal Reserve Survey of Consumer Finances (SCF) 2019; ' +
          'Saez & Zucman (2016/2019) capitalization estimates',
        figureUsed:
          'US p90 net-worth threshold ≈ $1.0M (SCF 2019, 2019 dollars); ' +
          'Saez-Zucman capitalization consistent with ~$1.0–1.2M for p90',
        basis: 'real' as const,
        definition:
          'US households at the 90th percentile of the net-worth distribution; ' +
          'net worth = total assets − total liabilities; ' +
          'real (2019/2020 dollars); SCF survey estimate + Saez-Zucman capitalization cross-check',
        yearVintage: 'US SCF 2019 + Saez-Zucman estimates ~2016–2019',
        retrievedDate: '2026-05-16',
        note:
          'D-04 range: SCF 2019 p90 threshold ~$1.0–1.2M; conservative end chosen ' +
          '($1.0M) consistent with Saez-Zucman capitalization and Pitfall 7 caution. ' +
          FAGERENG_CORRECTION_TRAIL,
        url: 'https://www.federalreserve.gov/publications/2020-bulletin-changes-in-us-family-finances-2016-2019.htm',
      }),
    }),

    top1: Object.freeze({
      value: 5_000_000,
      basis: 'real' as const,
      source: Object.freeze({
        sourceName:
          'Federal Reserve Survey of Consumer Finances (SCF) 2019; ' +
          'Saez & Zucman (2019) "The Triumph of Injustice"',
        figureUsed:
          'US p99 net-worth threshold ≈ $5M (SCF 2019/Saez-Zucman midpoint, 2019 dollars)',
        basis: 'real' as const,
        definition:
          'US households at the 99th percentile of the net-worth distribution; ' +
          'net worth at market value; real (2019/2020 dollars); ' +
          'SCF survey estimate triangulated with Saez-Zucman capitalization method',
        yearVintage: 'US SCF 2019 + Saez-Zucman ~2016–2019',
        retrievedDate: '2026-05-16',
        note:
          'D-04 range: SCF 2019 p99 threshold ~$5–7M depending on survey vintage; ' +
          'Saez-Zucman capitalization suggests ~$5M (conservative); chose $5M (lower bound ' +
          'of range, conservative per Pitfall 7 and D-04 midpoint of SCF-anchored range). ' +
          'alpha check: top01/top1 = 30M/5M = 6.0 → alpha ≈ 1.285 > 1 (D-03). ' +
          FAGERENG_CORRECTION_TRAIL,
        url: 'https://gabriel-zucman.eu/files/SaezZucman2016QJE.pdf',
      }),
    }),

    top01: Object.freeze({
      value: 30_000_000,
      basis: 'real' as const,
      source: Object.freeze({
        sourceName:
          'Saez & Zucman (2016/2019/2020) capitalization estimates; ' +
          'Federal Reserve Distributional Financial Accounts (DFA)',
        figureUsed:
          'US p99.9 net-worth threshold ≈ $25–40M (Saez-Zucman); midpoint $30M (real 2019 dollars)',
        basis: 'real' as const,
        definition:
          'US households at the 99.9th percentile of the net-worth distribution; ' +
          'net worth at market value (includes private business equity, unrealized gains); ' +
          'real (2019/2020 dollars); Saez-Zucman capitalization method (captures private-equity ' +
          'and unrealized gains that SCF undersamples at top tail)',
        yearVintage: 'US Saez-Zucman capitalization ~2016–2018',
        retrievedDate: '2026-05-16',
        note:
          'D-04 range: Saez-Zucman p99.9 threshold ~$25–40M in 2016–2019 depending on year. ' +
          'Midpoint of range → $30M chosen. Conservative relative to upper range end. ' +
          'alpha check: top01/top1 = 30_000_000/5_000_000 = 6.0 → ' +
          'alpha = Math.log(10)/Math.log(6.0) ≈ 1.2851 > 1 (D-03 satisfied). ' +
          'Saez-Zucman capitalization contested (Bricker et al. alternative); used here ' +
          'as best available estimate for the top-0.1% threshold. ' +
          FAGERENG_CORRECTION_TRAIL,
        url: 'https://gabriel-zucman.eu/files/SaezZucman2016QJE.pdf',
      }),
    }),
  }),

  // -------------------------------------------------------------------------
  // returnByTier — real return rates per wealth-percentile tier
  //
  // D-04/D-05: Triangulated central estimates. Fagereng's corrected ~10pp
  // net-of-tax net-worth-percentile ASSOCIATION (gradient justification) is
  // qualitatively consistent with the 9.5pp spread (12% - 2.5% = 9.5pp)
  // chosen here. Per-tier LEVELS from Bach 2020, Saez-Zucman, JST 2019.
  //
  // All values are real (inflation-adjusted), geometric mean basis (Pitfall 5).
  // -------------------------------------------------------------------------
  returnByTier: Object.freeze({
    median: Object.freeze({
      value: 0.025,
      basis: 'real' as const,
      source: Object.freeze({
        ...SOURCES.jst2019,
        figureUsed:
          'Conservative end of JST 2019 real housing/bond-mix return (~2–3% real); ' +
          'median household holds mixed portfolio (home equity, savings bonds, deposits); ' +
          'adjusted -0.5pp for survivorship bias (Pitfall 7, JST Appendix)',
        definition:
          'Median US household: primarily housing equity and bank deposits/bonds; ' +
          'return reflects weighted mix of JST housing (~6.9% real) and bonds/cash (~2.5%/1%); ' +
          'real, geometric mean; generalized (not Norway-specific; Fagereng gradient used ' +
          'qualitatively only); estimated for a median-wealth household portfolio mix',
        note:
          'D-04 range: PROJECT.md indicative band median ~2–3% real. ' +
          'Chose 2.5% = conservative end of range (JST bond-mix + Pitfall 7 -0.5pp adjustment). ' +
          'Median households hold ~60% housing equity, ~40% financial assets at conservative returns. ' +
          'JST geometric mean used per Pitfall 5 (deterministic path). ' +
          FAGERENG_CORRECTION_TRAIL,
      }),
    }),

    top10: Object.freeze({
      value: 0.045,
      basis: 'real' as const,
      source: Object.freeze({
        ...SOURCES.jst2019,
        figureUsed:
          'Midpoint of 4–5% real band: JST equity real geometric ~6.9% minus Pitfall 7 ' +
          'survivorship -0.5pp minus portfolio-mix discount (~2pp for non-equity holdings); ' +
          'consistent with Bach 2020 systematic-risk premium at p90',
        definition:
          'Top-10% US household (p90 net worth): equity-tilted portfolio with higher ' +
          'systematic-risk exposure than median (Bach 2020 mechanism); ' +
          'real, geometric mean; generalized cross-country calibration; ' +
          'returns net of fees, gross of personal tax (pre-tax basis, consistent with JST)',
        note:
          'D-04 range: PROJECT.md indicative band top 10% ~4–5% real. ' +
          'Chose 4.5% = midpoint of range. ' +
          'JST full-equity real return ~6.9%; adjusted -0.5pp survivorship (Pitfall 7) + ' +
          '-1.9pp portfolio-mix discount (top-10% household not 100% equity). ' +
          'Bach 2020 confirms higher systematic-risk exposure at p90 vs median. ' +
          'Geometric mean basis (Pitfall 5). ' +
          FAGERENG_CORRECTION_TRAIL,
      }),
    }),

    top1: Object.freeze({
      value: 0.07,
      basis: 'real' as const,
      source: Object.freeze({
        ...SOURCES.jst2019,
        figureUsed:
          'Midpoint of 6–9% real band: JST equity real geometric ~6.9% minus Pitfall 7 ' +
          '-0.5pp + Bach leverage premium at p99; consistent with near-pure-equity portfolio ' +
          'with moderate leverage',
        definition:
          'Top-1% US household (p99 net worth): near-equity portfolio with leverage ' +
          '(Bach 2020 mechanism dominant at p99+); ' +
          'real, geometric mean; generalized cross-country calibration; ' +
          'consistent with Saez-Zucman concentrated equity + private-business exposure',
        note:
          'D-04 range: PROJECT.md indicative band top 1% ~6–9% real. ' +
          'Chose 7.0% = lower-middle of range (conservative per Pitfall 7). ' +
          'JST full-equity real geometric ~6.9% is the level anchor; Bach leverage premium ' +
          'at p99 adds ~0.5–1pp; Pitfall 7 -0.5pp survivorship adjustment → net ~7%. ' +
          'Geometric mean basis (Pitfall 5). ' +
          FAGERENG_CORRECTION_TRAIL,
      }),
    }),

    top01: Object.freeze({
      value: 0.12,
      basis: 'real' as const,
      source: Object.freeze({
        ...SOURCES.saezZucman,
        figureUsed:
          'Conservative end of 10–15%+ real band: Saez-Zucman top-0.1% returns ' +
          'driven by private-business-equity gains + leverage (Bach 2020); ' +
          'chose 12% as conservative lower-middle of range',
        definition:
          'Top-0.1% US household (p99.9 net worth): heavily weighted to private business ' +
          'equity and leveraged assets (Saez-Zucman: unrealized private-equity gains dominant); ' +
          'real, geometric mean approximation; ' +
          'Saez-Zucman capitalization (contested but best available for top-0.1%)',
        note:
          'D-04 range: PROJECT.md indicative band top 0.1% ~10–15%+ real. ' +
          'Chose 12.0% = conservative lower-middle of range (avoids upper end where ' +
          'survivorship and measurement bias are largest). ' +
          'Saez-Zucman private-equity premium over public markets primary level anchor; ' +
          'Bach 2020 leverage channel qualitative confirmation. ' +
          'Gradient check: top01 - median = 12.0% - 2.5% = 9.5pp, ' +
          'qualitatively consistent with Fagereng corrected ~10pp net-of-tax association. ' +
          'Geometric mean approximation (private equity returns often stated as IRR; ' +
          'geometric mean may understate slightly). ' +
          FAGERENG_CORRECTION_TRAIL,
      }),
    }),
  }),

  // -------------------------------------------------------------------------
  // dragStrength — asset-price-inflation drag coefficient
  //
  // D-07/D-08/D-09: This value is a PROVISIONAL PLACEHOLDER pending the
  // Plan 04 back-solve procedure. The actual value will be derived by running
  // the engine over a 2000–2021-like baseline and choosing dragStrength so the
  // model's asset-inflation share of net-worth growth ≈ McKinsey ~80%.
  //
  // The placeholder 0.0 is used here (drag=0 → independent per-tier compounding
  // baseline, safe for Plan 03 tests). Plan 04 calibration.test.ts will
  // freeze the back-solved constant and update this value.
  // -------------------------------------------------------------------------
  dragStrength: Object.freeze({
    // D-07/D-08: back-solved constant. Derived by running the engine over the calibrated
    // DEFAULTS as a 2000–2021-like baseline and bisect-solving for the dragStrength such
    // that the model's cumulative asset-inflation share of net-worth growth ≈ McKinsey ~80%.
    // See calibration.test.ts (Plan 04) for the reproducible back-solve procedure.
    // The ~1.3× asset/GDP ratio is explicitly NOT the calibration target (D-08 exclusion).
    // Formula for share: Σ_year[totalAnchorWealth(year-1) × assetInflation(year)] /
    //                    (totalAnchorWealth(horizon) − totalAnchorWealth(0))
    value: 0.2094998675, // back-solved from McKinsey ~80% target against the Closure-A corrected model (D-07/D-08)
    basis: 'real' as const,
    source: Object.freeze({
      ...SOURCES.mckinsey2023,
      figureUsed:
        'McKinsey ~80% asset-inflation share of 2000–2021 net-worth growth ' +
        '(back-solve target; ~1/5 from new saving/investment) — NOT the ~1.3× asset/GDP ratio (D-08)',
      note:
        'D-07/D-08 BACK-SOLVED VALUE: this constant (0.2094998675) was derived by ' +
        'running projectionEngine on the calibrated DEFAULTS (anchors, returnByTier, savings, ' +
        'horizon=35 — the 2000–2021-like baseline, O-2) and bisect-solving for dragStrength ' +
        'such that the model\'s asset-inflation share of net-worth growth ≈ 0.80. ' +
        'Share formula (O-1, D-08): ' +
        'Σ_year[totalAnchorWealth(year-1) × assetInflation(year)] / ' +
        '(totalAnchorWealth(horizon) − totalAnchorWealth(0)). ' +
        'This maps to McKinsey "share of net-worth growth from asset-price inflation" ' +
        '(~80% for 2000–2021 advanced economies; ~1/5 from new saving/investment). ' +
        'The ~1.3× asset/GDP ratio is explicitly NOT the calibration target (D-08 exclusion). ' +
        'RECALIBRATION NOTE (debug session model-alpha-domain-freeze, maintainer ' +
        'decision LOCKED): this value was RE-DERIVED against the Closure-A ' +
        'net-growth-floor corrected engine model. The cited McKinsey ~80% target ' +
        'is UNCHANGED — only the back-solve OUTPUT changed because dragStrength is ' +
        'a derived constant coupled to the engine dynamics, and the Closure-A floor ' +
        '(which bounds the runaway top01/top1 tail ratio and pins the body-relative ' +
        'ratios so the lognormal+Pareto curve stays in the CR-02/CR-01 calibration ' +
        'domain for all horizons) changes the per-year asset-inflation trajectory. ' +
        'The PRIOR value (0.4325757739) was back-solved against the pre-Closure-A ' +
        'model whose endogenous evolution left the calibratable domain by ~year 11 ' +
        '(the freeze defect this session resolved). Re-deriving against the corrected ' +
        'model is the legitimate, documented update per the maintainer decision; the ' +
        'sourced TARGET (McKinsey 80%) was not loosened or changed. ' +
        'Reproducible: calibration.test.ts back-solves this value and asserts ' +
        'assetInflationShare(0.2094998675) ≈ 0.80 and value ≈ solved to 4 decimal places. ' +
        'McKinsey source: "The rise and rise of the global balance sheet" (2021).',
    }),
  }),

  // -------------------------------------------------------------------------
  // horizon — projection horizon in years (UX default, not DATA-04-scoped)
  //
  // ENTRY-03 band: ~30–40 years. Chose 35 = midpoint.
  // Plain number (no SourceRecord needed — UX default, not an empirical param).
  // -------------------------------------------------------------------------
  horizon: 35,

  // -------------------------------------------------------------------------
  // distributionEvolution — default curve-evolution mode
  //
  // 'endogenous': re-fit the lognormal+Pareto curve each year to the 4 evolved
  // anchor points. The engine fallback in engine.ts handles cases where extreme
  // long-horizon evolution causes top01/top1 to exceed 10 (alpha ≤ 1) by
  // falling back to shiftScaleCurve (Plan 01 deviation WR-01).
  // -------------------------------------------------------------------------
  distributionEvolution: 'endogenous' as const,

  // -------------------------------------------------------------------------
  // savings — annual savings contribution, real terms (UX default)
  //
  // Chose $6,000/year real: approximate median annual household savings rate
  // applied to median household income (~$70k × ~8–9% savings rate ≈ $5.6–6.3k).
  // This is a UX default, not a primary-literature sourced figure (DATA-04
  // does not apply; ENTRY-03 / D-12 discretion). SourceRecord notes this.
  // -------------------------------------------------------------------------
  savings: Object.freeze({
    value: 6_000,
    basis: 'real' as const,
    source: Object.freeze({
      sourceName: 'UX default — not a primary-literature sourced parameter',
      figureUsed:
        'Approximate median annual household savings: ' +
        'median household income ~$70k × ~8–9% personal savings rate ≈ $5.6–6.3k/year; ' +
        'rounded to $6,000/year real (2020 dollars)',
      basis: 'real' as const,
      definition:
        'Annual household savings in real (today\'s money) terms; ' +
        'constant contribution model (ordinary annuity, end-of-year); ' +
        'UX default for the two-input entry experience; user overrides are expected; ' +
        'D-12 discretion: this is a UX default, not a DATA-04-scoped empirical parameter',
      yearVintage: 'UX default (2020 dollars)',
      retrievedDate: '2026-05-16',
      note:
        'DATA-04 / D-12: this is a UX default (ENTRY-03 "start playable with two inputs"), ' +
        'not a primary-literature sourced figure. No calibration claim is made. ' +
        'BLS Personal Savings Rate 2019: US personal savings rate ~7.6%; ' +
        'median household income ~$68k (Census 2019) → ~$5.2–6.1k/year savings. ' +
        'Chose $6,000/year as a round, representative UX starting point. ' +
        'Users are expected to override this with their actual savings amount.',
    }),
  }),
} satisfies Params);

// ---------------------------------------------------------------------------
// SEED_WEALTH — UX default for the "current wealth" entry (D-02 / ENTRY-01)
//
// Exported separately from DEFAULTS because Params does not include a seedWealth
// field (DEFAULTS satisfies Params and TypeScript rejects extra properties on
// exact-match satisfies). SEED_WEALTH is imported directly by the store (Task 3)
// and by Plan 02 selectors. It is NOT in the sourcing-completeness gate (which
// only walks DEFAULTS — see sourcing.test.ts enumerateSourcedParams).
//
// SourceRecord fields are inlined here (not imported from SOURCES) because
// importing SOURCES would create a circular dependency via defaults.ts already
// importing from sources.ts above. The field values MUST match the scf2022
// entry added to SOURCES so the two are citation-consistent.
// ---------------------------------------------------------------------------

/**
 * UX seed default for the current wealth input (D-02).
 *
 * Based on US median family net worth from SCF 2022 ($192,900), rounded up
 * to $200,000 as a representative starting point for the two-input experience.
 * Not a DATA-04-scoped empirical model parameter — a UX default only.
 */
export const SEED_WEALTH: SourcedParam = Object.freeze({
  value: 200_000,
  basis: 'real' as const,
  source: Object.freeze({
    sourceName: 'Federal Reserve Board — Survey of Consumer Finances 2022 (SCF 2022)',
    figureUsed: 'Median family net worth $192,900 (2022 survey dollars)',
    basis: 'real' as const,
    definition:
      'US median family net worth; all families, 2022 survey; nominal 2022 dollars; ' +
      'rounded up to $200,000 as a UX seed default per D-02',
    yearVintage: '2022 survey data (published September 2023)',
    retrievedDate: '2026-05-16',
    note:
      'UX default seed for current wealth entry; not a calibrated model parameter ' +
      '(DATA-04 does not apply). SCF 2022 median family net worth = $192,900; ' +
      'rounded up to $200,000 for the two-input start experience (D-02). ' +
      'Source: federalreserve.gov/publications/files/scf23.pdf Table 2.',
    url: 'https://www.federalreserve.gov/publications/files/scf23.pdf',
  }),
});

// ---------------------------------------------------------------------------
// INFLATION_RATE — fixed long-run CPI-U rate for nominal re-inflation (D-07)
//
// Exported separately from DEFAULTS because Params does not include an
// inflationRate field. INFLATION_RATE is consumed by Plan 02 selectors
// (selectReinflated) — NOT a user control in v1; v2 CONFIG-01 may expose it.
//
// SourceRecord fields are inlined here (not imported from SOURCES) to avoid
// circular dependency — same pattern as SEED_WEALTH above. Values match the
// blsCpiLongRun entry in SOURCES for citation consistency.
// ---------------------------------------------------------------------------

/**
 * Fixed long-run CPI-U inflation rate for nominal re-inflation display (D-07).
 *
 * Long-run BLS CPI-U geometric mean ~2.9% (1926–2022); using 2.5% as a
 * conservative post-1990-adjusted anchor. Not a user control in v1.
 */
export const INFLATION_RATE: SourcedParam = Object.freeze({
  value: 0.025,
  basis: 'nominal' as const,
  source: Object.freeze({
    sourceName: 'US Bureau of Labor Statistics — CPI-U long-run geometric mean (1926–2022)',
    figureUsed:
      'Long-run geometric mean annual CPI-U change approximately 2.9% (1926–2022) — ' +
      'rounded to 2.5% as a conservative long-run anchor',
    basis: 'nominal' as const,
    definition:
      'US Consumer Price Index for All Urban Consumers (CPI-U, all items); ' +
      'long-run geometric average annual rate 1926–2022; ' +
      'fixed display-only rate for nominal re-inflation selector (D-07); ' +
      'not a user control (v2 CONFIG-01)',
    yearVintage: '1926–2022 long-run average',
    retrievedDate: '2026-05-16',
    note:
      'UX display default for nominal re-inflation (D-07 / selectReinflated); fixed for v1. ' +
      'Long-run CPI-U geometric mean ~2.9% (1926–2022); using 2.5% as a slightly conservative ' +
      'anchor that better reflects the post-1990 disinflationary period while remaining ' +
      'well-cited. Source: BLS CPI data series CUUR0000SA0. ' +
      'Money-illusion caption (D-09) cites this rate and source name.',
    url: 'https://www.bls.gov/cpi/data.htm',
  }),
});
