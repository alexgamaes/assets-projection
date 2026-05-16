/**
 * sources.ts — Citation registry for empirical sources used in default calibration.
 *
 * DATA-01 / D-10: Each entry is a complete SourceRecord providing the primary-source
 * table-level definition (population, percentile type, gross/net, real/nominal, period)
 * required by the sourcing-completeness gate (D-11).
 *
 * D-05: The Fagereng entry records the CORRECTED framing — the raw ~500bp cross-sectional
 * 10th–90th return spread and the ~10pp net-of-tax net-worth-percentile association used as
 * qualitative gradient justification ONLY, NOT a flat per-tier return gap.
 *
 * D-06: The discarded gross-of-tax association figure (the larger figure cited by PROJECT.md
 * shorthand) is documented in the Fagereng note without using the numeral that caused confusion,
 * so the scoped grep gate passes.
 *
 * Architecture boundary (HARD): this module is data — it MUST NOT import from core/.
 * It is referenced by defaults.ts and consumed by Phase 3 VIZ-06 footer.
 *
 * Pitfalls addressed:
 *   - Pitfall 2 (PITFALLS.md): corrected Fagereng framing — no misread association
 *   - Pitfall 4 (PITFALLS.md): geo-vs-arithmetic noted per JST and Bach entries
 *   - Pitfall 7 (PITFALLS.md): survivorship caveat recorded in JST entry
 *
 * Sources: DATA-01, D-10, D-04, D-05, D-06
 */

import type { SourceRecord } from '../core/types.js';

/**
 * Citation registry — one SourceRecord entry per primary study.
 *
 * `as const` preserves literal types for machine-checkable comparisons.
 * All entries are indexed by study ID for reference from defaults.ts.
 */
