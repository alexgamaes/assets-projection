// Source: RESEARCH.md §"Pattern Map — src/ui/HarnessPage.tsx"
// D-05: Phase 3 dev harness renders charts from hardcoded DEFAULTS; no input UI.
// D-07: One shared log/linear toggle, defaulting to log, governs two wealth charts.
// Phase 4 replaces this with the real 2-input shell and live recompute.
import { useMemo, useState } from 'react';
import { projectionEngine } from '../core/engine.js';
import { DEFAULTS } from '../data/defaults.js';
import { SOURCES } from '../data/sources.js';
import {
  selectTimeSeriesOption,
  selectCitationFooter,
} from '../state/selectors.js';
import { TimeSeriesChart } from '../viz/TimeSeriesChart.js';
import { LogLinearToggle } from './LogLinearToggle.js';

// Call engine once at module level — Phase 4 will move into Zustand subscription
const HARNESS_INPUTS = { currentWealth: 120_000, annualSavings: 6_000 };
const result = projectionEngine(HARNESS_INPUTS, DEFAULTS);

export function HarnessPage() {
  // D-07: default to log scale
  const [yAxisType, setYAxisType] = useState<'log' | 'value'>('log');

  const tsOption = useMemo(
    () => selectTimeSeriesOption(result, yAxisType),
    [yAxisType],
  );

  // Citations computed once — selectCitationFooter used for future footer (Plan 03)
  const _citations = useMemo(() => selectCitationFooter(SOURCES), []);
  void _citations;

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      {/* Display 28/600 */}
      <h1 className="text-[28px] font-semibold text-slate-900 mb-8">
        Wealth projection — model output preview
      </h1>

      {/* D-07: shared log/linear toggle above Chart 1 */}
      <div className="mt-8 mb-4">
        <LogLinearToggle value={yAxisType} onChange={setYAxisType} />
      </div>

      {/* VIZ-01: Time-series wealth trajectory — card treatment */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded">
        {/* Heading 20/600 */}
        <h2 className="text-[20px] font-semibold text-slate-800 mb-4">
          Projected wealth over time
        </h2>
        <TimeSeriesChart option={tsOption} />
      </div>

      {/* TODO (Plan 03): Chart 2 — Divergence overlay */}
      <div className="mt-6 bg-slate-50 border border-slate-200 p-4 rounded opacity-50">
        <h2 className="text-[20px] font-semibold text-slate-800 mb-4">
          Wealth by tier — coming in Plan 03
        </h2>
        <div className="h-10 text-sm text-slate-400">Chart 2 placeholder</div>
      </div>

      {/* TODO (Plan 03): Chart 3 — Relative-position trajectory */}
      <div className="mt-6 bg-slate-50 border border-slate-200 p-4 rounded opacity-50">
        <h2 className="text-[20px] font-semibold text-slate-800 mb-4">
          Your rank over time — coming in Plan 03
        </h2>
        <div className="h-10 text-sm text-slate-400">Chart 3 placeholder</div>
      </div>

      {/* TODO (Plan 03): Citation footer */}
    </main>
  );
}
