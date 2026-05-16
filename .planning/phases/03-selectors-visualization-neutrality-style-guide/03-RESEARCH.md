# Phase 3: Selectors, Visualization & Neutrality Style Guide — Research

**Researched:** 2026-05-16
**Domain:** ECharts 6 / React 19 / Vite 8 scaffold; memoized selector pattern; neutrality style guide authoring
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01** — Neutrality style guide is a plain versioned repo markdown artifact (prose rules, not executable). No codified palette tokens, no lint/CI lexicon test. Enforcement is the Phase 5 human review gate.

**D-02** — The guide covers: (a) copy lexicon (banned value-laden words/verbs/adjectives, alarm punctuation, blame/virtue framing, with neutral rewrites) and (b) chart-semantic rules (neutral axis/series labels, relative-position caption rule, log-scale explanatory-copy tone).

**D-03** — Brief explicit palette clause: "no semantic red/green; color must never imply good/bad." A full dedicated palette section and a formal pass/fail checklist template were explicitly NOT chosen.

**D-04** — The neutral caption text for the relative-position chart (D-11) is seeded into this style guide when authored, so Phase 5 reviews it against the same artifact.

**D-05** — Phase 3 stands up the Vite/React/ECharts scaffold plus a minimal dev harness page that renders the three charts from hardcoded default params (no input UI). Phase 4 replaces the page chrome with the real 2-input shell.

**D-06** — Three charts stacked vertically, all visible at once, in order: time-series growth → multi-tier divergence overlay → relative-position trajectory. No primary/secondary visual hierarchy.

**D-07** — One shared linear/log toggle, defaulting to log, governs only the two wealth-magnitude charts (time-series + divergence). The relative-position chart is always linear with no toggle.

**D-08** — The divergence-overlay tooltip is a combined tooltip showing all series at the inspected year (user + median + top1% + top0.1%, each with wealth) plus the user's percentile/rank and tier.

**D-09** — Relative-position chart plots the user's rank (percentile, 0–100) vs year as the primary trace. `userShare` is in the tooltip only, not the plotted axis. Standard axis orientation (p100 at top), no inversion.

**D-10** — Faint, unobtrusive neutral tier-threshold reference bands/lines at median/top10/top1/top0.1 percentile boundaries. Must stay neutral and not duplicate the divergence-overlay story.

**D-11** — Fixed neutral caption always visible under Chart 3, AND tooltip pairs the user's rank with their growing real wealth at the same year.

### Claude's Discretion

- Exact path/filename of the style guide artifact (proposed `.planning/` or `docs/NEUTRALITY-STYLE-GUIDE.md`).
- Who authors the initial lexicon seed and its exact banned-word list.
- Selector module layout and memoization mechanism (Zustand selector vs `useMemo` vs reselect-style).
- ECharts option construction details, axis units/formatting, time-series chart series composition.
- Citation affordance: VIZ-06 footer-line minimum satisfies; richer per-parameter sourcing is Phase 5.

### Deferred Ideas (OUT OF SCOPE)

- Richer per-parameter sourcing panel (Phase 5).
- Per-chart independent log/linear toggles (rejected for v1).
- Tabbed/switchable chart layout and primary+secondary hierarchy (rejected for neutrality reasons).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIZ-01 | A time-series wealth chart renders the user's trajectory over the horizon | ECharts 6 line chart with `type: 'value'` or `'log'` Y axis; data from `series[].userWealth`; selector maps `ProjectionResult → EChartsOption` |
| VIZ-02 | A linear/log scale toggle is available, with neutral explanatory copy | ECharts `yAxis.type: 'log'` / `'value'` toggled by React state; UI toggle component; copy contract from 03-UI-SPEC.md |
| VIZ-03 | Hover/tap tooltips show year, wealth, percentile/rank, and tier | ECharts `tooltip.trigger: 'axis'`, `formatter` function receiving params array; all required fields available from `YearSnapshot` via selectors |
| VIZ-04 | A multi-tier comparison overlay plots user vs representative tiers in one frame | ECharts multi-series line chart; four anchor tier lines + user line; combined tooltip (D-08) |
| VIZ-05 | A relative-position trajectory shows the user's wealth share/rank changing over the horizon | ECharts line chart of `relativePosition[].userRank`; markLine for tier boundaries (D-10); always linear; D-11 safeguard tooltip + fixed caption |
| VIZ-06 | Visible source citations (footer minimum) tracing displayed defaults to named research | React footer component reading `SOURCES` registry (`sourceName`, `url` fields from `SourceRecord`); rendered as linked text |
| NEUT-01 | A neutrality style guide artifact exists (copy + chart palette rules) | Plain markdown file authored by executor against 03-UI-SPEC.md copywriting contract; seeded with D-11 caption and palette clause (D-03/D-04) |
</phase_requirements>

---

## Summary

Phase 3 stands up the entire visual surface of the project from scratch — no Vite/React scaffold exists yet. The engine (`projectionEngine`) and empirical defaults (`DEFAULTS`, `SOURCES`) are complete from Phases 1 and 2. This phase's job is to wire a memoized selector layer between the engine and three ECharts 6 chart components, wrap them in a minimal dev-harness page, and author the neutrality style guide artifact.

