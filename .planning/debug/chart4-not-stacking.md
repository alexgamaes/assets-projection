---
slug: chart4-not-stacking
status: resolved
trigger: "Chart 4 'Share of total wealth by tier over time' does not render as a 100%-stacked area chart; bands draw as overlapping triangles that do not sum to 100% per horizon year"
phase: 04.1-tier-share-of-economy-visualization-at-the-end-of-the-projec
source_gap: 04.1-HUMAN-UAT.md#G1
created: "2026-05-17T01:00:00Z"
updated: "2026-05-17T02:30:00Z"
---

## Symptoms

- **Expected:** Chart 4 renders as a 100%-stacked area chart — the five band series (Bottom 50%, 50–90%, 90–99%, 99–99.9%, Top 0.1%) fill the full chart height at every horizon year, summing to exactly 100%.
- **Actual:** The five bands draw as independent overlapping translucent triangles that do not sum to 100% at each year. The "Top 0.1%" band pins at ~100% and stays flat; the others taper to zero by roughly year 60–140.
- **Error messages:** None surfaced — `deriveBandShares` in `src/core/tierBands.ts` has a bare `catch {}` that swallows `calibrateCurve` failures (code review 04.1-REVIEW.md CR-01/WR-04/WR-05).
- **Timeline:** Introduced in phase 04.1 (VIZ-07). Never worked correctly in the running app; automated tests passed because `tierBands.test.ts` only checks year 0 and a synthetic Pareto fixture, not the full horizon of a realistic projection.
- **Reproduction:** `npm run dev`, open the app with default inputs (~$200k), scroll to Chart 4 "Share of total wealth by tier over time". Bands render as overlapping triangles instead of a full-height 100% stack.
- **Related symptom (Chart 5 donut):** The end-of-horizon donut "Final-year wealth share by tier" looks identical regardless of the projection horizon/year — it does not show increasing wealth concentration over time as expected.

## Current Focus

hypothesis: CONFIRMED — `calibrateCurve` throws for the majority of horizon years (CR-02 alpha ≤ 1); the carry-forward fallback in `deriveBandShares` freezes band shares at the last-calibrated year, so bands stop evolving and the donut is horizon-invariant.
test: Instrumented `deriveBandShares`/`calibrateCurve` over realistic full-horizon projections (horizons 10/35/60/100, default inputs).
expecting: Many later horizon years throw in calibrateCurve; bands frozen after first failure.
next_action: RESOLVED — fix applied and tested.

## Evidence

- timestamp: 2026-05-17T02:00:00Z
  observation: |
    Instrumentation over default inputs (currentWealth=SEED_WEALTH, savings=$6k, distributionEvolution='endogenous'):
      horizon=10:  calibFails=0/11   finalTop01=0.8674
      horizon=35:  calibFails=25/36  firstFailYear=11  finalTop01=0.8674
      horizon=60:  calibFails=50/61  firstFailYear=11  finalTop01=0.8674
      horizon=100: calibFails=90/101 firstFailYear=11  finalTop01=0.8674
    badSumYears=0 in ALL cases — bands ALWAYS sum to 1.0 (normalization + carry-forward both preserve sum-to-1). The "not summing to 100%" symptom is a misdiagnosis; the real defect is FROZEN bands.
- timestamp: 2026-05-17T02:05:00Z
  observation: |
    top01/top1 anchor ratio drifts past 10 (alpha ≤ 1 → CR-02 guard throws) by ~year 11 at default settings:
      y0:  top01/top1=6.00   y17: 13.34   y35: 31.24   y60: 102.35   y100: 689.01
    From year 11 onward every BandShare is `{...prev, year}` — the year-10 curve (already pathologically concentrated, top01≈0.867) is carried forward unchanged for the rest of the horizon.
- timestamp: 2026-05-17T02:10:00Z
  observation: |
    Band evolution near the failure boundary (horizon=35): y8 top01=0.642, y9=0.744, y10=0.867, then y11..y35 ALL identically 0.867 (frozen). finalTop01=0.8674 is byte-identical for horizon 35/60/100 → donut cannot evolve with horizon.
- timestamp: 2026-05-17T02:12:00Z
  observation: |
    Donut center label is a SECOND independent manifestation: `last.topSetPercentile` clamps to 0.9999 (dynamicTopSetPercentile WR-01 boundary clamp) for every horizon → center always reads "Top 0.0% hold ≥50%" regardless of horizon.

## Eliminated

- ECharts `stack:'100%'` config: correct and not the defect (bands always sum to 1.0; ECharts faithfully renders the frozen near-degenerate distribution as a thin top sliver dominating the stack).
- Float-sum normalization in `computeBandFromCurve`: working correctly (badSumYears=0).
- Per-slice rounding in `selectDonutOption` (WR-02): real but cosmetic; not the cause of horizon-invariance.

## Resolution

root_cause: |
  Endogenous distribution evolution drives the top01/top1 anchor ratio past 10 (Pareto
  alpha ≤ 1) by ~year 11 at default settings, so `calibrateCurve` throws for ~70% of
  horizon years. `deriveBandShares` recalibrates from anchors *independently of the
  engine* and, on failure, carries forward the previous year's BandShare unchanged —
  freezing the band series at the last-calibrated (already pathologically concentrated,
  top0.1%≈87%) year. Chart 4 therefore shows a flat near-100% top band; Chart 5's slices
  are the frozen year-10 values (identical for every horizon) and its center label is the
  separately-clamped topSetPercentile (always "Top 0.0%"). The engine itself already
  maintains a *valid evolving* curve each year via `shiftScaleCurve`, but tierBands
  discarded it and recalibrated from scratch.
fix: |
  Persist the engine's already-valid evolving per-year curve summary on each YearSnapshot
  (`curveTotalWealth` plus the calibrated Curve via a new `curve` field), and have
  `deriveBandShares` consume the engine's evolving curve directly via
  `cumulativeShareFromTop` instead of re-deriving it from anchors. The standalone
  recalibration path is kept only as a fallback for snapshots lacking an attached curve,
  and genuinely-degraded entries are now tagged with `degraded: true` (CR-01/WR-05) so
  the donut can render an explicit "calibration unavailable" state instead of a
  fabricated equal split or a contradictory center label. Added regression tests
  asserting per-year sum-to-1 across a realistic full horizon and that final-year
  top-tier share evolves with horizon length.
