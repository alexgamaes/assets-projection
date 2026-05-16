/**
 * selectors.test.ts — VIZ-01 through VIZ-06 selector behavior tests.
 *
 * Phase 3 Plan 01: stub test file. The selectors module (src/state/selectors.ts)
 * is scaffolded in Plan 01 with typed stubs. Full behavior assertions will be
 * filled in when selectors are fully implemented in Plan 02.
 *
 * Each describe block is labelled by requirement ID (VIZ-01..VIZ-06) following
 * the same structure as goldenMaster.test.ts.
 */
import { describe, it, expect } from 'vitest';
import {
  selectTimeSeriesOption,
  selectDivergenceOption,
  selectRelPosOption,
  selectCitationFooter,
  formatWealth,
} from '../selectors.js';
import { makeSyntheticParams, syntheticInputs } from '../../core/__tests__/testUtils.js';
import { projectionEngine } from '../../core/engine.js';
import { SOURCES } from '../../data/sources.js';

// ---------------------------------------------------------------------------
// Shared fixture — short horizon for fast tests
// ---------------------------------------------------------------------------

const params = makeSyntheticParams({ horizon: 5 });
const result = projectionEngine(syntheticInputs, params);

// ---------------------------------------------------------------------------
// VIZ-01: Time-series chart — user trajectory over horizon
// ---------------------------------------------------------------------------

describe('VIZ-01: selectTimeSeriesOption', () => {
  it('returns an EChartsOption with xAxis, yAxis, tooltip, and series', () => {
    const option = selectTimeSeriesOption(result, 'value');
    expect(option.xAxis).toBeDefined();
    expect(option.yAxis).toBeDefined();
    expect(option.tooltip).toBeDefined();
    expect(Array.isArray(option.series)).toBe(true);
  });

  it('series contains at least one entry with data points', () => {
    const option = selectTimeSeriesOption(result, 'value');
    const series = option.series as Array<{ data: unknown[] }>;
    expect(series.length).toBeGreaterThan(0);
    expect(series[0]).toBeDefined();
    // horizon: 5, so we expect 6 data points (year 0..5)
    expect(series[0]!.data).toHaveLength(params.horizon + 1);
  });
});

// ---------------------------------------------------------------------------
// VIZ-02: Log/linear toggle — yAxisType drives yAxis.type and min
// ---------------------------------------------------------------------------

