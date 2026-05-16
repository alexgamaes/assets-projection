# Architecture Research

**Domain:** Client-side numerical projection / simulation web app (deterministic wealth model)
**Researched:** 2026-05-15
**Confidence:** HIGH

## Standard Architecture

The dominant, well-validated pattern for client-side numerical/simulation web apps
(financial calculators, mortgage/amortization engines, retirement projectors,
epidemiology sims) is a **functional core / imperative shell** layering:

1. A **pure deterministic model core** — no DOM, no framework, no I/O. Plain
   functions: `(inputs, params) → results`. Fully unit-testable in isolation,
   fast, and the single source of numerical truth.
2. A **data/params module** — static empirical constants with citations, frozen
   and imported by the core (the core never fetches; params are passed in).
3. A **config/state layer** — owns tunable params + minimal inputs, handles
   URL serialization (shareable links), and is the only place that decides
   *when* to recompute.
4. A **selector/derive layer** — turns raw model output into chart-ready and
   display-ready shapes (memoized).
5. A **presentation layer** (viz + UI shell) — pure render of derived state;
   emits user events back to the config/state layer.

Data flows one direction: `inputs + params → core → results → selectors →
view`. Events flow back up; recompute is triggered by state change, not by the
view directly.

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ UI Shell │  │  Input   │  │  Charts  │  │  Source  │      │
│  │ (layout) │  │ Controls │  │  (viz)   │  │ Citations│      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │  events ↑        ↑ derived/chart-ready data           │
├───────┴────────────┴────────────┴────────────┴───────────────┤
│              Config / State Layer  +  Selectors               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ State store  │  │ URL serialize│  │ Memoized selectors│   │
│  │ (inputs +    │←→│ /deserialize │  │ (results → chart  │   │
│  │  param overr)│  │ (shareable)  │  │  series, ranks)   │   │
│  └──────┬───────┘  └──────────────┘  └────────▲─────────┘    │
│         │  (inputs, effectiveParams)           │ results      │
├─────────┼─────────────────────────────────────┼──────────────┤
│         ▼     Pure Deterministic Model Core    │              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ projectionEngine(inputs, params) → TierTimeSeries[]  │    │
│  │  · year-by-year iteration over wealth tiers          │    │
│  │  · per-tier compounding (heterogeneous returns)      │    │
│  │  · drag coupling: aggregate top-tier growth →        │    │
│  │    asset-price inflation → real-return haircut       │    │
│  │  · relative-position / wealth-share derivation       │    │
│  │  NO DOM · NO framework · NO fetch · deterministic     │    │
│  └────────────────────────▲────────────────────────────┘    │
├───────────────────────────┼──────────────────────────────────┤
│                Empirical Params / Data Module                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ frozen defaults: return-by-tier curve, drag strength,│    │
│  │ horizon, tier boundaries — each with {value, source} │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Model Core | Year-by-year projection, per-tier compounding, drag coupling, relative-position math. Deterministic, pure. | Plain TS module, no framework imports. Pure functions over typed inputs. |
| Params/Data Module | Empirically-sourced default constants, each annotated with a citation. Tier definitions. | Frozen TS objects (`as const` / `Object.freeze`), `{ value, source, note }` shape. |
| Config/State Layer | Holds minimal inputs + param overrides; merges defaults+overrides into `effectiveParams`; triggers recompute; URL encode/decode. | Framework state (store/hook) + URL serializer (typed query params). |
| Selectors/Derive | Transform raw `results` into chart series, rank/share series, summary stats. Memoized on `(inputs, params)`. | Pure memoized selector functions. |
| Visualization | Render time-series + divergence + relative-position charts from derived data. | Charting lib (declarative); pure render of props. |
| UI Shell | Layout, progressive disclosure (2-input default vs advanced panel), citation display. | Component tree; emits events to state layer only. |

## Recommended Project Structure