The dominant technical risk is **the existing `package.json` is a core-only Node.js package** (vitest@3.2.4 as devDep, no Vite, no React). Adding the full Vite 8 + React 19 + ECharts 6 scaffold requires replacing that `package.json` entirely. A critical compatibility constraint: **vitest 3.x requires vite@^5/6/7 but @vitejs/plugin-react@6 requires vite@^8**. The resolution is upgrading vitest to 4.1.6, which explicitly supports vite@^6||^7||^8, keeping all Phase 1/2 model tests green.

The second highest design risk is the **relative-position chart** (VIZ-05, D-09..D-11): no mainstream precedent, neutrality safeguard is mandatory before Phase 5 can sign it off. ECharts `markLine` with constant Y values at the four tier-threshold percentiles (50/90/99/99.9) implements D-10. The D-11 tooltip must pair `userRank` with `userWealth` at the same year — this requires the selector to merge `series` and `relativePosition` arrays by year index into a single chart-ready series structure.

The third area requiring care is **ECharts log axis and zero/near-zero values**. ECharts cannot plot log(0) or log(negative). The engine's `userWealth` starts at `inputs.currentWealth`, which in the dev harness is `DEFAULTS`-driven (positive). However, the selector must guard against near-zero wealth for early years and clamp the axis `min` to a small positive value (e.g., `1` or `min: 1` on the axis) to prevent rendering defects.

**Primary recommendation:** Scaffold a new `package.json` (replacing the core-only one) with Vite 8 + @vitejs/plugin-react@6 + vitest@4.1.6 as the unified dev environment. Build the selector layer as pure memoized TypeScript functions in `src/state/selectors.ts`, then wire ECharts 6 via `echarts-for-react@3.0.6` in three chart components. Author the style guide as `docs/NEUTRALITY-STYLE-GUIDE.md`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Scaffold / build tooling | Frontend Server (build) | — | Vite 8 owns bundling, HMR, dev server; single-page app, no backend |
| Selector / data derivation | API / Data layer (pure TS) | — | `src/state/selectors.ts` — pure functions, no framework; correctness-critical; must be unit-testable |
| Chart rendering (ECharts) | Browser / Client | — | ECharts canvas renderer runs in the browser; driven by `EChartsOption` objects produced by selectors |
| Linear/log toggle state | Browser / Client (React state) | — | Local React `useState` in harness page; Phase 4 will move it to Zustand when live recompute is added |
| Citation footer | Browser / Client | — | Static render of `SOURCES` registry; no server |
| Neutrality style guide | Static artifact (docs/) | — | Markdown file; consumed by human reviewer in Phase 5, not by runtime code |
| Zustand store (Phase 3 scope) | Browser / Client | — | Minimal store holds `{ inputs, params }`; Phase 3 reads from `DEFAULTS` directly; store pattern established for Phase 4 |

---

## Standard Stack

### Core (Phase 3 adds all of these — none currently installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite | 8.0.13 | Build tool + dev server | Mandated by CLAUDE.md; current stable; Vite 7 EOL [VERIFIED: npm registry] |
| @vitejs/plugin-react | 6.0.2 | React + JSX transform for Vite 8 | Official plugin for React 19 + Vite 8 line; requires vite@^8 [VERIFIED: npm registry] |
| react | 19.2.6 | UI framework | Mandated by CLAUDE.md [VERIFIED: npm registry] |
| react-dom | 19.2.6 | React DOM renderer | Must match react version exactly [VERIFIED: npm registry] |
| echarts | 6.0.0 | Charting library | Mandated by CLAUDE.md; Apache project, 10yr history [VERIFIED: npm registry] |
| echarts-for-react | 3.0.6 | React wrapper for ECharts | Mandated by CLAUDE.md; peerDeps declare echarts@^6 support [VERIFIED: npm registry] |
| zustand | 5.0.13 | Parameter state store | Mandated by CLAUDE.md; ~1KB, no providers [VERIFIED: npm registry] |
| tailwindcss | 4.3.0 | Utility-first CSS | Mandated by CLAUDE.md; v4 = current stable [VERIFIED: npm registry] |
| @tailwindcss/vite | 4.3.0 | First-party Vite v4 plugin | Mandated by CLAUDE.md; replaces PostCSS pipeline [VERIFIED: npm registry] |

### Dev Dependencies (Phase 3 upgrades)

| Library | Version | Change from Phase 1/2 | Reason |
|---------|---------|----------------------|--------|
| vitest | 4.1.6 | Upgrade from 3.2.4 | vitest@3.x requires vite@^5/6/7; vitest@4.1.x supports vite@^6/7/8 [VERIFIED: npm registry] |
| @vitest/coverage-v8 | 4.1.6 | Upgrade from 3.2.4 | Must match vitest major version [VERIFIED: npm registry] |
| typescript | 5.9.3 | No change | Already installed at correct version [VERIFIED: npm registry] |
| @types/react | 19.x | New | Type support for React 19 [ASSUMED] |
| @types/react-dom | 19.x | New | Type support for react-dom 19 [ASSUMED] |

### Alternatives Considered (locked by CLAUDE.md — do not re-litigate)

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| echarts-for-react | Hand-rolled ~30-line useEffect wrapper | Acceptable alternative per CLAUDE.md; echarts-for-react reduces boilerplate and handles resize correctly |
| echarts-for-react | @react-three/fiber | Wrong domain (3D) |
| zustand | React Context + useReducer | Broader re-renders on param change; boilerplate |

