# Phase 4: UI Shell & Minimal Entry - Pattern Map

**Mapped:** 2026-05-16
**Files analyzed:** 11 (7 new, 4 edited)
**Analogs found:** 11 / 11

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/state/store.ts` (edit) | store | request-response | `src/state/store.ts` itself | self (edit) |
| `src/state/selectors.ts` (edit) | selector/transform | transform | `src/state/selectors.ts` itself | self (edit) |
| `src/data/defaults.ts` (edit) | config | — | `src/data/defaults.ts` itself | self (edit) |
| `src/data/sources.ts` (edit) | config | — | `src/data/sources.ts` itself | self (edit) |
| `src/ui/AppShell.tsx` (new) | layout component | request-response | `src/ui/HarnessPage.tsx` | role-match |
| `src/ui/ControlPanel.tsx` (new) | container component | request-response | `src/ui/HarnessPage.tsx` | role-match |
| `src/ui/LogSliderInput.tsx` (new) | input component | request-response | `src/ui/LogLinearToggle.tsx` | role-match |
| `src/ui/HorizonSlider.tsx` (new) | input component | request-response | `src/ui/LogLinearToggle.tsx` | exact |
| `src/ui/BasisToggle.tsx` (new) | toggle component | request-response | `src/ui/LogLinearToggle.tsx` | exact |
| `src/ui/SummaryReadout.tsx` (new) | display component | transform | `src/ui/CitationFooter.tsx` | role-match |
| `src/main.tsx` (edit) | entry point | — | `src/main.tsx` itself | self (edit) |

---

## Pattern Assignments

---

### `src/state/store.ts` (edit — add actions + new seed default)

**Analog:** `src/state/store.ts` (current file, being extended at its marked seam)

**Current imports / store shape** (lines 1–15):
```typescript
import { create } from 'zustand';
import type { Inputs, Params } from '../core/types.js';
import { DEFAULTS } from '../data/defaults.js';

interface ProjectionStore {
  inputs: Inputs;
  params: Params;
}

export const useProjectionStore = create<ProjectionStore>(() => ({
  inputs: { currentWealth: 120_000, annualSavings: 6_000 },
  params: DEFAULTS,
}));
```

**Target shape after Phase 4 edit — add `basis` + three setters:**
```typescript
// Extend the interface with the three new action signatures and basis flag
interface ProjectionStore {
  inputs: Inputs;
  params: Params;
  basis: 'real' | 'nominal';
  setInputs:  (patch: Partial<Inputs>) => void;
  setHorizon: (h: number) => void;
  setBasis:   (b: 'real' | 'nominal') => void;
}

