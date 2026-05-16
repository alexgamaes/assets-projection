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
    // TODO (Plan 02): assert series[0].data length === horizon + 1
    expect(series[0]).toBeDefined();
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
    // TODO (Plan 02): assert tooltip.formatter is a function and returns expected string
    expect(option.tooltip).toBeDefined();
  });

  it('selectTimeSeriesOption has a tooltip configured', () => {
    const option = selectTimeSeriesOption(result, 'value');
    // TODO (Plan 02): assert tooltip.formatter is a function and includes year/wealth/rank
    expect(option.tooltip).toBeDefined();
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

  it('first series (user) uses the teal-700 color', () => {
    const option = selectDivergenceOption(result, 'value');
    const series = option.series as Array<{ lineStyle?: { color: string } }>;
    const userSeries = series[0];
    // TODO (Plan 02): assert exact COLORS.user value '#0F766E'
    expect(userSeries).toBeDefined();
    expect(userSeries?.lineStyle?.color).toBe('#0F766E');
  });

  it('series names include expected tier labels', () => {
    const option = selectDivergenceOption(result, 'value');
    const series = option.series as Array<{ name: string }>;
    const names = series.map((s) => s.name);
    // TODO (Plan 02): assert exact series names from UI-SPEC
    expect(names).toContain('Your wealth');
  });
});

// ---------------------------------------------------------------------------
// VIZ-05: Relative-position trajectory — userRank (0–100), markLine thresholds
// ---------------------------------------------------------------------------

describe('VIZ-05: selectRelPosOption', () => {
  it('returns EChartsOption with series data from relativePosition', () => {
    const option = selectRelPosOption(result);
    // TODO (Plan 02): assert series[0].data values match result.relativePosition[].userRank
    expect(option.series).toBeDefined();
    expect(Array.isArray(option.series)).toBe(true);
  });

  it('series data length matches relativePosition array length', () => {
    const option = selectRelPosOption(result);
    const series = option.series as Array<{ data: unknown[] }>;
    expect(series[0]?.data?.length).toBe(result.relativePosition.length);
  });

  it('series has markLine with 4 tier-threshold entries at 50/90/99/99.9', () => {
    const option = selectRelPosOption(result);
    const series = option.series as Array<{
      markLine?: { data: Array<{ yAxis: number; name: string }> };
    }>;
    const markLineData = series[0]?.markLine?.data;
    expect(markLineData).toBeDefined();
    expect(markLineData).toHaveLength(4);
    // D-10: tier thresholds at p50/p90/p99/p99.9
    const yAxes = markLineData?.map((d) => d.yAxis) ?? [];
    expect(yAxes).toContain(50);
    expect(yAxes).toContain(90);
    expect(yAxes).toContain(99);
    expect(yAxes).toContain(99.9);
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
    // TODO (Plan 02): assert exact source names match SOURCES registry keys
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