**Installation (replaces existing package.json):**

```bash
# Production deps
npm install react@19.2.6 react-dom@19.2.6 echarts@6.0.0 echarts-for-react@3.0.6 zustand@5.0.13

# Dev deps
npm install -D vite@8.0.13 @vitejs/plugin-react@6.0.2 tailwindcss@4.3.0 @tailwindcss/vite@4.3.0 vitest@4.1.6 @vitest/coverage-v8@4.1.6 typescript@5.9.3 @types/react @types/react-dom
```

**Version verification (run before writing package.json):** All core package versions were verified via `npm view <pkg> version` on 2026-05-16 [VERIFIED: npm registry].

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| echarts | npm | ~11 yrs (2015) | Very high | github.com/apache/echarts | [OK] | Approved |
| echarts-for-react | npm | ~10 yrs (2016) | High | github.com/hustcc/echarts-for-react | [OK] | Approved |
| zustand | npm | ~7 yrs (2019) | Very high | github.com/pmndrs/zustand | [OK] | Approved |
| react | npm | ~15 yrs (2011) | Dominant | github.com/facebook/react | [OK] | Approved |
| react-dom | npm | ~12 yrs (2014) | Dominant | github.com/facebook/react | [OK] | Approved |
| vite | npm | ~6 yrs (2020) | Very high | github.com/vitejs/vite | [OK] | Approved |
| @vitejs/plugin-react | npm | ~5 yrs (2021) | Very high | github.com/vitejs/vite-plugin-react | [OK] | Approved |
| tailwindcss | npm | ~9 yrs (2017) | Dominant | github.com/tailwindlabs/tailwindcss | [OK] | Approved |
| @tailwindcss/vite | npm | ~1.3 yrs (2024-02) | High | github.com/tailwindlabs/tailwindcss | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** none

**Postinstall scripts:** None detected on any of the above packages [VERIFIED: npm registry].

---

## Architecture Patterns

### System Architecture Diagram

```
DEFAULTS (frozen Params)
        │
        ▼
projectionEngine(DEFAULTS_inputs, DEFAULTS_params)
        │ ProjectionResult { series[], relativePosition[] }
        ▼
src/state/selectors.ts  ──────────────────────────────────
  selectTimeSeriesData()  → EChartsOption for Chart 1     │
  selectDivergenceData()  → EChartsOption for Chart 2     │
  selectRelPosData()      → EChartsOption for Chart 3     │
  selectCitationFooter()  → SourceRecord[] for Footer     │
        │ (all selectors are pure functions; memoized      │
        │  via React useMemo or Zustand selector pattern)  │
        ▼                                                  │
src/viz/                                                   │
  TimeSeriesChart.tsx  ── ReactECharts option={...} ──────┤
  DivergenceChart.tsx  ── ReactECharts option={...} ──────┤
  RelativePosChart.tsx ── ReactECharts option={...} ──────┤
        │                                                  │
        ▼                                                  │
src/ui/HarnessPage.tsx (dev-harness shell)                 │
  [Toggle: Linear | Log] → shared yAxisType state         │
  <TimeSeriesChart />                                      │
  <DivergenceChart />                                      │
  <RelativePosChart />                                     │
  <CitationFooter />  ──── SOURCES registry ──────────────┘
        │
        ▼
Browser (ECharts canvas renderer)
  hover → tooltip → formatter(params[]) → combined display
```

### Recommended Project Structure

The existing `src/core/` and `src/data/` directories remain unchanged. Phase 3 adds:

```
src/
├── core/              # (existing — do not touch)
│   ├── engine.ts
│   ├── types.ts
│   └── ...
├── data/              # (existing — do not touch)
│   ├── defaults.ts
│   └── sources.ts
├── state/             # NEW in Phase 3
│   └── selectors.ts   # pure memoized functions: ProjectionResult → EChartsOption
├── viz/               # NEW in Phase 3
│   ├── TimeSeriesChart.tsx
│   ├── DivergenceChart.tsx
│   └── RelativePosChart.tsx
├── ui/                # NEW in Phase 3
│   ├── HarnessPage.tsx    # dev-harness shell with toggle + stacked charts + footer
│   ├── LogLinearToggle.tsx
│   └── CitationFooter.tsx
└── main.tsx           # NEW — composition root; renders HarnessPage
docs/
└── NEUTRALITY-STYLE-GUIDE.md   # NEW — NEUT-01 artifact
index.html             # NEW — Vite HTML entry point
vite.config.ts         # NEW — replaces plain vitest config
```

The existing `vitest.config.ts` at the project root is **replaced** by `vite.config.ts` which includes both Vite build config and Vitest test config inline.

### Pattern 1: Selector Function

**What:** A pure function that accepts `ProjectionResult` (and `yAxisType`) and returns a complete `EChartsOption` object. No side effects, no React imports.

**When to use:** Every time a chart needs data. Never transform `ProjectionResult` inside a component.

**Example:**