describe('VIZ-02: selectTimeSeriesOption log/linear toggle', () => {
  it('with yAxisType="log" returns yAxis.type "log" and min: 1', () => {
    const option = selectTimeSeriesOption(result, 'log');
    const yAxis = option.yAxis as { type: string; min?: number };
    expect(yAxis.type).toBe('log');
    expect(yAxis.min).toBe(1); // RESEARCH.md Pitfall 1 / Pattern 4 — log(0) guard
  });

  it('with yAxisType="value" returns yAxis.type "value" and min: undefined', () => {
    const option = selectTimeSeriesOption(result, 'value');
    const yAxis = option.yAxis as { type: string; min?: number };
    expect(yAxis.type).toBe('value');
    expect(yAxis.min).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// VIZ-03: Tooltip — formatter callable and includes required fields
// ---------------------------------------------------------------------------

describe('VIZ-03: selectDivergenceOption tooltip', () => {
  it('divergence option has a tooltip configured', () => {
    const option = selectDivergenceOption(result, 'value');
    expect(option.tooltip).toBeDefined();
    const tooltip = option.tooltip as { formatter?: unknown };
    expect(typeof tooltip.formatter).toBe('function');
  });

  it('selectTimeSeriesOption tooltip formatter is a callable function', () => {
    const option = selectTimeSeriesOption(result, 'value');
    const tooltip = option.tooltip as { formatter?: unknown };
    expect(typeof tooltip.formatter).toBe('function');
  });

  it('selectTimeSeriesOption tooltip formatter returns a string containing the year', () => {
    const option = selectTimeSeriesOption(result, 'value');
    const tooltip = option.tooltip as { formatter?: (params: unknown[]) => string };
    const formatter = tooltip.formatter!;
    // Simulate ECharts calling formatter with dataIndex=0
    const fakeParams = [{ dataIndex: 0, value: [0, 120000], seriesName: 'Your wealth', color: '#0F766E' }];
    const output = formatter(fakeParams);
    expect(typeof output).toBe('string');
    // Must contain the year value (year 0 of the series)
    expect(output).toContain('0');
  });

  it('selectTimeSeriesOption tooltip formatter output contains rank and tier', () => {
    const option = selectTimeSeriesOption(result, 'value');
    const tooltip = option.tooltip as { formatter?: (params: unknown[]) => string };
    const formatter = tooltip.formatter!;
    const fakeParams = [{ dataIndex: 0, value: [0, 120000], seriesName: 'Your wealth', color: '#0F766E' }];
    const output = formatter(fakeParams);
    // Must contain rank (case-insensitive) and tier information
    expect(output.toLowerCase()).toMatch(/rank/);
    expect(output.toLowerCase()).toMatch(/tier|top|median/);
  });
});

// ---------------------------------------------------------------------------
// VIZ-04: Multi-tier divergence overlay — 5 series with correct palette
// ---------------------------------------------------------------------------

describe('VIZ-04: selectDivergenceOption', () => {
  it('returns EChartsOption with 5 series (user + 4 anchor tiers)', () => {
    const option = selectDivergenceOption(result, 'value');
    const series = option.series as Array<{ name: string; lineStyle?: { color: string } }>;
    expect(series).toHaveLength(5);
  });

  it('first series (user) uses the teal-700 color #0F766E', () => {
    const option = selectDivergenceOption(result, 'value');
    const series = option.series as Array<{ lineStyle?: { color: string } }>;
    const userSeries = series[0];
    expect(userSeries).toBeDefined();
    expect(userSeries?.lineStyle?.color).toBe('#0F766E');
  });

  it('second series (median) uses the slate-500 color #64748B', () => {
    const option = selectDivergenceOption(result, 'value');
    const series = option.series as Array<{ lineStyle?: { color: string } }>;
    expect(series[1]?.lineStyle?.color).toBe('#64748B');
  });

  it('series names match exact UI-SPEC labels with p50/p90/p99/p99.9 suffixes', () => {
    const option = selectDivergenceOption(result, 'value');
    const series = option.series as Array<{ name: string }>;
    const names = series.map((s) => s.name);
    expect(names).toEqual([
      'Your wealth',
      'Median (p50)',
      'Top 10% (p90)',
      'Top 1% (p99)',
      'Top 0.1% (p99.9)',
    ]);
  });

  it('log mode: yAxis.type is "log" and min is 1', () => {
    const option = selectDivergenceOption(result, 'log');
    const yAxis = option.yAxis as { type: string; min?: number };
    expect(yAxis.type).toBe('log');
    expect(yAxis.min).toBe(1);
  });

  it('value mode: yAxis.type is "value" and min is undefined', () => {
    const option = selectDivergenceOption(result, 'value');
    const yAxis = option.yAxis as { type: string; min?: number };
    expect(yAxis.type).toBe('value');
    expect(yAxis.min).toBeUndefined();
  });

  it('has legend with show:true', () => {
    const option = selectDivergenceOption(result, 'value');
    const legend = option.legend as { show: boolean } | undefined;
    expect(legend?.show).toBe(true);
  });

  it('all series have showSymbol:false', () => {
    const option = selectDivergenceOption(result, 'value');
    const series = option.series as Array<{ showSymbol?: boolean }>;
    for (const s of series) {
      expect(s.showSymbol).toBe(false);
    }
  });

  it('divergence tooltip formatter returns a string with rank and tier info', () => {
    const option = selectDivergenceOption(result, 'value');
    const tooltip = option.tooltip as { formatter?: (params: unknown[]) => string };
    const formatter = tooltip.formatter!;
    expect(typeof formatter).toBe('function');
    const fakeParams = [{ dataIndex: 0, value: [params.horizon, 120000], seriesName: 'Your wealth', color: '#0F766E' }];
    const output = formatter(fakeParams);
    expect(typeof output).toBe('string');
    expect(output.toLowerCase()).toMatch(/rank/);
    expect(output.toLowerCase()).toMatch(/tier|top|median/);
  });
});

// ---------------------------------------------------------------------------
// VIZ-05: Relative-position trajectory — userRank (0–100), markLine thresholds
// ---------------------------------------------------------------------------

describe('VIZ-05: selectRelPosOption', () => {
  it('returns EChartsOption with series data from relativePosition', () => {
    const option = selectRelPosOption(result);
    expect(option.series).toBeDefined();
    expect(Array.isArray(option.series)).toBe(true);
  });

  it('series data length matches relativePosition array length', () => {
    const option = selectRelPosOption(result);
    const series = option.series as Array<{ data: unknown[] }>;
    expect(series[0]?.data?.length).toBe(result.relativePosition.length);
  });

  it('series[0].data[0][1] equals relativePosition[0].userRank (not re-multiplied — RESEARCH.md Pitfall 6)', () => {
    const option = selectRelPosOption(result);
    const series = option.series as Array<{ data: [number, number][] }>;
    const firstPoint = series[0]?.data[0];
    expect(firstPoint).toBeDefined();
    // userRank is already 0–100 — must NOT multiply by 100 again
    expect(firstPoint![1]).toBe(result.relativePosition[0]!.userRank);
  });

  it('series has markLine with exactly 4 tier-threshold entries', () => {
    const option = selectRelPosOption(result);
    const series = option.series as Array<{
      markLine?: { data: Array<{ yAxis: number; name: string }> };
    }>;
    const markLineData = series[0]?.markLine?.data;
    expect(markLineData).toBeDefined();
    expect(markLineData).toHaveLength(4);
  });

  it('markLine entries have yAxis values 50, 90, 99, 99.9 in that order (D-10)', () => {
    const option = selectRelPosOption(result);
    const series = option.series as Array<{
      markLine?: { data: Array<{ yAxis: number }> };
    }>;
    const yAxes = series[0]?.markLine?.data.map((d) => d.yAxis) ?? [];
    expect(yAxes).toEqual([50, 90, 99, 99.9]);
  });

  it('yAxis.type is always "value" (linear — D-07/D-09: no toggle on Chart 3)', () => {
    const option = selectRelPosOption(result);
    const yAxis = option.yAxis as { type: string };
    expect(yAxis.type).toBe('value');
  });

  it('yAxis has min:0, max:100, name "Percentile rank (0–100)"', () => {
    const option = selectRelPosOption(result);
    const yAxis = option.yAxis as { type: string; min?: number; max?: number; name?: string };
    expect(yAxis.min).toBe(0);
    expect(yAxis.max).toBe(100);
    expect(yAxis.name).toBe('Percentile rank (0–100)');
  });

  it('relPos tooltip formatter pairs rank with real wealth (D-11 safeguard)', () => {
    const option = selectRelPosOption(result);
    const tooltip = option.tooltip as { formatter?: (params: unknown[]) => string };
    const formatter = tooltip.formatter!;
    expect(typeof formatter).toBe('function');
    const fakeParams = [{ dataIndex: 0, value: [result.relativePosition[0]!.year, result.relativePosition[0]!.userRank], seriesName: 'Your rank', color: '#0F766E' }];
    const output = formatter(fakeParams);
    expect(typeof output).toBe('string');
    // Must contain "Rank" and "Real wealth" (D-11 tooltip safeguard)
    expect(output).toMatch(/Rank/);
    expect(output).toMatch(/Real wealth/);
  });
});

// ---------------------------------------------------------------------------
// VIZ-06: Citation footer — all sources with sourceName and url
// ---------------------------------------------------------------------------

describe('VIZ-06: selectCitationFooter', () => {
  it('returns an array of SourceRecord entries from SOURCES', () => {
    const citations = selectCitationFooter(SOURCES);
    expect(Array.isArray(citations)).toBe(true);
    expect(citations.length).toBeGreaterThan(0);
  });

  it('every returned entry has a non-empty sourceName', () => {
    const citations = selectCitationFooter(SOURCES);
    for (const c of citations) {
      expect(typeof c.sourceName).toBe('string');
      expect(c.sourceName.length).toBeGreaterThan(0);
    }
  });

  it('returns all entries from SOURCES registry', () => {
    const citations = selectCitationFooter(SOURCES);
    // SOURCES has fagereng, bach, saezZucman, jst, mckinsey
    expect(citations.length).toBe(Object.keys(SOURCES).length);
  });
});

// ---------------------------------------------------------------------------
// formatWealth helper (used by VIZ-01..VIZ-05 tooltips and axis labels)
// ---------------------------------------------------------------------------

describe('formatWealth', () => {
  it('formats millions with one decimal place', () => {
    expect(formatWealth(1_500_000)).toBe('$1.5M');
  });

  it('formats thousands with no decimal places', () => {
    expect(formatWealth(120_000)).toBe('$120k');
  });

  it('formats small values with no decimal places', () => {
    expect(formatWealth(500)).toBe('$500');
  });
});
