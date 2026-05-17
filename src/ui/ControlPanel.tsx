// Source: 04-PATTERNS.md §"ControlPanel.tsx" — thin container composing input controls
// Reads store selectors; dispatches setInputs/setHorizon/setBasis.
// Props: yAxisType forwarded from AppShell (shared toggle, Phase 3 D-07 pattern).
import { useProjectionStore } from '../state/store.js';
import { LogSliderInput } from './LogSliderInput.js';
import { HorizonSlider } from './HorizonSlider.js';
import { BasisToggle } from './BasisToggle.js';
import { LogLinearToggle } from './LogLinearToggle.js';

interface Props {
  yAxisType: 'log' | 'value';
  onYAxisTypeChange: (next: 'log' | 'value') => void;
}

export function ControlPanel({ yAxisType, onYAxisTypeChange }: Props) {
  const { inputs, params, basis, setInputs, setHorizon, setBasis } = useProjectionStore();

  return (
    <div className="space-y-4">
      {/* Heading 20/600 — control panel section heading (04-UI-SPEC.md typography) */}
      <h2 className="text-[20px] font-semibold text-slate-800">Inputs</h2>

      {/* D-01/D-04: Current wealth — log slider, $1k–$10M */}
      <LogSliderInput
        label="Current wealth"
        value={inputs.currentWealth}
        min={1_000}
        max={10_000_000}
        onChange={(v) => setInputs({ currentWealth: v })}
      />

      {/* D-04: Annual savings — log slider, $0–$2M (starts at 0) */}
      <LogSliderInput
        label="Annual savings"
        value={inputs.annualSavings}
        min={0}
        max={2_000_000}
        onChange={(v) => setInputs({ annualSavings: v })}
      />

      {/* D-05: Projection horizon — linear slider, 10–60 years */}
      <HorizonSlider value={params.horizon} onChange={setHorizon} />

      {/* D-08: Real/nominal basis toggle */}
      <BasisToggle value={basis} onChange={setBasis} />

      {/* D-07: Log/linear scale toggle (shared, carried from Phase 3) */}
      <LogLinearToggle value={yAxisType} onChange={onYAxisTypeChange} />
    </div>
  );
}
