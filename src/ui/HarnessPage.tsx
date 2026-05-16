// Source: RESEARCH.md §"Pattern Map — src/ui/HarnessPage.tsx"
// D-05: Phase 3 dev harness renders three charts from hardcoded DEFAULTS; no input UI.
// D-06: Three charts stacked vertically, all visible at once.
// D-07: One shared linear/log toggle, defaulting to log.
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

// D-11 neutral caption (from docs/NEUTRALITY-STYLE-GUIDE.md)
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
  const divOption = useMemo(
    () => selectDivergenceOption(result, yAxisType),
    [yAxisType],
  );
  const relOption = useMemo(() => selectRelPosOption(result), []);
  const citations = useMemo(() => selectCitationFooter(SOURCES), []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-normal text-slate-800 mb-2">
        Assets Projection
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Dev harness — hardcoded defaults. Phase 4 adds input UI.
      </p>

      {/* D-07: shared log/linear toggle */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-slate-600">Y-axis scale:</span>
        <LogLinearToggle value={yAxisType} onChange={setYAxisType} />
      </div>

      {/* D-06: three charts stacked, all visible */}
      <div className="flex flex-col gap-6">
        {/* VIZ-01: Time-series wealth trajectory */}
        <section>
          <h2 className="text-base font-normal text-slate-700 mb-2">
            Your wealth over time
          </h2>
          <TimeSeriesChart option={tsOption} />
        </section>

        {/* VIZ-04: Multi-tier divergence overlay */}
        <section>
          <h2 className="text-base font-normal text-slate-700 mb-2">
            Wealth by tier
          </h2>
          <DivergenceChart option={divOption} />
        </section>

        {/* VIZ-05: Relative-position trajectory */}
        <section>
          <h2 className="text-base font-normal text-slate-700 mb-2">
            Your rank over time
          </h2>
          {/* D-11: caption passed as prop, rendered as fixed DOM element */}
          <RelativePosChart option={relOption} caption={REL_POS_CAPTION} />
        </section>
      </div>

      {/* VIZ-06: Citation footer */}
      <CitationFooter citations={citations} />
    </main>
  );
}
