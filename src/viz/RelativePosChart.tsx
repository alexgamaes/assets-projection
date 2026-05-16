// Source: RESEARCH.md Pattern 2 — thin ReactECharts wrapper with D-11 fixed caption
// VIZ-05: relative-position trajectory (always linear, D-09)
// D-11: fixed neutral caption always visible directly under this chart
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { CSSProperties } from 'react';

interface Props {
  option: EChartsOption;
  caption: string; // D-11: fixed neutral caption (from NEUTRALITY-STYLE-GUIDE.md)
  style?: CSSProperties;
}

export function RelativePosChart({ option, caption, style }: Props) {
  return (
    <div>
      <ReactECharts
        option={option}
        notMerge={true}
        style={{ height: 320, width: '100%', ...style }}
      />
      {/* D-11: Fixed neutral caption — always visible as a DOM element, not an ECharts annotation */}
      <p className="text-sm font-normal text-slate-600 mt-2">{caption}</p>
    </div>
  );
}
