# Phase 3: Selectors, Visualization & Neutrality Style Guide — Pattern Map

**Mapped:** 2026-05-16
**Files analyzed:** 14 new/modified files
**Analogs found:** 8 / 14 (6 new-category files have no codebase analog — rely on RESEARCH.md patterns)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `package.json` | config | — | `package.json` (existing) | replace — strip existing, add Vite/React stack |
| `vite.config.ts` | config | — | `vitest.config.ts` (existing) | role-match — same test config, new build layer |
| `tsconfig.json` | config | — | `tsconfig.json` (existing) | modify — add `"jsx": "react-jsx"` |
| `index.html` | config | — | none | no analog |
| `src/main.tsx` | config | request-response | none | no analog — see RESEARCH.md §"Scaffold: src/main.tsx" |
| `src/index.css` | config | — | none | no analog — one-liner `@import "tailwindcss"` |
| `src/state/store.ts` | store | — | none | no analog — see RESEARCH.md Pattern 6 |
| `src/state/selectors.ts` | utility | transform | `src/core/relativePosition.ts` | role-match — pure function, typed I/O, no framework |
| `src/state/__tests__/selectors.test.ts` | test | — | `src/core/__tests__/goldenMaster.test.ts` | exact — same Vitest structure, describe/it/expect |
| `src/viz/TimeSeriesChart.tsx` | component | request-response | none | no analog — see RESEARCH.md Pattern 2 |
| `src/viz/DivergenceChart.tsx` | component | request-response | none | no analog — see RESEARCH.md Pattern 2 |
| `src/viz/RelativePosChart.tsx` | component | request-response | none | no analog — see RESEARCH.md Pattern 2 |
| `src/ui/HarnessPage.tsx` | component | request-response | `src/core/__tests__/invariants.test.ts` | partial — composition root calling engine with DEFAULTS |
| `src/ui/LogLinearToggle.tsx` | component | event-driven | none | no analog |
| `src/ui/CitationFooter.tsx` | component | transform | `src/data/sources.ts` | partial — reads SOURCES registry, renders fields |
| `docs/NEUTRALITY-STYLE-GUIDE.md` | config | — | none | no analog — prose artifact |

---

## Pattern Assignments

### `package.json` (config — full replacement)

**Analog:** Existing `package.json` (lines 1–18 — read for `"type"`, `"scripts"`, and `"devDependencies"` shape)

**Preserve from existing:**
```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:cov": "vitest run --coverage",
    "typecheck": "tsc --noEmit"
  }
}
```

**Replace `name` / `description` and all dependencies:** The existing package is a "core-only Node.js package" with `vitest@3.2.4` and no Vite/React. The replacement must:
- Change `name` to `"assets-projection"` (remove `-core` suffix — the whole app now)
- Upgrade `"vitest": "3.2.4"` to `"4.1.6"` and `"@vitest/coverage-v8"` to `"4.1.6"`
- Remove `"@types/node"` and `"tsx"` dev deps (no longer needed for a Vite SPA; `"tsx"` was for running TS scripts directly)
- Add all new production and dev deps per RESEARCH.md §"Standard Stack"

---

### `vite.config.ts` (config — replaces `vitest.config.ts`)

**Analog:** `vitest.config.ts` (lines 1–12)

**Existing pattern to preserve (Vitest test config):**
```typescript
// vitest.config.ts (existing) — lines 1-12
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/core/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**'],
      exclude: ['src/core/__tests__/**'],
    },
  },
});
```

**New pattern:** Expand `include` to cover new `src/state/__tests__/` and update coverage targets. Import from `vite` not `vitest/config`. Note: `vitest.config.ts` must be deleted when `vite.config.ts` is created (they cannot coexist).

```typescript
// vite.config.ts — full replacement pattern (RESEARCH.md §"Scaffold: vite.config.ts")
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
    environment: 'node',   // model tests are framework-free; no DOM needed
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/state/**'],
      exclude: ['src/**/__tests__/**'],
    },
  },
});
```

---

### `tsconfig.json` (config — minimal modification)

**Analog:** `tsconfig.json` (lines 1–14 — existing, read in full)

**Existing pattern:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**Add one field:** `"jsx": "react-jsx"` to `compilerOptions`. All other fields remain identical. This is the correct setting for the React 17+ JSX transform used by `@vitejs/plugin-react`.

---

### `src/state/selectors.ts` (utility, transform)

**Analog:** `src/core/relativePosition.ts` (lines 1–64)

