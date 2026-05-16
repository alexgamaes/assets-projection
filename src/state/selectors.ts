// Source: RESEARCH.md §"Pattern 1: Selector Function" and §"Pattern Map"
// Plan 02 will fill in the full EChartsOption construction.
// This module exports typed function stubs so Phase 3 plan 01 selector tests
// can discover and typecheck the required exports before implementation.
import type { EChartsOption } from 'echarts';
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
// VIZ-01: Time-series chart selector
// ---------------------------------------------------------------------------

/**
 * selectTimeSeriesOption — maps ProjectionResult to EChartsOption for Chart 1.
 * VIZ-01: user trajectory over horizon; VIZ-02: log/linear toggle.
 * Plan 02 fills in the full option; this stub returns a valid skeleton.
 */
export function selectTimeSeriesOption(
  result: ProjectionResult,
  yAxisType: 'log' | 'value',
): EChartsOption {
  // TODO (Plan 02): full EChartsOption implementation
  return {
    xAxis: { type: 'value', name: 'Year' },
    yAxis: {
      type: yAxisType,
      name: "Real wealth (today's money)",
      min: yAxisType === 'log' ? 1 : undefined,
    },
    tooltip: { trigger: 'axis' },
    series: [
      {
        type: 'line',
        name: 'Your wealth',
        data: result.series.map((s) => [
          s.year,
          yAxisType === 'log' ? Math.max(1, s.userWealth) : s.userWealth,
        ]),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// VIZ-04: Multi-tier divergence chart selector
// ---------------------------------------------------------------------------

/**
 * selectDivergenceOption — maps ProjectionResult to EChartsOption for Chart 2.
 * VIZ-03: hover tooltips; VIZ-04: multi-tier overlay.
 * Plan 02 fills in the full option; this stub returns a valid skeleton.
 */
export function selectDivergenceOption(
  result: ProjectionResult,
  yAxisType: 'log' | 'value',
): EChartsOption {
  // TODO (Plan 02): full EChartsOption with all 5 series + combined tooltip
  return {
    xAxis: { type: 'value', name: 'Year' },
    yAxis: {
      type: yAxisType,
      name: "Real wealth (today's money)",
      min: yAxisType === 'log' ? 1 : undefined,
    },
    tooltip: { trigger: 'axis' },
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
