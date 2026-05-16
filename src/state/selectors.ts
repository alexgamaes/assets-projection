// Source: RESEARCH.md §"Pattern 1: Selector Function" and §"Pattern Map"
// Plan 02 fills in full EChartsOption construction for VIZ-01/02/03.
import type { EChartsOption } from 'echarts';
import type { CallbackDataParams } from 'echarts/types/dist/shared.js';
import type { ProjectionResult, SourceRecord } from '../core/types.js';

// ---------------------------------------------------------------------------
// Color palette constants (03-UI-SPEC.md §"Color")
// ---------------------------------------------------------------------------
export const COLORS = {
  user: '#0F766E',     // teal-700 — user trajectory across all three charts
  median: '#64748B',   // slate-500
  top10: '#7C3AED',    // violet-600
  top1: '#2563EB',     // blue-600
  top01: '#0891B2',    // cyan-600
  tierBand: '#CBD5E1', // slate-300 for markLine reference bands
} as const;

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Format a wealth value for display.
 * Source: RESEARCH.md §"Selector: wealth number formatter"
 */
export function formatWealth(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Derive a human-readable tier label from a [0,1] percentile fraction.
 * VIZ-03: used in the time-series tooltip.
 * Thresholds: >= 0.999 → 'top 0.1%'; >= 0.99 → 'top 1%'; >= 0.90 → 'top 10%'; else → 'median'
 */
function deriveTier(userPercentile: number): string {
  if (userPercentile >= 0.999) return 'top 0.1%';
  if (userPercentile >= 0.99) return 'top 1%';
  if (userPercentile >= 0.90) return 'top 10%';
  return 'median';
}

// ---------------------------------------------------------------------------
// VIZ-01: Time-series chart selector
// ---------------------------------------------------------------------------

/**
 * selectTimeSeriesOption — maps ProjectionResult to EChartsOption for Chart 1.
 * VIZ-01: user trajectory over horizon; VIZ-02: log/linear toggle.
 * VIZ-03: tooltip formatter shows year, wealth, rank, and tier.
 * T-03-04: log axis zero-guard applied (Math.max(1, value) + yAxis.min=1).
 * T-03-03: tooltip strings built only from numeric model output — no user-supplied strings.
 */
export function selectTimeSeriesOption(
  result: ProjectionResult,
  yAxisType: 'log' | 'value',
): EChartsOption {
  return {
    grid: { top: 24, right: 16, bottom: 32, left: 48 },
    xAxis: {
      type: 'value',
      name: 'Year',
      nameTextStyle: { fontSize: 14, fontWeight: 400 },
      axisLabel: { fontSize: 14, fontWeight: 400 },
    },
    yAxis: {
      type: yAxisType,
      name: "Real wealth (today's money)",
      nameTextStyle: { fontSize: 14, fontWeight: 400 },
      // T-03-04: log(0) guard — min=1 when log axis active
      min: yAxisType === 'log' ? 1 : undefined,
      axisLabel: {
        fontSize: 14,
        fontWeight: 400,
        formatter: (v: number) => formatWealth(v),
      },
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      // VIZ-03: formatter builds string from numeric model output only (T-03-03)
      formatter: (params: CallbackDataParams | CallbackDataParams[]) => {
        const paramsArr = Array.isArray(params) ? params : [params];
        if (!paramsArr.length) return '';
        const dataIndex = paramsArr[0]!.dataIndex ?? 0;
        const snap = result.series[dataIndex];
        const relPos = result.relativePosition[dataIndex];
        if (!snap || !relPos) return '';
        const tier = deriveTier(snap.userPercentile);
        return (
          `Year ${snap.year} · ` +
          `Rank: ${relPos.userRank.toFixed(1)}th · ` +
          `Tier: ${tier} · ` +
          `Wealth: ${formatWealth(snap.userWealth)}`
        );
      },
    },
    series: [
      {
        type: 'line',
        name: 'Your wealth',
        // T-03-04: Math.max(1, value) guard on data prevents log(0) in ECharts
        data: result.series.map((s) => [
          s.year,
          yAxisType === 'log' ? Math.max(1, s.userWealth) : s.userWealth,
        ]),
        lineStyle: { color: COLORS.user, width: 2 },
        itemStyle: { color: COLORS.user },
        showSymbol: false,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// VIZ-04: Multi-tier divergence chart selector
// ---------------------------------------------------------------------------

/**
 * selectDivergenceOption — maps ProjectionResult to EChartsOption for Chart 2.
 * VIZ-03: hover tooltips; VIZ-04: multi-tier overlay with all 5 series.
 * T-03-04: log axis zero-guard applied to all 5 series.
 * T-03-03: tooltip strings built only from numeric model output.
 */
export function selectDivergenceOption(
  result: ProjectionResult,
  yAxisType: 'log' | 'value',
): EChartsOption {
  return {
    grid: { top: 24, right: 16, bottom: 32, left: 48 },
    xAxis: {
      type: 'value',
      name: 'Year',
      nameTextStyle: { fontSize: 14, fontWeight: 400 },
      axisLabel: { fontSize: 14, fontWeight: 400 },
    },
    yAxis: {
      type: yAxisType,
      name: "Real wealth (today's money)",
      nameTextStyle: { fontSize: 14, fontWeight: 400 },
      min: yAxisType === 'log' ? 1 : undefined,
      axisLabel: {
        fontSize: 14,
        fontWeight: 400,
        formatter: (v: number) => formatWealth(v),
      },
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      formatter: (params: CallbackDataParams | CallbackDataParams[]) => {
        const paramsArr = Array.isArray(params) ? params : [params];
        if (!paramsArr.length) return '';
        const dataIndex = paramsArr[0]!.dataIndex ?? 0;
        const snap = result.series[dataIndex];
        const relPos = result.relativePosition[dataIndex];
        if (!snap || !relPos) return '';
        const lines = paramsArr.map((p) => {
          const val = Array.isArray(p.value) ? (p.value as number[])[1] ?? 0 : (p.value as number) ?? 0;
          return `${p.seriesName}: ${formatWealth(val)}`;
        });
        return `Year ${snap.year} · Rank: ${relPos.userRank.toFixed(1)}th<br/>${lines.join('<br/>')}`;
      },
    },
    series: [
      {
        type: 'line',
        name: 'Your wealth',
        data: result.series.map((s) => [
          s.year,
          yAxisType === 'log' ? Math.max(1, s.userWealth) : s.userWealth,
        ]),
        lineStyle: { color: COLORS.user },
        itemStyle: { color: COLORS.user },
      },
      {
        type: 'line',
        name: 'Median',
        data: result.series.map((s) => [
          s.year,
          yAxisType === 'log'
            ? Math.max(1, s.anchorWealth.median)
            : s.anchorWealth.median,
        ]),
        lineStyle: { color: COLORS.median },
        itemStyle: { color: COLORS.median },
      },
      {
        type: 'line',
        name: 'Top 10%',
        data: result.series.map((s) => [
          s.year,
          yAxisType === 'log'
            ? Math.max(1, s.anchorWealth.top10)
            : s.anchorWealth.top10,
        ]),
        lineStyle: { color: COLORS.top10 },
        itemStyle: { color: COLORS.top10 },
      },
      {
        type: 'line',
        name: 'Top 1%',
        data: result.series.map((s) => [
          s.year,
          yAxisType === 'log'
            ? Math.max(1, s.anchorWealth.top1)
            : s.anchorWealth.top1,
        ]),
        lineStyle: { color: COLORS.top1 },
        itemStyle: { color: COLORS.top1 },
      },
      {
        type: 'line',
        name: 'Top 0.1%',
        data: result.series.map((s) => [
          s.year,
          yAxisType === 'log'
            ? Math.max(1, s.anchorWealth.top01)
            : s.anchorWealth.top01,
        ]),
        lineStyle: { color: COLORS.top01 },
        itemStyle: { color: COLORS.top01 },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// VIZ-05: Relative-position chart selector
// ---------------------------------------------------------------------------

/**
 * selectRelPosOption — maps ProjectionResult to EChartsOption for Chart 3.
 * VIZ-05: relative-position trajectory; D-09: userRank (0–100), always linear.
 * D-10: tier-threshold markLine reference bands.
 * Plan 02 fills in the full option; this stub returns a valid skeleton.
 */
export function selectRelPosOption(result: ProjectionResult): EChartsOption {
  // TODO (Plan 02): full EChartsOption with D-10 markLine and D-11 tooltip
  return {
    xAxis: { type: 'value', name: 'Year' },
    yAxis: { type: 'value', name: 'Wealth rank (percentile)', min: 0, max: 100 },
    tooltip: { trigger: 'axis' },
    series: [
      {
        type: 'line',
        name: 'Your rank',
        // NOTE: use relativePosition[].userRank (0–100), NOT series[].userPercentile (0–1)
        data: result.relativePosition.map((rp) => [rp.year, rp.userRank]),
        lineStyle: { color: COLORS.user },
        itemStyle: { color: COLORS.user },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            color: COLORS.tierBand,
            opacity: 0.3,
            type: 'dashed',
            width: 1,
          },
          label: { fontSize: 12, color: '#94A3B8' },
          data: [
            { yAxis: 50, name: 'p50' },
            { yAxis: 90, name: 'p90' },
            { yAxis: 99, name: 'p99' },
            { yAxis: 99.9, name: 'p99.9' },
          ],
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// VIZ-06: Citation footer selector
// ---------------------------------------------------------------------------

/**
 * selectCitationFooter — returns all source records from the SOURCES registry.
 * VIZ-06: visible citations tracing displayed defaults to named research.
 */
export function selectCitationFooter(
  sources: Record<string, SourceRecord>,
): SourceRecord[] {
  return Object.values(sources);
}
