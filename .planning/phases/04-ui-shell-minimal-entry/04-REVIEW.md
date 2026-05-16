---
phase: 04-ui-shell-minimal-entry
reviewed: 2026-05-16T00:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - docs/NEUTRALITY-STYLE-GUIDE.md
  - src/data/defaults.ts
  - src/data/sources.ts
  - src/main.tsx
  - src/state/selectors.ts
  - src/state/store.ts
  - src/state/__tests__/selectors.test.ts
  - src/state/__tests__/store.test.ts
  - src/ui/AppShell.tsx
  - src/ui/BasisToggle.tsx
  - src/ui/ControlPanel.tsx
  - src/ui/HorizonSlider.tsx
  - src/ui/LogSliderInput.tsx
  - src/ui/summaryFormatters.ts
  - src/ui/SummaryReadout.tsx
  - src/ui/__tests__/summaryFormatters.test.ts
findings:
  critical: 1
  warning: 6
  info: 4
  total: 11
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-05-16
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed the Phase 4 UI shell, state store, selectors, and the citation/data
modules. The data-sourcing modules (`defaults.ts`, `sources.ts`) are thorough
and citation-complete. The defect that matters most is a neutrality-spec
violation in the rank-delta wealth-growth clause: in nominal basis the "while
real wealth grew Gx" sentence reports a *nominal* multiple while asserting it
is real — exactly the misreading the Neutrality Style Guide §6 (D-14) forbids.
Several robustness and quality issues accompany it (whole-store subscription
in `ControlPanel`, brittle year-exponent assumption in `selectReinflated`,
a numeric input that accepts 0 for a wealth field, and stale comments in
`defaults.ts`/`store.ts`).

## Critical Issues

### CR-01: Nominal-basis rank-delta sentence claims "real wealth grew Gx" while reporting the nominal multiple

**File:** `src/ui/SummaryReadout.tsx:54`, `src/state/selectors.ts:400-414`, `src/ui/AppShell.tsx:55-76`

**Issue:** The Neutrality Style Guide §6 (D-14) is explicit: the
`while real wealth grew [G]×` clause "must refer to the real growth multiple
regardless of the active basis setting." In `AppShell`, `summary` is derived
from `result`, and `result` is the *re-inflated* projection when
`basis === 'nominal'` (`selectReinflated(rawResult, basis, ...)`,
AppShell.tsx:55-58). `selectSummary` then computes
`growthMultiple = end / start` from the nominal series (selectors.ts:409).
`SummaryReadout` passes that nominal `growthMultiple` straight into
`formatRankDelta(...)` (SummaryReadout.tsx:54), which renders the literal
text `while real wealth grew {G}×`. In nominal mode `G` is inflated by
`(1+i)^years`, so the UI states a larger multiple and labels it "real wealth"
— a factually wrong, non-neutral claim and a direct D-14 violation that
Phase 5 NEUT-02 will gate on.

**Fix:** Compute the real growth multiple from the pre-reinflation result and
pass it independently of basis. For example, derive the summary from
`rawResult` for the rank/growth pairing, or add a `realGrowthMultiple` field:

```tsx
// AppShell.tsx — summary's growth pairing must be real-basis
const summary = useMemo(
  () => (rawResult !== null ? selectSummary(rawResult) : null),
  [rawResult],
);
// If endingWealth must reflect the active basis, split the concern:
// keep endingWealth basis-adjusted but pass a separate realGrowthMultiple
// (from rawResult) into formatRankDelta.
```

Then ensure `formatRankDelta` receives the real-basis multiple only. Add a
test asserting the rendered clause is identical in real and nominal modes.

## Warnings

### WR-01: `selectReinflated` re-inflation exponent assumes the series always starts at year 0

**File:** `src/state/selectors.ts:362`

**Issue:** The re-inflation factor is `const f = (1 + i) ** s.year;`. This is
only correct because the current engine emits `year` running `0..horizon`
(verified in `engine.ts:221`). It silently breaks if the engine ever emits an
absolute calendar year or a non-zero start (the factor would be astronomically
large, e.g. `1.025^2026`). The function has no guard documenting or enforcing
this coupling.

