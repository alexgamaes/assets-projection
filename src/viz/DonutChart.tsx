// VIZ-07: Thin ReactECharts wrapper for the final-year wealth-share donut chart.
// Mirrors RelativePosChart structure exactly. Caption is text-base (16px) per
// UI-SPEC Typography contract (overrides RESEARCH Pattern 5 text-sm).
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { CSSProperties } from 'react';

interface Props {
  option: EChartsOption;
  caption: string; // D-16: mandatory disclosure caption (from SHARE_CAPTION constant)
  style?: CSSProperties;
}

export function DonutChart({ option, caption, style }: Props) {
  return (
    <div>
      <ReactECharts
        option={option}
        notMerge={true}
        style={{ height: 320, width: '100%', ...style }}
      />
      {/* D-16: Fixed neutral caption — always visible as a DOM element, not an ECharts annotation */}
      {/* UI-SPEC: text-base (16px/400/slate-600) — load-bearing neutrality-disclosure tier */}
      <p className="text-base font-normal text-slate-600 mt-2">{caption}</p>
    </div>
  );
}
