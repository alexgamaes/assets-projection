/**
 * invariants.test.ts — MODEL-01 + MODEL-04
 *
 * MODEL-01: core/ source files (non-test) must import ZERO framework/DOM/fetch/Date.now/
 *   Math.random/document/window APIs. Implemented as a filesystem read + regex scan over
 *   the source text (the test file itself may use node APIs; the scan targets non-test sources).
 *
 * MODEL-04 invariants (D-12, Plans 03/04):
 *   drag=0 ⇒ independent per-tier baseline; non-conservation; infinite-growth preserved;
 *   monotone relative divergence.
 *
 * All four highest-severity correctness pitfalls addressed here:
 *   P3 — drag=0 collapse + drag-applied-once (no double-count)
 *   P4 — non-conservation / no zero-sum transfer
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { projectionEngine } from '../engine.js';
import { analyticOrdinaryAnnuity, relErr, makeSyntheticParams, synParam, syntheticInputs } from './testUtils.js';
import { DEFAULTS } from '../../data/defaults.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect all .ts files under a directory recursively, excluding __tests__ subdirs. */
function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const st = statSync(fullPath);
    if (st.isDirectory()) {
      if (entry === '__tests__') continue; // skip test dirs
      files.push(...collectSourceFiles(fullPath));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Pattern that must NOT appear in core/ source files (non-test).
const FORBIDDEN_PATTERN =
  /\breact\b|\breact-dom\b|from ['"]fs|from ['"]node:|fetch\s*\(|Date\.now\b|Math\.random\b|document\.|window\./;

/** Sum all 4 anchor tier wealths in a snapshot. */
function sumAnchors(anchorWealth: { median: number; top10: number; top1: number; top01: number }): number {
  return anchorWealth.median + anchorWealth.top10 + anchorWealth.top1 + anchorWealth.top01;
}

// ---------------------------------------------------------------------------
// MODEL-01: Import boundary (framework-free core)
// ---------------------------------------------------------------------------
describe('MODEL-01: core/ is framework-free and deterministic', () => {
  it('core source files contain zero framework/DOM/fetch/Date.now/Math.random imports', () => {
    // Resolve path relative to this test file's location
    const coreDir = new URL('../..', import.meta.url).pathname;
    // coreDir points to src/core; ensure only files directly under core/ (not __tests__)
    const sources = collectSourceFiles(coreDir);

    const violations: { file: string; line: number; text: string }[] = [];

    for (const file of sources) {
      const lines = readFileSync(file, 'utf-8').split('\n');
      lines.forEach((text: string, idx: number) => {
        if (FORBIDDEN_PATTERN.test(text)) {
          violations.push({ file, line: idx + 1, text: text.trim() });
        }
      });
    }

    expect(
      violations,
      `core/ source files must not import framework/DOM/fetch/Date.now/Math.random.\nViolations:\n${violations
        .map(v => `  ${v.file}:${v.line}: ${v.text}`)
        .join('\n')}`
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// MODEL-04: D-12 invariant battery
// ---------------------------------------------------------------------------
describe('MODEL-04 invariants (drag coupling)', () => {
  // D-12 / PITFALLS P3 (drag double-count check):
  // dragStrength=0 must collapse each tier to the independent analytic annuity baseline.
  // The engine's drag formula is: assetInflation = dragStrength × topGrowthRate.
  // With dragStrength=0: assetInflation=0 for every year → r_eff = r − 0 = r → exact baseline.
  // Any double-counting of drag would break this invariant.
  it('dragStrength=0 collapses each tier to the independent analytic ordinary-annuity baseline (<1e-9 relErr)', () => {
    // Use default 60-year horizon so any FP drift is caught too
    const params = makeSyntheticParams({ dragStrength: synParam(0) });
    const result = projectionEngine(syntheticInputs, params);
    const finalSnap = result.series.at(-1)!;

    // Expected: each tier matches analyticOrdinaryAnnuity(W0_tier, r_tier, savings, horizon)
    // W0 and r from makeSyntheticParams defaults; savings=1000; horizon=60
    const tierData = [
      { key: 'median' as const, W0: 50_000, r: 0.02 },
      { key: 'top10' as const, W0: 300_000, r: 0.04 },
      { key: 'top1' as const, W0: 2_000_000, r: 0.07 },
      { key: 'top01' as const, W0: 15_000_000, r: 0.12 },
    ];
    const savings = 1_000;
    const horizon = 60;

    for (const { key, W0, r } of tierData) {
      const expected = analyticOrdinaryAnnuity(W0, r, savings, horizon);
      const actual = finalSnap.anchorWealth[key];
      const err = relErr(actual, expected);
      expect(err, `dragStrength=0 ${key} tier relErr should be <1e-9; got ${err.toExponential(3)}`).toBeLessThan(1e-9);
    }
  });

  // D-12 / PITFALLS P4 (zero-sum / non-conservation check):
  // Non-conservation: aggregate real wealth grows, not conserved, across multiple drag values.
  // This asserts the drag is a haircut on returns, NOT a transfer between tiers.
  //
  // dragStrength=0.3: all 4 anchor tiers compound at reduced-but-positive returns for 5 years.
  // dragStrength=0.6: all 4 anchor tiers compound at reduced returns for 5 years.
  // In BOTH cases: total aggregate wealth must exceed year-0 total (growth, not conservation).
  //
  // "No transfer" assertion: sum of tier gains is non-zero in both directions (if drag were
  // redistribution, one tier's loss would exactly equal another's gain → net zero change).
  // Since both totals INCREASE, there is no zero-sum redistribution.
  it('aggregate real wealth is NOT conserved and grows with drag>0; no transfer between tiers', () => {
    // 5-year horizon to keep numbers readable (same anchor + return params as default)
    const baseParams = makeSyntheticParams({ horizon: 5 });

    const params03 = { ...baseParams, dragStrength: synParam(0.30) };
    const params06 = { ...baseParams, dragStrength: synParam(0.60) };

    const result03 = projectionEngine(syntheticInputs, params03);
    const result06 = projectionEngine(syntheticInputs, params06);

    const totalY0 = sumAnchors(result03.series[0]!.anchorWealth);
    const total03 = sumAnchors(result03.series.at(-1)!.anchorWealth);
    const total06 = sumAnchors(result06.series.at(-1)!.anchorWealth);

    // Aggregate wealth must grow in both drag scenarios (non-conservation, Pitfall 4)
    expect(total03, 'dragStrength=0.3: aggregate must grow from year 0').toBeGreaterThan(totalY0);
    expect(total06, 'dragStrength=0.6: aggregate must grow from year 0').toBeGreaterThan(totalY0);

    // No tier's delta should cancel another's (no zero-sum): each tier grows independently.
    // We assert this by checking each tier individually — all should be >= year-0 wealth
    // (with drag=0.3 which is moderate; drag=0.6 may shrink the median due to low r_eff).
    const snap03 = result03.series.at(-1)!;
    const snap0 = result03.series[0]!;
    expect(snap03.anchorWealth.median).toBeGreaterThan(snap0.anchorWealth.median);
    expect(snap03.anchorWealth.top10).toBeGreaterThan(snap0.anchorWealth.top10);
    expect(snap03.anchorWealth.top1).toBeGreaterThan(snap0.anchorWealth.top1);
    expect(snap03.anchorWealth.top01).toBeGreaterThan(snap0.anchorWealth.top01);
  });

  // D-12 / PITFALLS P3 (infinite-growth preserved; no negative real wealth from drag alone):
  // No tier is forced to negative real wealth by drag alone.
  // The synthetic default params (dragStrength=0.30, 60y) are designed so even the
  // lowest-return tier (median, r=2%) has r_eff = 2% − drag > −100% → wealth stays positive.
  //
  // Computed: with drag=0.3 and top01 rate=12%, top-set growth rate ≈ 12%,
  // assetInflation ≈ 0.3 × 12% = 3.6%. Median r_eff = 2% − 3.6% = −1.6%.
  // But W_{n+1} = W_n · (1 − 1.6%) + savings. With savings=1000 > 0, the wealth
  // floor is savings / 1.6% ≈ 62,500 > 0. So the median stays positive.
  // This invariant ensures the drag never forces a tier into negative real wealth.
  it('no tier is forced to negative real wealth by drag alone (infinite-growth preserved)', () => {
    const params = makeSyntheticParams(); // default dragStrength=0.30, horizon=60
    const result = projectionEngine(syntheticInputs, params);

    for (const snap of result.series) {
      expect(snap.anchorWealth.median, `year ${snap.year} median must be positive`).toBeGreaterThan(0);
      expect(snap.anchorWealth.top10, `year ${snap.year} top10 must be positive`).toBeGreaterThan(0);
      expect(snap.anchorWealth.top1, `year ${snap.year} top1 must be positive`).toBeGreaterThan(0);
      expect(snap.anchorWealth.top01, `year ${snap.year} top01 must be positive`).toBeGreaterThan(0);
    }
  });

  // D-12 / Monotone relative divergence:
  // With drag ON, higher-return tiers compound at a net rate advantage over lower-return tiers
  // RELATIVE to their starting wealth. The top01/median wealth ratio should increase over time,
  // confirming wealth concentration divergence is preserved (not eliminated) by the drag model.
  //
  // This tests that drag does not accidentally equalize returns (which would be a zero-sum
  // redistribution masquerading as a haircut). The relative wealth ratio at year 60 must exceed
  // the year-0 ratio, across multiple drag levels.
  //
  // Note: Absolute gap (top01 − median) decreases with increasing drag because top01 has the
  // highest gross return and thus gets the largest absolute haircut. But the RELATIVE ratio
  // (top01/median) increases with drag, confirming the divergence story.
  it('drag-on relative wealth ratio (top01/median) diverges over time (monotone concentration)', () => {
    const horizon = 10; // shorter horizon for clarity
    for (const drag of [0.1, 0.2, 0.3]) {
      const params = makeSyntheticParams({
        horizon,
        dragStrength: synParam(drag),
      });
      const result = projectionEngine(syntheticInputs, params);

      const snap0 = result.series[0]!;
      const snapN = result.series.at(-1)!;

      const ratio0 = snap0.anchorWealth.top01 / snap0.anchorWealth.median;
      const ratioN = snapN.anchorWealth.top01 / snapN.anchorWealth.median;

      expect(
        ratioN,
        `drag=${drag}: top01/median ratio at year ${horizon} (${ratioN.toFixed(2)}) must exceed year-0 ratio (${ratio0.toFixed(2)}) — higher-return tier should diverge`,
      ).toBeGreaterThan(ratio0);
    }
  });
});

// ---------------------------------------------------------------------------
// D-09: D-12 invariant battery re-run on real DEFAULTS (Pitfall 4)
//
// Implements D-09: re-asserts the Phase 1 D-12 non-conservation / infinite-growth
// invariants on the real back-solved defaults. Proves that the back-solved calibration
// introduced no finite-pie/zero-sum artifact (Pitfall 4 / D-09).
//
// Only the params source changes (DEFAULTS instead of makeSyntheticParams()); the four
// invariant cases and the sumAnchors helper are reused unchanged.
// ---------------------------------------------------------------------------

/** Representative inputs for D-09 DEFAULTS-fed invariant tests. */
const defaultsInputs = {
  currentWealth: DEFAULTS.anchors.median.value, // start at the median anchor level
  annualSavings: DEFAULTS.savings.value,        // DEFAULTS savings baseline
};

describe('D-09: D-12 invariant battery re-run on real DEFAULTS (Pitfall 4)', () => {
  // Case 1: drag=0 collapse to independent per-tier baseline
  // D-09 invariant: when dragStrength is overridden to 0, each DEFAULTS anchor tier must
  // compound at its own return rate independently (no assetInflation haircut).
  // Checks P3 (no drag double-count) on the real anchor/return values.
  it('D-09 / drag=0: DEFAULTS with dragStrength=0 collapses to independent per-tier baseline (<1e-9 relErr)', () => {
    // Use a 10-year horizon: enough to detect any drift while keeping the numbers readable.
    // Full DEFAULTS horizon (35y) would trigger endogenous calibrateCurve fallback, which
    // is expected for long horizons (top01/top1 ratio growth causes alpha <= 1 after ~7y).
    // The drag=0 collapse invariant holds regardless of curve re-fit mode.
    const horizon = 10;
    const params = { ...DEFAULTS, dragStrength: synParam(0, 'real'), horizon };

    const result = projectionEngine(defaultsInputs, params);
    const finalSnap = result.series[result.series.length - 1];
    if (!finalSnap) throw new Error('expected series to have at least one entry');

    // Each tier must match the independent annuity formula at its own DEFAULTS anchor + return
    const tierData = [
      { key: 'median' as const, W0: DEFAULTS.anchors.median.value,  r: DEFAULTS.returnByTier.median.value },
      { key: 'top10' as const,  W0: DEFAULTS.anchors.top10.value,   r: DEFAULTS.returnByTier.top10.value  },
      { key: 'top1' as const,   W0: DEFAULTS.anchors.top1.value,    r: DEFAULTS.returnByTier.top1.value   },
      { key: 'top01' as const,  W0: DEFAULTS.anchors.top01.value,   r: DEFAULTS.returnByTier.top01.value  },
    ];
    const savings = DEFAULTS.savings.value;

    for (const { key, W0, r } of tierData) {
      const expected = analyticOrdinaryAnnuity(W0, r, savings, horizon);
      const actual = finalSnap.anchorWealth[key];
      const err = relErr(actual, expected);
      expect(
        err,
        `D-09 drag=0 ${key} relErr should be <1e-9; got ${err.toExponential(3)} (actual=${actual.toExponential(4)}, expected=${expected.toExponential(4)})`,
      ).toBeLessThan(1e-9);
    }
  });

  // Case 2: Non-conservation / no transfer (Pitfall 4)
  // D-09 invariant: with the back-solved dragStrength, aggregate real wealth must still grow
  // (drag is a return haircut, NOT a transfer between tiers — Pitfall 4).
  // Assertion: total anchor wealth grows from year 0 to year N (non-conservation),
  // and high-return tiers (top1, top01) individually grow (no zero-sum redistribution).
  // Note: median r_eff may be negative under DEFAULTS dragStrength (large haircut on low-return
  // tier); median wealth may decline over 5 years — this is expected, physically meaningful
  // behavior. The non-transfer assertion focuses on top1/top01 (positive r_eff) and aggregate
  // growth (total must increase — the economy as a whole grows even if median declines).
  it('D-09 / non-conservation: aggregate DEFAULTS anchor wealth grows with back-solved dragStrength; no tier-to-tier transfer (Pitfall 4)', () => {
    const horizon = 5;
    const params = { ...DEFAULTS, horizon };

    const result = projectionEngine(defaultsInputs, params);
    const snap0 = result.series[0];
    const snapN = result.series[result.series.length - 1];
    if (!snap0 || !snapN) throw new Error('expected non-empty series');

    const totalY0 = sumAnchors(snap0.anchorWealth);
    const totalYN = sumAnchors(snapN.anchorWealth);

    // Aggregate must grow (non-conservation / Pitfall 4 / D-09)
    expect(
      totalYN,
      `D-09 non-conservation: aggregate DEFAULTS wealth at year ${horizon} (${totalYN.toExponential(4)}) must exceed year-0 (${totalY0.toExponential(4)})`,
    ).toBeGreaterThan(totalY0);

    // High-return tiers must grow individually (non-zero-sum: no tier's gain sourced from another's loss)
    expect(
      snapN.anchorWealth.top1,
      'D-09 top1 must grow under DEFAULTS dragStrength (non-transfer assertion)',
    ).toBeGreaterThan(snap0.anchorWealth.top1);
    expect(
      snapN.anchorWealth.top01,
      'D-09 top01 must grow under DEFAULTS dragStrength (non-transfer assertion)',
    ).toBeGreaterThan(snap0.anchorWealth.top01);
  });

  // Case 3: No tier forced to negative real wealth by drag alone (infinite-growth preserved)
  // D-09 invariant: no tier at any year has strictly negative real wealth under DEFAULTS.
  // With DEFAULTS dragStrength~0.4326 and median r=2.5%, drag may make median r_eff < 0,
  // but with savings=6000/year, the wealth floor is > 0. We allow median to reach near 0
  // (asserting >= 0) while tiers with positive r_eff (top10/top1/top01) must stay > 0.
  it('D-09 / infinite-growth: no DEFAULTS anchor tier is forced to negative real wealth', () => {
    const result = projectionEngine(defaultsInputs, DEFAULTS);

    for (const snap of result.series) {
      // median may approach the floor (savings/|r_eff|) but must not go negative
      expect(snap.anchorWealth.median, `D-09 year ${snap.year} median must be >= 0`).toBeGreaterThanOrEqual(0);
      expect(snap.anchorWealth.top10, `D-09 year ${snap.year} top10 must be positive`).toBeGreaterThan(0);
      expect(snap.anchorWealth.top1, `D-09 year ${snap.year} top1 must be positive`).toBeGreaterThan(0);
      expect(snap.anchorWealth.top01, `D-09 year ${snap.year} top01 must be positive`).toBeGreaterThan(0);
    }
  });

  // Case 4: Monotone relative divergence on real DEFAULTS
  // D-09 invariant: the top01/median wealth ratio must increase over DEFAULTS horizon.
  // Confirms wealth concentration divergence is preserved under the real back-solved drag —
  // consistent with the Phase 1 synthetic battery (drag does not equalize returns).
  it('D-09 / monotone divergence: top01/median wealth ratio increases over DEFAULTS horizon', () => {
    const result = projectionEngine(defaultsInputs, DEFAULTS);

    const snap0 = result.series[0];
    const snapN = result.series[result.series.length - 1];
    if (!snap0 || !snapN) throw new Error('expected non-empty series');

    const ratio0 = snap0.anchorWealth.top01 / snap0.anchorWealth.median;
    const ratioN = snapN.anchorWealth.top01 / snapN.anchorWealth.median;

    expect(
      ratioN,
      `D-09 top01/median ratio at year ${DEFAULTS.horizon} (${ratioN.toFixed(2)}) must exceed year-0 ratio (${ratio0.toFixed(2)}) — wealth concentration must diverge`,
    ).toBeGreaterThan(ratio0);
  });
});