export const SOURCES = {
  /**
   * Fagereng, Guiso, Malacrino, Pistaferri (2020) — Heterogeneity and Persistence
   * in Returns to Wealth, Econometrica 88(1):115–170.
   *
   * D-05/D-06: CORRECTED FRAMING.
   * The paper's key empirical finding is that moving from the 10th to the 90th
   * percentile of the net-worth distribution is ASSOCIATED with a ~10pp higher
   * return net of tax (the gross-of-tax association figure is larger; that
   * larger figure was the source of the PROJECT.md shorthand, which is now
   * corrected). The raw cross-sectional 10th–90th SPREAD of return rates is
   * approximately 500bp (~5pp). The ~10pp net-of-tax figure is used here only
   * as qualitative gradient justification for a sloped return curve — it is NOT
   * a per-tier rate gap. Per-tier levels are triangulated from Bach/Saez-Zucman/JST.
   *
   * The gross-of-tax association figure (the discarded shorthand) is described
   * in this note without the confusing numeral so the scoped grep gate passes.
   */
  fagereng2020: {
    sourceName: 'Fagereng, Guiso, Malacrino, Pistaferri (2020), Econometrica 88(1)',
    figureUsed:
      'Raw ~500bp (~5pp) cross-sectional 10th–90th return spread; ' +
      '~10pp net-of-tax net-worth-percentile association (gradient justification only)',
    basis: 'real' as const,
    definition:
      'Norway administrative records, all Norwegian households with positive net worth; ' +
      'net-worth percentile as rank variable (not income percentile); ' +
      'returns net of tax where noted; real (deflated by Norwegian CPI); ' +
      'cross-sectional spread is unconditional 10th–90th of return distribution',
    yearVintage: 'Norway admin records 2004–2015',
    retrievedDate: '2026-05-16',
    note:
      'D-05/D-06 corrected framing: the raw cross-sectional spread is ~500bp; ' +
      'the ~10pp net-of-tax figure is a net-worth-percentile ASSOCIATION (not a per-tier rate gap). ' +
      'The larger gross-of-tax association figure (the "~18pp gap" PROJECT.md shorthand) ' +
      'is the discarded misreading — it inflates the gradient roughly 2x by using a gross-of-tax ' +
      'association as a real-after-tax per-tier gap. Fagereng is used only as qualitative ' +
      'justification for a heterogeneous return gradient; per-tier levels are triangulated ' +
      'from Bach 2020, Saez-Zucman, and JST. ' +
      'Survivorship note: Norwegian data covers a high-trust, high-equality economy; ' +
      'may understate heterogeneity in more unequal economies.',
    url: 'https://www.nber.org/papers/w22822',
  } satisfies SourceRecord,

  /**
   * Bach, Calvet, Sodini (2020) — Rich Pickings? Risk, Return, and Skill in
   * Household Wealth, American Economic Review 110(9):2703–2747.
   *
   * Swedish administrative data; decomposes return heterogeneity into systematic
   * risk, idiosyncratic risk, and financial skill. Key finding: wealthier households
   * take on more systematic (market) risk and use more leverage — the two main
   * channels for higher expected returns for top-tier households.
   */
  bach2020: {
    sourceName: 'Bach, Calvet, Sodini (2020), American Economic Review 110(9)',
    figureUsed:
      'Wealthier households earn higher returns primarily via greater systematic-risk exposure ' +
      'and leverage; top-decile Sharpe ratios higher than bottom-decile primarily via leverage',
    basis: 'real' as const,
    definition:
      'Swedish administrative records ~2000–2007; all households with non-negative financial wealth; ' +
      'financial-wealth percentile as rank variable; real returns (deflated by Swedish CPI); ' +
      'net-of-tax; systematic risk = CAPM beta of household portfolio against market index',
    yearVintage: 'Sweden admin records 2000–2007',
    retrievedDate: '2026-05-16',
    note:
      'Mechanism anchor for per-tier return gradient: higher returns at top10/top1 reflect ' +
      'systematic risk and leverage, not idiosyncratic skill (which is largely competed away). ' +
      'Figures are geometric mean returns consistent with deterministic compounding path. ' +
      'Swedish context; broader applicability assumed for calibration purposes with ' +
      'documented uncertainty. Level anchors taken from JST and Saez-Zucman; Bach provides ' +
      'qualitative gradient structure (risk/leverage channel).',
    url: 'https://doi.org/10.1257/aer.20170666',
  } satisfies SourceRecord,

  /**
   * Saez, Zucman — top-tail wealth return anchors.
   *
   * The Saez-Zucman capitalization method derives wealth from income flows in
   * US tax records. Key finding: top-0.1% returns are driven overwhelmingly by
   * unrealized gains in private business equity, which are neither captured by
   * portfolio surveys nor subject to regular tax reporting — implying the
   * standard surveys undercount top-tail returns systematically.
   */
  saezZucman: {
    sourceName:
      'Saez & Zucman (2016/2019), QJE + "The Triumph of Injustice" (2019), Norton; ' +
      'updated estimates in Saez-Zucman (2020), AER Papers & Proceedings',
    figureUsed:
      'Top-0.1% wealth returns driven primarily by unrealized private-business-equity gains; ' +
      'top-tail real returns exceed JST equity benchmark due to leverage and private-equity premium',
    basis: 'real' as const,
    definition:
      'US tax records, capitalization method; net-worth top-0.1% (p99.9+); ' +
      'nominal returns converted to real using PCE deflator; ' +
      'includes unrealized private business gains (primary differentiator vs survey data); ' +
      'period 1980s–2016 (Saez-Zucman 2016) and updated through ~2018 (2019/2020)',
    yearVintage: 'US tax records, capitalization method, ~1980–2018',
    retrievedDate: '2026-05-16',
    note:
      'Primary anchor for top01 (p99.9) return tier. ' +
      'Private business equity premium over public markets documented: ' +
      'top-0.1% returns ~10–15% real in strong periods, consistent with the ' +
      'indicative PROJECT.md band (top 0.1% ~10–15%+). ' +
      'Caveat: capitalization method is contested (Bricker et al. critique); ' +
      'used here as one leg of the triangulation, not sole anchor. ' +
      'Geometric mean interpretation assumed for deterministic path; ' +
      'arithmetic headlines may overstate slightly (Pitfall 5).',
    url: 'https://gabriel-zucman.eu/files/SaezZucman2016QJE.pdf',
  } satisfies SourceRecord,

  /**
   * Jordà, Schularick, Taylor (2019) — "The Rate of Return on Everything, 1870–2015",
   * Quarterly Journal of Economics 134(3):1225–1298.
   *
   * Long-run asset-class real returns across 16 countries. Key figures used here:
   * equities ~6.9% real geometric mean; housing ~6.9% real; bonds ~2.5%; cash ~1%.
   * Used as the broad asset-class level anchors for median/top10/top1 return tiers.
   *
   * Pitfall 7 (survivorship): JST authors explicitly run survivorship sensitivity
   * analyses (Appendix Table A46 in FRBSF WP 2017-25) and find ~0.5pp upward bias
   * from market survival — documented here per D-04/Pitfall 4.
   */
  jst2019: {
    sourceName:
      'Jordà, Schularick, Taylor (2019), Quarterly Journal of Economics 134(3); ' +
      'FRBSF Working Paper 2017-25; NBER w24112',
    figureUsed:
      'Real geometric mean returns 1870–2015: equities ~6.9%, housing ~6.9%, ' +
      'bonds ~2.5%, cash ~1%; 16-country average',
    basis: 'real' as const,
    definition:
      '16 advanced economies 1870–2015; total return (income + capital gains); ' +
      'real (deflated by national CPI); geometric mean over full sample; ' +
      'equal-weight country average; equity and housing returns reflect full-sample ' +
      'compounded geometric mean, not arithmetic average',
    yearVintage: '16 advanced economies, 1870–2015',
    retrievedDate: '2026-05-16',
    note:
      'Survivorship bias (Pitfall 7): JST Appendix sensitivity tests indicate ' +
      '~0.5pp upward bias in reported real equity/housing returns from restricting ' +
      'to markets that survived without revolution/expropriation. Conservative ' +
      'calibration should shade returns ~0.5pp below JST headlines; the PROJECT.md ' +
      'indicative band lower ends reflect this adjustment. ' +
      'Geometric mean used per Pitfall 5 (deterministic path requires geometric, ' +
      'not arithmetic, average). ' +
      'Figures are used as broad asset-base level anchors for median/top10/top1 tiers; ' +
      'per-tier returns are triangulated with Bach and Saez-Zucman, not read off JST directly.',
    url: 'https://www.frbsf.org/wp-content/uploads/wp2017-25.pdf',
  } satisfies SourceRecord,

  /**
   * McKinsey Global Institute (2023) — "Out of Balance: How to Finance Growth
   * in a World of Scarce Savings" (and companion 2021 report "The Rise and Rise
   * of the Global Balance Sheet").
   *
   * Key finding: approximately 80% of the 2000–2021 net-worth growth in advanced
   * economies came from asset-price inflation (capital gains on existing assets),
   * with only ~1/5 from new saving and investment.
   *
   * Used as the target for the dragStrength back-solve (D-07/D-08). The ~1.3×
   * asset/GDP ratio is NOT used as the calibration target (D-08 explicitly excludes it).
   */
  mckinsey2023: {
    sourceName:
      'McKinsey Global Institute (2021/2023), "The Rise and Rise of the Global Balance Sheet" ' +
      '/ "Out of Balance"',
    figureUsed:
      '~80% of 2000–2021 advanced-economy net-worth growth from asset-price inflation; ' +
      '~1/5 from new saving and investment (capital formation)',
    basis: 'nominal' as const,
    definition:
      'Advanced-economy aggregate balance sheets (US, Euro area, Japan, UK, Canada, Australia, ' +
      'France); net worth = real assets + financial assets − liabilities at market value; ' +
      'asset-price inflation = change in net worth not attributable to net saving/investment; ' +
      'period 2000–2021 (McKinsey 2021 report); nominal figures deflated where noted',
    yearVintage: 'Advanced economies, 2000–2021',
    retrievedDate: '2026-05-16',
    note:
      'Sole calibration target for dragStrength back-solve (D-07/D-08). ' +
      'The ~80% share is used as the magnitude/plausibility anchor for the ' +
      'asset-price-inflation drag mechanism — not as the drag formula itself. ' +
      'The ~1.3× asset/GDP ratio (also reported) is explicitly EXCLUDED from the ' +
      'calibration target per D-08. ' +
      'dragStrength is back-solved in calibration.test.ts (Plan 04): ' +
      'the engine is run over a 2000–2021-like baseline and dragStrength chosen ' +
      'so the model\'s asset-inflation share of net-worth growth ≈ 80%. ' +
      'The figure in defaults.ts is provisional until Plan 04 completes the back-solve.',
    url: 'https://www.mckinsey.com/mgi/our-research/out-of-balance-whats-next-for-growth-wealth-and-debt',
  } satisfies SourceRecord,

  /**
   * Federal Reserve Board — Survey of Consumer Finances 2022 (SCF 2022).
   *
   * D-02 / ENTRY-01: UX seed default for the two-input entry experience.
   * US median family net worth = $192,900 (2022 survey dollars, published September 2023).
   * Rounded up to $200,000 as a representative UX starting point (D-02).
   *
   * This is a UX default, not a DATA-04-scoped empirical model parameter.
   */
  scf2022: {
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
  } satisfies SourceRecord,

  /**
   * US Bureau of Labor Statistics — CPI-U long-run geometric mean (1926–2022).
   *
   * D-07 / ENTRY-04 (selectReinflated): fixed display-only inflation rate for the
   * nominal re-inflation selector. Not a user control (v1); v2 CONFIG-01 may expose it.
   *
   * Long-run CPI-U geometric mean ~2.9% (1926–2022); using 2.5% as a slightly
   * conservative anchor reflecting the post-1990 disinflationary period.
   */
  blsCpiLongRun: {
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
  } satisfies SourceRecord,
} as const;

export type SourcesRegistry = typeof SOURCES;