// Replace () => ({...}) with (set) => ({...})
export const useProjectionStore = create<ProjectionStore>((set) => ({
  inputs: { currentWealth: SEED_WEALTH, annualSavings: SEED_SAVINGS }, // D-02 cited medians
  params: DEFAULTS,
  basis: 'real',                                                        // D-08 default
  setInputs:  (patch) => set((s) => ({ inputs: { ...s.inputs, ...patch } })),
  setHorizon: (h) => set((s) => ({ params: { ...s.params, horizon: h } })), // shallow clone — DEFAULTS is frozen
  setBasis:   (b) => set({ basis: b }),
}));
```

**Key constraint:** `DEFAULTS` is `Object.freeze`d (deep). `{ ...s.params, horizon: h }` creates a new top-level object — do NOT mutate `s.params.horizon` in place (throws in strict mode). Horizon is a plain top-level `number` in `Params`, so a shallow clone of `params` is sufficient (no deep clone needed).

---

### `src/state/selectors.ts` (edit — add two new memoized selectors)

**Analog:** `src/state/selectors.ts` (lines 1–342, the established selector pattern)

**Imports pattern** (lines 1–6 of the existing file — copy exactly):
```typescript
import type { EChartsOption } from 'echarts';
import type { CallbackDataParams } from 'echarts/types/dist/shared.js';
import type { ProjectionResult, SourceRecord } from '../core/types.js';
```

**Existing selector signature pattern** (lines 61–64) — all new selectors follow this:
```typescript
export function selectXxx(
  result: ProjectionResult,
  secondParam: SomeType,
): ReturnType {
  // pure function, no side effects, no React imports
}
```

**New selector 1 — `selectReinflated` (D-06/D-08, display-layer nominal re-inflation):**
```typescript
// Append after selectCitationFooter.
// NEVER import from src/core/ beyond the read-only types already imported.
// Engine stays real-only invariant — re-inflation is display-layer only.
export function selectReinflated(
  r: ProjectionResult,
  basis: 'real' | 'nominal',
  i: number,
): ProjectionResult {
  if (basis === 'real') return r;
  return {
    ...r,
    series: r.series.map((s) => {
      const f = (1 + i) ** s.year;
      return {
        ...s,                                   // preserves _totalWealth and all other fields
        userWealth:   s.userWealth   * f,
        anchorWealth: {
          median: s.anchorWealth.median * f,
          top10:  s.anchorWealth.top10  * f,
          top1:   s.anchorWealth.top1   * f,
          top01:  s.anchorWealth.top01  * f,
        },
        // userPercentile / topSetPercentile / assetInflation: NOT re-inflated (unitless)
      };
    }),
    relativePosition: r.relativePosition,       // rank/share unaffected (D-08) — Chart 3 untouched
  };
}
```

**New selector 2 — `selectSummary` (D-13/D-14, summary readout derivation):**
```typescript
// Call AFTER selectReinflated so money fields already track the active basis.
// relativePosition is basis-independent — read directly from the original result.
export interface Summary {
  endingWealth:   number;   // last series userWealth (already basis-adjusted)
  growthMultiple: number;   // endingWealth / startingWealth
  cagr:           number;   // (end/start)^(1/years) - 1
  startRank:      number;   // relativePosition[0].userRank   (0–100, basis-independent)
  endRank:        number;   // relativePosition[last].userRank
}

export function selectSummary(r: ProjectionResult): Summary {
  const first = r.series[0]!;
  const last  = r.series[r.series.length - 1]!;
  const years = last.year - first.year;
  const start = first.userWealth;
  const end   = last.userWealth;
  const rp    = r.relativePosition;
  return {
    endingWealth:   end,
    growthMultiple: start > 0 ? end / start : 0,
    cagr:           start > 0 && years > 0 ? (end / start) ** (1 / years) - 1 : 0,
    startRank:      rp[0]!.userRank,
    endRank:        rp[rp.length - 1]!.userRank,
  };
}
```

**Formatting helper to reuse** (lines 28–32) — use `formatWealth` for all money values in the summary readout, do NOT write a new formatter:
```typescript
export function formatWealth(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
}
```

---

### `src/data/sources.ts` (edit — add two new SourceRecord entries)

**Analog:** `src/data/sources.ts` lines 35–225 (existing entries in the `SOURCES` registry)

**Existing entry shape** (lines 53–77, `fagereng2020` as the template):
```typescript
export const SOURCES = {
  fagereng2020: {
    sourceName: 'Fagereng, Guiso, Malacrino, Pistaferri (2020), Econometrica 88(1)',
    figureUsed: '...',
    basis: 'real' as const,
    definition: '...',
    yearVintage: '...',
    retrievedDate: '2026-05-16',
    note: '...',
    url: 'https://...',
  } satisfies SourceRecord,
  // ... (other entries)
} as const;
```

**Target: append two new entries** to the `SOURCES` object — one for the seed median net worth (citing SCF 2022) and one for the long-run inflation rate. Follow the exact six-field `SourceRecord` shape (all fields required; `note` and `url` recommended). Use `'real' as const` for the seed wealth entry; the inflation rate entry uses `'nominal' as const` (it is a nominal growth rate). Self-describe as a UX default in the `note` field, copying the `savings` entry pattern from `defaults.ts` lines 379–404.

**Architecture boundary (HARD, lines 16–17 of sources.ts):** `sources.ts` MUST NOT import from `src/core/`. It is imported by `defaults.ts`, which is imported by the store, which is imported by UI. Keep the boundary clean.

---

### `src/data/defaults.ts` (edit — add two new sourced defaults + update seed wealth)

**Analog:** `src/data/defaults.ts` lines 370–405 (the `savings` UX-default entry — exact pattern to copy)

**UX default pattern** (lines 379–404):
```typescript
savings: Object.freeze({
  value: 6_000,
  basis: 'real' as const,
  source: Object.freeze({
    sourceName: 'UX default — not a primary-literature sourced parameter',
    figureUsed: 'Approximate median annual household savings: ...',
    basis: 'real' as const,
    definition: 'Annual household savings in real terms; UX default for the two-input entry experience; ...',
    yearVintage: 'UX default (2020 dollars)',
    retrievedDate: '2026-05-16',
    note: 'DATA-04 / D-12: this is a UX default (ENTRY-03 ...), not a primary-literature sourced figure. ...',
  }),
}),
```

**Phase 4 additions:** two new entries following this exact `Object.freeze({ value, basis, source: Object.freeze({...}) })` pattern:
- `seedWealth` — value ≈ `200_000`, `basis: 'real' as const`, source citing SCF 2022 (`$192,900` median family net worth, rounded up to `$200k` per D-02).
- `inflationRate` — value ≈ `0.025` (long-run CPI-U geometric mean ~2.5%), `basis: 'nominal' as const`, source citing BLS CPI-U long-run average.

Also replace the `inputs.currentWealth: 120_000` placeholder in `store.ts` with `SEED_WEALTH` (a named constant derived from the new `seedWealth` entry) per D-02. The `savings` entry value stays at `6_000` but the store's `annualSavings` seed should be sourced from `DEFAULTS.savings.value` for consistency.

The sourcing-completeness Vitest gate (`src/core/__tests__/sourcing.test.ts`) must stay green — all six `SourceRecord` fields must be non-empty for every new entry.

---

### `src/ui/AppShell.tsx` (new — responsive layout wrapper)

**Analog:** `src/ui/HarnessPage.tsx` (lines 51–95) — the `<main>` layout structure and card treatment

**Layout pattern from HarnessPage** (lines 52–53, 63–91):
```tsx
<main className="max-w-4xl mx-auto px-4 py-16">
  <h1 className="text-[28px] font-semibold text-slate-900 mb-8">...</h1>
  <section className="bg-slate-50 border border-slate-200 p-4 rounded">
    <h2 className="text-[20px] font-semibold text-slate-800 mb-4">...</h2>
    {/* chart */}
  </section>
