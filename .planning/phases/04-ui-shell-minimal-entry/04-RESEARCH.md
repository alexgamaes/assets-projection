# Phase 4: UI Shell & Minimal Entry - Research

**Researched:** 2026-05-16
**Domain:** React 19 SPA shell — controlled inputs, live recompute, responsive layout, touch-graceful ECharts
**Confidence:** HIGH (codebase fully inspected; stack already installed and proven through Phase 3)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Each primary input is a **logarithmic slider linked to a numeric field** — drag to play fast, type for precision. Applies to current wealth and annual savings.
- **D-02:** Default seed values are **rounded-up real-world medians**. Default current wealth ≈ rounded-up US median net worth (~$200k — replaces `store.ts` placeholder `$120,000`). Default annual savings ≈ rounded-up median savings figure.
- **D-03:** Seed defaults **must be cited** like model parameters. Add a real source to `src/data/sources.ts` the same way Phase 2 did, surfaced through the existing citation affordance.
- **D-04:** Slider span is **broad and logarithmic** (annual savings ~$2k → ~$2M/yr; current wealth similarly broad). Exact min/max/step is planner's, grounded in `src/data/defaults.ts` tier boundaries. Typed field handles out-of-span values.
- **D-05:** Horizon is a **linear slider with a live year readout**, default ~35y, range ~10–60y.
- **D-06:** Engine **stays locked real-only**. Nominal view = **display-layer re-inflation**: `nominal = real × (1 + i)^year`, applied in selector/display layer only, never in `core/`.
- **D-07:** One **new sourced inflation-rate default** (single cited long-run figure) added to `src/data/defaults.ts` + `src/data/sources.ts` under the Phase 2 sourcing gate. **Fixed for v1, not a user control.**
- **D-08:** **Default basis = real.** The toggle re-inflates **all money surfaces consistently** — Chart 1, Chart 2, summary readout. Chart 3 (rank) is unitless and unaffected.
- **D-09:** **Money-illusion neutrality safeguard:** when nominal is active, a **fixed neutral caption** states figures are not inflation-adjusted and cites the inflation rate used. Seeded into `docs/NEUTRALITY-STYLE-GUIDE.md` for the Phase 5 gate.
- **D-10:** Desktop layout = a **sticky side panel** holding all controls (2 inputs + horizon + log/linear toggle + real/nominal toggle), three stacked charts scrolling beside it.
- **D-11:** On mobile the side panel **collapses to a full-width block stacked above the charts** (no hidden UI, no bottom sheet). Phase 3 single-column stacked-chart order preserved.
- **D-12:** Hover tooltips degrade to **tap-to-inspect with tap-away dismiss** (standard ECharts touch). Every Phase 3 tooltip safeguard (D-08 combined divergence tooltip, D-11 rank-paired-with-real-wealth tooltip) must work on touch — never hover-only.
- **D-13:** Readout shows **ending wealth, growth multiple, CAGR** and **tracks the active real/nominal basis**.
- **D-14:** Readout surfaces distribution position as a **rank delta, not a bare absolute** (e.g. `p75 → p71`), **paired with the wealth growth** over the same horizon.
- **D-15:** The rank-delta stat carries a **neutral disclosure** (rank can shift while real wealth still grows), wording seeded into `docs/NEUTRALITY-STYLE-GUIDE.md` for Phase 5. Never shown in isolation from growing wealth.

### Claude's Discretion

- **Recompute/debounce mechanics** (debounce ms, type-vs-drag timing) — planner's call; locked requirement is ENTRY-02 (live, debounced for slider drags, no jank) + ENTRY-01 (no Calculate gate, projection on first paint).
- **Typed-value validation/clamping** for out-of-slider-range inputs — must keep engine from receiving `NaN`/negative/absurd values (Zod is the noted boundary option).
- **Summary readout placement** — explicitly deferred to planner. The three metrics, rank-delta treatment (D-14), basis-tracking (D-13) are locked; placement is not.
- Exact slider min/max/step, precise rounded-up seed figures and which SCF/dataset vintage, the inflation-rate figure and source, side-panel collapse breakpoint, chart min-height on small screens — planner/researcher, grounded in cited sources and empirical tier boundaries.

### Deferred Ideas (OUT OF SCOPE)

