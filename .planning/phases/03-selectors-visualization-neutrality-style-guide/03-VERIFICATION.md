---
phase: 03-selectors-visualization-neutrality-style-guide
verified: 2026-05-16T05:25:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open browser at http://localhost:5173 (npm run dev) and verify Chart 1 renders the user's teal wealth curve with a log Y axis by default, and clicking 'Linear' switches to absolute scale without a blank or broken chart."
    expected: "Chart 1 visible with teal compounding curve; log ticks (100k, 200k, 500k, 1M…) by default; toggling to Linear shows absolute scale without render defects."
    why_human: "ECharts canvas rendering and axis switching cannot be verified by grep or tsc — requires a browser to confirm the chart actually mounts and re-renders."
  - test: "Hover/tap Chart 1 (time-series) and inspect the tooltip."
    expected: "Tooltip shows year, formatted wealth ($Xk/$XM), percentile rank (e.g. 'Rank: 45.2th'), and tier (e.g. 'Tier: median')."
    why_human: "Tooltip runtime behavior requires mouse interaction in a browser; the formatter function exists and passes tests, but live rendering must be confirmed."
  - test: "Hover/tap Chart 2 (divergence overlay) and inspect the combined tooltip."
    expected: "Combined tooltip lists all five series (Your wealth, Median (p50), Top 10% (p90), Top 1% (p99), Top 0.1% (p99.9)) with formatted wealth values, plus rank and tier at the inspected year."
    why_human: "Multi-series ECharts tooltip cannot be verified without browser interaction."
  - test: "Verify Chart 2 renders five colored lines with the specified palette."
    expected: "Teal user line (#0F766E), slate median (#64748B), violet top-10% (#7C3AED), blue top-1% (#2563EB), cyan top-0.1% (#0891B2). No red or green anywhere on the page."
    why_human: "Color rendering is a visual check that cannot be confirmed by code analysis alone."
  - test: "Verify Chart 3 (relative-position) displays four faint dashed horizontal reference bands and the D-11 caption is permanently visible below the chart."
    expected: "Four dashed grey bands at p50/p90/p99/p99.9 visible. Below the chart, the caption 'This shows the user's rank within the distribution. Rank can move down while the user's real wealth still grows...' is always present in the DOM — not hidden behind a tooltip."
    why_human: "ECharts markLine rendering and DOM visibility of the caption element require browser inspection."
  - test: "Toggle log/linear and confirm Chart 3 is NOT affected while Charts 1 and 2 switch axes."
    expected: "Charts 1 and 2 switch between log and linear Y axes. Chart 3 Y axis (Percentile rank 0-100) remains unchanged throughout."
    why_human: "Axis toggle behavior across three simultaneous charts requires visual browser verification."
  - test: "Verify the citation footer is visible below all charts with linked source names."
    expected: "Footer reads 'Default parameters sourced from: [linked names]. See sources for definitions and caveats.' Source names link to external URLs. No href is empty or malformed."
    why_human: "Anchor rendering and link correctness require browser inspection; rel=noopener is confirmed in code but clickable link behavior needs human verification."
---

# Phase 3: Selectors, Visualization & Neutrality Style Guide — Verification Report