</main>
```

**Phase 4 target layout** (D-10/D-11 responsive grid, from 04-UI-SPEC.md):
```tsx
// AppShell.tsx — imports: React children only; no chart imports (charts live in consumers)
import type { ReactNode } from 'react';

interface Props {
  controlPanel: ReactNode;
  summaryReadout: ReactNode;
  charts: ReactNode;
  footer: ReactNode;
}

export function AppShell({ controlPanel, summaryReadout, charts, footer }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Display 28/600 — one instance, page title */}
      <h1 className="text-[28px] font-semibold text-slate-900 mb-8">Wealth projection</h1>
      {/*
        D-10: desktop — sticky 320px control panel + scrolling chart column
        D-11: mobile — full-width block above charts (no hidden UI, no bottom sheet)
        lg breakpoint = 1024px (04-UI-SPEC.md rationale: 320px panel + ≥320px chart need ≥1024px)
      */}
      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-8">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          {/* D-11: full-width block above charts on mobile; sticky panel on desktop */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded mb-8 lg:mb-0">
            {controlPanel}
          </div>
        </aside>
        <main className="space-y-6">
          {/* Summary readout at top of chart column (04-UI-SPEC.md placement decision) */}
          {summaryReadout}
          {charts}
          {footer}
        </main>
      </div>
    </div>
  );
}
```

**Chart card treatment** (inherited from HarnessPage lines 63–65, 72–74, 80–82 — reuse verbatim):
```tsx
<section className="bg-slate-50 border border-slate-200 p-4 rounded">
  <h2 className="text-[20px] font-semibold text-slate-800 mb-4">...</h2>
  {/* chart component */}