- **User-adjustable inflation rate** — v2 CONFIG-01. v1 ships a fixed cited inflation default (D-07).
- **Absolute ending rank/percentile as a headline stat** — rejected (Pitfall-4 zero-sum misread). Use rank-delta-paired-with-wealth (D-14).
- **Collapsible bottom-sheet / sticky compact mobile controls** — rejected for v1 in favor of stack-on-top (D-11).
- **Richer per-parameter sourcing panel** beyond the VIZ-06 footer — remains Phase 5 unless the planner finds the footer insufficient for the new seed/inflation citations.
- v2: CONFIG-01 advanced param overrides, SHARE-01 URL-shared state, plus all REQUIREMENTS.md "Out of Scope" items (accounts, tax modeling, advice, Monte Carlo, budgeting).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ENTRY-01 | Inputs current wealth + annual savings; immediate projection, no Calculate gate; all other params defaulted | First paint reads store defaults → existing selectors → existing charts. No gating boolean; the projection is a derived value, not a triggered action (§Architecture Pattern 1). |
| ENTRY-02 | Recomputes live on input change (debounced for slider drags) | `useDeferredValue` on the store-derived inputs OR a setTimeout debounce on slider→store writes; recompute is sub-ms synchronous so deferral is sufficient (§Pattern 3, §Don't Hand-Roll). |
| ENTRY-03 | Adjustable horizon (default ~30–40y, up to ~50–60y) | `horizon` is already a plain `number` field in `Params`; engine supports ≤60 (`types.ts` D-09). Add `setHorizon` to store; linear slider 10–60, default 35 (matches `DEFAULTS.horizon`). |
| ENTRY-04 | Toggle real vs nominal (real is honest default) | Display-layer re-inflation selector (D-06). New `basis` flag in store; new memoized re-inflation selector wrapping the three money selectors. Engine untouched (§Pattern 2). |
| ENTRY-05 | Summary readout: ending wealth, growth multiple, CAGR | All three derivable from `ProjectionResult.series` (first/last `userWealth`, horizon). New memoized `selectSummary` selector; rank delta from `relativePosition` first/last `userRank` (§Code Examples). |
| ENTRY-06 | Responsive across mobile/desktop; chart interactions degrade to touch | Tailwind v4 responsive utilities; ECharts touch is automatic (tap = hover trigger, tap-away dismiss) — no extra config needed (§Pattern 4, §Common Pitfalls). |
</phase_requirements>

## Summary

Phase 4 is a **pure imperative-shell wiring task on top of an already-complete, already-tested functional core**. Every model concern (engine, distribution, drag, relative position, selectors, charts, citation footer, neutrality style guide) exists and passes tests as of Phase 3. There is **no new domain investigation required** — this is composition, state plumbing, and responsive layout.

The single architectural seam is `src/state/store.ts`: today it is a read-only Zustand store seeded from `DEFAULTS`. Phase 4 adds `setInputs`/`setHorizon`/`setBasis` actions, replaces the `$120,000` placeholder with a cited median seed, and replaces `HarnessPage.tsx`'s module-level `projectionEngine(...)` call with a store-subscribed memoized recompute. The existing three chart selectors and components are reused verbatim; nominal re-inflation and the summary readout are **new memoized selectors layered on top of the existing ones** — never edits to `core/`.

**Primary recommendation:** Add three store actions; create one `selectProjection(state)` memoized derivation and two new selectors (`selectReinflated` for nominal display, `selectSummary` for the readout); build a `ControlPanel` component and an `AppShell` layout component; replace `HarnessPage` with the real shell; use React 19's `useDeferredValue` for slider-drag debouncing (recompute is sub-millisecond, so deferral — not timer debounce — is the simplest correct tool); validate the typed-field boundary with Zod (already in CLAUDE.md as the sanctioned option, not yet installed). All new copy goes through the existing `docs/NEUTRALITY-STYLE-GUIDE.md` seeding pattern for the Phase 5 gate.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Projection math | Functional core (`src/core/`) | — | Already complete & tested; Phase 4 must not touch it (basis invariant, ARCHITECTURE.md) |
| Parameter/input state | Zustand store (`src/state/store.ts`) | — | Designated seam; flat parameter bag feeding a pure function — Zustand's sweet spot |
| engine→ECharts mapping | Memoized selectors (`src/state/selectors.ts`) | — | CLAUDE.md mandatory `params → selector → model → option` pattern; charts never transform inline |
| Nominal re-inflation (D-06) | Memoized selector (display layer) | — | Engine is real-only invariant; re-inflation is round-at-display |
| Summary metrics (D-13/D-14) | Memoized selector (display layer) | — | Pure derivation from `ProjectionResult`; testable in Vitest like Phase 3 selectors |
| Input controls (sliders/fields) | Imperative shell (`src/ui/`) | — | DOM/React concern; new components compose existing ones |
| Responsive layout (D-10/D-11) | Imperative shell (Tailwind utilities) | — | No design system (CLAUDE.md); Tailwind v4 breakpoint utilities only |
| Boundary validation (typed fields) | Imperative shell (Zod at the input edge) | — | Keep engine from receiving NaN/negative/absurd (CLAUDE.md) |
| Touch interaction | ECharts (built-in) | — | ECharts handles touch automatically; no custom gesture code |

## Standard Stack

The stack is **fixed and already installed** (verified from `package.json` and a clean Phase 3 test suite). No new framework or charting decisions.

### Core (already installed — verified from package.json 2026-05-16)
| Library | Installed Version | Purpose | Notes |
|---------|-------------------|---------|-------|
| react / react-dom | 19.2.6 | UI framework | `useDeferredValue`, `useMemo`, `useSyncExternalStore` (via zustand) all available [VERIFIED: package.json] |
| zustand | 5.0.13 | Parameter store | The Phase 4 seam; add actions to existing `useProjectionStore` [VERIFIED: package.json] |
| echarts | 6.0.0 | Charting | Touch interaction built-in [VERIFIED: package.json] |
| echarts-for-react | 3.0.6 | React ECharts wrapper | Already wrapped in `TimeSeriesChart`/`DivergenceChart`/`RelativePosChart` [VERIFIED: package.json] |
| tailwindcss / @tailwindcss/vite | 4.3.0 | Styling | `@import "tailwindcss"` already in `src/index.css`; responsive utilities available [VERIFIED: package.json] |
| vite | 8.0.13 | Build/dev | [VERIFIED: package.json] |
| vitest | 4.1.6 | Unit tests | **Note: 4.1.6, not "3.x" as CLAUDE.md states** — CLAUDE.md is stale here; the installed/working version is 4.1.6 [VERIFIED: package.json] |
| typescript | 5.9.3 | Language | strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax` all on [VERIFIED: tsconfig.json] |

### Supporting (one new dependency)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 4.x | Runtime validation of the typed numeric fields + clamping to keep engine inputs sane | CLAUDE.md §Supporting names Zod 4.x as the boundary-validation option. Add only for the typed-field validation (Claude's-discretion item). A ~15-line hand-rolled clamp is an acceptable zero-dep alternative for two numeric fields (see §Alternatives Considered). |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `useDeferredValue` for slider debounce | `setTimeout` debounce hook | `setTimeout` is for rate-limiting I/O (network). This recompute is **synchronous, sub-millisecond, no I/O** (pure function over ~36–61 years × few tiers). `useDeferredValue` is the React-native, no-magic-number fit: it keeps the slider thumb responsive while deferring the (cheap) recompute, and interrupts/restarts cleanly. [CITED: react.dev/reference/react/useDeferredValue] |
| Zod for typed-field validation | Hand-rolled `clamp(parseFloat(x), min, max)` returning a safe default on `NaN` | For exactly two non-negative numeric fields a 15-line helper is defensible and zero-dep (CLAUDE.md explicitly allows this judgement). Zod earns its place if/when URL-shared state (v2 SHARE-01) arrives. Planner's call. |
| New AppShell layout component | Inline layout in the page | A dedicated `AppShell` keeps the page declarative and the sticky/stacked responsive logic in one place; recommended for D-10/D-11 clarity. |

**Installation (only if Zod chosen for validation):**
```bash
npm install zod@^4
```

**Version verification:** `react@19.2.6`, `zustand@5.0.13`, `echarts@6.0.0`, `echarts-for-react@3.0.6`, `tailwindcss@4.3.0`, `vite@8.0.13`, `vitest@4.1.6`, `typescript@5.9.3` all verified from the committed `package.json` on 2026-05-16. Node `v25.9.0` present (exceeds Vite 8's Node 22.12+/20.19+ floor) [VERIFIED: package.json + node --version].

## Package Legitimacy Audit

Only one potential new package (`zod`), and only if the planner chooses it over a hand-rolled clamp. slopcheck was not run this session (no install attempted); therefore the recommendation is tagged `[ASSUMED]` and the planner must gate it behind a `checkpoint:human-verify` task before install if chosen.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| zod | npm | mature (~5 yrs) | very high (>20M/wk, training-knowledge) | github.com/colinhacks/zod | not run | `[ASSUMED]` — named explicitly in project CLAUDE.md §Supporting; planner gates install behind checkpoint:human-verify |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*slopcheck unavailable this session → `zod` is `[ASSUMED]`. If the planner chooses the hand-rolled clamp instead, this phase installs **zero** new packages and the audit is moot.*

## Architecture Patterns

### System Architecture Diagram

```
                         ┌─────────────────────────────────────────┐
   user drags slider ───▶ │  ControlPanel (imperative shell)        │
   user types in field ─▶ │  - log slider ⇄ numeric field (D-01)    │
   user moves horizon ──▶ │  - horizon linear slider (D-05)         │
   user toggles basis ──▶ │  - real/nominal toggle (D-08)           │
   user toggles scale ──▶ │  - existing LogLinearToggle (D-07)      │
                         └──────────────┬──────────────────────────┘
                                        │ setInputs / setHorizon / setBasis
                                        ▼
                         ┌─────────────────────────────────────────┐
                         │  useProjectionStore (Zustand)           │
                         │  { inputs, params(+horizon), basis }    │
                         └──────────────┬──────────────────────────┘
                                        │ useDeferredValue(inputs)  ← drag debounce
                                        ▼
                         ┌─────────────────────────────────────────┐
                         │  selectProjection (useMemo)             │
                         │  projectionEngine(inputs, params)       │  ← real-only core, UNTOUCHED
                         └──────────────┬──────────────────────────┘
                                        │ ProjectionResult (real basis)
                          ┌─────────────┼───────────────────────────┐
                          ▼             ▼                           ▼
              ┌───────────────────┐ ┌──────────────────┐ ┌─────────────────────┐
              │ selectReinflated  │ │ selectSummary    │ │ existing selectors  │
              │ real→nominal if   │ │ ending wealth,   │ │ TimeSeries/Diverg./ │
              │ basis==='nominal' │ │ ×, CAGR, rank Δ  │ │ RelPos/Citation     │
              │ (D-06 display)    │ │ (D-13/D-14)      │ │ (Phase 3, reused)   │
              └─────────┬─────────┘ └────────┬─────────┘ └──────────┬──────────┘
                        ▼                    ▼                      ▼
              ┌──────────────────────────────────────────────────────────────┐
              │  AppShell  (D-10 sticky side panel desktop / D-11 stack mobile)│
              │  Chart1 · Chart2 · Chart3 · SummaryReadout · CitationFooter    │
              │  + nominal caption (D-09) + rank-delta disclosure (D-15)       │
              └──────────────────────────────────────────────────────────────┘
```

The basis toggle re-inflates the **inputs to the money selectors**, not the engine output store. Chart 3 (`selectRelPosOption`) bypasses `selectReinflated` entirely — rank is unitless (D-08).

### Recommended Project Structure (additive — no moves)
```
src/
├── core/           # UNTOUCHED — engine, distribution, drag, relativePosition, types
├── data/           # defaults.ts + sources.ts — ADD: seed median + inflation rate (D-03/D-07)
├── state/
│   ├── store.ts    # EDIT: add setInputs/setHorizon/setBasis; replace 120_000 seed; add basis
│   └── selectors.ts# ADD: selectReinflated (D-06), selectSummary (D-13/D-14); existing ones reused
├── ui/
│   ├── AppShell.tsx       # NEW — responsive layout (D-10 sticky panel / D-11 stack)
│   ├── ControlPanel.tsx   # NEW — composes the input/slider/toggle controls
│   ├── LogSliderInput.tsx # NEW — log slider ⇄ numeric field pair (D-01)
│   ├── HorizonSlider.tsx  # NEW — linear slider + year readout (D-05)
│   ├── BasisToggle.tsx    # NEW — real/nominal (mirror LogLinearToggle styling)
│   ├── SummaryReadout.tsx # NEW — ending wealth / × / CAGR / rank Δ (D-13/D-14/D-15)
│   ├── LogLinearToggle.tsx# REUSED as-is (Phase 3)
│   ├── CitationFooter.tsx # REUSED as-is (Phase 3)
│   └── HarnessPage.tsx    # DELETE/REPLACE — becomes the real shell (or new App.tsx)
├── viz/            # UNTOUCHED — TimeSeriesChart, DivergenceChart, RelativePosChart
└── main.tsx        # EDIT one line — render the new shell instead of HarnessPage
```

### Pattern 1: Projection as a derived value, not a gated action (ENTRY-01)
**What:** There is no "Calculate" boolean anywhere. The projection is `useMemo(() => projectionEngine(inputs, params), [inputs, params])`. First paint already has store defaults → a chart renders before any interaction.
**When to use:** Always, this phase. This is the literal ENTRY-01 requirement.
**Example:**
```typescript
// src/state/selectors.ts (new) — Source: existing engine.ts signature + CLAUDE.md mandatory pattern
import { projectionEngine } from '../core/engine.js';
import type { Inputs, Params, ProjectionResult } from '../core/types.js';

export function selectProjection(inputs: Inputs, params: Params): ProjectionResult {
  return projectionEngine(inputs, params); // pure; memoize at the call site
}
```
```tsx
// in the shell component
const inputs   = useProjectionStore((s) => s.inputs);
const params   = useProjectionStore((s) => s.params);
const deferred = useDeferredValue(inputs);                       // ENTRY-02 drag debounce
const result   = useMemo(() => selectProjection(deferred, params), [deferred, params]);
```

### Pattern 2: Display-layer re-inflation, engine stays real-only (ENTRY-04 / D-06)
**What:** `selectReinflated(result, basis, inflationRate)` returns `result` unchanged when `basis === 'real'`; when `'nominal'` it maps every money field by `× (1 + i) ** year`. `userPercentile`, `topSetPercentile`, `userRank`, `userShare` are **never** re-inflated (unitless / D-08). Chart 3 never goes through this selector.
**When to use:** Between `selectProjection` and the money selectors (Chart 1, Chart 2, summary).
**Example:**
```typescript
// Source: CONTEXT.md D-06/D-08; ProjectionResult shape from src/core/types.ts (read 2026-05-16)
export function selectReinflated(
  r: ProjectionResult, basis: 'real' | 'nominal', i: number,
): ProjectionResult {
  if (basis === 'real') return r;
  return {
    ...r,
    series: r.series.map((s) => {
      const f = (1 + i) ** s.year;
      return {
        ...s,
        userWealth: s.userWealth * f,
        anchorWealth: {
          median: s.anchorWealth.median * f, top10: s.anchorWealth.top10 * f,
          top1: s.anchorWealth.top1 * f, top01: s.anchorWealth.top01 * f,
        },
        // userPercentile / topSetPercentile / assetInflation: NOT re-inflated (unitless)
      };
    }),
    relativePosition: r.relativePosition, // rank/share unaffected (D-08) — Chart 3 untouched
  };
}
```
**Note:** `ProjectionResult.series` carries an internal `_totalWealth` field (added by `engine.ts` for `deriveShares`). The spread `...s` preserves it; do not re-derive shares from re-inflated wealth — `relativePosition` is passed through unchanged (a uniform `× f` does not change rank or share anyway, which is exactly why D-08 holds).

### Pattern 3: Zustand actions on the existing store (the seam)
**What:** `useProjectionStore` is currently `create<...>(() => ({...}))` (no actions). Add `set`-based actions. Keep selectors narrow so charts only re-render on relevant change (CLAUDE.md rationale for Zustand).
**Example:**
```typescript
// src/state/store.ts (EDIT) — Source: existing store.ts + zustand 5 create API
export const useProjectionStore = create<ProjectionStore>((set) => ({
  inputs: { currentWealth: SEED_WEALTH, annualSavings: SEED_SAVINGS }, // D-02 cited median
  params: DEFAULTS,
  basis: 'real',                                                       // D-08 default
  setInputs:  (patch) => set((s) => ({ inputs: { ...s.inputs, ...patch } })),
  setHorizon: (h) => set((s) => ({ params: { ...s.params, horizon: h } })),
  setBasis:   (b) => set({ basis: b }),
}));
```
**Caveat:** `DEFAULTS` is `Object.freeze`d (deep). `{ ...s.params, horizon: h }` creates a new top-level object so the frozen original is not mutated — safe. Do not attempt in-place `s.params.horizon = h`.

### Pattern 4: Responsive layout with Tailwind v4 utilities (D-10/D-11)
**What:** Mobile-first single column; at a breakpoint switch to a two-column grid with a `sticky top-0 self-start` control panel. No design system, no component library (CLAUDE.md / 03-UI-SPEC.md).
**Example:**
```tsx
// Source: Tailwind v4 responsive variants; D-10/D-11
<div className="mx-auto max-w-6xl px-4 py-8 lg:grid lg:grid-cols-[320px_1fr] lg:gap-8">
  <aside className="lg:sticky lg:top-8 lg:self-start">
    <ControlPanel />          {/* D-11: full-width block above charts on mobile */}
  </aside>
  <main className="space-y-6 mt-8 lg:mt-0">{/* Chart1 · Chart2 · Chart3 · Summary */}</main>
</div>
```
Reuse the existing Phase 3 card treatment verbatim (`bg-slate-50 border border-slate-200 p-4 rounded`, 320px chart min-height, `lg`=24px gap) — 03-UI-SPEC.md is still the binding visual contract.

### Anti-Patterns to Avoid
- **Re-inflating inside `core/`** — violates the real-only basis invariant (MODEL-05, ARCHITECTURE.md). Re-inflation lives in `selectors.ts` only.
- **A Calculate button or `hasCalculated` flag** — directly violates ENTRY-01. Projection is a derived value.
- **Mutating `DEFAULTS`** — it is deep-frozen; clone the top level when setting horizon.
- **`setTimeout` debounce with a guessed ms** — unnecessary; the recompute is sub-ms and synchronous. `useDeferredValue` is the correct primitive (§Don't Hand-Roll).
- **Re-deriving `relativePosition` from re-inflated wealth** — pointless and risks divergence from the engine's `deriveShares`; pass it through (uniform inflation preserves rank/share by construction — D-08).
- **A bare absolute ending rank stat** — explicitly rejected (CONTEXT deferred; Pitfall 4). Must be a delta paired with wealth growth (D-14) + neutral disclosure (D-15).
- **Hover-only tooltips** — every Phase 3 tooltip safeguard must work on tap (D-12). Do not set `triggerOn: 'mousemove'` (it disables tap on touch); leave ECharts default.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slider-drag debounce | Custom timer/debounce hook with a magic ms | React 19 `useDeferredValue` | Recompute is synchronous & sub-ms; deferral keeps the thumb smooth and self-cancels. No magic number to tune. [CITED: react.dev/reference/react/useDeferredValue] |
| State store | New context/reducer | Existing `useProjectionStore` (zustand) | The seam already exists; selector subscriptions prevent broad re-renders (CLAUDE.md rationale). |
| engine→chart mapping | New inline chart transforms | Existing `selectTimeSeriesOption`/`selectDivergenceOption`/`selectRelPosOption` | Already implemented, tested, neutrality-reviewed. Reuse verbatim. |
| Numeric input parsing/clamping | Bespoke regex/parse logic scattered per field | Zod schema (CLAUDE.md option) **or** one shared `clampPositive(raw, min, max)` helper | Centralize the NaN/negative/absurd guard at one boundary (CLAUDE.md). |
| Touch gesture handling for tooltips | Custom touch listeners on charts | ECharts built-in touch | ECharts 6 maps tap→tooltip trigger and tap-away→dismiss automatically; the Phase 3 wrapper already passes `confine:true` so tooltips stay on-screen on small viewports. |
| Log-scale slider math | Ad-hoc per-slider exp/log | One shared `LogSliderInput` (slider holds `log10(value)`, field holds value) | D-01 needs this for two inputs (wealth + savings); a single component avoids duplicated, drift-prone math. |
| Number/currency formatting | New formatter | Existing `formatWealth` in `selectors.ts` | Already handles k/M abbreviation with the agreed format; reuse for the summary readout too. |

**Key insight:** Phase 4 introduces *zero* new algorithms. Every "hard" problem (projection, distribution, drag, relative position, chart options, citation rendering) is solved and tested. The only genuinely new code is (a) three trivial Zustand setters, (b) two pure derived selectors, (c) presentational components. Treat anything that *feels* like new math as a signal you're about to violate the functional-core boundary.

## Common Pitfalls

### Pitfall 1: Putting nominal re-inflation in the engine
**What goes wrong:** Tempting to add a `basis` param to `projectionEngine`. This breaks the `assertReal` guard and the MODEL-05 basis invariant; `basis.test.ts` will fail.
**Why it happens:** Re-inflation looks like "model logic."
**How to avoid:** It is *display* logic. Implement `selectReinflated` in `selectors.ts`; engine and `core/` are untouched. Verify with: `git diff --stat src/core` shows zero changes.
**Warning signs:** Any new import of `core/` types into a re-inflation function beyond the read-only `ProjectionResult`/`Inputs`/`Params` types.

### Pitfall 2: ECharts stale axis/series on basis or scale toggle
**What goes wrong:** Toggling real→nominal or log→linear leaves the previous axis scale/data because ECharts merges options by default.
**Why it happens:** `setOption` merges unless told not to.
**How to avoid:** The Phase 3 chart wrappers already pass `notMerge={true}` (see `TimeSeriesChart.tsx` line 16, `RelativePosChart.tsx`). Reuse those wrappers unchanged — do **not** introduce new chart components without `notMerge`.
**Warning signs:** Y-axis still shows old magnitudes after toggling basis; a newly-written chart component missing `notMerge`.

### Pitfall 3: Frozen-object mutation on horizon change
**What goes wrong:** `DEFAULTS` is deep `Object.freeze`d. `state.params.horizon = h` throws in strict mode / silently no-ops.
**How to avoid:** Always `{ ...s.params, horizon: h }` (Pattern 3). `horizon` is a plain top-level `number` in `Params`, so a shallow clone of `params` is sufficient.
**Warning signs:** Horizon slider moves but charts don't change; a "Cannot assign to read only property" error.

### Pitfall 4: Rank-delta presented as a zero-sum/finite-pie outcome
**What goes wrong:** Showing `p75 → p71` alone reads as "the user lost," implying a fixed pie — the project's single biggest neutrality risk (PITFALLS.md Pitfall 4; REQUIREMENTS Out-of-Scope).
**How to avoid:** D-14 mandates the rank delta is **always paired with the same-horizon wealth growth** in the readout; D-15 mandates a neutral disclosure ("rank can shift while real wealth still grows"). Seed the exact disclosure wording into `docs/NEUTRALITY-STYLE-GUIDE.md` (new subsection) exactly as Phase 3 seeded the D-11 caption (see Section 3 of the style guide for the pattern), so Phase 5 (NEUT-02) gates it verbatim.
**Warning signs:** A summary stat showing a rank or rank delta with no adjacent wealth figure; disclosure text only in code, not in the style guide.

### Pitfall 5: Nominal numbers shown without the money-illusion caption
**What goes wrong:** Nominal mode shows impressively large numbers with no statement that they aren't inflation-adjusted — money illusion, a neutrality failure.
**How to avoid:** D-09 — when `basis === 'nominal'`, render a fixed neutral caption stating figures are *not* inflation-adjusted and citing the inflation rate used (read from the new `sources.ts` record). Mirror the D-11 caption pattern (DOM element, not a tooltip). Seed wording into the style guide for the Phase 5 gate.
**Warning signs:** Nominal toggle changes chart magnitudes but no caption appears; caption text hardcoded but absent from the style guide.

### Pitfall 6: Sourcing-completeness gate fails on the new defaults
**What goes wrong:** Adding the seed-median and inflation-rate values without a complete `SourceRecord` fails the Phase 2 sourcing gate (`src/core/__tests__/sourcing.test.ts`) and CI.
**Why it happens:** D-03/D-07 add new shipped figures; DATA-04 makes sourcing an enforced invariant.
**How to avoid:** Add full six-field `SourceRecord`s to `src/data/sources.ts` and reference them, exactly as the existing `anchors`/`returnByTier` entries do (`defaults.ts` lines 88–195 are the template). The 2022 SCF median family net worth is **$192,900** — rounding up to ~$200k for the seed (D-02) is well-supported [VERIFIED: federalreserve.gov SCF 2022 / scf23.pdf]. For the inflation default, a single cited long-run figure (e.g. long-run US CPI ~ 2.5–3%, or PCE ~2%) — planner selects exact figure + source under the same gate. **Note:** the seed values are *UX defaults*, not DATA-04-scoped empirical model params (compare the existing `savings` record in `defaults.ts` lines 379–404, which documents itself as a UX default while still carrying a full `SourceRecord` — copy that exact pattern, including the self-describing `note`).
**Warning signs:** `npm test` fails in `sourcing.test.ts`; a new figure with `source: null` or partial record.

### Pitfall 7: New copy bypasses the neutrality style guide
**What goes wrong:** Control labels, the nominal caption, the rank-delta disclosure, and summary labels are new user-facing copy. If not seeded into `docs/NEUTRALITY-STYLE-GUIDE.md`, Phase 5's NEUT-02 review has nothing to gate against.
**How to avoid:** For every new visible string, add/extend a style-guide section (the guide already has the lexicon, chart-semantic rules, and the D-11 caption-rule pattern in Sections 1–4). D-09 and D-15 explicitly require their wording seeded there.
**Warning signs:** New strings in `.tsx` files with no corresponding style-guide entry; evaluative words (banned lexicon in Section 1: "soar", "trapped", "winners", "lose", "!", zero-sum framing).

## Runtime State Inventory

> Rename/refactor inventory. Phase 4 is **additive UI wiring**, not a rename — but it *deletes/replaces* `HarnessPage.tsx` and changes a stored seed default, so a light inventory applies.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no database, no persistence, no localStorage in the codebase (verified: no `localStorage`/`indexedDB`/persist-middleware references in `src/`). State is in-memory Zustand only. | None |
| Live service config | None — pure static SPA, no backend, no external services (REQUIREMENTS Out-of-Scope confirms). | None |
| OS-registered state | None — browser app, no OS registrations. | None |
| Secrets/env vars | None — no `.env`, no API keys (no network calls in scope). | None |
| Build artifacts | `src/ui/HarnessPage.tsx` is referenced by `src/main.tsx` (line 5) and is the only `main.tsx` import. Replacing/deleting it requires updating that one import line. No compiled artifacts to clean (Vite rebuilds `dist/` fresh). The `$120,000` seed appears in `store.ts` line 13 **and** `HarnessPage.tsx` line 27 (module-level `HARNESS_INPUTS`) — both are removed/replaced; the only remaining seed source becomes the store. | Update `main.tsx` import; ensure no other module imports `HarnessPage`; remove the duplicate `HARNESS_INPUTS` literal. Verified: only `main.tsx` imports `HarnessPage` (grep). |

**Canonical question — after every file is updated, what still holds the old seed/page?** Nothing runtime. The only persistence is module-level constants, all of which are edited in this phase. Confirmed by codebase grep: `HarnessPage` imported only in `main.tsx`; `120_000` literal only in `store.ts` and `HarnessPage.tsx`.

## Code Examples

### Summary readout derivation (ENTRY-05 / D-13 / D-14)
```typescript
// src/state/selectors.ts (new) — Source: ProjectionResult shape from src/core/types.ts (read 2026-05-16)
// Operates on the BASIS-ADJUSTED result (call after selectReinflated) so it tracks D-13.
export interface Summary {
  endingWealth: number;     // last series userWealth (already basis-adjusted)
  growthMultiple: number;   // endingWealth / startingWealth
  cagr: number;             // (end/start)^(1/years) - 1
  startRank: number;        // relativePosition[0].userRank   (0–100, basis-independent)
  endRank: number;          // relativePosition[last].userRank
}
export function selectSummary(r: ProjectionResult): Summary {
  const first = r.series[0]!;
  const last  = r.series[r.series.length - 1]!;
  const years = last.year - first.year;          // = horizon
  const start = first.userWealth;
  const end   = last.userWealth;
  const rp    = r.relativePosition;
  return {
    endingWealth: end,
    growthMultiple: start > 0 ? end / start : 0,
    cagr: start > 0 && years > 0 ? (end / start) ** (1 / years) - 1 : 0,
    startRank: rp[0]!.userRank,
    endRank: rp[rp.length - 1]!.userRank,
  };
}
```
The readout component renders `endRank` paired with the wealth growth and the D-15 disclosure — never `endRank` alone (D-14/Pitfall 4). Rank is basis-independent so it is identical whether real or nominal is active; only the money fields track basis.

### Log slider ⇄ numeric field pairing (D-01)
```tsx
// src/ui/LogSliderInput.tsx (new) — Source: D-01/D-04; standard log-slider technique
// Slider operates in log10 space so $2k…$2M is perceptually even (D-04).
function LogSliderInput({ value, min, max, onChange, label }: {
  value: number; min: number; max: number; label: string;
  onChange: (v: number) => void;
}) {
  const lg = (n: number) => Math.log10(n);
  return (
    <label className="block">
      <span className="text-sm text-slate-600">{label}</span>
      <input type="range" min={lg(min)} max={lg(max)} step={0.001}
        value={lg(Math.min(Math.max(value, min), max))}
        onChange={(e) => onChange(Math.round(10 ** Number(e.target.value)))} />
      <input type="number" inputMode="numeric" value={value} min={0}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) && n >= 0 ? n : 0); // boundary guard (Zod-or-clamp choice)
        }} />
    </label>
  );
}
```
Typed field accepts values **outside** the slider span (D-04); the slider clamps its thumb to `[min,max]` but the underlying store value is whatever was typed (still guarded ≥0, finite).

### ECharts touch — no code required (ENTRY-06 / D-12)
The Phase 3 wrappers (`TimeSeriesChart`, `DivergenceChart`, `RelativePosChart`) already configure `tooltip: { trigger: 'axis', confine: true }` in the selectors. ECharts 6 maps a tap to the axis-trigger tooltip and a tap elsewhere dismisses it automatically; `confine: true` keeps the tooltip inside the (narrow, mobile) container. **Do not** add `triggerOn: 'mousemove'` (that would break tap). No new chart code is needed for D-12 — only verify on a touch viewport during UAT.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `setTimeout`/lodash debounce for expensive recompute on input | `useDeferredValue` for synchronous in-app recompute | React 18+ (stable in 19) | No magic ms; interruptible; correct tool when there's no I/O to rate-limit |
| Class/HOC chart wrappers | `echarts-for-react` functional `<ReactECharts notMerge>` | already adopted Phase 3 | Reuse as-is; don't reinvent |
| Tailwind v3 + PostCSS | Tailwind v4 `@tailwindcss/vite` plugin | already adopted (`index.css`) | Use v4 responsive variant utilities directly |

**Deprecated/outdated:**
- CLAUDE.md says Vitest "3.x" — installed and working version is **4.1.6**. Treat 4.1.6 as authoritative; do not downgrade. (CLAUDE.md stack table is otherwise accurate vs `package.json`.)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `useDeferredValue` (no timer debounce) is sufficient for ENTRY-02 "no jank" because the recompute is sub-millisecond | Standard Stack / Don't Hand-Roll | LOW — if a long horizon ever made recompute slow, fallback is a timer debounce or Web Worker (CLAUDE.md notes Worker as a measured-evidence-only escalation). Engine is closed-form annual loop over ≤61 years; no measured perf issue. |
| A2 | Rounding the 2022 SCF median net worth ($192,900) up to ~$200k satisfies D-02 "rounded-up real-world median" | Pitfall 6 | LOW — figure verified; exact rounded value + vintage is Claude's-discretion per CONTEXT. Planner picks final figure. |
| A3 | Uniform `× (1+i)^year` re-inflation leaves `userRank`/`userShare` unchanged, so `relativePosition` can pass through untouched (D-08) | Pattern 2 | LOW — mathematically true: a common positive factor across all tiers preserves ordering and shares. D-08 explicitly asserts Chart 3 is unaffected. |
| A4 | The seed/inflation defaults are UX defaults (like the existing `savings` record), not DATA-04-scoped model params, but still need a full `SourceRecord` to pass the sourcing gate | Pitfall 6 | LOW — `defaults.ts` lines 379–404 show the established self-describing-UX-default-with-SourceRecord pattern; copy it. |
| A5 | The exact long-run inflation figure and its source are unspecified by CONTEXT (Claude's-discretion) | Pitfall 6 | MEDIUM — multiple valid choices (US CPI ~2.5–3% long-run vs PCE ~2%). The *figure* affects nominal magnitudes; the *approach* (one cited fixed rate, display-only) is locked by D-07. Planner/discuss must pick + cite; flag for user confirmation if a specific number matters. |
| A6 | Zod is the sanctioned validation lib but a hand-rolled clamp is an acceptable zero-dep alternative for two numeric fields | Standard Stack | LOW — CLAUDE.md explicitly permits the hand-rolled judgement for this small app. |

## Open Questions

1. **Exact inflation rate figure + primary source (D-07)**
   - What we know: must be one cited long-run figure, fixed for v1, added under the Phase 2 sourcing gate, display-only.
   - What's unclear: CPI vs PCE vs GDP-deflator basis; which vintage. Affects nominal numbers (not real, the default).
   - Recommendation: Planner picks long-run US CPI-U geometric average with a Federal Reserve / BLS primary citation, documents basis in the `SourceRecord.definition`, and seeds the D-09 caption text (which cites the rate) into the style guide. Surface as a discuss-phase confirmation if the user has a preference.

2. **Exact rounded seed figures (D-02) and SCF vintage**
   - What we know: ~$200k current wealth (rounds up 2022 SCF $192,900); savings ≈ rounded-up median savings.
   - What's unclear: precise rounded values; whether to cite SCF 2022 (latest) vs SCF 2019 (already cited in `anchors`).
   - Recommendation: Use SCF 2022 ($192,900 → seed $200k) for currency; for savings reuse the reasoning already in `defaults.ts` `savings` note (median income × savings rate ≈ $6k, possibly rounded up per D-02). Planner finalizes; both go through the sourcing gate.

3. **Side-panel collapse breakpoint and small-screen chart min-height**
   - What we know: sticky panel desktop / stacked mobile (D-10/D-11); Phase 3 chart min-height is 320px.
   - What's unclear: exact Tailwind breakpoint (`md` 768px vs `lg` 1024px).
   - Recommendation: `lg` (1024px) — control panel + three 320px charts side-by-side need width; below that, stack. Keep 320px chart min-height (03-UI-SPEC.md contract) unless touch testing shows it's too tall on small phones; planner's discretion per CONTEXT.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Vite dev/build, Vitest | ✓ | v25.9.0 (≥ Vite 8 floor 22.12/20.19) | — |
| npm | Install (only if Zod chosen) | ✓ | bundled with Node 25 | — |
| All runtime deps | Entire phase | ✓ | Installed & test-green at Phase 3 | — |
| Browser w/ touch (UAT) | ENTRY-06/D-12 verification | manual | — | Desktop devtools touch emulation as a first pass; real device for sign-off |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** Zod is *not yet installed* — only needed if the planner chooses Zod over a hand-rolled clamp (fallback: zero-dep clamp helper).

## Validation Architecture

`workflow.nyquist_validation` is not set to `false` (no `.planning/config.json` workflow override found) → section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 |
| Config file | Inline in `vite.config.ts` (`test:` block) — no separate `vitest.config.ts` |
| Quick run command | `npm test -- src/state/__tests__/selectors.test.ts` |
| Full suite command | `npm test` (alias for `vitest run`) + `npm run typecheck` (`tsc --noEmit`) |

**Important:** `vite.config.ts` `test.environment` is `'node'` and `coverage.include` is `['src/core/**','src/state/**']`. New **selector** tests (`selectReinflated`, `selectSummary`) run under `node` and are coverage-tracked — keep them framework-free pure-function tests (the existing `selectors.test.ts` is the exact template). Component/DOM tests would need `jsdom`/`happy-dom` (not currently configured) — see Wave 0.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENTRY-01 | engine called from defaults; result has data on first derivation | unit (selector) | `npm test -- src/state/__tests__/selectors.test.ts` | ✅ extend existing |
| ENTRY-02 | recompute is pure/deterministic given inputs (debounce is UI-only, manual) | unit + manual | `npm test` (purity) / UAT for jank | ✅ / ❌ jank is manual UAT |
| ENTRY-03 | `setHorizon` produces new params; engine respects horizon (series length = horizon+1) | unit | `npm test -- src/state/__tests__/store.test.ts` | ❌ Wave 0 (`store.test.ts`) |
| ENTRY-04 | `selectReinflated` real==identity; nominal scales money by (1+i)^year; rank/share unchanged | unit | `npm test -- src/state/__tests__/selectors.test.ts` | ✅ extend existing |
| ENTRY-05 | `selectSummary` returns correct ×, CAGR, rank delta vs hand-computed fixture | unit | `npm test -- src/state/__tests__/selectors.test.ts` | ✅ extend existing |
| ENTRY-06 | responsive layout + touch tooltip | manual (UAT) | n/a — devtools/device check | ❌ manual; record as UAT item |
| D-03/D-07 sourcing | new seed/inflation records pass sourcing-completeness gate | unit | `npm test -- src/core/__tests__/sourcing.test.ts` | ✅ existing gate (must stay green) |

### Sampling Rate
- **Per task commit:** `npm test -- src/state/__tests__/selectors.test.ts` (fast, the touched surface)
- **Per wave merge:** `npm test` (full suite — includes the sourcing gate that the new defaults must pass) + `npm run typecheck`
- **Phase gate:** Full suite green + `tsc --noEmit` clean before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/state/__tests__/store.test.ts` — covers ENTRY-03 (`setHorizon`/`setInputs`/`setBasis` produce correct new state; frozen-`DEFAULTS` not mutated). New file; no store test exists today.
- [ ] Extend `src/state/__tests__/selectors.test.ts` — add `selectReinflated` (ENTRY-04) and `selectSummary` (ENTRY-05) describe blocks; existing file is the template.
- [ ] No framework install needed for these (pure-function, `node` env). **If** any component-level test is desired later, `happy-dom` + `vitest` env override would be a separate Wave 0 item — not required for the requirement coverage above (component behavior is UAT/manual for ENTRY-06).
- [ ] ENTRY-06 / D-12 touch behavior: register as a **manual UAT item** (no automated harness for ECharts touch in this setup).

