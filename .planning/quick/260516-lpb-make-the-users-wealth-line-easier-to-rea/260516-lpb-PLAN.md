---
phase: quick-260516-lpb
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/state/selectors.ts
  - src/state/__tests__/selectors.test.ts
autonomous: true
requirements: [LPB-01]

must_haves:
  truths:
    - "User series line width is 3.5px in all three charts (time-series, divergence, relative-position)"
    - "A 'You' end-of-line label appears on the user series in Charts 1, 2, and 3"
    - "All tier lines (median/top10/top1/top01) remain at width 2"
    - "COLORS.user hue is unchanged (#0F766E — teal-700)"
    - "No semantic color is introduced (palette clause D-03 respected)"
    - "tsc --noEmit is clean and vitest run passes all 125+ tests"
  artifacts:
    - path: "src/state/selectors.ts"
      provides: "Updated user series lineStyle.width and endLabel in all three selectors"
    - path: "src/state/__tests__/selectors.test.ts"
      provides: "New assertions for lineStyle.width === 3.5 and endLabel on user series"
  key_links:
    - from: "src/state/selectors.ts"
      to: "ECharts series[0].lineStyle.width"
      via: "selectTimeSeriesOption, selectDivergenceOption, selectRelPosOption"
      pattern: "lineStyle.*width.*3\\.5"
    - from: "src/state/selectors.ts"
      to: "ECharts series[0].endLabel"
      via: "selectTimeSeriesOption, selectDivergenceOption, selectRelPosOption"
      pattern: "endLabel.*show.*true"
---

<objective>
Make the user's wealth/rank line visually distinct from tier lines across all three charts by increasing its width from 2 to 3.5px and adding a direct end-of-line "You" label via ECharts endLabel.

