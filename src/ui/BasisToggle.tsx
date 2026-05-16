// Source: 04-PATTERNS.md §"BasisToggle" — structural clone of LogLinearToggle.tsx
// D-08: two-segment control: 'Real' and 'Nominal'; accent indicates selection, not correctness.
// Neutrality: copy never implies one basis is better (04-UI-SPEC.md §Color).

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
      {/* Body 16/400 — explanatory copy (mirrors LogLinearToggle lines 47–50) */}
      <p className="text-base font-normal text-slate-600 mt-2">
        Real shows amounts in today&apos;s purchasing power. Nominal shows future dollar amounts without
        adjusting for inflation.
      </p>
    </div>
  );
}
