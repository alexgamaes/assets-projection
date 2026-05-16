// Source: RESEARCH.md §"Pattern Map — src/ui/HarnessPage.tsx"
// D-05: Phase 3 dev harness renders charts from hardcoded DEFAULTS; no input UI.
// D-06: All three charts stacked vertically with equal card treatment (no visual hierarchy).
// D-07: One shared log/linear toggle, defaulting to log, governs the two wealth charts.
// Phase 4 replaces this with the real 2-input shell and live recompute.
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

// D-11 caption text — canonical text from NEUTRALITY-STYLE-GUIDE.md §"Relative-Position Caption Rule"
const REL_POS_CAPTION =
  "This shows the user's rank within the distribution. Rank can move down while the user's real wealth still grows — every tier's wealth increases over this horizon. See the wealth-by-tier chart above for absolute amounts.";

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

  // D-06: Chart 2 uses the same yAxisType toggle (but Chart 3 does not — D-07/D-09)
  const divOption = useMemo(
    () => selectDivergenceOption(result, yAxisType),
    [yAxisType],
  );

  // D-07/D-09: Chart 3 is always linear — memoized with no deps
  const relOption = useMemo(() => selectRelPosOption(result), []);

  // VIZ-06: Citation footer — computed once
  const citations = useMemo(() => selectCitationFooter(SOURCES), []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      {/* Display 28/600 */}
      <h1 className="text-[28px] font-semibold text-slate-900 mb-8">
        Wealth projection — model output preview
      </h1>

      {/* D-07: shared log/linear toggle above the two wealth charts */}
      <div className="mt-8 mb-4">
        <LogLinearToggle value={yAxisType} onChange={setYAxisType} />
      </div>

      {/* VIZ-01: Chart 1 — User wealth trajectory — equal card treatment (D-06) */}
      <section className="bg-slate-50 border border-slate-200 p-4 rounded">
        {/* Heading 20/600 */}
        <h2 className="text-[20px] font-semibold text-slate-800 mb-4">
          Projected wealth over time
        </h2>
        <TimeSeriesChart option={tsOption} />
      </section>

      {/* VIZ-04: Chart 2 — Divergence overlay — equal card treatment (D-06) */}
      <section className="mt-6 bg-slate-50 border border-slate-200 p-4 rounded">
        {/* Heading 20/600 — identical treatment to Chart 1 */}
        <h2 className="text-[20px] font-semibold text-slate-800 mb-4">
          Wealth by tier over time
        </h2>
        <DivergenceChart option={divOption} />
      </section>

      {/* VIZ-05: Chart 3 — Relative-position trajectory — equal card treatment (D-06) */}
      <section className="mt-6 bg-slate-50 border border-slate-200 p-4 rounded">
        {/* Heading 20/600 — identical treatment to Charts 1 and 2 */}
        <h2 className="text-[20px] font-semibold text-slate-800 mb-4">
          Position in the wealth distribution over time
        </h2>
        {/* D-11: caption is passed as a prop — RelativePosChart renders it as a DOM p element */}
        <RelativePosChart option={relOption} caption={REL_POS_CAPTION} />
      </section>

      {/* VIZ-06: Citation footer */}
      <CitationFooter citations={citations} />
    </main>
  );
}
