// Source: RESEARCH.md §"Pattern Map — src/ui/LogLinearToggle.tsx"
// D-07: one shared linear/log toggle, defaulting to log
// Governs only the two wealth-magnitude charts (time-series + divergence)
interface Props {
  value: 'log' | 'value';
  onChange: (next: 'log' | 'value') => void;
}

export function LogLinearToggle({ value, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Y-axis scale"
      className="inline-flex rounded border border-slate-300 overflow-hidden text-sm font-normal"
    >
      <button
        type="button"
        aria-pressed={value === 'log'}
        onClick={() => onChange('log')}
        className={`px-3 py-1.5 transition-colors ${
          value === 'log'
            ? 'bg-teal-700 text-white'
            : 'bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        Logarithmic
      </button>
      <button
        type="button"
        aria-pressed={value === 'value'}
        onClick={() => onChange('value')}
        className={`px-3 py-1.5 transition-colors ${
          value === 'value'
            ? 'bg-teal-700 text-white'
            : 'bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        Linear
      </button>
    </div>
  );
}