**Fix:** Anchor the exponent to the series start so the contract is explicit:

```ts
const baseYear = r.series[0]?.year ?? 0;
// ...
const f = (1 + i) ** (s.year - baseYear);
```

### WR-02: `ControlPanel` subscribes to the entire store, defeating the narrow-selector design

**File:** `src/ui/ControlPanel.tsx:16`

**Issue:** `const { inputs, params, basis, setInputs, setHorizon, setBasis } = useProjectionStore();`
subscribes the component to every store field. `AppShell` deliberately uses
narrow selectors (AppShell.tsx:35-37) to limit re-renders, but `ControlPanel`
re-renders on every store change regardless, including unrelated future slices.
This contradicts the documented intent ("Reads store selectors") and the
CLAUDE.md rationale for choosing Zustand (selector-based subscriptions).

**Fix:** Use individual selectors:

```tsx
const inputs = useProjectionStore((s) => s.inputs);
const params = useProjectionStore((s) => s.params);
const basis = useProjectionStore((s) => s.basis);
const setInputs = useProjectionStore((s) => s.setInputs);
const setHorizon = useProjectionStore((s) => s.setHorizon);
const setBasis = useProjectionStore((s) => s.setBasis);
```

### WR-03: `LogSliderInput` numeric field accepts 0 for a wealth field with a `min` prop of 1,000

**File:** `src/ui/LogSliderInput.tsx:36-47`

**Issue:** The `min` prop (e.g. `1_000` for current wealth) is used only to
scale the log slider; the numeric `<input>` sets `min={0}` and the onChange
guard accepts any finite `n >= 0`, falling back to `0`. A user can type `0`
(or clear the field) and feed `currentWealth = 0` to the engine. Downstream
`selectSummary` zeroes `growthMultiple`/`cagr`, but the projection still runs
with a degenerate input and the UI shows `$0` with no feedback. The component
comment claims "out-of-slider-range values passed through" but does not
mention that sub-`min` values are silently accepted.

**Fix:** Clamp to the provided `min` (or surface a validation message)
instead of `0`:

```tsx
onChange={(e) => {
  const n = Number(e.target.value);
  onChange(Number.isFinite(n) && n >= min ? n : min);
}}
```

(Use `min={min}` on the `<input>` for consistency with the slider domain.)

### WR-04: `selectReinflated` returns `r.series` mapped objects that drop branded/extra fields silently via spread, but rank/share path is not validated

**File:** `src/state/selectors.ts:359-376`

**Issue:** The function spreads `...s` then overwrites `userWealth` and
`anchorWealth`. If `YearSnapshot` later gains a money-typed field (e.g. a
nominal cash-flow), it will be carried through *un-reinflated* with no compile
error, producing a mixed-basis snapshot. The "preserves ... etc." comment
explicitly relies on spread catching everything, which is the opposite of
safe for money fields. There is no test asserting that *only* the intended
money fields are scaled.

**Fix:** Construct the re-inflated snapshot explicitly (enumerate money fields)
or add a typed mapping helper so a new money field forces a compile-time
decision. At minimum add a test that fails if a new numeric snapshot field is
introduced without a re-inflation decision.

### WR-05: `selectSummary` non-null assertions will throw on an empty series instead of failing gracefully

**File:** `src/state/selectors.ts:401-412`

**Issue:** `r.series[0]!`, `r.series[r.series.length - 1]!`, `rp[0]!`,
`rp[rp.length - 1]!` use non-null assertions. If `series`/`relativePosition`
is ever empty (e.g. a future engine edge case or a horizon of 0 producing an
unexpected shape), this throws a `TypeError` at render time. `AppShell` only
guards against `rawResult === null`, not against an empty-but-non-null result,
so the try/catch around `projectionEngine` does not cover this path and the
neutral diagnostic will not be shown — the app white-screens instead.

