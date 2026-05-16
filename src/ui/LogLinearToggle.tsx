// Source: RESEARCH.md §"Pattern Map — src/ui/LogLinearToggle.tsx"
// D-07: one shared log/linear toggle, defaulting to log
// Governs only the two wealth-magnitude charts (time-series + divergence)
interface Props {
  value: 'log' | 'value';
  onChange: (next: 'log' | 'value') => void;
}

export function LogLinearToggle({ value, onChange }: Props) {
  return (
    <div>
      <div
        role="group"
        aria-label="Y-axis scale"
        className="inline-flex rounded border border-slate-300 overflow-hidden"
      >
        <button
          type="button"
          aria-pressed={value === 'log'}
          onClick={() => onChange('log')}
          className={`px-4 py-1.5 text-sm font-normal transition-colors ${
            value === 'log'
              ? 'bg-teal-700 text-white'
              : 'bg-white text-slate-600 border-r border-slate-200'
          }`}
        >
          Log
        </button>
        <button
          type="button"
          aria-pressed={value === 'value'}
          onClick={() => onChange('value')}
          className={`px-4 py-1.5 text-sm font-normal transition-colors ${
            value === 'value'
              ? 'bg-teal-700 text-white'
              : 'bg-white text-slate-600'
          }`}
        >
          Linear
        </button>
      </div>
      {/* Label 14/400 — scope notice */}
      <p className="text-sm font-normal text-slate-500 mt-1">
        Scale applies to the two wealth charts.
      </p>
      {/* Body 16/400 — explanatory copy (03-UI-SPEC.md §"Copywriting Contract") */}
      <p className="text-base font-normal text-slate-600 mt-2">
        Log scale: equal vertical distance represents equal percentage change, making compounding
        visible. Linear scale: equal vertical distance represents equal absolute change.
      </p>
    </div>
  );
}
