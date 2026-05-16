// Source: 04-PATTERNS.md §"HorizonSlider" and 04-UI-SPEC.md §"Horizon control"
// D-05: linear (not log) slider, range 10–60, default 35.
// Live year readout adjacent to the slider label (tabular-nums).

interface Props {
  value: number;
  onChange: (h: number) => void;
}

export function HorizonSlider({ value, onChange }: Props) {
  return (
    <div>
      {/* Label 14/400 — control label + live readout (tabular-nums) */}
      <div className="flex justify-between text-sm font-normal text-slate-600 mb-1">
        <span>Projection horizon</span>
        <span className="tabular-nums text-sm font-normal text-slate-600">{value} years</span>
      </div>
      {/* Linear slider (D-05) */}
      <input
        type="range"
        min={10}
        max={60}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-teal-700"
      />
      {/* Label 14/400 — scope notice (mirrors LogLinearToggle line 43) */}
      <p className="text-sm font-normal text-slate-500 mt-1">10–60 years. Default is 35.</p>
    </div>
  );
}