**Fix:** Guard explicitly and return a safe zeroed `Summary` (or null) when
the series is empty, so `AppShell` can render `ENGINE_ERROR_MSG`:

```ts
if (r.series.length === 0 || r.relativePosition.length === 0) {
  return { endingWealth: 0, growthMultiple: 0, cagr: 0, startRank: 0, endRank: 0 };
}
```

### WR-06: Stale "PROVISIONAL PLACEHOLDER / 0.0" comment contradicts the shipped back-solved `dragStrength`

**File:** `src/data/defaults.ts:309-329`

**Issue:** The block comment states `dragStrength` "is a PROVISIONAL
PLACEHOLDER", that "The placeholder 0.0 is used here", and that "Plan 04
calibration.test.ts will freeze the back-solved constant and update this
value." The actual shipped `value` is `0.4325757739` (a back-solved constant,
per the inline note immediately below). The two comments directly contradict
each other within the same property. A future maintainer reading the block
comment will believe drag is disabled (0.0) when it is not, and may "fix" it
incorrectly. Misleading documentation on a calibration constant is a
correctness hazard for a correctness-first tool.

**Fix:** Delete the obsolete placeholder paragraph (lines ~311-320) and keep
only the accurate back-solve note. Ensure the prose matches the shipped value.

## Info

### IN-01: Stale comments in `store.ts` reference patterns/tasks rather than current behavior

**File:** `src/state/store.ts:1-2,20,23`

**Issue:** Comments like "RESEARCH.md Pattern 6", "T-04-01-01", and "(ENTRY-02)"
are planning-artifact references. The "Shallow clone of frozen DEFAULTS is
safe" comment on `setHorizon` is accurate, but the file leads with phase
bookkeeping rather than describing the store contract. Low impact; noted for
maintainability since CLAUDE.md flags this as a long-lived solo-maintained tool.

**Fix:** Replace task-ID comments with a short description of the store's
responsibilities and the frozen-DEFAULTS clone invariant.

### IN-02: `store.test.ts` casts `getState()` with `as` to reach actions that are already typed on the store

**File:** `src/state/__tests__/store.test.ts:62-66,71-73,80-82,97-99,107-109,123-125,131-134`

**Issue:** `ProjectionStore` already declares `setInputs`/`setHorizon`/`setBasis`,
so the repeated `as ReturnType<typeof useProjectionStore.getState> & { ... }`
casts are unnecessary and obscure type regressions (a removed action would
still compile in these tests). Test smell, not a product defect.

**Fix:** Destructure directly: `const { setInputs } = useProjectionStore.getState();`.

### IN-03: `selectCitationFooter` parameter typed `Record<string, SourceRecord>` is looser than the `SOURCES` literal

**File:** `src/state/selectors.ts:337-341`

**Issue:** `SOURCES` is `as const` with precise keys, but the selector accepts
any `Record<string, SourceRecord>` and returns `Object.values`. Order of
`Object.values` is insertion-order for string keys here so it is stable, but
the loose type discards the registry's literal-key guarantees and the function
is effectively a one-line `Object.values` wrapper. Minor.

**Fix:** Accept `SourcesRegistry` (or `typeof SOURCES`) to preserve key
information, or inline `Object.values(SOURCES)` at the call site.

### IN-04: Magic layout numbers duplicated across selectors

**File:** `src/state/selectors.ts:66,138,261` (and repeated axis style objects)

**Issue:** `grid: { top: 24, right: 16, bottom: 32, left: 48 }`, the
`fontSize: 14, fontWeight: 400` axis styling, and `min: yAxisType === 'log' ? 1 : undefined`
are duplicated verbatim across the three chart selectors. Drift between charts
becomes likely as styles evolve.

**Fix:** Extract shared `GRID`, `AXIS_TEXT_STYLE`, and a `yAxisFor(yAxisType)`
helper and reuse across the three selectors.

---

_Reviewed: 2026-05-16_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
