// Source: RESEARCH.md §"Pattern 1: Selector Function" and §"Pattern Map"
// Plan 02 fills in full EChartsOption construction for VIZ-01/02/03.
// Plan 03 fills in full implementations for VIZ-04/05/06.
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
        lineStyle: { color: COLORS.user, width: 3.5 },
        itemStyle: { color: COLORS.user },
        showSymbol: false,
        endLabel: { show: true, formatter: () => 'You', color: COLORS.user, fontSize: 12, fontWeight: 600 },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// VIZ-04: Multi-tier divergence chart selector
// ---------------------------------------------------------------------------

/**
 * selectDivergenceOption — maps ProjectionResult to EChartsOption for Chart 2.
 * VIZ-04: multi-tier overlay with all 5 series (user + 4 tier anchors).
 * D-08: combined tooltip shows all 5 series wealth values + rank + tier.
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
    legend: {
      show: true,
      textStyle: { fontSize: 14, fontWeight: 400 },
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      // D-08: combined tooltip — all 5 series wealth + rank + tier (T-03-03)
      formatter: (params: CallbackDataParams | CallbackDataParams[]) => {
        const paramsArr = Array.isArray(params) ? params : [params];
        if (!paramsArr.length) return '';
        const dataIndex = paramsArr[0]!.dataIndex ?? 0;
        const snap = result.series[dataIndex];
        const relPos = result.relativePosition[dataIndex];
        if (!snap || !relPos) return '';
        const tier = deriveTier(snap.userPercentile);
        const header = `Year ${snap.year} · Rank: ${relPos.userRank.toFixed(1)}th · Tier: ${tier}`;
        const lines = paramsArr.map((p) => {
          const val = Array.isArray(p.value) ? (p.value as number[])[1] ?? 0 : (p.value as number) ?? 0;
          return `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color ?? ''};margin-right:4px;"></span>${p.seriesName ?? ''}: ${formatWealth(val)}`;
        });
        return `${header}<br/>${lines.join('<br/>')}`;
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
        lineStyle: { color: COLORS.user, width: 3.5 },
        itemStyle: { color: COLORS.user },
        showSymbol: false,
        endLabel: { show: true, formatter: () => 'You', color: COLORS.user, fontSize: 12, fontWeight: 600 },
      },
      {
        type: 'line',
        name: 'Median (p50)',
        data: result.series.map((s) => [
          s.year,
          yAxisType === 'log'
            ? Math.max(1, s.anchorWealth.median)
            : s.anchorWealth.median,
        ]),
        lineStyle: { color: COLORS.median, width: 2 },
        itemStyle: { color: COLORS.median },
        showSymbol: false,
      },
      {
        type: 'line',
        name: 'Top 10% (p90)',
        data: result.series.map((s) => [
          s.year,
          yAxisType === 'log'
            ? Math.max(1, s.anchorWealth.top10)
            : s.anchorWealth.top10,
        ]),
        lineStyle: { color: COLORS.top10, width: 2 },
        itemStyle: { color: COLORS.top10 },
        showSymbol: false,
      },
      {
        type: 'line',
        name: 'Top 1% (p99)',
        data: result.series.map((s) => [
          s.year,
          yAxisType === 'log'
            ? Math.max(1, s.anchorWealth.top1)
            : s.anchorWealth.top1,
        ]),
        lineStyle: { color: COLORS.top1, width: 2 },
        itemStyle: { color: COLORS.top1 },
        showSymbol: false,
      },
      {
        type: 'line',
        name: 'Top 0.1% (p99.9)',
        data: result.series.map((s) => [
          s.year,
          yAxisType === 'log'
            ? Math.max(1, s.anchorWealth.top01)
            : s.anchorWealth.top01,
        ]),
        lineStyle: { color: COLORS.top01, width: 2 },
        itemStyle: { color: COLORS.top01 },
        showSymbol: false,
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
 * D-07: yAxis.type is ALWAYS 'value' — the shared log/linear toggle does NOT affect Chart 3.
 * D-10: tier-threshold markLine reference bands at p50/p90/p99/p99.9.
 * D-11 tooltip safeguard: pairs rank with real wealth and share in tooltip.
 */