**Import pattern** (lines 22–23 of relativePosition.ts):
```typescript
import type { YearSnapshot, ProjectionResult } from './types.js';
```
Selectors follow the same `import type` convention. They import from `../core/types.js` (not from `../data/`), keeping the architecture boundary clean.

**Core function pattern** (lines 44–64 of relativePosition.ts):
```typescript
// Pure function — accepts typed result, returns typed output. No side effects.
// No framework imports. Accepts injected data, never fetches or calls engine.
export function deriveShares(
  series: YearSnapshot[],
): Array<{ year: number; userShare: number; userRank: number }> {
  return series.map((snap) => {
    const userRank = snap.userPercentile * 100;
    // ... pure transform
    return { year: snap.year, userShare, userRank };
  });
}
```

**Selectors module pattern** — four exported pure functions, each accepting `ProjectionResult` (and `yAxisType` where needed), returning a typed value. Never call `projectionEngine` internally:

```typescript
// src/state/selectors.ts — module pattern
import type { EChartsOption } from 'echarts';
import type { ProjectionResult, SourceRecord } from '../core/types.js';

// Each selector: pure function, typed I/O, no side effects, no framework imports
export function selectTimeSeriesOption(
  result: ProjectionResult,
  yAxisType: 'log' | 'value',
): EChartsOption { /* ... */ }

export function selectDivergenceOption(
  result: ProjectionResult,
  yAxisType: 'log' | 'value',
): EChartsOption { /* ... */ }

export function selectRelPosOption(
  result: ProjectionResult,
): EChartsOption { /* ... */ }

export function selectCitationFooter(
  sources: Record<string, SourceRecord>,
): SourceRecord[] { /* ... */ }

// Formatting helpers — defined once in this file, used by all selectors
export function formatWealth(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
}
```

**Log axis zero-guard pattern** (RESEARCH.md Pattern 4):
```typescript
// Applied in selectTimeSeriesOption and selectDivergenceOption when yAxisType === 'log'
yAxis: {
  type: yAxisType,
  min: yAxisType === 'log' ? 1 : undefined,  // guard against log(0)
},
// AND in series data:
data: result.series.map(s => [s.year, yAxisType === 'log' ? Math.max(1, s.userWealth) : s.userWealth])
```

**Tier-threshold markLine pattern** (RESEARCH.md Pattern 5 — for `selectRelPosOption`):
```typescript
// Chart 3 Y axis is userRank (0–100); thresholds at 50, 90, 99, 99.9
markLine: {
  silent: true,
  symbol: 'none',
  lineStyle: { color: '#CBD5E1', opacity: 0.3, type: 'dashed', width: 1 },
  label: { fontSize: 14, color: '#94A3B8' },
  data: [
    { yAxis: 50, name: 'p50' },
    { yAxis: 90, name: 'p90' },
    { yAxis: 99, name: 'p99' },
    { yAxis: 99.9, name: 'p99.9' },
  ],
},
```

**Combined tooltip formatter pattern** (RESEARCH.md Pattern 3 — for `selectDivergenceOption`):
```typescript
// Use result.series[dataIndex] and result.relativePosition[dataIndex] by index
// (not by year lookup) — the data arrays are parallel and index-aligned
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
    // ... build HTML string from snap + relPos fields
  },
},
```

**Architecture boundary constraint** (from `invariants.test.ts` lines 55–79): `selectors.ts` must not import from `src/core/engine.ts` directly. It accepts `ProjectionResult` as a parameter — the composition root (`HarnessPage.tsx`) calls the engine and passes the result down.

---

### `src/state/__tests__/selectors.test.ts` (test)

**Analog:** `src/core/__tests__/goldenMaster.test.ts` (lines 1–203) — exact match in structure

**Import pattern** (lines 11–19 of goldenMaster.test.ts):
```typescript
import { describe, it, expect } from 'vitest';
import { projectionEngine } from '../engine.js';
import {
  analyticOrdinaryAnnuity,
  relErr,
  makeSyntheticParams,
  synParam,
  syntheticInputs,
} from './testUtils.js';
```

Selectors test imports:
```typescript
import { describe, it, expect } from 'vitest';
import {
  selectTimeSeriesOption,
  selectDivergenceOption,
  selectRelPosOption,
  selectCitationFooter,
  formatWealth,
} from '../selectors.js';
import { makeSyntheticParams, syntheticInputs } from '../../core/__tests__/testUtils.js';
import { projectionEngine } from '../../core/engine.js';
import { SOURCES } from '../../data/sources.js';
```