</section>
```

**HarnessPage imports pattern** (lines 6–21) — the new shell/AppShell composes from the same chart components and selectors:
```tsx
import { useMemo, useState, useDeferredValue } from 'react';
import { SOURCES } from '../data/sources.js';
import {
  selectTimeSeriesOption,
  selectDivergenceOption,
  selectRelPosOption,
  selectCitationFooter,
  selectReinflated,   // new Phase 4 selector
  selectSummary,      // new Phase 4 selector
} from '../state/selectors.js';
import { useProjectionStore } from '../state/store.js';
import { TimeSeriesChart } from '../viz/TimeSeriesChart.js';
import { DivergenceChart } from '../viz/DivergenceChart.js';
import { RelativePosChart } from '../viz/RelativePosChart.js';
import { LogLinearToggle } from './LogLinearToggle.js';
import { CitationFooter } from './CitationFooter.js';
```

**REL_POS_CAPTION reuse** (HarnessPage line 23–24) — keep the exact caption string, move it to a shared constant or into the component that renders Chart 3:
```tsx
const REL_POS_CAPTION =
  "This shows the user's rank within the distribution. Rank can move down while the user's real wealth still grows — every tier's wealth increases over this horizon. See the wealth-by-tier chart above for absolute amounts.";
```

**useDeferredValue debounce pattern** (ENTRY-01/ENTRY-02 — from RESEARCH.md Pattern 1/3):
```tsx
// In the shell page component that holds projection state:
const inputs   = useProjectionStore((s) => s.inputs);
const params   = useProjectionStore((s) => s.params);
const deferred = useDeferredValue(inputs);             // ENTRY-02: keeps slider thumb responsive
const result   = useMemo(() => projectionEngine(deferred, params), [deferred, params]);
```

---

### `src/ui/ControlPanel.tsx` (new — composes input controls)

**Analog:** `src/ui/HarnessPage.tsx` (lines 30–61 for the toggle/section pattern) + `src/ui/LogLinearToggle.tsx` (full file, for sub-component composition)

**Composition pattern** — ControlPanel is a thin container that assembles sub-controls and wires store actions:
```tsx
// ControlPanel.tsx — reads store selectors; dispatches setInputs/setHorizon/setBasis/setYAxisType
import { useProjectionStore } from '../state/store.js';
import { LogSliderInput } from './LogSliderInput.js';
import { HorizonSlider } from './HorizonSlider.js';
import { BasisToggle } from './BasisToggle.js';
import { LogLinearToggle } from './LogLinearToggle.js';

export function ControlPanel({ yAxisType, onYAxisTypeChange }: Props) {
  const { inputs, params, basis, setInputs, setHorizon, setBasis } = useProjectionStore();
  return (
    <div className="space-y-4">
      {/* Heading 20/600 — control panel section heading (04-UI-SPEC.md typography) */}
      <h2 className="text-[20px] font-semibold text-slate-800">Inputs</h2>
      <LogSliderInput
        label="Current wealth"
        value={inputs.currentWealth}
        min={1_000} max={10_000_000}
        onChange={(v) => setInputs({ currentWealth: v })}
      />
      <LogSliderInput
        label="Annual savings"
        value={inputs.annualSavings}
        min={2_000} max={2_000_000}
        onChange={(v) => setInputs({ annualSavings: v })}
      />
      <HorizonSlider
        value={params.horizon}
        onChange={setHorizon}
      />
      <BasisToggle value={basis} onChange={setBasis} />
      <LogLinearToggle value={yAxisType} onChange={onYAxisTypeChange} />
    </div>
  );
}
```

---

### `src/ui/LogSliderInput.tsx` (new — log slider paired with numeric field)

**Analog:** `src/ui/LogLinearToggle.tsx` (full file — segmented-control pattern, label/control structure, Tailwind classes)

**LogLinearToggle structure to copy** (lines 9–53):
```tsx
// Same outer <div>, same <label> or role-group pattern, same className conventions
// Key Tailwind classes from LogLinearToggle to replicate:
//   "inline-flex rounded border border-slate-300 overflow-hidden"  — for group container
//   "px-4 py-1.5 text-sm font-normal transition-colors"           — for interactive elements
//   "bg-teal-700 text-white"                                       — active state (accent)
//   "bg-white text-slate-600"                                      — inactive state
//   "text-sm font-normal text-slate-500 mt-1"                     — scope/hint line (Label 14/400)
//   "text-base font-normal text-slate-600 mt-2"                   — explanatory copy (Body 16/400)
```

**LogSliderInput target pattern** (D-01/D-04):
```tsx
// Slider operates in log10 space so $2k…$2M is perceptually even (D-04).
// Typed field accepts values outside the slider span (D-04).
// Boundary guard keeps engine from receiving NaN/negative.
// inputMode="numeric" for mobile keyboard. ≥44px touch targets (04-UI-SPEC.md).
function LogSliderInput({ value, min, max, onChange, label }: {
  value: number; min: number; max: number; label: string;
  onChange: (v: number) => void;
}) {
  const lg = (n: number) => Math.log10(n);
  return (
    <label className="block">
      {/* Label 14/400 — control label */}
      <span className="text-sm font-normal text-slate-600 block mb-1">{label}</span>
      {/* Tabular numerals enforced on value readout (04-UI-SPEC.md §Typography) */}
      <span className="text-sm font-normal text-slate-500 tabular-nums">{formatWealth(value)}</span>
      <input
        type="range"
        min={lg(min)} max={lg(max)} step={0.001}
        value={lg(Math.min(Math.max(value, min), max))}
        onChange={(e) => onChange(Math.round(10 ** Number(e.target.value)))}
        className="w-full accent-teal-700"   // accent = #0F766E (04-UI-SPEC.md Color §4)
      />
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={0}
        className="w-full border border-slate-200 rounded px-2 py-1 text-sm tabular-nums
                   focus:outline-none focus:ring-2 focus:ring-teal-700"
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) && n >= 0 ? n : 0);  // clamp guard — keeps engine safe
        }}
      />
    </label>
  );
}
```

**Import `formatWealth` from selectors** (not a new formatter):
```typescript
import { formatWealth } from '../state/selectors.js';
```

---

### `src/ui/HorizonSlider.tsx` (new — linear slider with live year readout)

**Analog:** `src/ui/LogLinearToggle.tsx` (full file — label + control pattern)

**Pattern to copy** — same label/scope/explanatory structure from LogLinearToggle (lines 42–53), with a linear `input[type=range]` instead of buttons:
```tsx
// D-05: linear (not log) slider, default 35, range 10–60
// Live year readout adjacent to the slider label (04-UI-SPEC.md §"Horizon control")
interface Props {
  value: number;         // current horizon in years
  onChange: (h: number) => void;
}