## Security Domain

`security_enforcement` not explicitly `false` (no `.planning/config.json` override found) → section included. This is a **static, no-backend, no-auth, no-network, no-PII** browser SPA (REQUIREMENTS Out-of-Scope: no accounts, no API, no persistence). The attack surface is minimal.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth, no accounts (out of scope) |
| V3 Session Management | no | No sessions, no cookies, no storage |
| V4 Access Control | no | No protected resources; fully public tool |
| V5 Input Validation | yes | Two numeric fields → Zod schema **or** clamp helper: reject `NaN`/negative/non-finite before the engine (CLAUDE.md). Engine already pure & deterministic (no eval, no injection sink). |
| V6 Cryptography | no | No secrets, no crypto, no PII |
| V7 Error Handling/Logging | minor | Engine can `throw` on basis violation; the existing 03-UI-SPEC.md neutral diagnostic line ("Projection unavailable…") is the contract — never leak stack traces to the UI. |
| V14 Configuration | minor | Static `dist/` deploy; no server config. Standard CDN headers only (host-level, out of phase scope). |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed numeric input → `NaN`/`Infinity` propagating into the chart (DoS-of-self / garbage UI) | Tampering | Boundary validation (Zod/clamp) at the typed field — guard `>=0`, finite, before `setInputs` (Pattern in §Code Examples) |
| Tooltip XSS via injected strings in ECharts `formatter` | Tampering/Info | **Already mitigated** in Phase 3: all tooltip strings are built from **numeric model output only** (selectors.ts comments T-03-03); no user-supplied string ever enters a formatter. Phase 4 must preserve this — never interpolate a raw user string into a tooltip/label. |
| Dependency supply chain (one possible new dep: Zod) | Tampering | `[ASSUMED]`-tagged; planner gates install behind `checkpoint:human-verify`; or choose zero-dep clamp and add nothing. |