```typescript
// Source: ARCHITECTURE.md Pattern 3 + CLAUDE.md "Stack Patterns by Variant"
// src/state/selectors.ts
import type { EChartsOption } from 'echarts';
import type { ProjectionResult } from '../core/types.js';

export function selectTimeSeriesOption(
  result: ProjectionResult,
  yAxisType: 'log' | 'value',
): EChartsOption {
  return {
    xAxis: {
      type: 'value',
      name: 'Year',
      nameTextStyle: { fontSize: 14, fontWeight: 400 },
    },
    yAxis: {
      type: yAxisType,
      name: 'Real wealth (today\'s money)',
      nameTextStyle: { fontSize: 14, fontWeight: 400 },
      min: yAxisType === 'log' ? 1 : undefined,  // guard against log(0)
      axisLabel: {
        fontSize: 14,
        fontWeight: 400,
        formatter: (v: number) => formatWealth(v),
      },
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => formatTimeSeriesTooltip(params, result),
    },
    series: [{
      type: 'line',
      name: 'Your wealth',
      data: result.series.map(s => [s.year, Math.max(1, s.userWealth)]),
      lineStyle: { color: '#0F766E', width: 2 },
      itemStyle: { color: '#0F766E' },
      showSymbol: false,
    }],
  };
}
```

### Pattern 2: ReactECharts Component

**What:** A thin React component that receives the `EChartsOption` from a memoized selector and renders it with `ReactECharts`. No data transformation inside the component.

**When to use:** For every chart. Props = `{ option: EChartsOption; style?: CSSProperties }`.

```typescript
// Source: echarts-for-react README + echartsforreact.com/docs/api/echarts-react/
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface Props {
  option: EChartsOption;
  style?: React.CSSProperties;
}

export function TimeSeriesChart({ option, style }: Props) {
  return (
    <ReactECharts
      option={option}
      notMerge={true}   // replace full option on yAxisType change
      style={{ height: 320, width: '100%', ...style }}
    />
  );
}
```

**`notMerge={true}` is required** when switching between log and linear: ECharts merges options by default, which causes stale axis type to persist. Always use `notMerge={true}` when yAxisType changes the option shape.

### Pattern 3: Combined Tooltip Formatter (D-08)

**What:** When `tooltip.trigger` is `'axis'`, ECharts passes an array of params (one entry per series at the hovered X position) to `formatter`. Use a function formatter to build a custom multi-series tooltip block.

```typescript
// Source: ECharts official docs (tooltip.formatter function signature)
// Applied to Chart 2 (divergence) per D-08
tooltip: {
  trigger: 'axis',
  formatter: (params: Array<{ seriesName: string; value: [number, number]; color: string }>) => {
    const year = params[0]?.value[0] ?? 0;
    // Merge in the user's rank/tier from the result series (looked up by year)
    const snap = resultSeriesLookup.get(year);
    const rank = snap ? (snap.userPercentile * 100).toFixed(1) : '—';
    const tier = snap ? deriveTier(snap.userPercentile) : '—';
    const rows = params.map(p =>
      `<tr><td style="color:${p.color}">⬤</td><td>${p.seriesName}</td><td style="text-align:right">${formatWealth(p.value[1])}</td></tr>`
    ).join('');
    return `<table>${rows}</table>Year ${year} • Rank: ${rank}th • Tier: ${tier}`;
  },
},
```

### Pattern 4: Log Axis Zero-Guard

**What:** ECharts `type: 'log'` cannot render 0 or negative values. The selector must either clamp data to `Math.max(1, value)` or set `yAxis.min: 1`.

**When to use:** Always, on the two wealth-magnitude charts when `yAxisType === 'log'`.

```typescript
// Guard in selector — applied to all series data points
data: result.series.map(s => [s.year, yAxisType === 'log' ? Math.max(1, s.userWealth) : s.userWealth])
// AND set on the axis:
yAxis: { type: 'log', min: yAxisType === 'log' ? 1 : undefined }
```

### Pattern 5: markLine for Tier-Threshold Reference Bands (D-10)

**What:** ECharts `markLine` on a series, using constant `yAxis` values to draw horizontal dashed lines at the percentile thresholds.

```typescript
// Source: ECharts markLine docs (oreateai.com/blog/a-detailed-guide-to-using-markline-in-echarts)
// Applied to Chart 3 (relative-position) for D-10
// The relative-position Y axis is userRank (0–100), so thresholds are at 50, 90, 99, 99.9
markLine: {
  silent: true,
  symbol: 'none',
  lineStyle: { color: '#CBD5E1', opacity: 0.3, type: 'dashed', width: 1 },
  label: { fontSize: 12, color: '#94A3B8' },
  data: [
    { yAxis: 50, name: 'p50' },
    { yAxis: 90, name: 'p90' },
    { yAxis: 99, name: 'p99' },
    { yAxis: 99.9, name: 'p99.9' },
  ],
},
```

### Pattern 6: Zustand Store for Phase 3 (minimal)

Phase 3 does not need live recompute (that is Phase 4). The store is established in Phase 3 so Phase 4 can build on it without a structural change.

```typescript
// src/state/store.ts — Phase 3 minimal version
import { create } from 'zustand';
import type { Inputs, Params } from '../core/types.js';
import { DEFAULTS } from '../data/defaults.js';

interface ProjectionStore {
  inputs: Inputs;
  params: Params;
}

// Phase 3: read-only from DEFAULTS; Phase 4 will add setInputs/setParams
export const useProjectionStore = create<ProjectionStore>(() => ({
  inputs: { currentWealth: 120_000, annualSavings: 6_000 },
  params: DEFAULTS,
}));
```

