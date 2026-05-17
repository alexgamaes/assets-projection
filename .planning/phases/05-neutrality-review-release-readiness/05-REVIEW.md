---
phase: 05-neutrality-review-release-readiness
reviewed: 2026-05-17T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - docs/NEUTRALITY-STYLE-GUIDE.md
  - src/state/__tests__/selectors.test.ts
  - src/state/selectors.ts
  - src/ui/AppShell.tsx
  - src/ui/CitationFooter.tsx
  - src/ui/SummaryReadout.tsx
  - src/ui/__tests__/summaryFormatters.test.ts
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-05-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Reviewed the selectors module, three React components, two Vitest suites, and the
neutrality style guide. The components and formatter contracts are sound. However
the donut center label asserts a numerically and semantically wrong concentration
figure ("Top 1% hold X%" where X is actually the top-10% share), which is both a
data-integrity defect and a neutrality defect (it overstates concentration on a
public-facing chart). A test enshrines this wrong value, so the suite will not
catch it. Additionally, the tooltip tier-labeling logic is internally inconsistent
with the donut band-binning logic, producing wrong tier labels for mid-distribution
users.

No structural findings block was provided.

## Critical Issues

### CR-01: Donut center label labels the top-10% share as "Top 1%"

**File:** `src/state/selectors.ts:603-606`
**Issue:** `top1Share` sums `lb.top01 + lb.band99to999 + lb.band90to99`. Per the
band definitions used everywhere else in this file (`selectShareOption`/`selectDonutOption`
data: `band90to99` = the 90–99% population band, `band99to999` = 99–99.9%, `top01`
= top 0.1%), this sum is the share held by **everyone at or above the 90th
percentile — i.e. the top 10%**, not the top 1%. The top 1% share is
`lb.top01 + lb.band99to999` only (99th percentile and above).

The center label therefore renders `Top 1% hold {top10Share}%` — a factually wrong,
materially overstated concentration figure on a publicly deployed chart. This
directly violates the project's data-integrity constraint ("don't assume stuff",
all displayed figures must be correct/sourced) and the neutrality constraint
(overstating concentration is non-neutral framing). The comment on lines 601-603
explicitly claims this is "the cumulative share held by the top 1% (the three
richest bands)" — but the three richest of the five bands span p90→p100, which is
the top 10%.

`src/state/__tests__/selectors.test.ts:626-628` asserts this exact wrong value
(`(lb.top01 + lb.band99to999 + lb.band90to99) * 100`), so the test suite
green-lights the bug instead of catching it. The test must be corrected alongside
the code.

**Fix:**
```ts
// Top 1% = p99 and above: top 0.1% band + the 99–99.9% band ONLY.
const top1Share = lb.top01 + lb.band99to999;
const centerText = lb.degraded
  ? `Beyond model domain\n(year ${last.year})`
  : `Top 1% hold\n${(top1Share * 100).toFixed(1)}%\n(year ${last.year})`;
```
And update `selectors.test.ts:626-628`:
```ts
const expected = (lb.top01 + lb.band99to999) * 100;
```
(Alternatively, if the intended figure really is the top-10% share, change the
label string to `Top 10% hold` — but the label and the math must agree.)

## Warnings

### WR-01: `deriveTier` thresholds are inconsistent with the donut band binning

**File:** `src/state/selectors.ts:45-50` (vs `573`)
**Issue:** `deriveTier` maps `userPercentile` to a label using `>= 0.999 / >= 0.99
/ >= 0.90`, returning `'median'` for everything below `0.90`. `selectDonutOption`
bins the same `userPercentile` with `< 0.5 / < 0.9 / < 0.99 / < 0.999` into
"Bottom 50%" / "50–90%" / "90–99%" / "99–99.9%" / "Top 0.1%". A user at p70 is
labeled `Tier: median` in the Chart 1/Chart 2 tooltips while being highlighted in
the "50–90%" band on the donut — two different answers for the same input. "median"
is also a misleading label for any percentile in (0.5, 0.9). This is a correctness
and neutrality (misleading copy) concern across VIZ-01/VIZ-03/VIZ-04 tooltips.
**Fix:** Derive the tier label from the same threshold table the donut uses (or
extract one shared `bandIndex(percentile)` + `bandLabel` helper used by both
`deriveTier` and `selectDonutOption`) so tooltip tier and donut band are always
consistent, and so no user in (0.5, 0.9) is labeled "median".

