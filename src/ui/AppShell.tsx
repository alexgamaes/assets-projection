// Source: 04-PATTERNS.md §"AppShell.tsx" — page-level component
// Holds all projection state, runs memoized computation, composes all sections.
// D-10/D-11: responsive layout — sticky 320px side panel on desktop, stacked on mobile.
// T-04-03-03: projectionEngine wrapped in try/catch — engine errors show neutral diagnostic.
import { useMemo, useState, useDeferredValue } from 'react';
import { projectionEngine } from '../core/engine.js';
import { DEFAULTS, INFLATION_RATE } from '../data/defaults.js';
import { SOURCES } from '../data/sources.js';
import {
  selectTimeSeriesOption,
  selectDivergenceOption,
  selectRelPosOption,
  selectCitationFooter,
  selectReinflated,
  selectSummary,
} from '../state/selectors.js';
import { useProjectionStore } from '../state/store.js';
import { TimeSeriesChart } from '../viz/TimeSeriesChart.js';
import { DivergenceChart } from '../viz/DivergenceChart.js';
import { RelativePosChart } from '../viz/RelativePosChart.js';
import { CitationFooter } from './CitationFooter.js';
import { ControlPanel } from './ControlPanel.js';
import { SummaryReadout } from './SummaryReadout.js';

// D-11 caption text — carried from the Phase 3 harness verbatim (NEUTRALITY-STYLE-GUIDE.md §3)
const REL_POS_CAPTION =
  "This shows the user's rank within the distribution. Rank can move down while the user's real wealth still grows — every tier's wealth increases over this horizon. See the wealth-by-tier chart above for absolute amounts.";

// T-04-03-03: neutral diagnostic string — exact wording required, no stack trace exposed
const ENGINE_ERROR_MSG =
  'Projection unavailable: the model could not produce a result from the current parameters.';

export function AppShell() {
  // Narrow store selectors to minimize re-renders
  const inputs = useProjectionStore((s) => s.inputs);
  const params = useProjectionStore((s) => s.params);
  const basis = useProjectionStore((s) => s.basis);

  // D-07: shared log/linear scale toggle (Phase 3 pattern, local state)
  const [yAxisType, setYAxisType] = useState<'log' | 'value'>('log');

  // ENTRY-02: useDeferredValue keeps slider thumb responsive during recompute
  const deferred = useDeferredValue(inputs);

  // T-04-03-03: REQUIRED try/catch — never expose stack trace to user
  const rawResult = useMemo(() => {
    try {
      return projectionEngine(deferred, params);
    } catch {
      return null;
    }
  }, [deferred, params]);

  // D-06: basis re-inflation is display-layer only — only when rawResult is non-null
  const result = useMemo(
    () => (rawResult !== null ? selectReinflated(rawResult, basis, INFLATION_RATE.value) : null),
    [rawResult, basis],
  );

  // Memoize ECharts options — only when result is non-null
  const tsOption = useMemo(
    () => (result !== null ? selectTimeSeriesOption(result, yAxisType) : null),
    [result, yAxisType],
  );
  const divOption = useMemo(
    () => (result !== null ? selectDivergenceOption(result, yAxisType) : null),
    [result, yAxisType],
  );
  // D-08: Chart 3 uses rawResult — rank is real-basis-independent
  const relOption = useMemo(
    () => (rawResult !== null ? selectRelPosOption(rawResult) : null),
    [rawResult],
  );

  // D-13: summary metrics (only when result is non-null)
  const summary = useMemo(() => (result !== null ? selectSummary(result) : null), [result]);

  // VIZ-06: citation footer — computed once
  const citations = useMemo(() => selectCitationFooter(SOURCES), []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Display 28/600 — page title (04-UI-SPEC.md §Typography) */}
      <h1 className="text-[28px] font-semibold text-slate-900 mb-8">Wealth projection</h1>

      {/*
        D-10: desktop — sticky 320px control panel + scrolling chart column (lg:grid)
        D-11: mobile — full-width block stacked above charts (no bottom sheet, no hidden UI)
        lg breakpoint = 1024px (04-UI-SPEC.md: 320px panel + ≥320px chart need ≥1024px)
      */}
      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-8">
        <aside className="lg:sticky lg:top-8 lg:self-start mb-8 lg:mb-0">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded">
            <ControlPanel yAxisType={yAxisType} onYAxisTypeChange={setYAxisType} />
          </div>
        </aside>

        <main className="space-y-6">
          {rawResult === null ? (
            /* T-04-03-03: neutral diagnostic — no stack trace, no Error.message */
            <p className="text-base font-normal text-slate-600">{ENGINE_ERROR_MSG}</p>
          ) : (
            <>
              {/* D-13/D-14/D-15: summary readout above charts */}
              <SummaryReadout
                summary={summary!}
                basis={basis}
                inflationRate={INFLATION_RATE.value}
                inflationSourceName={INFLATION_RATE.source.sourceName}
              />

              {/* VIZ-01: Chart 1 — User wealth trajectory */}
              <section className="bg-slate-50 border border-slate-200 p-4 rounded">
                <h2 className="text-[20px] font-semibold text-slate-800 mb-4">
                  Projected wealth over time
                </h2>
                <TimeSeriesChart option={tsOption!} />
              </section>

              {/* VIZ-04: Chart 2 — Divergence overlay */}
              <section className="bg-slate-50 border border-slate-200 p-4 rounded">
                <h2 className="text-[20px] font-semibold text-slate-800 mb-4">
                  Wealth by tier over time
                </h2>
                <DivergenceChart option={divOption!} />
              </section>

              {/* VIZ-05: Chart 3 — Relative-position trajectory — uses rawResult (D-08) */}
              <section className="bg-slate-50 border border-slate-200 p-4 rounded">
                <h2 className="text-[20px] font-semibold text-slate-800 mb-4">
                  Position in the wealth distribution over time
                </h2>
                <RelativePosChart option={relOption!} caption={REL_POS_CAPTION} />
              </section>
            </>
          )}

          {/* VIZ-06: Citation footer */}
          <CitationFooter citations={citations} />
        </main>
      </div>
    </div>
  );
}