Purpose: Improve legibility — the user line is the primary reference point; a thicker line and a label let the reader find their trajectory without scanning a legend. The change is purely presentational: no color, data, or selector math is altered.
Output: Updated selectors.ts (width + endLabel) and extended selectors.test.ts (width + endLabel assertions).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@docs/NEUTRALITY-STYLE-GUIDE.md
@src/state/selectors.ts
@src/state/__tests__/selectors.test.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Widen user series and add end-of-line label in selectors.ts</name>
  <files>src/state/selectors.ts</files>
  <behavior>
    - selectTimeSeriesOption: series[0].lineStyle.width === 3.5
    - selectTimeSeriesOption: series[0].lineStyle.color === '#0F766E' (unchanged)
    - selectTimeSeriesOption: series[0].endLabel.show === true and formatter returns 'You'
    - selectDivergenceOption: series[0].lineStyle.width === 3.5
    - selectDivergenceOption: series[0].endLabel.show === true and formatter returns 'You'
    - selectDivergenceOption: series[1..4].lineStyle.width === 2 (tier lines unchanged)
    - selectRelPosOption: series[0].lineStyle.width === 3.5
    - selectRelPosOption: series[0].endLabel.show === true and formatter returns 'You'
  </behavior>
  <action>
    In src/state/selectors.ts, make the following three changes — no other code is touched:

    1. selectTimeSeriesOption (around line 114) — user series object:
       Change `lineStyle: { color: COLORS.user, width: 2 }` to `lineStyle: { color: COLORS.user, width: 3.5 }`.
       Add an `endLabel` property to the same series object:
       `endLabel: { show: true, formatter: () => 'You', color: COLORS.user, fontSize: 12, fontWeight: 600 }`
       The formatter is a function returning the literal string 'You'. This is neutral copy per NEUTRALITY-STYLE-GUIDE.md §2 ("Your wealth" / "Your rank" are already approved labels; "You" is the shortest neutral self-referential identifier with no evaluative meaning). Color matches the series so the label is tied to the line with no new hue (D-03 satisfied).

    2. selectDivergenceOption (around line 188) — user series object only (series[0]):
       Change `lineStyle: { color: COLORS.user, width: 2 }` to `lineStyle: { color: COLORS.user, width: 3.5 }`.
       Add the same `endLabel` property as above.
       Do NOT alter lineStyle.width for the median, top10, top1, or top01 series — those remain `width: 2`.

    3. selectRelPosOption (around line 303) — user series object:
       Change `lineStyle: { color: COLORS.user, width: 2 }` to `lineStyle: { color: COLORS.user, width: 3.5 }`.
       Add the same `endLabel` property as above.

    The `endLabel` ECharts API: `endLabel` is a standard ECharts series-level property (supported since ECharts 5; project uses ECharts 6). It renders a label at the terminal data point of the line. Set `show: true`, `formatter: () => 'You'`, `color: COLORS.user`, `fontSize: 12`, `fontWeight: 600`. No additional imports are needed — this is plain object configuration.

    IMPORTANT constraints:
    - Do NOT change COLORS.user (`#0F766E` — teal-700). No new hue.
    - Do NOT add red, green, or any hue that implies gain/loss (NEUTRALITY-STYLE-GUIDE.md §4 / D-03).
    - Do NOT alter the series `name` fields ('Your wealth', 'Your rank') — the legend and tooltip depend on them.
    - Do NOT touch any other selector logic, data transforms, or test helpers.
  </action>
  <verify>
    <automated>cd /Users/gama/Documents/personal/assets-projection && npx tsc --noEmit && npx vitest run src/state/__tests__/selectors.test.ts 2>&1 | tail -20</automated>
  </verify>
  <done>
    tsc reports zero errors. All selectors tests pass (the new assertions added in Task 2 are the definitive gate — but this task's action must produce code that will satisfy them). At this point the selectors file compiles cleanly.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add width and endLabel assertions to selectors.test.ts</name>
  <files>src/state/__tests__/selectors.test.ts</files>
  <behavior>
    - New test in VIZ-01 block: selectTimeSeriesOption series[0].lineStyle.width === 3.5
    - New test in VIZ-01 block: selectTimeSeriesOption series[0].endLabel.show === true
    - New test in VIZ-04 block: selectDivergenceOption series[0].lineStyle.width === 3.5
    - New test in VIZ-04 block: selectDivergenceOption series[1..4].lineStyle.width === 2 (tier lines unchanged)
    - New test in VIZ-04 block: selectDivergenceOption series[0].endLabel.show === true
    - New test in VIZ-05 block: selectRelPosOption series[0].lineStyle.width === 3.5
    - New test in VIZ-05 block: selectRelPosOption series[0].endLabel.show === true
  </behavior>
  <action>
    Append new `it(...)` cases inside the existing describe blocks in src/state/__tests__/selectors.test.ts. Do not restructure existing tests.

    In the `describe('VIZ-01: selectTimeSeriesOption', ...)` block, add after the existing `it` cases:

    ```
    it('user series (series[0]) lineStyle.width is 3.5', () => {
      const option = selectTimeSeriesOption(result, 'value');
      const series = option.series as Array<{ lineStyle?: { width?: number } }>;
      expect(series[0]?.lineStyle?.width).toBe(3.5);
    });

    it('user series (series[0]) has endLabel with show:true', () => {
      const option = selectTimeSeriesOption(result, 'value');
      const series = option.series as Array<{ endLabel?: { show?: boolean } }>;
      expect(series[0]?.endLabel?.show).toBe(true);
    });
    ```

    In the `describe('VIZ-04: selectDivergenceOption', ...)` block, add after the existing `it` cases:

    ```
    it('user series (series[0]) lineStyle.width is 3.5', () => {
      const option = selectDivergenceOption(result, 'value');
      const series = option.series as Array<{ lineStyle?: { width?: number } }>;
      expect(series[0]?.lineStyle?.width).toBe(3.5);
    });

    it('tier series (series[1..4]) lineStyle.width remains 2', () => {
      const option = selectDivergenceOption(result, 'value');
      const series = option.series as Array<{ lineStyle?: { width?: number } }>;
      for (const tierSeries of series.slice(1)) {
        expect(tierSeries?.lineStyle?.width).toBe(2);
      }
    });

    it('user series (series[0]) has endLabel with show:true', () => {
      const option = selectDivergenceOption(result, 'value');
      const series = option.series as Array<{ endLabel?: { show?: boolean } }>;
      expect(series[0]?.endLabel?.show).toBe(true);
    });
    ```

    In the `describe('VIZ-05: selectRelPosOption', ...)` block (locate it around line 198), add after the existing `it` cases:

    ```
    it('user series (series[0]) lineStyle.width is 3.5', () => {
      const option = selectRelPosOption(result);
      const series = option.series as Array<{ lineStyle?: { width?: number } }>;
      expect(series[0]?.lineStyle?.width).toBe(3.5);
    });

    it('user series (series[0]) has endLabel with show:true', () => {
      const option = selectRelPosOption(result);
      const series = option.series as Array<{ endLabel?: { show?: boolean } }>;
      expect(series[0]?.endLabel?.show).toBe(true);
    });
    ```

    Note: Do not use fenced code blocks in the actual action — the content above is shown as reference. Write the test cases as plain TypeScript inside the existing describe blocks.
  </action>
  <verify>
    <automated>cd /Users/gama/Documents/personal/assets-projection && npx vitest run 2>&1 | tail -20</automated>
  </verify>
  <done>
    All tests pass (125+ tests, now including the 7 new assertions). tsc --noEmit is clean. No test regressions. The full test suite exits 0.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| selector output → ECharts renderer | ECharts consumes the option object; malformed endLabel config would silently produce no label rather than a security risk |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-lpb-01 | Tampering | COLORS.user hue | accept | Change is width/label only; color constant is not touched. TSC enforces `as const` on COLORS. |
| T-lpb-02 | Information Disclosure | endLabel formatter string | accept | formatter returns literal 'You' — no user-supplied input, no XSS surface. ECharts renders this as canvas text, not innerHTML. |
</threat_model>

<verification>
Full suite: `cd /Users/gama/Documents/personal/assets-projection && npx tsc --noEmit && npx vitest run`

Expected: 0 TypeScript errors, all tests green (125+ tests), exit 0.
</verification>

<success_criteria>
- src/state/selectors.ts: user series lineStyle.width is 3.5 in selectTimeSeriesOption, selectDivergenceOption, and selectRelPosOption
- src/state/selectors.ts: endLabel with show:true and formatter returning 'You' is present on the user series in all three selectors
- Tier series (median/top10/top1/top01) in selectDivergenceOption retain lineStyle.width: 2
- COLORS.user is unchanged (#0F766E)
- No new hue added (D-03 satisfied)
- All 125+ Vitest tests pass, tsc --noEmit exits 0
</success_criteria>

<output>
Create `.planning/quick/260516-lpb-make-the-users-wealth-line-easier-to-rea/260516-lpb-SUMMARY.md` when done
</output>