## Sources

### Primary (HIGH confidence)
- Codebase inspection (2026-05-16): `src/core/types.ts`, `src/core/engine.ts`, `src/state/store.ts`, `src/state/selectors.ts`, `src/state/__tests__/selectors.test.ts`, `src/ui/*`, `src/viz/*`, `src/data/defaults.ts`, `vite.config.ts`, `tsconfig.json`, `package.json` — authoritative for stack versions, engine/result contracts, the store seam, and reuse surface.
- `.planning/phases/04-ui-shell-minimal-entry/04-CONTEXT.md` — locked decisions D-01..D-15.
- `.planning/phases/03-selectors-visualization-neutrality-style-guide/03-UI-SPEC.md` + `docs/NEUTRALITY-STYLE-GUIDE.md` — binding visual/neutrality contract Phase 4 extends.
- federalreserve.gov SCF 2022 (`scf23.pdf`) — 2022 US median family net worth = $192,900.
- react.dev/reference/react/useDeferredValue — deferred-value semantics vs timer debounce.

### Secondary (MEDIUM confidence)
- React community comparisons (dev.to, react.dev guidance) — `useDeferredValue` is for in-app expensive recompute; `setTimeout` debounce is for I/O rate-limiting. Cross-verified with react.dev primary doc.

### Tertiary (LOW confidence)
- None relied upon for any prescriptive claim.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every version read directly from committed `package.json`; suite green at Phase 3.
- Architecture: HIGH — engine/selector/store contracts read directly from source; the seam is explicitly marked in `store.ts`.
- Pitfalls: HIGH — derived from actual code constraints (frozen `DEFAULTS`, `assertReal`, `notMerge`, sourcing gate, T-03-03 tooltip rule) plus CONTEXT decisions.
- Inflation figure (A5/Q1): MEDIUM — approach locked, exact figure is Claude's-discretion needing a citation pick.

**Research date:** 2026-05-16
**Valid until:** ~2026-06-15 (stable; stack frozen, no fast-moving externals — codebase facts do not expire, only the optional Zod version recommendation)