export function HorizonSlider({ value, onChange }: Props) {
  return (
    <div>
      {/* Label 14/400 — control label + live readout (tabular-nums) */}
      <div className="flex justify-between text-sm font-normal text-slate-600 mb-1">
        <span>Projection horizon</span>
        <span className="tabular-nums">{value} years</span>
      </div>
      <input
        type="range"
        min={10} max={60} step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-teal-700"
      />
      {/* Label 14/400 — scope notice (mirrors LogLinearToggle line 43) */}
      <p className="text-sm font-normal text-slate-500 mt-1">
        10–60 years. Default is 35.
      </p>
    </div>
  );
}
```

---

### `src/ui/BasisToggle.tsx` (new — real/nominal two-segment control)

**Analog:** `src/ui/LogLinearToggle.tsx` (full file — this is an exact structural clone)

**LogLinearToggle segmented-control pattern** (lines 9–53 — copy structure verbatim, change labels and value type):
```tsx
// BasisToggle mirrors LogLinearToggle exactly (04-UI-SPEC.md §"Real/nominal toggle"):
//   - same role="group" + aria-label wrapper
//   - same inline-flex rounded border border-slate-300 overflow-hidden container
//   - same button pattern with aria-pressed + conditional bg-teal-700/bg-white classes
//   - same Label-14 scope line below
//   - same Body-16 explanatory copy below
interface Props {
  value: 'real' | 'nominal';
  onChange: (next: 'real' | 'nominal') => void;
}