### WR-02: Boundary semantics differ between `deriveTier` and donut binning

**File:** `src/state/selectors.ts:46-48` (vs `573`)
**Issue:** `deriveTier` uses `>=` (inclusive of the threshold), while the donut uses
`<` (exclusive). A user exactly at `userPercentile === 0.99` is `'top 1%'` in the
tooltip but binned into the `< 0.999` → index 3 ("99–99.9%") slice on the donut,
and a user at exactly `0.999` is `'top 0.1%'` in the tooltip but index 4 on the
donut. Edge-case label disagreement on the same value. **Fix:** Pick one boundary
convention and apply it through the single shared helper proposed in WR-01.

### WR-03: Share-chart tooltip year can desynchronize from the category axis

**File:** `src/state/selectors.ts:518-527`
**Issue:** The x-axis categories come from `bandSeries.map(b => String(b.year))`
(line 457) but the tooltip resolves the year via `result.series[dataIndex].year`
(lines 518-521). These are only correct if `bandSeries` and `result.series` are
the same length and index-aligned. If `deriveBandShares` ever drops/filters a
degraded terminal year (the code elsewhere explicitly handles a `degraded` band
state), `dataIndex` into `result.series` would point at the wrong year while the
hovered category is from `bandSeries`. **Fix:** Read the year from the band series
that drives the axis: `const year = bandSeries[dataIndex]?.year;` (guard for
undefined), keeping tooltip and axis from a single source of truth.

### WR-04: Test suite hard-codes the CR-01 defect as the expected value

**File:** `src/state/__tests__/selectors.test.ts:626-628`
**Issue:** The "center label is band-derived" test computes its expectation as
`(lb.top01 + lb.band99to999 + lb.band90to99) * 100` and asserts the label contains
`Top 1% hold {that}%`. Because the assertion mirrors the buggy implementation
exactly, the suite passes while shipping a wrong concentration figure — the test
provides false assurance for a data-integrity-critical surface. **Fix:** Change the
expectation to the true top-1% share (`(lb.top01 + lb.band99to999) * 100`) as part
of the CR-01 fix, so the test pins the correct invariant.

## Info

### IN-01: Tooltip `dataIndex ?? 0` silently masks missing index

**File:** `src/state/selectors.ts:96, 175, 295, 518`
**Issue:** `const dataIndex = paramsArr[0]!.dataIndex ?? 0;` falls back to index 0
when `dataIndex` is absent. A missing index would silently render the year-0
tooltip rather than failing or returning `''`. Low impact (ECharts populates
`dataIndex`), but the fallback hides anomalies. **Fix:** Treat a missing
`dataIndex` like the existing `!snap` guard and return `''`.

### IN-02: `selectShareOption` tooltip casts category-series value loosely

**File:** `src/state/selectors.ts:524`
**Issue:** `const val = (p.value as number) ?? 0;` — `as number` then `?? 0` is
contradictory typing (a successful `as number` cast is never nullish; the `?? 0`
only fires if the cast lied). Harmless at runtime but signals the cast is not
trustworthy. **Fix:** `const raw = p.value; const val = typeof raw === 'number' ?
raw : 0;`

### IN-03: REL_POS_CAPTION / D-15 neutrality strings verified only by source-read comments

**File:** `src/ui/AppShell.tsx:32-33`, `src/ui/SummaryReadout.tsx:59-62`
**Issue:** `REL_POS_CAPTION` and the inline D-15 disclosure are byte-exact
neutrality requirements but are validated only by hand-written "source-read
equality" comment blocks in the test files (selectors.test.ts:646-672,
summaryFormatters.test.ts:57-76), not by executable assertions — unlike
`SHARE_CAPTION` and the formatter templates, which are pinned by real `expect`
tests. A future edit to either string (or its style-guide counterpart) can drift
without any test failing. Not a defect today (strings match the guide as read),
but the asymmetry is a maintainability gap on a gate-critical surface. **Fix:**
Export `REL_POS_CAPTION` from `AppShell.tsx` and add a byte-exact `expect(...).toBe(...)`
test (the test file already documents this as the intended remediation).

---

_Reviewed: 2026-05-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