The dev harness reads `useProjectionStore.getState()` once to pass to the engine, then renders charts. No live reactivity needed in Phase 3.

### Anti-Patterns to Avoid

- **Transforming `ProjectionResult` inside chart components:** Do ALL data shaping in `selectors.ts`. Never call `result.series.map(...)` inside a `<chart />` component.
- **Forgetting `notMerge={true}`:** Without it, toggling yAxisType from `'log'` to `'value'` will leave stale log axis settings merged in, producing invisible or garbled charts.
- **Using `min: 0` on a log axis:** ECharts will crash or produce rendering artifacts. Always use `min: 1` (or a small positive value) on log axes.
- **Importing from `core/` in `data/` or vice versa:** The architecture boundary rule is enforced by the existing `invariants.test.ts` import scan — new modules must not create new violations.
- **Log axis with zero-wealth data points:** The dev harness uses `currentWealth: 120_000` which is positive, but the selector must clamp defensively in case a future user with zero wealth reaches this code.
- **Including connotative color in the tier lines or reference bands:** Per D-03 and 03-UI-SPEC.md, tier series must use the specified categorical palette. Do not use red for negative trajectories or green for positive.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart rendering | Custom SVG/canvas loop | ECharts 6 via echarts-for-react | Handles canvas rendering, resize, tooltip positioning, log axis, markLine, legend — all out of the box |
| Chart resize on window change | ResizeObserver in component | echarts-for-react `autoResize={true}` (default) | Already handled by the wrapper |
| Tooltip DOM | Custom tooltip overlay component | ECharts `tooltip.formatter` function | ECharts manages tooltip positioning, Z-index, and show/hide; custom overlays fight with this |
| Log scale from scratch | Manual log transform of Y data | ECharts `yAxis.type: 'log'` | ECharts handles axis tick placement, label formatting, and value-to-pixel mapping for log scale |
| Number formatting for large wealth | Custom formatter without units | `Intl.NumberFormat` or simple abbreviation (e.g., `1.2M`) in selector's `formatWealth()` helper | Edge cases: `1_000_000 → "1M"`, `123_456 → "$123k"`. Write once in `selectors.ts`, reuse everywhere |
| Memoization | `Object.is` comparisons by hand | `useMemo` in the component or a stable selector reference | `useMemo(computeOption, [result, yAxisType])` — React handles referential equality correctly |

**Key insight:** ECharts' declarative `EChartsOption` object is the correct abstraction boundary. Selectors produce options; components render them. Never leak chart logic into components.

---

## Common Pitfalls

### Pitfall 1: Log Axis Zero/Negative Value Crash

**What goes wrong:** ECharts silently fails to render, or renders blank chart area, when any data point has value ≤ 0 on a log axis.

**Why it happens:** `Math.log(0) = -Infinity`; `Math.log(negative)` is NaN. ECharts cannot compute pixel positions for these.

**How to avoid:** In the selector, set `min: 1` on the Y axis when `yAxisType === 'log'`, AND clamp data with `Math.max(1, value)`. Both guards together.

**Warning signs:** Chart renders blank or axis labels show `NaN` or `-Infinity` in DevTools console.

### Pitfall 2: notMerge Missing on yAxisType Toggle

**What goes wrong:** Toggling from log to linear (or vice versa) leaves the chart in a broken intermediate state — axis type appears unchanged or shows double axes.

**Why it happens:** ECharts merges new options with the previous state by default. If the prior option had `type: 'log'` and the new option has `type: 'value'`, ECharts may not cleanly replace the axis.

**How to avoid:** Always pass `notMerge={true}` to `ReactECharts` when the option structure changes (which it does on scale toggle, because `min` comes and goes).

**Warning signs:** After toggle, chart axis shows incorrect ticks or both log and linear labeling.

### Pitfall 3: vitest@3.x / vite@8 Peer Conflict

**What goes wrong:** `npm install` fails with ERESOLVE because `vitest@3.2.4` resolves `vite@^7.x` internally (vite-node peer dep), and `@vitejs/plugin-react@6` requires `vite@^8`.

**Why it happens:** The Phase 1/2 `package.json` used `vitest@3.2.4` which is hard-wired to vite@5–7. `@vitejs/plugin-react@6` only supports Vite 8.

**How to avoid:** The new `package.json` must use `vitest@4.1.6` (or any 4.1.x), which explicitly declares `vite: "^6.0.0 || ^7.0.0 || ^8.0.0"`. All Phase 1/2 model tests remain runnable with Vitest 4 — the test file format is compatible.

**Warning signs:** npm ERESOLVE error mentioning `vite@8.0.13` conflicting with `@vitejs/plugin-react`.

### Pitfall 4: Architecture Boundary Violation (core/ importing data/)

**What goes wrong:** New modules in `src/state/` or `src/viz/` import directly from `src/core/engine.ts` in a way that bypasses the composition root, or conversely, `src/core/` imports from `src/state/`.

**Why it happens:** It is tempting to call the engine from inside a selector that also imports from `data/`. The architecture requires the composition root (`main.tsx` or the harness page) to wire `data/ → core → selectors → viz`.

**How to avoid:** `src/state/selectors.ts` accepts `ProjectionResult` as a parameter — it does NOT call `projectionEngine` internally. The harness page calls the engine with `DEFAULTS` and passes the result to selectors.