export function BasisToggle({ value, onChange }: Props) {
  return (
    <div>
      <div
        role="group"
        aria-label="Display basis"
        className="inline-flex rounded border border-slate-300 overflow-hidden"
      >
        <button
          type="button"
          aria-pressed={value === 'real'}
          onClick={() => onChange('real')}
          className={`px-4 py-1.5 text-sm font-normal transition-colors ${
            value === 'real'
              ? 'bg-teal-700 text-white'
              : 'bg-white text-slate-600 border-r border-slate-200'
          }`}
        >
          Real
        </button>
        <button
          type="button"
          aria-pressed={value === 'nominal'}
          onClick={() => onChange('nominal')}
          className={`px-4 py-1.5 text-sm font-normal transition-colors ${
            value === 'nominal'
              ? 'bg-teal-700 text-white'
              : 'bg-white text-slate-600'
          }`}
        >
          Nominal
        </button>
      </div>
      {/* Label 14/400 — scope notice (mirrors LogLinearToggle line 43) */}
      <p className="text-sm font-normal text-slate-500 mt-1">
        Real adjusts for inflation; nominal does not.
      </p>
      {/* Body 16/400 — explanatory copy (mirrors LogLinearToggle lines 46–50) */}
      <p className="text-base font-normal text-slate-600 mt-2">
        Real shows amounts in today's purchasing power. Nominal shows future dollar amounts without
        adjusting for inflation.
      </p>
    </div>
  );
}
```

---

### `src/ui/SummaryReadout.tsx` (new — ending wealth / growth multiple / CAGR / rank delta)

**Analog:** `src/ui/CitationFooter.tsx` (full file — display-only component receiving typed props, Tailwind classes, no store coupling)

**CitationFooter structure to copy** (lines 9–35):
```tsx
// Same import-only-types pattern; no store imports; receives all data as props
import type { SourceRecord } from '../core/types.js';
interface Props { citations: SourceRecord[]; }
export function CitationFooter({ citations }: Props) {
  return (
    <footer className="mt-12 text-sm text-slate-600 font-normal border-t border-slate-200 pt-6">
      {/* renders citations as a list */}
    </footer>
  );
}
```

**SummaryReadout target pattern** (D-13/D-14/D-15, 04-UI-SPEC.md §"Summary readout labels"):
```tsx
import type { Summary } from '../state/selectors.js';
import { formatWealth } from '../state/selectors.js';

interface Props {
  summary: Summary;
  basis: 'real' | 'nominal';
  inflationRate: number;         // for D-09 nominal caption — cite the rate
  inflationSourceName: string;   // from SourceRecord.sourceName in sources.ts
}

export function SummaryReadout({ summary, basis, inflationRate, inflationSourceName }: Props) {
  const basisLabel = basis === 'nominal' ? '(nominal)' : '(real)';
  const pctStr = (r: number) => `${(r * 100).toFixed(1)}%`;

  return (
    <section className="bg-slate-50 border border-slate-200 p-4 rounded">
      {/* Heading 20/600 — section heading (04-UI-SPEC.md §Typography) */}
      <h2 className="text-[20px] font-semibold text-slate-800 mb-4">Summary</h2>

      {/* Three required metrics (D-13) — values in Body 16/600 semibold, labels in Label 14/400 */}
      <dl className="space-y-2">
        <div>
          <dt className="text-sm font-normal text-slate-600">
            Ending wealth {basisLabel}
          </dt>
          {/* tabular-nums enforced on all figures (04-UI-SPEC.md §Typography) */}
          <dd className="text-base font-semibold text-slate-800 tabular-nums">
            {formatWealth(summary.endingWealth)}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-normal text-slate-600">Growth multiple</dt>
          <dd className="text-base font-semibold text-slate-800 tabular-nums">
            {summary.growthMultiple.toFixed(1)}×
          </dd>
        </div>
        <div>
          <dt className="text-sm font-normal text-slate-600">CAGR</dt>
          <dd className="text-base font-semibold text-slate-800 tabular-nums">
            {pctStr(summary.cagr)} / yr
          </dd>
        </div>
      </dl>

      {/* D-14: rank delta — ALWAYS paired with wealth growth, never bare absolute */}
      <p className="text-sm font-normal text-slate-600 mt-4 tabular-nums">
        Distribution position: p{summary.startRank.toFixed(0)} → p{summary.endRank.toFixed(0)},
        while real wealth grew {summary.growthMultiple.toFixed(1)}×.
      </p>

      {/* D-15: neutral disclosure — seeded into docs/NEUTRALITY-STYLE-GUIDE.md for Phase 5 gate */}
      {/* Body 16/400 (04-UI-SPEC.md) */}
      <p className="text-base font-normal text-slate-600 mt-2">
        Rank can move down while real wealth still grows — every tier's wealth increases over this
        horizon. See the wealth-by-tier chart for absolute amounts.
      </p>

      {/* D-09: money-illusion caption — only shown when nominal is active */}
      {basis === 'nominal' && (
        <p className="text-base font-normal text-slate-600 mt-2">
          These figures are not adjusted for inflation. They assume a fixed{' '}
          {pctStr(inflationRate)} annual inflation rate ({inflationSourceName}).
          Switch to Real for inflation-adjusted amounts.
        </p>
      )}
    </section>
  );
}
```

**Key constraint (D-14/Pitfall 4):** the rank-delta stat (`p75 → p71`) is NEVER shown in isolation. The `while real wealth grew X×` clause is mandatory and adjacent in the same `<p>`. The D-15 neutral disclosure must always accompany it.

---

### `src/main.tsx` (edit — swap HarnessPage for new shell)

**Analog:** `src/main.tsx` (current file, lines 1–13)

**Current pattern** (lines 1–13 — keep everything except the import and component name):
```tsx
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

