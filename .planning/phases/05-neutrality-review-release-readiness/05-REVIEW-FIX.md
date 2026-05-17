---
phase: 05-neutrality-review-release-readiness
fixed_at: 2026-05-17T00:35:00Z
review_path: .planning/phases/05-neutrality-review-release-readiness/05-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 05: Code Review Fix Report

**Fixed at:** 2026-05-17T00:35:00Z
**Source review:** .planning/phases/05-neutrality-review-release-readiness/05-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (1 Critical, 4 Warning — Info findings excluded by `critical_warning` scope)
- Fixed: 5
- Skipped: 0

Post-fix verification: `npx vitest run` → 170/170 passing across 12 files; `npx tsc --noEmit` → exit 0.

## Fixed Issues

### CR-01 / WR-04: Donut center label labels the top-10% share as "Top 1%"

**Files modified:** `src/state/selectors.ts`, `src/state/__tests__/selectors.test.ts`
**Commit:** 339717e
**Applied fix:** Changed `top1Share` from `lb.top01 + lb.band99to999 + lb.band90to99` (the share held by everyone at/above p90 — the top 10%) to `lb.top01 + lb.band99to999` (p99 and above — the true top 1%). Updated the accompanying comment to explain the band semantics. Corrected the mis-asserting test (WR-04) at `selectors.test.ts:626` from `(lb.top01 + lb.band99to999 + lb.band90to99) * 100` to `(lb.top01 + lb.band99to999) * 100` so the suite now pins the correct invariant. CR-01 and WR-04 were fixed together in a single atomic commit as instructed (production expression + its mirroring test assertion).

**Note — requires human verification:** This is a numerical/logic correction on a data-integrity- and neutrality-critical surface. Syntax and the corrected test both pass, but a reviewer should confirm the top-1% definition (p99-and-above = top-0.1% band + 99–99.9% band) matches the intended public-facing concentration figure.

### WR-01 / WR-02: `deriveTier` thresholds and boundary semantics inconsistent with donut binning

**Files modified:** `src/state/selectors.ts`
**Commit:** 154f8db
**Applied fix:** Extracted a single shared `bandIndex(userPercentile)` helper plus a `BAND_LABELS` table, both using one upper-exclusive (`<`) boundary convention matching the donut's existing thresholds (`< 0.5 / 0.9 / 0.99 / 0.999`). `deriveTier` now returns `BAND_LABELS[bandIndex(p)]` and `selectDonutOption` now bins via `bandIndex(last.userPercentile)` instead of its inline ternary. This removes the misleading `'median'` label for percentiles in (0.5, 0.9) (now `'50–90%'`), and guarantees the tooltip tier and the highlighted donut band — including edge values exactly at 0.99/0.999 — always agree for the same input. WR-01 and WR-02 share the single-helper remediation and were committed together.

**Note — requires human verification:** The tier-label copy shown in Chart 1/2 tooltips changed (e.g. `'median'` → `'50–90%'`, `'top 1%'` → `'99–99.9%'`/`'Top 0.1%'` band names). A reviewer should confirm the new label wording is acceptable for the tooltip surface and consistent with the neutrality style guide.

### WR-03: Share-chart tooltip year can desynchronize from the category axis

**Files modified:** `src/state/selectors.ts`
**Commit:** 6bebe5e
**Applied fix:** Replaced `const snap = result.series[dataIndex]; ... const year = snap.year;` with `const year = bandSeries[dataIndex]?.year;` followed by an `if (year === undefined) return '';` guard (preserving the existing fail-empty behaviour). The tooltip now resolves the year from the same `bandSeries` array that drives the x-axis categories, so they cannot desynchronize if the band and result series ever differ in length.

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-05-17T00:35:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
