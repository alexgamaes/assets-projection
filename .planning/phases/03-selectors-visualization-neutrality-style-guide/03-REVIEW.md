---
phase: 03-selectors-visualization-neutrality-style-guide
reviewed: 2026-05-16T00:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - src/state/selectors.ts
  - src/state/store.ts
  - src/state/__tests__/selectors.test.ts
  - src/viz/TimeSeriesChart.tsx
  - src/viz/DivergenceChart.tsx
  - src/viz/RelativePosChart.tsx
  - src/ui/HarnessPage.tsx
  - src/ui/LogLinearToggle.tsx
  - src/ui/CitationFooter.tsx
  - src/main.tsx
  - src/index.css
  - index.html
  - vite.config.ts
  - tsconfig.json
  - package.json
  - docs/NEUTRALITY-STYLE-GUIDE.md
findings:
  critical: 0
  warning: 3
  info: 5
  total: 8
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-05-16
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed the Phase 3 scaffold, selectors, ECharts wrappers, dev harness, and the neutrality style guide. Overall the code is clean, well-typed, and architecturally disciplined (pure-function selectors, thin chart wrappers, `notMerge` on all instances). The focus areas held up well:

- **Tooltip/HTML-injection safety:** All tooltip strings are built from numeric model output and static literals. The one raw-HTML formatter (`selectDivergenceOption`) interpolates `p.color`, but that value originates from frozen `COLORS` constants, not user input — currently safe. Flagged as a defensive WARNING because it is an unescaped HTML sink that would become exploitable if a future series color is ever derived from external/user data.
- **Log-axis zero-guard:** Dual protection (`Math.max(1, value)` on data + `yAxis.min: 1`) is correctly applied to all wealth series. One correctness gap: negative wealth values would survive the `Math.max(1, …)` guard incorrectly only if the model could produce them (it cannot today) — noted as Info.
- **Type safety in selectors:** Strong. `CallbackDataParams` union used correctly; `noUncheckedIndexedAccess` honored with `?.`/`??` guards and non-null assertions on already-checked array heads.
- **React correctness:** Sound. `useMemo` dependency arrays are correct given the module-level constant `result`.
- **Neutrality:** No violations found in UI copy or the style guide. The guide is thorough and self-consistent; the D-11 caption matches verbatim between `HarnessPage.tsx` and the guide.

No blockers. Three warnings and five info items below.

## Warnings

### WR-01: Unescaped HTML sink in divergence tooltip formatter