**Phase 4 edit:** replace the `HarnessPage` import with the new shell component (e.g. `AppShell` or a dedicated `App.tsx` top-level component that composes `AppShell` + store subscriptions). One line change at the import + one line at the JSX render site. Everything else stays identical.

---

## Shared Patterns

### Tailwind card treatment
**Source:** `src/ui/HarnessPage.tsx` lines 63–65
**Apply to:** All new section containers — ControlPanel, SummaryReadout, each chart section
```tsx
<section className="bg-slate-50 border border-slate-200 p-4 rounded">
```

### Section heading
**Source:** `src/ui/HarnessPage.tsx` lines 54, 75, 84
**Apply to:** All new section headings (ControlPanel, SummaryReadout)
```tsx
<h2 className="text-[20px] font-semibold text-slate-800 mb-4">...</h2>
```

### Label 14/400 (scope/hint line)
**Source:** `src/ui/LogLinearToggle.tsx` line 43
**Apply to:** All control scope notices below sliders and toggles
```tsx
<p className="text-sm font-normal text-slate-500 mt-1">...</p>
```

### Body 16/400 (explanatory copy)
**Source:** `src/ui/LogLinearToggle.tsx` lines 47–50
**Apply to:** BasisToggle explanation, nominal caption (D-09), rank disclosure (D-15)
```tsx
<p className="text-base font-normal text-slate-600 mt-2">...</p>
```

### notMerge=true on all chart wrappers
**Source:** `src/viz/TimeSeriesChart.tsx` line 16, `src/viz/RelativePosChart.tsx` line 19
**Apply to:** All chart component usages — DO NOT omit this prop on any chart render site
```tsx
<ReactECharts option={option} notMerge={true} style={{ height: 320, width: '100%' }} />
```

### SourceRecord shape for new data defaults
**Source:** `src/data/sources.ts` lines 53–77 (fagereng2020 entry)
**Apply to:** Two new entries in `sources.ts` (seed median wealth + inflation rate)
Six required fields: `sourceName`, `figureUsed`, `basis`, `definition`, `yearVintage`, `retrievedDate`; `note` and `url` strongly recommended.

### Frozen SourcedParam shape for new defaults.ts entries
**Source:** `src/data/defaults.ts` lines 379–404 (savings UX-default entry)
**Apply to:** New `seedWealth` and `inflationRate` entries in `defaults.ts`
```typescript
Object.freeze({
  value: /* number */,
  basis: 'real' as const,   // or 'nominal'
  source: Object.freeze({ /* full SourceRecord */ }),
})
```

### Selector test structure
**Source:** `src/state/__tests__/selectors.test.ts` lines 26–51
**Apply to:** New `selectReinflated` and `selectSummary` describe blocks in the same file
```typescript
const params = makeSyntheticParams({ horizon: 5 });
const result = projectionEngine(syntheticInputs, params);

describe('ENTRY-04: selectReinflated', () => {
  it('basis=real returns the result unchanged', () => { ... });
  it('basis=nominal scales userWealth by (1+i)^year', () => { ... });
  it('relativePosition is not modified by re-inflation', () => { ... });
});
```

---

## No Analog Found

All Phase 4 files have a close match in the existing codebase. No file requires falling back to RESEARCH.md patterns alone.

---

## Metadata

**Analog search scope:** `src/ui/`, `src/viz/`, `src/state/`, `src/data/`, `src/core/`, `src/main.tsx`
**Files scanned:** 28 (all source files as of 2026-05-16)
**Pattern extraction date:** 2026-05-16