**Test structure pattern** (lines 37–59 of goldenMaster.test.ts):
```typescript
describe('VIZ-01: selectTimeSeriesOption', () => {
  it('returns EChartsOption with xAxis, yAxis, series, tooltip', () => {
    const params = makeSyntheticParams({ horizon: 5 });
    const result = projectionEngine(syntheticInputs, params);
    const option = selectTimeSeriesOption(result, 'value');
    expect(option.xAxis).toBeDefined();
    expect(option.yAxis).toBeDefined();
    expect(Array.isArray(option.series)).toBe(true);
  });
  // ...
});
```

Key test cases to cover (from RESEARCH.md §"Phase Requirements → Test Map"):
- VIZ-01: `selectTimeSeriesOption` returns EChartsOption with correct series data
- VIZ-02: `yAxisType='log'` → `yAxis.type: 'log'` and `min: 1`; `'value'` → `min: undefined`
- VIZ-03: Tooltip formatter includes year, wealth, userRank, tier
- VIZ-04: `selectDivergenceOption` returns 5 series with correct palette colors
- VIZ-05: `selectRelPosOption` maps `relativePosition[].userRank`; markLine has 4 entries at 50/90/99/99.9
- VIZ-06: `selectCitationFooter` returns entries from SOURCES with `sourceName` and `url` populated

---

### `src/state/store.ts` (store)

**Analog:** None in codebase. Use RESEARCH.md Pattern 6.

```typescript
// src/state/store.ts — Phase 3 minimal version (RESEARCH.md Pattern 6)
// Phase 3: read-only from DEFAULTS; Phase 4 will add setInputs/setParams actions
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

The harness reads `useProjectionStore.getState()` once — no live reactivity in Phase 3.

---

### `src/ui/HarnessPage.tsx` (component, request-response)

**Analog:** `src/core/__tests__/invariants.test.ts` (lines 220–245) — partial match. The invariants test is the only file that calls `projectionEngine` with `DEFAULTS` as the composition root.

**Composition root pattern** (lines 221–229 of invariants.test.ts):
```typescript
// invariants.test.ts — the existing "call engine with DEFAULTS" pattern
import { DEFAULTS } from '../../data/defaults.js';
const defaultsInputs = {
  currentWealth: DEFAULTS.anchors.median.value,
  annualSavings: DEFAULTS.savings.value,
};
// ...
const result = projectionEngine(defaultsInputs, DEFAULTS);
```

**HarnessPage composition root pattern:**
```typescript
// src/ui/HarnessPage.tsx — Phase 3 dev harness
// Calls engine once at top level; passes ProjectionResult to chart components as props.
// Phase 4 will move engine call into a Zustand subscription for live recompute.
import { useMemo, useState } from 'react';
import { projectionEngine } from '../core/engine.js';
import { DEFAULTS } from '../data/defaults.js';
import { SOURCES } from '../data/sources.js';
import {
  selectTimeSeriesOption,
  selectDivergenceOption,
  selectRelPosOption,
  selectCitationFooter,
} from '../state/selectors.js';
import { TimeSeriesChart } from '../viz/TimeSeriesChart.js';
import { DivergenceChart } from '../viz/DivergenceChart.js';
import { RelativePosChart } from '../viz/RelativePosChart.js';
import { LogLinearToggle } from './LogLinearToggle.js';
import { CitationFooter } from './CitationFooter.js';

const HARNESS_INPUTS = { currentWealth: 120_000, annualSavings: 6_000 };
const result = projectionEngine(HARNESS_INPUTS, DEFAULTS); // called once at module level