**File:** `src/state/selectors.ts:175`
**Issue:** The divergence tooltip builds raw HTML by interpolating `p.color` directly into a `style="…background:${p.color}…"` attribute and `p.seriesName` into element text. Today `p.color` and `p.seriesName` come from frozen `COLORS` constants and static series names, so this is not currently exploitable. However, it is an unescaped HTML/attribute injection sink with no defense-in-depth: if any future change sources a series color or name from URL state, user overrides, or external data (Phase 4 wires live Zustand inputs and the stack roadmap includes URL-encoded shareable state), this becomes a stored/reflected XSS vector with no remaining guard. The other two formatters return plain text and are not affected.
**Fix:** Constrain the color to a known-safe pattern and avoid interpolating arbitrary strings into HTML. For example, validate the hex/rgb shape before use and HTML-escape series names:
```ts
const safeColor = /^#[0-9a-fA-F]{3,8}$|^rg(b|ba)\([\d.,\s]+\)$/.test(String(p.color ?? ''))
  ? String(p.color)
  : 'transparent';
const esc = (s: string) => s.replace(/[&<>"']/g, (ch) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
return `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${safeColor};margin-right:4px;"></span>${esc(String(p.seriesName ?? ''))}: ${formatWealth(val)}`;
```

### WR-02: `formatWealth` rounding boundary produces malformed magnitude labels

**File:** `src/state/selectors.ts:28-32`
**Issue:** The thresholds switch on the raw value but format with `toFixed`, so values in `[999_500, 1_000_000)` render as `$1000k` instead of `$1.0M`, and values in `[999.5, 1000)` render as `$1000` instead of `$1.0k`. This is a real display defect on axis labels and tooltips whenever a tier crosses these boundaries (plausible over a 60-year compounding horizon). It is a logic gap, not just cosmetic, because the magnitude suffix becomes inconsistent with the displayed digits.
**Fix:** Compare against the post-rounding magnitude, or bump the threshold so rounding cannot cross it:
```ts
export function formatWealth(v: number): string {
  const a = Math.abs(v);
  if (a >= 999_500) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (a >= 999.5) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
}
```

### WR-03: Tooltip formatters silently return empty string on index miss

**File:** `src/state/selectors.ts:95`, `src/state/selectors.ts:170`, `src/state/selectors.ts:287`
**Issue:** All three formatters return `''` when `snap` or `relPos` is falsy (e.g. `dataIndex` out of range, or a `userShare`/`userRank` of `0` is *not* the issue here since the object truthiness check is on the object, not the number — but a missing index yields an empty tooltip with no diagnostic). Returning an empty string makes ECharts render a blank tooltip box, which looks like a rendering bug to the user and is hard to diagnose. The `dataIndex ?? 0` fallback also masks the real failure by silently pointing at year 0. With aligned `series`/`relativePosition` lengths this should not trigger in practice, but the silent-empty path is a latent correctness/UX hazard if the engine contract ever drifts.
**Fix:** Either return `undefined` (ECharts then suppresses the tooltip cleanly) or keep a minimal informative fallback, and do not coerce a missing `dataIndex` to `0`:
```ts
const idx = paramsArr[0]?.dataIndex;
if (idx == null) return '';
const snap = result.series[idx];
const relPos = result.relativePosition[idx];
if (!snap || !relPos) return '';
```

## Info

### IN-01: `formatWealth` mishandles negative values

**File:** `src/state/selectors.ts:28-32`
**Issue:** The branch test uses `Math.abs(v)` but the division uses signed `v`, so a negative value renders e.g. `$-5k`. The wealth model is non-negative today so this is not reachable, but the helper is exported and used broadly; a defensive sign-aware format would prevent a future misuse defect.
**Fix:** Format the magnitude and prepend a sign explicitly, or document the non-negative precondition in the JSDoc.

### IN-02: `dataIndex ?? 0` fallback hides axis-trigger assumptions

**File:** `src/state/selectors.ts:92`, `src/state/selectors.ts:167`, `src/state/selectors.ts:284`
**Issue:** `paramsArr[0]!.dataIndex ?? 0` assumes the first param always carries the correct index. For `trigger: 'axis'` line series this holds, but the `?? 0` masks any future trigger/series change by silently selecting year 0 instead of failing visibly. Covered remediation-wise by WR-03; listed separately as a code-clarity concern.
**Fix:** Replace the `?? 0` coalesce with an explicit null check (see WR-03 fix).

### IN-03: Engine called at module scope in `HarnessPage`

**File:** `src/ui/HarnessPage.tsx:26-28`
**Issue:** `projectionEngine(...)` runs at module-evaluation time. This is intentional and documented for the Phase 3 harness ("Phase 4 will move into Zustand subscription"), and is acceptable for a dev harness. Flagged only so the Phase 4 migration does not forget that the `useMemo` deps arrays (`[yAxisType]`, `[]`) deliberately exclude the stable `result` and will need updating when `result` becomes reactive.
**Fix:** No action this phase. When Phase 4 makes `result` reactive, add it to every selector `useMemo` dependency array.

### IN-04: Duplicated grid/axis/yAxis option blocks across selectors

**File:** `src/state/selectors.ts:66-84`, `src/state/selectors.ts:138-155`, `src/state/selectors.ts:261-276`
**Issue:** The `grid`, `xAxis`, and wealth `yAxis` (incl. log-guard `min`) blocks are copy-pasted across `selectTimeSeriesOption` and `selectDivergenceOption`, and the grid/xAxis again in `selectRelPosOption`. Divergence between these copies (e.g. fixing the log guard in one but not the other) is a realistic future bug. Not a defect today since the copies are currently identical.
**Fix:** Extract shared `baseGrid`, `yearXAxis`, and `wealthYAxis(yAxisType)` factory helpers and spread them into each option.

### IN-05: `selectors.test.ts` header comment is stale

**File:** `src/state/__tests__/selectors.test.ts:4-7`
**Issue:** The file docblock still says "stub test file … Full behavior assertions will be filled in when selectors are fully implemented in Plan 02," but the file now contains the full Plan 02/03 assertions. Stale guidance comments mislead future maintainers.
**Fix:** Update the docblock to reflect that the assertions are complete as of Plan 03.

---

_Reviewed: 2026-05-16_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