**Phase Goal:** The engine's output is made legible through three neutral chart types (time-series growth, multi-tier divergence overlay, relative-position trajectory) driven by memoized selectors, with a linear/log toggle, hover/tap tooltips, visible source citations, and an explicit neutrality style guide artifact governing copy and palette.
**Verified:** 2026-05-16T05:25:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | Time-series chart renders user trajectory from memoized selectors (never transforms engine output inline) | VERIFIED | `HarnessPage.tsx` calls `projectionEngine` once at module level; `tsOption` = `useMemo(() => selectTimeSeriesOption(result, yAxisType), [yAxisType])`; `TimeSeriesChart` receives the memoized option as a prop. No inline data transformation in the component. |
| SC-2 | Linear/log toggle present with neutral explanatory copy | VERIFIED | `LogLinearToggle.tsx` exports two `aria-pressed` buttons ("Log"/"Linear"); explanatory paragraph: "Log scale: equal vertical distance represents equal percentage change, making compounding visible. Linear scale: equal vertical distance represents equal absolute change." Copy is mechanically descriptive with no evaluative framing. |
| SC-3 | Hover/tap tooltips show year, wealth, percentile/rank, and tier | VERIFIED | `selectors.ts` `selectTimeSeriesOption` tooltip formatter returns `"Year N · Rank: X.Xth · Tier: T · Wealth: $X"`. VIZ-03 tests in `selectors.test.ts` assert formatter returns string containing year, "rank" and tier match. All 89 tests pass (`npm test`). Live rendering requires human verification. |
| SC-4 | Multi-tier overlay (user vs. median/top1%/top0.1%) AND separate relative-position chart | VERIFIED | `selectDivergenceOption` returns 5 series: user (#0F766E), Median (p50) (#64748B), Top 10% (p90) (#7C3AED), Top 1% (p99) (#2563EB), Top 0.1% (p99.9) (#0891B2). `selectRelPosOption` returns a separate chart with `userRank` data. Both wired in `HarnessPage.tsx` via memoized selectors. Tests confirm correct series count, colors, names, and markLine at 50/90/99/99.9. |
| SC-5 | Visible source citations (footer minimum) AND neutrality style guide artifact with no value-laden red/green | VERIFIED | `CitationFooter.tsx` renders `Object.values(SOURCES)` as linked anchors with `rel="noopener noreferrer"`. `docs/NEUTRALITY-STYLE-GUIDE.md` exists (6710 bytes) with 4 sections: copy lexicon, chart-semantic rules, D-11 caption rule, and palette clause. Contains "No semantic red or green" and D-11 canonical text with "rank can move" phrase. |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | Full Vite 8 + React 19 + ECharts 6 + Zustand 5 + Tailwind v4 dep manifest | VERIFIED | echarts@6.0.0, react@19.2.6, zustand@5.0.13, vite@8.0.13, vitest@4.1.6, tailwindcss@4.3.0 all present at specified versions. `name: "assets-projection"`, `type: "module"`. |
| `vite.config.ts` | Unified build + Vitest config (no separate vitest.config.ts) | VERIFIED | Imports from "vite" with `react()` and `tailwindcss()` plugins; inline `test.include` glob. `vitest.config.ts` deleted (confirmed by `test !-f`). |
| `tsconfig.json` | TypeScript config with `"jsx": "react-jsx"` | VERIFIED | `grep "react-jsx" tsconfig.json` returns match. |
| `index.html` | Vite SPA entry, references `src/main.tsx` | VERIFIED | Contains `<script type="module" src="/src/main.tsx">` and `<div id="root">`. |
| `src/main.tsx` | React composition root importing HarnessPage | VERIFIED | Imports `HarnessPage` from `./ui/HarnessPage.js`; renders via `createRoot` inside `StrictMode`. |
| `src/index.css` | Tailwind v4 import | VERIFIED | Single line: `@import "tailwindcss"`. |
| `src/state/store.ts` | Zustand store exporting `useProjectionStore` seeded from DEFAULTS | VERIFIED | Exports `useProjectionStore = create<ProjectionStore>(() => ({...DEFAULTS}))`. |
| `src/state/__tests__/selectors.test.ts` | VIZ-01..VIZ-06 test file with substantive assertions | VERIFIED | 6 describe blocks (VIZ-01 through VIZ-06) plus `formatWealth` block; 89 total tests pass including all selector assertions. No stub-only `it.todo` or `it.skip` remaining. |
| `src/state/selectors.ts` | All 4 selectors + `formatWealth` + `COLORS` constants | VERIFIED | Exports: `COLORS`, `formatWealth`, `selectTimeSeriesOption`, `selectDivergenceOption`, `selectRelPosOption`, `selectCitationFooter`. Full implementations, no empty stubs. 342 lines. |
| `src/viz/TimeSeriesChart.tsx` | Thin ECharts wrapper with `notMerge={true}` | VERIFIED | `notMerge={true}` present (grep count: 1). Wraps `ReactECharts` with `style={{ height: 320, width: '100%' }}`. |
| `src/viz/DivergenceChart.tsx` | Thin ECharts wrapper with `notMerge={true}` | VERIFIED | `notMerge={true}` present (grep count: 1). |
| `src/viz/RelativePosChart.tsx` | ECharts wrapper + D-11 fixed DOM caption element | VERIFIED | Accepts `caption: string` prop; renders `<p className="text-sm font-normal text-slate-600 mt-2">{caption}</p>` below `ReactECharts`. `notMerge={true}` present. |
| `src/ui/HarnessPage.tsx` | Complete harness — all 3 charts + citation footer | VERIFIED | Imports all 3 chart components + `CitationFooter` + `LogLinearToggle`; calls `projectionEngine` at module level; 3 chart sections with equal card classes; all 3 charts rendered with memoized options. |
| `src/ui/LogLinearToggle.tsx` | Log/linear toggle with `aria-pressed` and explanatory copy | VERIFIED | Two buttons both have `aria-pressed`; active state: `bg-teal-700 text-white`; explanatory paragraph present; scope notice "Scale applies to the two wealth charts." present. |
| `src/ui/CitationFooter.tsx` | Citation footer with `rel="noopener noreferrer"` | VERIFIED | `rel="noopener noreferrer"` present on anchor elements (grep count: 1). Renders all `citations` as linked or plain source names. |
| `docs/NEUTRALITY-STYLE-GUIDE.md` | NEUT-01 artifact with copy lexicon, chart rules, D-11 caption, palette clause | VERIFIED | File exists (6710 bytes). Contains "No semantic red or green" (Section 4), "rank can move down" in explanatory prose, D-11 canonical caption verbatim in Section 3. Version 1.0 header present. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `vite.config.ts` | `src/state/__tests__/selectors.test.ts` | `test.include` glob `src/**/__tests__/**/*.test.ts` | WIRED | Glob confirmed in `vite.config.ts`; test file found and 89 tests execute. |
| `src/main.tsx` | `src/ui/HarnessPage.tsx` | `import { HarnessPage }` + `createRoot` render | WIRED | Import and render confirmed in `src/main.tsx`. |
| `src/state/store.ts` | `src/data/defaults.ts` | `import { DEFAULTS }` | WIRED | Import confirmed; store initialized with `params: DEFAULTS`. |
| `src/ui/HarnessPage.tsx` | `src/state/selectors.ts` | `selectTimeSeriesOption(result, yAxisType)` via `useMemo` | WIRED | All 4 selectors imported and called via `useMemo` in `HarnessPage.tsx`. |
| `src/viz/TimeSeriesChart.tsx` | `echarts-for-react` | `ReactECharts` with `notMerge={true}` | WIRED | Import and render confirmed in component. |
| `src/viz/RelativePosChart.tsx` | D-11 caption DOM element | Rendered `<p>` element below `ReactECharts` | WIRED | `<p className="...">{caption}</p>` is a DOM element (not ECharts annotation). Caption text passed from `HarnessPage` as `REL_POS_CAPTION` constant. |
| `src/ui/HarnessPage.tsx` | `src/ui/CitationFooter.tsx` | `citations = selectCitationFooter(SOURCES)` passed as prop | WIRED | `useMemo(() => selectCitationFooter(SOURCES), [])` → `<CitationFooter citations={citations} />` confirmed. |
| `src/state/selectors.ts` | `src/core/types.ts` | `import type ProjectionResult` — selectors never call engine | WIRED | Type-only import confirmed; no `projectionEngine` import in `selectors.ts`. Architecture boundary maintained. |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `HarnessPage.tsx` | `result` (ProjectionResult) | `projectionEngine(HARNESS_INPUTS, DEFAULTS)` called at module level | Yes — calls the real engine with real DEFAULTS from Phase 2 | FLOWING |
| `HarnessPage.tsx` | `tsOption` | `useMemo(() => selectTimeSeriesOption(result, yAxisType), [yAxisType])` | Yes — selector maps real `result.series` to EChartsOption with data array | FLOWING |
| `HarnessPage.tsx` | `divOption` | `useMemo(() => selectDivergenceOption(result, yAxisType), [yAxisType])` | Yes — selector maps `result.series` (5 tier streams) to EChartsOption | FLOWING |
| `HarnessPage.tsx` | `relOption` | `useMemo(() => selectRelPosOption(result), [])` | Yes — selector maps `result.relativePosition` (userRank values) to EChartsOption | FLOWING |
| `HarnessPage.tsx` | `citations` | `useMemo(() => selectCitationFooter(SOURCES), [])` | Yes — `Object.values(SOURCES)` returns the 5 real Phase 2 source records | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 89 tests pass | `npm test -- --run` | `9 test files, 89 tests passed` | PASS |
| TypeScript typecheck | `npm run typecheck` (`tsc --noEmit`) | Exit 0, no errors | PASS |
| `vitest.config.ts` deleted | `test ! -f vitest.config.ts` | Exit 0 ("vitest.config.ts: DELETED") | PASS |
| `selectors.ts` `selectTimeSeriesOption` with `yAxisType='log'` returns `yAxis.min=1` | Covered by VIZ-02 test (green) | Assertion passes | PASS |
| `selectDivergenceOption` returns 5 series with correct palette | Covered by VIZ-04 tests (green) | 9 assertions pass | PASS |
| `selectRelPosOption` markLine has 4 entries at 50/90/99/99.9 | Covered by VIZ-05 tests (green) | 2 markLine assertions pass | PASS |
| `formatWealth(1_000_000)` returns `'$1.0M'` | Covered by `formatWealth` tests (green) | Passes | PASS |
| `selectCitationFooter(SOURCES)` returns 5 entries | Covered by VIZ-06 test (green) | `citations.length === Object.keys(SOURCES).length` | PASS |
| Browser rendering — Chart 1 visible, toggle functional | Requires `npm run dev` + browser | Not executable in CI | SKIP (human verification required) |

---

### Probe Execution

No `scripts/*/tests/probe-*.sh` files declared or found for this phase. Step 7c: SKIPPED (no probe files).

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| VIZ-01 | 03-01, 03-02 | Time-series wealth chart renders user trajectory | SATISFIED | `TimeSeriesChart` + `selectTimeSeriesOption` wired in `HarnessPage`; VIZ-01 tests green |
| VIZ-02 | 03-01, 03-02 | Linear/log scale toggle with neutral explanatory copy | SATISFIED | `LogLinearToggle` with `aria-pressed`, scope notice, and mechanical copy in `LogLinearToggle.tsx` |
| VIZ-03 | 03-02 | Hover/tap tooltips show year, wealth, percentile/rank, tier | SATISFIED (automated portion) | Tooltip formatter in `selectTimeSeriesOption` verified by VIZ-03 tests; live interaction requires human check |
| VIZ-04 | 03-01, 03-03 | Multi-tier comparison overlay — user vs. median/top1%/top0.1% | SATISFIED | `selectDivergenceOption` returns 5 series with correct COLORS and names; `DivergenceChart` wired in `HarnessPage`; VIZ-04 tests green |
| VIZ-05 | 03-01, 03-03 | Relative-position trajectory showing wealth share/rank changing over horizon | SATISFIED | `selectRelPosOption` uses `userRank` (0–100) with 4-entry markLine; `RelativePosChart` with D-11 DOM caption; VIZ-05 tests green |
| VIZ-06 | 03-01, 03-03 | Visible source citations in footer tracing defaults to named research | SATISFIED | `CitationFooter` renders `Object.values(SOURCES)` as linked citations with `noopener noreferrer`; wired in `HarnessPage` |
| NEUT-01 | 03-03 | Neutrality style guide artifact (copy + palette rules, no value-laden red/green) | SATISFIED | `docs/NEUTRALITY-STYLE-GUIDE.md` exists at 6710 bytes; "No semantic red or green" confirmed in Section 4; D-11 canonical caption text present in Section 3; all 4 required sections present |

All 7 phase requirements (VIZ-01 through VIZ-06 + NEUT-01) are SATISFIED. REQUIREMENTS.md maps all 7 to Phase 3 — no orphaned or unclaimed requirements for this phase.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No TBD/FIXME/XXX debt markers found in any phase-modified file | — | None |
| — | — | No `return null`, empty array stubs, or hollow props found in selector output paths | — | None |

Note: `TODO` comments in `HarnessPage.tsx` from Plan 02 (Chart 2/3 placeholder divs) were fully replaced in Plan 03. No TODO markers remain in the delivered file.

---

### Human Verification Required

The following items require a browser open at `http://localhost:5173` (`npm run dev`).

#### 1. Chart 1 — Time-Series Rendering and Toggle

**Test:** Open the page. Verify Chart 1 renders a teal compounding curve. Click "Log" (default) — confirm log Y-axis ticks (e.g., 100k, 200k, 500k, 1M). Click "Linear" — confirm Y-axis switches to absolute scale without blank chart or console errors.
**Expected:** Smooth re-render in both modes; no blank chart; no console errors.
**Why human:** ECharts canvas mounting and axis re-render cannot be verified by grep or tsc.

#### 2. Tooltip on Chart 1

**Test:** Hover over Chart 1. Inspect the tooltip.
**Expected:** Tooltip text includes: "Year N", "Rank: X.Xth", "Tier: [tier]", "Wealth: $X".
**Why human:** Tooltip trigger requires mouse interaction in a live browser.

#### 3. Chart 2 — Five Colored Lines and Combined Tooltip

**Test:** Confirm Chart 2 shows exactly 5 lines: teal user line, slate median, violet top-10%, blue top-1%, cyan top-0.1%. Hover to trigger combined tooltip.
**Expected:** Tooltip lists all 5 series with wealth values, plus rank and tier. No red or green hues anywhere on the page.
**Why human:** Color rendering and multi-series tooltip require visual browser inspection.

#### 4. Chart 3 — markLine Bands, D-11 Caption, and Toggle Isolation

**Test:** Verify Chart 3 shows 4 faint dashed horizontal bands. Confirm the D-11 caption is always visible below the chart. Toggle log/linear and confirm Chart 3 is unaffected.
**Expected:** Bands at p50/p90/p99/p99.9. Caption "This shows the user's rank within the distribution. Rank can move down while the user's real wealth still grows — every tier's wealth increases over this horizon. See the wealth-by-tier chart above for absolute amounts." permanently visible. Chart 3 Y axis does not change on toggle.
**Why human:** ECharts markLine rendering, DOM visibility of caption, and cross-chart toggle isolation require browser confirmation.

#### 5. Citation Footer — Link Rendering

**Test:** Scroll to the citation footer. Confirm source names are linked and clicking opens the correct URLs in a new tab.
**Expected:** Footer reads "Default parameters sourced from: [linked names]. See sources for definitions and caveats." Links are functional; `rel="noopener noreferrer"` prevents tab-napping.
**Why human:** Anchor rendering and click behavior require browser interaction.

---

### Gaps Summary

No automated gaps. All 5 roadmap success criteria are VERIFIED against the codebase. All 7 requirement IDs (VIZ-01 through VIZ-06, NEUT-01) are SATISFIED by substantive, wired, data-flowing implementations. The test suite passes 89/89 tests; `tsc --noEmit` exits 0.

Status is `human_needed` because 5 browser-rendering checks are required to confirm the charts visually mount and interact correctly in a real browser. These checks cannot be automated without a live browser process.

---

_Verified: 2026-05-16T05:25:00Z_
_Verifier: Claude (gsd-verifier)_