export function HarnessPage() {
  const [yAxisType, setYAxisType] = useState<'log' | 'value'>('log'); // D-07: default log

  const tsOption = useMemo(() => selectTimeSeriesOption(result, yAxisType), [yAxisType]);
  const divOption = useMemo(() => selectDivergenceOption(result, yAxisType), [yAxisType]);
  const relOption = useMemo(() => selectRelPosOption(result), []);
  const citations  = useMemo(() => selectCitationFooter(SOURCES), []);

  return (
    <main className="...">
      {/* toggle + charts + footer */}
    </main>
  );
}
```

**Tailwind class pattern:** `className` strings use Tailwind v4 utility classes. Follow the spacing scale from `03-UI-SPEC.md`: `p-4` (16px), `gap-6` (24px between charts), `mb-12` (48px above footer).

---

### `src/viz/TimeSeriesChart.tsx`, `src/viz/DivergenceChart.tsx`, `src/viz/RelativePosChart.tsx` (components)

**Analog:** None in codebase — first React components. Use RESEARCH.md Pattern 2.

**Chart component pattern:**
```typescript
// All three charts share this thin-wrapper pattern (RESEARCH.md Pattern 2)
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
      notMerge={true}   // REQUIRED: prevents stale axis type on yAxisType toggle
      style={{ height: 320, width: '100%', ...style }}
    />
  );
}
```

**Critical constraint:** `notMerge={true}` is mandatory. Without it, toggling `yAxisType` from `'log'` to `'value'` leaves stale axis settings (RESEARCH.md Pitfall 2).

**RelativePosChart extra:** Must render the D-11 fixed neutral caption as a sibling `<p>` element below the `ReactECharts` instance — NOT inside the ECharts option. This is a rendered DOM element, not a chart annotation:
```typescript
export function RelativePosChart({ option, caption }: Props) {
  return (
    <div>
      <ReactECharts option={option} notMerge={true} style={{ height: 320, width: '100%' }} />
      <p className="text-base font-normal text-slate-600 mt-2">{caption}</p>
    </div>
  );
}
```

---

### `src/ui/LogLinearToggle.tsx` (component, event-driven)

**Analog:** None in codebase. Simple two-segment toggle.

**Pattern:**
```typescript
interface Props {
  value: 'log' | 'value';
  onChange: (next: 'log' | 'value') => void;
}

export function LogLinearToggle({ value, onChange }: Props) {
  // Two buttons, role="group", aria-pressed on each segment.
  // Active segment: bg-teal-700 text-white (accent #0F766E per UI-SPEC)
  // Inactive segment: bg-white text-slate-600
}
```

---

### `src/ui/CitationFooter.tsx` (component, transform)

**Analog:** `src/data/sources.ts` (lines 35–227) — partial match. CitationFooter reads the same `SourceRecord` shape that `sources.ts` defines.

**Data shape to render** (from sources.ts lines 53–77):
```typescript
// Each SOURCES entry has: sourceName, url (optional), figureUsed, basis, definition, yearVintage
// CitationFooter renders: sourceName as link text, url as href (when present)
// Copywriting contract (03-UI-SPEC.md): "Default parameters sourced from: [list]. See sources for definitions and caveats."
```

**Component pattern:**
```typescript
import type { SourceRecord } from '../core/types.js';

interface Props {
  citations: SourceRecord[];
}

