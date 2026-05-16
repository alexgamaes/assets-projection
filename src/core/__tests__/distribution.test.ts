/**
 * distribution.test.ts — MODEL-02
 *
 * Tests for the lognormal+Pareto continuous wealth distribution:
 *   - CDF and quantile round-trip
 *   - cumulativeShareFromTop closed form vs hand-computed Pareto values
 *   - Calibration to the 4 anchor percentiles
 *   - Return-by-percentile interpolation (monotone: higher percentile → higher rate)
 *   - C0/C1 stitch continuity
 *
 * Tolerance: DIST_TOL = 1e-6 (RESEARCH Open Question 2 resolution — two-tolerance scheme)
 *
 * ALL tests are it.todo — filled by Plan 01-02 (distribution-calibration spike).
 * The file exists now so `npx vitest run` is runnable (MODEL-06 infra ready).
 */
import { describe, it } from 'vitest';

describe('MODEL-02: Continuous wealth distribution (lognormal + Pareto)', () => {
  it.todo(
    'calibrate: lognormal+Pareto curve passes through all 4 anchor percentiles (within DIST_TOL)'
  );

  it.todo(
    'quantile(cdf(w)) ≈ w for representative wealth values across the body and tail'
  );

  it.todo(
    'cumulativeShareFromTop(p) matches hand-computed Pareto top-share closed form for tail quantiles'
  );

  it.todo(
    'cumulativeShareFromTop is strictly monotone decreasing in p (smaller top fraction → more concentrated share)'
  );

  it.todo(
    'returnAtPercentile is strictly monotone non-decreasing (higher wealth percentile → higher or equal return rate)'
  );

  it.todo(
    'distribution CDF is C0-continuous at the lognormal/Pareto stitch point (no jump in value)'
  );

  it.todo(
    'distribution density is approximately C1-continuous at the stitch point (density jump below documented threshold)'
  );
});