**Warning signs:** The existing `invariants.test.ts` import boundary scan would catch `core/` importing `data/`, but the inverse (new shell code importing `core/` directly inside a `viz/` component) would not be caught automatically.

### Pitfall 5: ECharts TypeScript — Stale `@types/echarts` Package

**What goes wrong:** Some developers install `@types/echarts` (the unofficial DefinitelyTyped types for ECharts 4), which conflicts with ECharts 6's built-in types.

**Why it happens:** Pre-ECharts 5, types were in `@types/echarts`. Since ECharts 5, types ship bundled in the `echarts` package itself.

**How to avoid:** Do NOT install `@types/echarts`. Import types directly: `import type { EChartsOption } from 'echarts'`. ECharts 6 ships full TypeScript declarations.

**Warning signs:** Type errors about `EChartsOption` not matching, or conflicting type declarations.

### Pitfall 6: Relative-Position Chart — userRank Scale (0–100 vs 0–1)

**What goes wrong:** Chart renders all lines near 0 or Y axis is wrong range.

**Why it happens:** `YearSnapshot.userPercentile` is in `[0, 1]` (fraction), but `relativePosition[].userRank` is already multiplied by 100 (as per `relativePosition.ts`: `userRank = snap.userPercentile * 100`). Using the raw `userPercentile` instead of `userRank` produces a flat line near 0 on a 0–100 axis.

**How to avoid:** In `selectRelPosOption()`, use `result.relativePosition[i].userRank` (the derived 0–100 value from `relativePosition.ts`), NOT `result.series[i].userPercentile`.

**Warning signs:** Percentile line runs flat along the bottom of the chart; tooltip shows values < 1.

### Pitfall 7: Neutrality Caption Not Always Visible

**What goes wrong:** D-11 requires the relative-position caption to be "always visible directly under this chart" (03-UI-SPEC.md) — not in a tooltip or hover-only affordance.

**Why it happens:** Developers implement the caption only in the tooltip formatter, which satisfies the tooltip part of D-11 but not the "fixed neutral caption" requirement.

**How to avoid:** The caption is a rendered `<p>` element in `RelativePosChart.tsx` (or in `HarnessPage.tsx` immediately after the chart card), not part of the ECharts option at all.

---

## Code Examples

### Scaffold: vite.config.ts

```typescript
// Source: tailwind-css.colrlab.com/install-tailwind-css (v4 Vite plugin pattern)
// Source: vitejs.dev + @vitejs/plugin-react README
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Vitest config inline — replaces vitest.config.ts
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
    environment: 'node',   // model tests are framework-free (no DOM needed)
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/state/**'],
      exclude: ['src/**/__tests__/**'],
    },
  },
});
```

### Scaffold: src/main.tsx

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { HarnessPage } from './ui/HarnessPage.js';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
createRoot(root).render(
  <StrictMode>
    <HarnessPage />
  </StrictMode>,
);
```

### Scaffold: src/index.css (Tailwind v4)

```css
/* Source: dev.to/goldenekpendu/how-to-install-tailwind-v4-in-a-vite-project */
@import "tailwindcss";
```

### Selector: wealth number formatter

```typescript
// src/state/selectors.ts
// Source: [ASSUMED] — standard JS Intl pattern; no external library needed
export function formatWealth(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
}
```

### ECharts: multi-series divergence tooltip (D-08)

```typescript
// Source: ECharts tooltip.trigger='axis' formatter docs
// Merges anchorWealth lookup + userRank from the ProjectionResult
tooltip: {
  trigger: 'axis',
  confine: true,
  formatter: (params: Array<{
    seriesName: string; value: [number, number]; color: string; dataIndex: number;
  }>) => {
    if (!params.length) return '';
    const dataIndex = params[0]!.dataIndex;
    const snap = result.series[dataIndex];
    const relPos = result.relativePosition[dataIndex];
    if (!snap || !relPos) return '';
    const rank = relPos.userRank.toFixed(1);
    const tier = deriveTier(snap.userPercentile); // 'median' | 'top10' | 'top1' | 'top01'
    const header = `<strong>Year ${snap.year}</strong><br/>Rank: ${rank}th · Tier: ${tier}<hr/>`;
    const rows = params.map(p =>
      `<span style="color:${p.color}">●</span> ${p.seriesName}: <b>${formatWealth(p.value[1])}</b>`
    ).join('<br/>');
    return header + rows;
  },
},
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| vitest@3.x (vite@^5–7 peer) | vitest@4.1.x (vite@^6/7/8 peer) | vitest 4.0 (2025) | Unblocks Vite 8 upgrade without changing model tests |
| Tailwind v3 + PostCSS pipeline | Tailwind v4 + `@tailwindcss/vite` plugin | Tailwind v4 (2025) | One plugin line, no `tailwind.config.js`, no PostCSS config |
| `@types/echarts` (DefinitelyTyped) | Built-in ECharts TypeScript types | ECharts v5 | Never install `@types/echarts`; types ship in `echarts` package |
| vite@7 (EOL) | vite@8 (current stable) | Vite 8 released 2025 | Vite 7 is end-of-life; Vite 8 required by @vitejs/plugin-react@6 |