export function selectRelPosOption(result: ProjectionResult): EChartsOption {
  return {
    grid: { top: 24, right: 16, bottom: 32, left: 48 },
    xAxis: {
      type: 'value',
      name: 'Year',
      nameTextStyle: { fontSize: 14, fontWeight: 400 },
      axisLabel: { fontSize: 14, fontWeight: 400 },
    },
    yAxis: {
      // D-07/D-09: ALWAYS linear — Chart 3 is never affected by the log/linear toggle
      type: 'value',
      name: 'Percentile rank (0–100)',
      nameTextStyle: { fontSize: 14, fontWeight: 400 },
      min: 0,
      max: 100,
      axisLabel: { fontSize: 14, fontWeight: 400 },
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      // D-11: tooltip pairs rank with growing real wealth (T-03-03)
      formatter: (params: CallbackDataParams | CallbackDataParams[]) => {
        const paramsArr = Array.isArray(params) ? params : [params];
        if (!paramsArr.length) return '';
        const dataIndex = paramsArr[0]!.dataIndex ?? 0;
        const snap = result.series[dataIndex];
        const relPos = result.relativePosition[dataIndex];
        if (!snap || !relPos) return '';
        const shareStr = (relPos.userShare * 100).toFixed(2) + '%';
        return (
          `Year ${relPos.year} · ` +
          `Rank: ${relPos.userRank.toFixed(1)}th · ` +
          `Real wealth: ${formatWealth(snap.userWealth)} · ` +
          `Share of total: ${shareStr}`
        );
      },
    },
    series: [
      {
        type: 'line',
        name: 'Your rank',
        // NOTE: userRank is already 0–100 (RESEARCH.md Pitfall 6 — do NOT re-multiply)
        data: result.relativePosition.map((rp) => [rp.year, rp.userRank]),
        lineStyle: { color: COLORS.user, width: 3.5 },
        itemStyle: { color: COLORS.user },
        showSymbol: false,
        endLabel: { show: true, formatter: () => 'You', color: COLORS.user, fontSize: 12, fontWeight: 600 },
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
          // D-10: tier thresholds at p50/p90/p99/p99.9
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

// ---------------------------------------------------------------------------
// ENTRY-04: selectReinflated — display-layer nominal re-inflation (D-06/D-08)
// ---------------------------------------------------------------------------

/**
 * selectReinflated — re-inflates a real-basis ProjectionResult for nominal display.
 * D-06: re-inflation is display-layer only; src/core/engine.ts remains real-only.
 * D-08: relativePosition (rank/share) is NEVER re-inflated — rank is unitless.
 * If basis === 'real', returns the identical result reference (no copy).
 */
export function selectReinflated(
  r: ProjectionResult,
  basis: 'real' | 'nominal',
  i: number,
): ProjectionResult {
  if (basis === 'real') return r;
  return {
    ...r,
    series: r.series.map((s) => {
      const f = (1 + i) ** s.year;
      return {
        ...s, // preserves userPercentile, topSetPercentile, assetInflation, _totalWealth, etc.
        userWealth: s.userWealth * f,
        anchorWealth: {
          median: s.anchorWealth.median * f,
          top10: s.anchorWealth.top10 * f,
          top1: s.anchorWealth.top1 * f,
          top01: s.anchorWealth.top01 * f,
        },
        // userPercentile / topSetPercentile / assetInflation: NOT re-inflated (unitless)
      };
    }),
    relativePosition: r.relativePosition, // rank/share unaffected (D-08) — Chart 3 untouched
  };
}

// ---------------------------------------------------------------------------
// ENTRY-05: selectSummary — summary readout derivation (D-13)
// ---------------------------------------------------------------------------

/**
 * Summary — the five metrics rendered by SummaryReadout.
 * Call selectReinflated first when basis === 'nominal' so money fields are already scaled.
 * startRank / endRank come from relativePosition and are basis-independent.
 */
export interface Summary {
  endingWealth: number;   // last series userWealth (already basis-adjusted)
  growthMultiple: number; // endingWealth / startingWealth
  cagr: number;           // (end/start)^(1/years) - 1
  startRank: number;      // relativePosition[0].userRank   (0–100, basis-independent)
  endRank: number;        // relativePosition[last].userRank
}

/**
 * selectSummary — derives the five summary metrics from a ProjectionResult.
 * Guard: if startingWealth <= 0, growthMultiple and cagr are 0 (no division-by-zero).
 */
export function selectSummary(r: ProjectionResult): Summary {
  const first = r.series[0]!;
  const last = r.series[r.series.length - 1]!;
  const years = last.year - first.year;
  const start = first.userWealth;
  const end = last.userWealth;
  const rp = r.relativePosition;
  return {
    endingWealth: end,
    growthMultiple: start > 0 ? end / start : 0,
    cagr: start > 0 && years > 0 ? (end / start) ** (1 / years) - 1 : 0,
    startRank: rp[0]!.userRank,
    endRank: rp[rp.length - 1]!.userRank,
  };
}