export function CitationFooter({ citations }: Props) {
  return (
    <footer className="mt-12 text-sm text-slate-600 font-normal">
      <p>
        Default parameters sourced from:{' '}
        {citations.map((c, i) => (
          <span key={c.sourceName}>
            {c.url
              ? <a href={c.url} target="_blank" rel="noopener noreferrer">{c.sourceName}</a>
              : <span>{c.sourceName}</span>}
            {i < citations.length - 1 ? '; ' : '.'}
          </span>
        ))}
        {' '}See sources for definitions and caveats.
      </p>
    </footer>
  );
}
```

---

### `docs/NEUTRALITY-STYLE-GUIDE.md` (static artifact)

**Analog:** None. Plain markdown artifact authored by the executor.

**Required sections** (from CONTEXT.md D-02/D-03/D-04 and 03-UI-SPEC.md):
1. Copy lexicon — banned value-laden words/verbs/adjectives, alarm punctuation, blame/virtue framing, with neutral rewrites
2. Chart-semantic rules — neutral axis/series labels, relative-position caption rule, log-scale explanatory-copy tone
3. Brief palette clause — "no semantic red/green; color must never imply good/bad" (D-03)
4. The D-11 relative-position caption text (seeded verbatim from 03-UI-SPEC.md for Phase 5 gate)

**D-11 caption text to seed** (from 03-UI-SPEC.md §"Copywriting Contract"):
> "This shows the user's rank within the distribution. Rank can move down while the user's real wealth still grows — every tier's wealth increases over this horizon. See the wealth-by-tier chart above for absolute amounts."

---

## Shared Patterns

### Module Resolution and Import Style
**Source:** All existing `src/core/` files — universally applied
**Apply to:** All new TypeScript files

```typescript
// .js extension on all relative imports (required for ES module + "moduleResolution: bundler")
import type { ProjectionResult } from '../core/types.js';
import { DEFAULTS } from '../data/defaults.js';
// NOT: '../core/types' (without .js) — TypeScript "bundler" mode requires explicit extensions
```

### Type-Only Imports
**Source:** `src/core/relativePosition.ts` (line 22), `src/data/defaults.ts` (line 38), `src/data/sources.ts` (line 27)
**Apply to:** All new files that import from `core/types.ts`

```typescript
import type { SourceRecord } from '../core/types.js';
// Use "import type" for all type-only imports (verbatimModuleSyntax: true in tsconfig)
```

### Architecture Boundary (enforced by `invariants.test.ts`)
**Source:** `src/core/__tests__/invariants.test.ts` (lines 43–45, the FORBIDDEN_PATTERN regex)
**Apply to:** All new files in `src/state/`, `src/viz/`, `src/ui/`

```typescript
// The import boundary scanner checks for: /\breact\b|\breact-dom\b|from ['"]fs|from ['"]node:|fetch\s*\(|Date\.now\b|Math\.random\b|document\.|window\./
// New rule (not yet in the scanner): src/core/ must not import from src/state/, src/viz/, or src/ui/
// src/viz/ and src/ui/ SHOULD import React — the scanner only targets src/core/
// src/state/selectors.ts must NOT import from src/core/engine.ts; accepts ProjectionResult as param
```

### Color Palette Constants
**Source:** `03-UI-SPEC.md` §"Color" — apply to all ECharts options in `selectors.ts`
**Apply to:** `src/state/selectors.ts` (color values for all series)

```typescript
// Define once as constants in selectors.ts:
const COLORS = {
  user: '#0F766E',     // teal-700 — user trajectory across all three charts
  median: '#64748B',   // slate-500
  top10: '#7C3AED',    // violet-600
  top1: '#2563EB',     // blue-600
  top01: '#0891B2',    // cyan-600
  tierBand: '#CBD5E1', // slate-300 for markLine reference bands
} as const;
```

### Typography in ECharts Options
**Source:** `03-UI-SPEC.md` §"Typography" — apply to all axis and tooltip config in `selectors.ts`

```typescript
// All ECharts text elements must match the UI-SPEC typography contract:
// Axis names: Label 14/400
// Axis labels: Label 14/400 + tabular nums
nameTextStyle: { fontSize: 14, fontWeight: 400 },
axisLabel: { fontSize: 14, fontWeight: 400 },
// ECharts default is 12px — must be explicitly overridden
```

### Vitest Test Structure
**Source:** `src/core/__tests__/goldenMaster.test.ts` (lines 11–19, 37–40)
**Apply to:** `src/state/__tests__/selectors.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
// Named imports only — no default import from vitest
// describe() wraps each requirement ID (VIZ-01, VIZ-02, etc.)
// it() states the observable behavior in plain language
```

---

## No Analog Found

Files with no close codebase match (planner should use RESEARCH.md patterns directly):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `index.html` | config | — | No HTML files exist yet; Vite HTML entry is boilerplate (RESEARCH.md §"Scaffold: src/main.tsx") |
| `src/main.tsx` | config | — | No React entry point exists; pattern in RESEARCH.md §"Scaffold: src/main.tsx" |
| `src/index.css` | config | — | No CSS exists; one line: `@import "tailwindcss"` (RESEARCH.md §"Scaffold: src/index.css") |
| `src/state/store.ts` | store | — | No Zustand store exists; Pattern 6 in RESEARCH.md is the authority |
| `src/ui/LogLinearToggle.tsx` | component | event-driven | No interactive components exist; simple two-button toggle |
| `docs/NEUTRALITY-STYLE-GUIDE.md` | artifact | — | Plain markdown prose; no code analog; authored against CONTEXT.md D-02/D-03/D-04 and 03-UI-SPEC.md |

---

## Metadata

**Analog search scope:** `src/core/`, `src/data/`, `src/core/__tests__/`, root config files
**Files scanned:** 18 existing files (all current source files + config)
**Pattern extraction date:** 2026-05-16

**Critical constraints for planner:**
1. `vitest.config.ts` must be DELETED before `vite.config.ts` is created — they cannot coexist
2. Do NOT install `@types/echarts` — ECharts 6 ships built-in types; `import type { EChartsOption } from 'echarts'`
3. `notMerge={true}` on every `ReactECharts` instance — required for yAxisType toggle correctness
4. `src/state/selectors.ts` must NOT call `projectionEngine` — it accepts `ProjectionResult` as a parameter
5. D-11 caption for Chart 3 is a `<p>` DOM element, not an ECharts annotation
6. All `relativePosition[].userRank` values are already 0–100 (multiplied by 100 in `relativePosition.ts` line 49); do NOT re-multiply