**Deprecated/outdated:**
- `create-react-app`: deprecated, not in this stack
- `vitest.config.ts` as a separate file: still valid but for Vite apps the convention is to inline Vitest config into `vite.config.ts` using the `test` key — removes one config file

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@types/react` and `@types/react-dom` for React 19 exist on npm at compatible versions | Standard Stack dev deps | If wrong, TypeScript will error on React imports; resolution: check `npm view @types/react` |
| A2 | `formatWealth()` rounding with simple M/k abbreviation is sufficient for chart axis labels | Code Examples | If wealth numbers need more precision (e.g., $1.23M), the formatter string must be updated; low risk |
| A3 | `deriveTier(userPercentile: number): string` is a simple threshold lookup implementable inline | Code Examples | If tier boundary logic is more complex, it should live in `src/core/tiers.ts` and be imported by selectors |

---

## Open Questions

1. **vitest.config.ts vs vite.config.ts merge**
   - What we know: The existing `vitest.config.ts` at project root must be replaced (or deleted) when `vite.config.ts` is created, since both configure the same Vitest runner and would conflict.
   - What's unclear: The Phase 1/2 tests use `include: ['src/core/__tests__/**/*.test.ts']` — the new config should expand this to include Phase 3 selector tests but keep the model tests passing.
   - Recommendation: The plan's Wave 0 task should delete `vitest.config.ts` and create `vite.config.ts` with the merged Vitest config. Expand `include` to `['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx']`.

2. **Zustand store read vs compute pattern in Phase 3**
   - What we know: Phase 3 needs the engine result once (from `DEFAULTS`). Phase 4 needs reactive recompute. Two patterns: (a) call engine in the component/hook that renders charts; (b) call engine in a top-level harness page and pass result down as props.
   - What's unclear: Whether to introduce a Zustand-derived result selector now or keep it simpler.
   - Recommendation: In Phase 3, call the engine once at the top of `HarnessPage` and pass the `ProjectionResult` to each chart as a prop. This avoids premature Zustand complexity and keeps the harness straightforward. Phase 4 will move the engine call into a Zustand selector/subscription when live recompute is needed.

3. **TypeScript `moduleResolution: 'bundler'` compatibility with Vite 8**
   - What we know: The existing `tsconfig.json` uses `"moduleResolution": "bundler"` which is the correct setting for Vite + TypeScript.
   - What's unclear: Whether the existing tsconfig needs a `"jsx": "react-jsx"` addition for React 19 JSX transform (which `@vitejs/plugin-react` handles at the Vite level, making `tsconfig jsx` optional for build but still needed for IDE type-checking).
   - Recommendation: Add `"jsx": "react-jsx"` to `tsconfig.json` `compilerOptions` as part of Wave 0. This is the correct setting for React 17+ JSX transform.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite 8 (requires >=20.19 or 22.12+) | ✓ | 25.9.0 | — (exceeds minimum) |
| npm | Package management | ✓ | 11.12.1 | — |
| Browser (Chrome/Safari/Firefox) | ECharts canvas rendering | ✓ (dev machine) | — | — |

**Missing dependencies with no fallback:** None identified.

**Missing dependencies with fallback:** None identified.

**Note on Node version:** Node 25.9.0 exceeds Vite 8's minimum (20.19+ or 22.12+). No compatibility issue. [VERIFIED: vite.dev/releases — Node requirement confirmed for Vite 8 via CLAUDE.md §"Version Compatibility"]

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 (upgrade from 3.2.4) |
| Config file | `vite.config.ts` (merged — replaces `vitest.config.ts`) |
| Quick run command | `npm test` (which runs `vitest run`) |
| Full suite command | `npm run test:cov` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIZ-01 | `selectTimeSeriesOption` returns EChartsOption with correct series data from `ProjectionResult.series` | unit | `vitest run src/state/__tests__/selectors.test.ts` | ❌ Wave 0 |
| VIZ-02 | `selectTimeSeriesOption` with `yAxisType='log'` returns `yAxis.type: 'log'` and `min: 1`; with `'value'` returns `yAxis.type: 'value'` | unit | `vitest run src/state/__tests__/selectors.test.ts` | ❌ Wave 0 |
| VIZ-03 | Tooltip formatter function in Chart 1 and Chart 2 options includes `year`, `wealth`, `userRank`, `tier` — test by calling formatter with fixture params | unit | `vitest run src/state/__tests__/selectors.test.ts` | ❌ Wave 0 |
| VIZ-04 | `selectDivergenceOption` returns 5 series (user + 4 tiers) with correct colors from the palette | unit | `vitest run src/state/__tests__/selectors.test.ts` | ❌ Wave 0 |
| VIZ-05 | `selectRelPosOption` maps `relativePosition[].userRank` to series data; markLine data has 4 entries at 50/90/99/99.9 | unit | `vitest run src/state/__tests__/selectors.test.ts` | ❌ Wave 0 |
| VIZ-06 | `selectCitationFooter` returns all 5 sources from `SOURCES` with `sourceName` and `url` fields populated | unit | `vitest run src/state/__tests__/selectors.test.ts` | ❌ Wave 0 |
| NEUT-01 | Style guide artifact exists at the declared path | smoke (file existence check) | Manual verify or `test -f docs/NEUTRALITY-STYLE-GUIDE.md` | ❌ Wave 0 |

**Note on chart component tests (VIZ-01..VIZ-05):** The React chart components themselves (rendering ECharts) are NOT unit-tested via jsdom — ECharts requires a real canvas. The selector functions that produce the `EChartsOption` objects ARE unit-tested (they are pure functions). Visual rendering is verified by viewing the dev harness page in a browser. This is the correct testing boundary for this stack.

### Sampling Rate

- **Per task commit:** `npm test` (Vitest run, all model + selector tests)
- **Per wave merge:** `npm run test:cov` (full suite with coverage)
- **Phase gate:** Full suite green + browser visual verification before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/state/__tests__/selectors.test.ts` — covers VIZ-01..VIZ-06 selector behaviors
- [ ] Delete `vitest.config.ts`, create `vite.config.ts` with merged config
- [ ] Add `"jsx": "react-jsx"` to `tsconfig.json` compilerOptions
- [ ] Create `index.html` (Vite HTML entry point)
- [ ] Create `src/main.tsx` (React composition root)
- [ ] Create `src/index.css` (`@import "tailwindcss"`)

