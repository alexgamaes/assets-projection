// Source: RESEARCH.md Pattern 2 — thin ReactECharts wrapper
// VIZ-01: renders the user's wealth trajectory over the horizon
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { CSSProperties } from 'react';

interface Props {
  option: EChartsOption;
  style?: CSSProperties;
}

export function TimeSeriesChart({ option, style }: Props) {
  return (
    <ReactECharts
      option={option}
      notMerge={true} // REQUIRED: prevents stale axis type on yAxisType toggle (RESEARCH.md Pitfall 2)
      style={{ height: 320, width: '100%', ...style }}
    />
  );
}
