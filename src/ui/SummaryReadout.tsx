// Source: 04-PATTERNS.md §"SummaryReadout" and 04-UI-SPEC.md §"Summary readout labels"
// D-13: three required metrics (endingWealth, growthMultiple, CAGR)
// D-14: rank delta ALWAYS paired with wealth-growth clause — delegated to formatRankDelta
// D-15: neutral disclosure (rank can move down while wealth grows)
// D-09: money-illusion caption only when nominal — delegated to formatMoneyIllusionCaption
// No store imports — all data received as props; store wiring is ControlPanel/AppShell's job.
import type { Summary } from '../state/selectors.js';
import { formatWealth } from '../state/selectors.js';
import { formatRankDelta, formatMoneyIllusionCaption } from './summaryFormatters.js';

interface Props {
  summary: Summary;
  basis: 'real' | 'nominal';
  inflationRate: number;         // for D-09 nominal caption — cite the rate
  inflationSourceName: string;   // from SourceRecord.sourceName in sources.ts
}

export function SummaryReadout({ summary, basis, inflationRate, inflationSourceName }: Props) {
  // D-09: caption is '' when basis=real (safe to use in truthiness check)
  const moneyIllusionCaption = formatMoneyIllusionCaption(basis, inflationRate, inflationSourceName);

  return (
    <section className="bg-slate-50 border border-slate-200 p-4 rounded">
      {/* Heading 20/600 — section heading (04-UI-SPEC.md §Typography) */}
      <h2 className="text-[20px] font-semibold text-slate-800 mb-4">Summary</h2>

      {/* D-13: three required metrics — labels in Label 14/400, values in Body 16/600 */}
      <dl className="space-y-2">
        <div>
          <dt className="text-sm font-normal text-slate-600">
            {basis === 'nominal' ? 'Ending wealth (nominal)' : 'Ending wealth (real)'}
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
            {(summary.cagr * 100).toFixed(1)}% / yr
          </dd>
        </div>
      </dl>

      {/* D-14: rank delta — ALWAYS paired with wealth-growth clause via formatRankDelta */}
      <p className="text-sm font-normal text-slate-600 mt-4 tabular-nums">
        {formatRankDelta(summary.startRank, summary.endRank, summary.growthMultiple)}
      </p>

      {/* D-15: neutral disclosure — rank can move down while wealth grows */}
      <p className="text-base font-normal text-slate-600 mt-2">
        Rank can move down while real wealth still grows — every tier&apos;s wealth increases over this
        horizon. See the wealth-by-tier chart for absolute amounts.
      </p>

      {/* D-09: money-illusion caption — rendered via formatMoneyIllusionCaption ('' when basis=real) */}
      {moneyIllusionCaption && (
        <p className="text-base font-normal text-slate-600 mt-2">
          {moneyIllusionCaption}
        </p>
      )}
    </section>
  );
}