---

## Security Domain

Security enforcement applies. Phase 3 is a static browser-only SPA with no backend, no user accounts, and no network calls. The attack surface is minimal.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in this app |
| V3 Session Management | No | No sessions; URL state only (Phase 5+) |
| V4 Access Control | No | No backend; public read-only app |
| V5 Input Validation | Partial | Phase 3 uses hardcoded `DEFAULTS` — no user input this phase; Phase 4 will validate inputs |
| V6 Cryptography | No | No cryptographic operations |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| ECharts tooltip XSS via HTML formatter | Tampering | Use `tooltip.renderMode: 'html'` carefully; do not inject unsanitized user strings into formatter output. Phase 3 tooltip strings are constructed from numeric model output only — no user string interpolation. |
| Supply chain via transitive deps | Spoofing | All packages verified via slopcheck [OK]; no postinstall scripts detected |

---

## Sources

### Primary (HIGH confidence)

- `src/core/types.ts`, `src/core/engine.ts`, `src/data/defaults.ts`, `src/data/sources.ts` — Phase 1/2 engine output contract; confirmed correct types for `ProjectionResult`, `YearSnapshot`, `relativePosition`, `SOURCES` [VERIFIED: codebase read]
- `npm view` registry queries — package versions verified on 2026-05-16 [VERIFIED: npm registry]
- `echartsforreact.com/docs/api/echarts-react/` — ReactECharts component API (option, notMerge, ref pattern, onEvents) [CITED: echartsforreact.com/docs/api/echarts-react/]
- `github.com/hustcc/echarts-for-react/README.md` — prop types, TypeScript ref pattern [CITED: github.com/hustcc/echarts-for-react]
- CLAUDE.md `§Technology Stack`, `§Stack Patterns by Variant` — locked stack and mandatory selector pattern [CITED: ./CLAUDE.md]
- `.planning/research/ARCHITECTURE.md` — functional-core/imperative-shell pattern, selector layer placement [CITED: .planning/research/ARCHITECTURE.md]
- `.planning/phases/03-selectors-visualization-neutrality-style-guide/03-CONTEXT.md` — all D-xx decisions [CITED: .planning/phases/03-selectors-visualization-neutrality-style-guide/03-CONTEXT.md]
- `.planning/phases/03-selectors-visualization-neutrality-style-guide/03-UI-SPEC.md` — exact colors, typography, spacing, copy strings, chart interaction contract [CITED: .planning/phases/03-selectors-visualization-neutrality-style-guide/03-UI-SPEC.md]

### Secondary (MEDIUM confidence)

- `dev.to/manufac/using-apache-echarts-with-react-and-typescript-353k` — EChartsOption type import pattern, `ComposeOption` for bundle optimization [MEDIUM — verified by registry that types ship in echarts package]
- `oreateai.com/blog/a-detailed-guide-to-using-markline-in-echarts` — markLine constant yAxis reference line configuration [MEDIUM — consistent with ECharts doc structure]
- `github.com/apache/echarts/issues/12621` — log axis zero/negative value issue confirmed in ECharts issues [MEDIUM — primary source is the ECharts issue tracker]
- vitest@4.1.x peerDependencies (`vite: "^6.0.0 || ^7.0.0 || ^8.0.0"`) — verified via `npm view vitest@4.1.6 peerDependencies` [VERIFIED: npm registry]

### Tertiary (LOW confidence)

- WebSearch results on Zustand 5 selector patterns — consistent with Zustand docs but not independently verified against official Zustand 5 documentation [LOW]

---

## Metadata

**Confidence breakdown:**
- Standard stack + versions: HIGH — all verified via npm registry
- Package legitimacy: HIGH — slopcheck [OK] for all 9 packages, no postinstall scripts
- Architecture patterns: HIGH — grounded in Phase 1/2 codebase read + CLAUDE.md/ARCHITECTURE.md
- ECharts API details (log axis, markLine, tooltip): MEDIUM — verified via official example source + echarts-for-react docs; some details [ASSUMED] from training knowledge about ECharts 5/6 API stability
- vitest upgrade path: HIGH — peer deps verified via npm registry

**Research date:** 2026-05-16
**Valid until:** 2026-06-15 (30 days — stable ecosystem; Vite/vitest move fast but the locked versions are pinned)