```
src/
├── core/                  # Pure deterministic model — ZERO framework imports
│   ├── engine.ts          # projectionEngine(inputs, params) → results
│   ├── tiers.ts           # tier iteration, per-tier compounding
│   ├── drag.ts            # asset-price-inflation drag coupling function
│   ├── relativePosition.ts# wealth-share / rank derivation
│   ├── types.ts           # Inputs, Params, TierTimeSeries, ProjectionResult
│   └── __tests__/         # unit tests + numerical golden-master tests
├── data/                  # Empirical params with citations (imported by core)
│   ├── defaults.ts        # frozen default params, each {value, source}
│   ├── sources.ts         # citation registry (Fagereng 2020, JST, etc.)
│   └── tiers.config.ts    # tier boundary definitions
├── state/                 # Config/state + URL-shareable serialization
│   ├── store.ts           # inputs + param overrides; effectiveParams getter
│   ├── urlState.ts        # encode/decode state ↔ query params (versioned)
│   └── selectors.ts       # memoized results → chart/display shapes
├── viz/                   # Visualization components (pure render)
│   ├── ProjectionChart.tsx
│   ├── DivergenceChart.tsx
│   └── RelativePositionChart.tsx
├── ui/                    # UI shell
│   ├── App.tsx
│   ├── MinimalInputs.tsx  # the 2-input default entry
│   ├── AdvancedPanel.tsx  # opt-in param overrides
│   └── SourceCitations.tsx
└── main.tsx               # composition root: wires data→core→state→viz/ui
```

### Structure Rationale

