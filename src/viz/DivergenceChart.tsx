// Source: RESEARCH.md Pattern 2 — thin ReactECharts wrapper
// VIZ-04: multi-tier comparison overlay (user + median + top10 + top1 + top0.1)
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { CSSProperties } from 'react';

interface Props {
  option: EChartsOption;
  style?: CSSProperties;
}

export function DivergenceChart({ option, style }: Props) {
  return (
    <ReactECharts
      option={option}
      notMerge={true} // REQUIRED: prevents stale axis type on yAxisType toggle (RESEARCH.md Pitfall 2)
      style={{ height: 320, width: '100%', ...style }}
    />
  );
}
