// Source: 04-PATTERNS.md §"LogSliderInput" and 04-UI-SPEC.md §"Color", §"Interaction & Control Contract"
// D-01/D-04: log-scale range slider paired with a numeric field.
// D-04: slider spans log10 space so $2k…$2M is perceptually even.
//        Typed values outside the slider span are passed through as-is.
// T-04-02-01: onChange guard rejects NaN/negative/non-finite (falls back to 0).
import { formatWealth } from '../state/selectors.js';

interface Props {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (v: number) => void;
}

export function LogSliderInput({ value, min, max, label, onChange }: Props) {
  return (
    <label className="block">
      {/* Label 14/400 — control label (04-UI-SPEC.md §Typography) */}
      <span className="text-sm font-normal text-slate-600 block mb-1">{label}</span>
      {/* Tabular numerals enforced on value readout (04-UI-SPEC.md §Typography) */}
      <span className="text-sm font-normal text-slate-500 tabular-nums block mb-1">
        {formatWealth(value)}
      </span>
      {/* Log-scale slider: operates in log10 space (D-04) */}
      <input
        type="range"
        min={Math.log10(min)}
        max={Math.log10(max)}
        step={0.001}
        value={Math.log10(Math.min(Math.max(value, min), max))}
        onChange={(e) => onChange(Math.round(10 ** Number(e.target.value)))}
        className="w-full accent-teal-700"
      />
      {/* Numeric field: out-of-slider-range values passed through (D-04); NaN/negative rejected (T-04-02-01) */}
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={0}
        className="w-full border border-slate-200 rounded px-2 py-1 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-700 mt-2"
        onChange={(e) => {
          const n = Number(e.target.value);
          // T-04-02-01: clamp guard — keeps engine from receiving NaN/negative/non-finite
          onChange(Number.isFinite(n) && n >= 0 ? n : 0);
        }}
      />
    </label>
  );
}