- **core/ has zero framework/DOM/fetch imports** — enforce with a lint
  boundary rule. This is what makes the numerical model testable in isolation
  and the correctness guarantee (the project's #1 constraint) auditable.
- **data/ is imported *by* the composition root and passed into core**, not
  imported by core itself. Keeps core pure and lets tests inject synthetic
  params. Every default carries its source inline so citations and values
  never drift apart.
- **state/ is the only layer that decides when to recompute** and the only
  owner of URL serialization — keeps "no accounts, shareable via URL" (a Key
  Decision) in one place.
- **viz/ and ui/ are pure consumers of derived state** — never call the engine
  directly, never own model logic.

## Architectural Patterns

### Pattern 1: Functional Core, Imperative Shell

**What:** All numerical logic lives in pure functions; the framework only
orchestrates I/O, state, and rendering around it.
**When to use:** Any app where numerical correctness is the primary value
(this project's #1 constraint and goal).
**Trade-offs:** + Trivially testable, framework-agnostic, deterministic,
re-usable. − Requires discipline to keep the boundary clean (enforce via lint).

```typescript
// core/engine.ts — no React, no DOM, no fetch
export function projectionEngine(inputs: Inputs, params: Params): ProjectionResult {
  let tiers = initTiers(inputs, params);
  const series: YearSnapshot[] = [];
  for (let year = 0; year <= params.horizon; year++) {
    const aggTopGrowth = aggregateTopTierGrowth(tiers, params);
    const assetInflation = dragFromTopGrowth(aggTopGrowth, params); // coupling
    tiers = tiers.map(t => stepTier(t, params, assetInflation, inputs));
    series.push(snapshot(tiers, year));
  }
  return { series, relativePosition: deriveShares(series) };
}
```

### Pattern 2: Params as Injected, Citation-Annotated Data

**What:** Defaults are frozen data objects passed into the core, each value
paired with its source. Core never hard-codes constants.
**When to use:** When empirical grounding/auditability is a hard requirement.
**Trade-offs:** + Single source of truth for value+citation; testable with
synthetic params; UI can render provenance for free. − Slightly more verbose
than inline magic numbers (acceptable, and the point).

```typescript
// data/defaults.ts
export const DEFAULTS = Object.freeze({
  realReturnByTier: {
    median:   { value: 0.025, source: "fagereng2020" },
    top10:    { value: 0.045, source: "fagereng2020" },
    top1:     { value: 0.075, source: "saezZucman" },
    top01:    { value: 0.12,  source: "bach2020" },
  },
  dragStrength: { value: 0.013, source: "mckinsey2023" }, // asset infl ÷ GDP
});
```

### Pattern 3: Derived State via Memoized Selectors

**What:** Engine returns raw results; selectors (memoized on input identity)
shape them for charts and stats. View never transforms model output itself.
**When to use:** Always — keeps recompute cheap and view dumb.
**Trade-offs:** + Recompute only on real input change; view stays pure.
− One more layer (cheap; this app's compute is light enough that even
naive recompute-on-change is fine — memoize for UX smoothness, not necessity).

### Pattern 4: URL as Serialized State (Shareable, No Backend)

**What:** Full reproducible state (inputs + param overrides) encodes into the
URL query string with a schema version; deserialization validates and falls
back to defaults on mismatch.
**When to use:** "Public app, no accounts, shareable" (a Key Decision).
**Trade-offs:** + Zero backend, instantly shareable, deep-linkable.
− Need a versioned, validated codec so old shared links degrade gracefully
(use a typed/validated query-param codec, not ad-hoc string concat).

## Data Flow

### Compute Flow (one direction)

```
User edits input / param
        ↓
State layer updates store → merges DEFAULTS + overrides = effectiveParams
        ↓
projectionEngine(inputs, effectiveParams)        [pure, deterministic]
        ↓
ProjectionResult { series[], relativePosition[] }
        ↓
Memoized selectors → chart series, rank/share series, summary stats
        ↓
Viz + UI render (pure)
        ↓
(also) State layer serializes inputs+overrides → URL query string
```

### Tier-Coupling / Drag Data Flow (inside the core, per simulated year)

```
For year n:
  tiers[n]  ──► aggregateTopTierGrowth()  ──► topTierNominalGrowth
                                                     │
                                                     ▼
                              dragFromTopGrowth(topGrowth, dragStrength)
                                                     │
                                                     ▼
                                          assetPriceInflation_n   (a scalar,
                                                     │             NOT a pie split)
                       ┌─────────────────────────────┤
                       ▼                              ▼
        stepTier(median, realReturn − drag)   stepTier(top1, realReturn − drag)
                       │                              │
                       └──────────► tiers[n+1] ◄──────┘
```

Key property (matches the Key Decision "drag = asset-price inflation, not
finite pie"): the coupling is a **scalar haircut on real return derived from
aggregate top-tier compounding**, applied to every tier's growth. No tier's
gain is subtracted from another's balance; total wealth can still grow
unbounded. The drag asymmetrically compresses *real* returns more for lower
tiers because their nominal returns are smaller relative to the same inflation.

### State Management

```
URL query  ⇄  urlState codec  ⇄  State store (inputs + param overrides)
                                          │ effectiveParams = merge(DEFAULTS, overrides)
                                          ▼
                                  selectors (memoized) ⇄ engine
                                          ▼
                                     viz / ui (read-only)
```

## Build Order (dependency-implied)

The dependency graph dictates strict ordering — each layer depends only on
those below it, so build bottom-up. This is the recommendation to carry into
the roadmap:

1. **Core types + Model Engine + tests (FIRST).**
   `core/types.ts`, `engine.ts`, `tiers.ts`, `drag.ts`, `relativePosition.ts`
   with unit + golden-master numerical tests using *synthetic* params. The
   model is the product's core value and #1 constraint (correctness); it must
   be provable before anything renders. No UI dependency exists here.
2. **Empirical Params / Data module.**
   `data/defaults.ts` + `sources.ts` — replace synthetic test params with
   real, cited defaults. Validate the indicative tier returns against the
   identified literature. Depends on core types only.
3. **Selectors / derive layer.**
   Shape engine output into chart/stat structures. Depends on core; no UI yet.
4. **Visualization.**
   Charts rendering derived series. Depends on selectors.
5. **Config/State + URL serialization, then UI shell.**
   Wire minimal-input default + advanced overrides + shareable URL last; it
   composes everything below. Progressive disclosure (2 inputs default) is a
   UI concern, intentionally last.

Rationale: viz and UI are worthless without a correct engine; the engine needs
no UI to be validated. Building core+tests first de-risks the entire project
and lets every later layer assume a trustworthy model.

## Scaling Considerations

This is a single-user, client-side, static-hostable app ("public access is a
convenience, not a product mandate"). "Scale" here means *compute cost in the
browser*, not concurrent users.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Default (≤~100 yrs × handful of tiers) | Synchronous recompute on the main thread is fine (sub-millisecond). No optimization needed. |
| Heavy config (long horizons, many tiers, live-drag sliders) | Memoize selectors; debounce slider-driven recompute. Still main-thread. |
| Hypothetical (Monte Carlo / thousands of paths — out of current scope) | Move engine into a Web Worker; core's purity makes this a zero-logic-change move. |

### Scaling Priorities

1. **First "bottleneck":** UI jank from recompute on every slider tick →
   debounce + memoized selectors. Not an architecture change.
2. **Second:** only if simulation grows (Monte Carlo) → relocate the *already
   pure* core to a Web Worker. The functional-core boundary makes this free.

## Anti-Patterns

### Anti-Pattern 1: Model logic inside components / hooks

**What people do:** Compute projections inside a React component, `useEffect`,
or event handler.
**Why it's wrong:** Untestable without rendering, non-deterministic re-runs,
couples math to framework lifecycle — fatal for a correctness-first tool.
**Do this instead:** All math in `core/`, pure functions; components call
selectors only.

### Anti-Pattern 2: Hard-coded magic constants in the engine

**What people do:** Inline `0.07` returns and drag factors in the loop.
**Why it's wrong:** Breaks the "every default must cite a source" constraint;
makes the model unauditable and non-configurable.
**Do this instead:** All constants live in `data/` as `{value, source}` and
are passed into the engine as params.

### Anti-Pattern 3: Modeling drag as a finite-pie transfer

**What people do:** Subtract top-tier gains from lower tiers' balances.
**Why it's wrong:** Contradicts the explicit Out-of-Scope decision (no
zero-sum economics); produces wrong, biased results.
**Do this instead:** Drag = a scalar asset-price-inflation haircut on *real*
return derived from aggregate top growth; all tiers can still grow.

### Anti-Pattern 4: Ad-hoc URL string building for shareable state

**What people do:** Manually concatenate query params; no versioning/validation.
**Why it's wrong:** Old shared links break silently on schema change; type
coercion bugs.
**Do this instead:** A single versioned, validated codec module
(`state/urlState.ts`) with graceful fallback to defaults.

### Anti-Pattern 5: View transforming raw engine output

**What people do:** Charts reshape `ProjectionResult` inline on each render.
**Why it's wrong:** Duplicated derivation logic, recompute churn, untestable.
**Do this instead:** Memoized selectors own all result→view transforms.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| None (static host) | Pure client app; deploy as static assets. | No backend; no per-user persistence (Key Decision). |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| data → core | Params passed in as args (core never imports data) | Keeps core pure & testable with synthetic params. |
| core → state/selectors | Plain function call returning typed result | One-directional; deterministic. |
| selectors → viz/ui | Read-only derived props | View never calls engine directly. |
| ui/viz → state | Events only | State decides when to recompute & serialize URL. |
| state ⇄ URL | Versioned validated codec | Shareable, backward-tolerant. |

## Sources

- Functional core / imperative shell + pure-function calculation separation for
  financial calculators (engine simulating month/year-by-year vs. UI):
  [Why we built financial calculators separating logic from UI (DEV)](https://dev.to/cnivargi/why-we-ditched-react-and-built-financial-calculators-in-vanilla-javascript-and-how-it-made-2nl),
  [Mortgage calculator: engine vs UI, amortization loop (DEV)](https://dev.to/wernerpj_purens_jaco/how-i-built-a-mortgage-calculator-that-actually-helps-people-save-200k-nextjs-real-math-44),
  [Building a mortgage calculator: UI vs business logic (Muvon)](https://blog.muvon.io/frontend/mortgage-calculator-using-reactjs),
  [Structured finance tracker: business logic separate from rendering (DEV)](https://dev.to/amirhossein_ln/building-a-structured-finance-tracker-in-vanilla-javascript-without-frameworks-2aa2),
  [Decoupling data flow from React rendering, high-perf charts (DEV/DXcharts)](https://dev.to/devexperts/behind-the-scenes-how-we-built-a-high-performance-charting-library-in-react-cdc)
  — confidence HIGH (consistent across multiple independent engineering write-ups; also the textbook functional-core pattern).
- URL-as-shareable-state with typed/validated serialization and graceful
  fallback:
  [Advanced React state via URL params (LogRocket)](https://blog.logrocket.com/advanced-react-state-management-using-url-parameters/),
  [use-query-params (typed query param codec)](https://github.com/pbeshai/use-query-params),
  [Type-safe URL state with nuqs](https://gitnation.com/contents/type-safe-url-state-management-in-react-with-nuqs),
  [Persisting & sharing app state via URL (DEV)](https://dev.to/prabhu66/persisting-and-sharing-your-applications-state-local-url-and-beyond-4527)
  — confidence HIGH (well-established pattern, multiple mature libraries).
- Project domain constraints & decisions: `.planning/PROJECT.md` (read directly).

---
*Architecture research for: client-side deterministic wealth-projection web app*
*Researched: 2026-05-15*
