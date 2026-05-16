# Project Research Summary

**Project:** Assets Projection
**Domain:** Client-side deterministic wealth-projection + wealth-inequality-visualization web calculator
**Researched:** 2026-05-15
**Confidence:** HIGH

## Executive Summary

This is a browser-only, statically-hosted financial calculator whose core value is modeling *heterogeneous* returns by wealth tier — a niche that no mainstream tool currently occupies. Existing products split into two categories (compound-growth projectors and static wealth-percentile rankers) but no tool makes percentile rank dynamic over time or couples it to an asset-price-inflation drag mechanism. The recommended approach is a deliberately simple, correctness-first stack: Vite + React 19 + TypeScript, Apache ECharts for visualization, Zustand for parameter state, all structured as a pure functional core wired to a thin UI shell. The model is the product; the UI is the delivery vehicle.

The single most important architectural decision is keeping the projection engine as pure TypeScript functions with no framework or DOM imports. This is non-negotiable because the project's explicit top constraint is numerical correctness, and correctness is only provable in isolation. Every other component — charts, state, UI — should be a consumer of the engine's output, never a participant in its computation. Build order is dictated by this dependency: engine and empirical data layer first, visualization second, UI shell last.

The dominant risk is epistemic, not technical. The project's differentiator is empirical grounding, and the pitfalls that cause rewrites are misapplying cited figures, mixing nominal and real returns, or implementing the drag mechanism as a zero-sum transfer. Two factual corrections to PROJECT.md are critical to surface before any parameter defaults ship: (1) the Fagereng "~18pp gap" is the gross-return *association* across the net-worth distribution, not the raw 10th-to-90th return spread — the raw spread is ~500bp (~5pp); (2) the McKinsey figure grounding the drag magnitude is that ~80% of 2000–2021 net-worth growth came from asset-price inflation. These must be resolved in the data-sourcing phase before the engine consumes any defaults.

## Key Findings

### Recommended Stack

A conservative, mainstream 2026 stack optimized for correctness and solo maintainability: TypeScript 5.9 for the model (types catch parameter-mapping errors silently wrong charts cannot), React 19 + Vite 8 as the UI runtime (best documentation depth, instant HMR for iterating on a math-heavy model), Apache ECharts 6 for charts (native log-axis toggle, canvas renderer for dense multi-decade series, neutral default palettes), and Zustand 5 for parameter state (flat store feeding one pure function — exactly its design target). Supporting: Vitest 3 for model unit tests, Zod 4 for input/URL validation, nuqs 2 for shareable URL state when that feature is ready. No backend, no SSR framework, no auth.

**Core technologies:**
- TypeScript 5.9: numerical model language — types catch silent unit/mapping errors in the return curve
- React 19 + Vite 8: UI framework + build — best ecosystem depth for charts/state; instant HMR for model iteration
- Apache ECharts 6: charting — log-axis toggle, canvas renderer, neutral palette; best fit for all three required chart types
- Zustand 5: parameter state — flat tunable-param store feeding a pure function; minimal boilerplate
- Tailwind CSS v4: styling — utility-first, neutral UI, single Vite plugin, fast rebuilds
- Vitest 3: model unit tests — shared Vite config, trivial setup, critical for correctness-first math

### Expected Features

The MVP (v1) is everything required to deliver the core insight: a 2-input entry point that immediately renders a projection, a heterogeneous return curve driving the engine, the asset-price-inflation drag, a relative-position trajectory, a multi-tier comparison overlay, and a log/linear chart toggle. Sourcing citations are a launch requirement, not a polish item — they are the empirical-grounding differentiator.

**Must have (table stakes):**
- Minimal 2-input start (current wealth + annual savings) with immediate projection on first paint
- Time-series growth chart with linear/log toggle and hover tooltips
- Multi-tier comparison overlay (user vs. median vs. top 1% vs. top 0.1%)
- Real vs. nominal toggle and adjustable projection horizon
- Visible source citations per default parameter
- Responsive layout

**Should have (differentiators, all P1 scope):**
- Heterogeneous return curve by wealth percentile/tier — the core differentiator; without it this is a flat-rate calculator
- Asset-price-inflation drag mechanism — the non-zero-sum thesis; grounded in McKinsey: ~80% of 2000–2021 net-worth growth from asset-price inflation
- Relative-position tracking over time — wealth share/rank trajectory; the "you fall behind even while growing" insight
- Empirical default parameter set with citation data model — foundational; every other feature reads from it
- Advanced configuration panel with inline per-parameter source tooltips — v1.x, after core model is trusted
- Shareable URL state — v1.x, pairs with config panel

**Defer (v2+):**
- Optional sensitivity/uncertainty band — only if users request it and it does not muddy the deterministic thesis
- Alternative regional/country default sets — requires a non-US dataset sourced to the same standard
- Chart image export — shareable URL covers the primary sharing need

### Architecture Approach

The canonical pattern for correctness-first client-side simulation tools is **functional core / imperative shell**: all projection math lives in pure TypeScript functions (`projectionEngine(inputs, params) → ProjectionResult`), isolated in a `core/` directory with a lint-enforced boundary (zero framework imports). Empirical parameters live in a separate `data/` module as frozen, citation-annotated objects and are injected into the engine — the engine never imports them directly. A state layer (Zustand) merges defaults with user overrides, triggers recompute, and owns URL serialization. Memoized selectors transform raw engine output into chart-ready shapes. Viz and UI components are pure consumers of derived state and never call the engine directly.

**Major components:**
1. Model Core (`src/core/`) — pure deterministic projection engine: year-by-year per-tier compounding, drag coupling as a scalar real-return haircut derived from aggregate top-tier growth, relative-position/share derivation. No DOM, no framework, no fetch.
2. Empirical Params Module (`src/data/`) — frozen defaults, each as `{value, unit, basis, definition, source, retrieved_date}`. The build should refuse uncited parameters.
3. Config/State Layer (`src/state/`) — Zustand store for inputs + param overrides; effectiveParams = merge(DEFAULTS, overrides); versioned URL codec for shareability.
4. Selectors (`src/state/selectors.ts`) — memoized transforms of engine output into chart series, rank/share series, summary stats.
5. Visualization (`src/viz/`) — pure chart components driven by derived state. Three chart types: time-series growth, multi-tier divergence overlay, relative-position trajectory.
6. UI Shell (`src/ui/`) — 2-input default entry, advanced panel (progressive disclosure), source citation display.

### Critical Pitfalls

1. **Fagereng "18pp gap" misapplication** — PROJECT.md's current phrasing ("~18pp gap between 10th and 90th percentile returns") is the easy-to-misread shorthand. What Fagereng actually reports: an ~18pp *association* between moving from the 10th to the 90th percentile of the *net-worth* distribution and gross returns before tax (~10pp net of tax). The raw 10th-to-90th spread in *return rates* is ~500bp (~5pp). Using 18pp as the per-tier rate gap inflates top-tier compounding to absurd levels within a decade. Build the tier curve from triangulated, explicitly-defined per-tier targets, citing each anchor separately.

2. **Nominal/real mixing in the engine** — Different cited sources report in different terms (JST uses real; many "7% market returns" are nominal; user savings are nominal currency). Silently mixing them produces 2x+ terminal wealth errors over 40 years. Fix: pick one basis (real) as an explicit engine invariant, tag every parameter object with its basis, and label every displayed figure "real (today's money)."

3. **Drag double-counting or zero-sum implementation** — The McKinsey figure (~80% of 2000–2021 net-worth growth from asset-price inflation) grounds the drag magnitude but is not a formula. The drag must be specified as a single explicit transformation: aggregate top-tier compounding raises an asset-price index; a saver's real return is their gross return minus the price-appreciation portion not backed by their own productive return. A unit test must verify: drag=0 collapses to baseline, total wealth can grow unbounded, no tier is forced to negative real wealth by drag alone. Any "transfer function" between tiers is wrong.

4. **Editorializing in copy and chart palette** — Inequality data is emotionally loaded. Red/green chart colors, value-laden adjectives, and alarm punctuation all violate the hard neutrality requirement. A neutral language and visualization style guide must exist as an explicit artifact before any user-facing copy is written, with a review gate at every release.

5. **Single chart scale for exponential data** — Peer-reviewed research shows linear axes cause users to underestimate growth trajectory while log axes cause them to underestimate magnitude — each produces opposite predictable misperceptions. Both scales with a prominent toggle and a plain-language explanation are a success criterion, not a polish item.

## Implications for Roadmap

Based on combined research, the dependency graph dictates five phases in strict bottom-up order. Nothing user-facing should exist until the engine is proven correct.

### Phase 1: Model Foundation

**Rationale:** The model is the product. Correctness is the top constraint and the top-priority goal. The engine must be provable before anything renders — all downstream layers assume a trustworthy core. Building it first also lets every pitfall check (P1–P5, P10) be verified before UI work begins.
**Delivers:** A fully tested, pure TypeScript projection engine — per-tier heterogeneous compounding, asset-price-inflation drag coupling (with documented identity and conservation unit tests), relative-position/share derivation, floating-point structure minimizing cancellation. No UI dependency.
**Addresses:** Pitfall P1 (nominal/real invariant encoded in schema), P3 (drag identity + conservation tests), P4 (non-conservation invariant), P5 (geometric mean enforcement), P10 (engine vs. closed-form reference within relative-error tolerance).
**Avoids:** Coupling math to any framework; hard-coding magic constants; implementing drag as a transfer function.

### Phase 2: Empirical Data Layer and Parameter Calibration

**Rationale:** The engine is ready to receive real parameters but data sourcing is a distinct, research-intensive deliverable — not a coding task. Every default must trace to a specific paper, definition, percentile type, real/nominal basis, and retrieved date before the engine consumes it. This is where Pitfall P2 (Fagereng misapplication) is resolved.
**Delivers:** A frozen, citation-annotated default parameter set (return-by-tier curve, drag strength, tier boundaries, horizon default), a citation registry, and a build check that fails on incomplete source records. The corrected Fagereng framing (~500bp raw return spread; ~10pp net-of-tax association) is reflected in the tier-curve anchors, not the shorthand "18pp gap." The McKinsey ~80% figure grounds drag magnitude.
**Addresses:** Pitfall P2 (tier curve calibrated from triangulated cited targets), P5 (geometric/arithmetic mean tagged per parameter), P6 (complete source record per default, build fails without it), P7 (survivorship caveat recorded and surfaced neutrally).
**Avoids:** Tuning parameters "until they look right"; mixing US-specific and cross-country figures without documentation.

### Phase 3: Selectors, Visualization, and Chart Infrastructure

**Rationale:** With a correct engine and a valid data layer, visualization can be built as a pure consumer. This is the phase that makes the model legible — achieving Goals 1 and 2. The log/linear toggle and multi-tier overlay are the payload of Goal 1; the relative-position chart is the payload of Goal 2.
**Delivers:** All three chart types (time-series growth with linear/log toggle, multi-tier divergence overlay, relative-position trajectory), memoized selectors transforming engine output to chart series, hover tooltips, the neutral visualization style guide, and the neutrality review gate.
**Uses:** Apache ECharts 6 (log axis, canvas renderer, neutral palette configured explicitly), echarts-for-react.
**Addresses:** Pitfall P8 (neutral palette; style guide as artifact before any copy is written), P9 (both scales + explanatory note; mandatory toggle is a success criterion).
**Implements:** Visualization layer and selectors/derive layer from architecture.

### Phase 4: UI Shell, Minimal Entry, and Source Citations

**Rationale:** The UI is the last layer added because it depends on everything below. The 2-input start with immediate projection, progressive disclosure of advanced overrides, and visible source citations are all UI concerns. Source citations are a launch requirement because empirical grounding is the differentiator.
**Delivers:** Minimal 2-input default entry with immediate projection on first paint, responsive layout, real/nominal toggle, horizon slider, visible per-parameter source citations (footer minimum), advanced configuration panel behind progressive disclosure, reset to defaults, summary readout (ending wealth, multiple, CAGR).
**Addresses:** All table-stakes features; Pitfall P8 (neutral copy checked against style guide before release).
**Implements:** UI Shell and Config/State Layer from architecture.

### Phase 5: Shareability, Configuration Overrides, and Polish

**Rationale:** Shareable URL state and scenario comparison require a stable, fully-parameterized model state to serialize — they cannot be designed before the config panel exists. Designing the URL codec alongside the config panel (not after) avoids a forced refactor.
**Delivers:** Shareable URL state (versioned validated codec with graceful fallback to defaults), inline per-parameter source tooltips, scenario comparison (2–3 side-by-side), reset to defaults.
**Uses:** nuqs 2 or hand-rolled URLSearchParams codec; Zod 4 for URL state validation.
**Implements:** URL serialization in state layer; inline citation UI.

### Phase Ordering Rationale

- Bottom-up is mandatory: the engine has no UI dependency, but the UI has total engine dependency. Inverting this order means building UI against an unproven model — the most expensive rework scenario.
- Data sourcing is a separate phase from engine implementation because it requires primary-source verification, not coding. Coupling it to Phase 1 risks rushing citations to unblock development.
- Visualization comes before UI because charts are the core value delivery; the input shell is the access mechanism. Testing that the model produces legible, correct charts should happen before building the interaction layer around it.
- Shareable state is last because it requires a stable serializable model — adding it before the config panel is finalized forces a codec rewrite.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Empirical Data Layer):** High epistemic risk. Requires reading primary sources (Fagereng, Bach, JST, McKinsey) at the table/definition level, not from abstracts or secondary summaries. The drag-strength parameter has no off-the-shelf formula — it needs a documented derivation anchored to the McKinsey figure. Flag for `/gsd:plan-phase --research-phase 2`.
- **Phase 3 (Visualization):** The relative-position chart design has no direct precedent in mainstream tools. The neutrality style guide requires deliberate design work. Flag for `/gsd:plan-phase --research-phase 3` if the chart design needs a spike.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Model Foundation):** Pure TypeScript functional core is well-documented. Architecture pattern is established. Primary economic-modeling risk is surfaced by research — resolve in Phase 2.
- **Phase 4 (UI Shell):** React + Vite + Zustand + Tailwind are all well-documented with standard patterns. Progressive disclosure UX is conventional.
- **Phase 5 (Shareability):** nuqs/URLSearchParams + Zod are mature, documented libraries. Implementation is mechanical once the state schema is stable.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations verified from official sources (vite.dev, react.dev, ECharts/npmjs releases). Version compatibility confirmed. Conservative choices with deep documentation. |
| Features | MEDIUM-HIGH | Calculator UX conventions are well-established and converge across products. The heterogeneous-return + relative-position niche has few direct comparables, so differentiator design is informed-but-novel. |
| Architecture | HIGH | Functional core / imperative shell is extensively documented for financial calculators across multiple independent engineering sources. URL-as-state is a mature pattern with multiple stable libraries. |
| Pitfalls | HIGH | Core economic-modeling pitfalls verified against primary sources (Fagereng 2020, JST 2019, McKinsey 2021/2023). Visualization pitfalls verified against peer-reviewed cognitive science. Floating-point pitfalls verified against numerical-computing references. |

**Overall confidence:** HIGH

### Gaps to Address

- **Drag formula derivation:** The McKinsey figure (~80% of 2000–2021 wealth growth from asset-price inflation) establishes the mechanism's plausibility and rough magnitude but does not produce a clean model parameter. A defensible formula connecting aggregate top-tier compounding to a real-return haircut on lower tiers must be derived and documented in Phase 2. This is the highest-risk piece of math in the project.
- **Tier curve interpolation:** Research surfaces per-tier anchors (median ~2–3%, top 10% ~4–5%, top 1% ~6–9%, top 0.1% ~10–15%+) but the interpolation function between tiers (linear? power-law? step?) is not specified. Must be decided and documented with a rationale in Phase 2 before the engine uses it.
- **Fagereng definition correction in PROJECT.md:** PROJECT.md contains the shorthand "~18pp gap between 10th and 90th percentile returns" which is imprecise. The corrected framing (raw ~500bp return spread; ~18pp is the gross-return association across the net-worth distribution; ~10pp net of tax is the more defensible cited figure) must be propagated to PROJECT.md, source records, and any copy referencing the figure before Phase 2 closes.
- **Relative-position chart design:** Showing the user's wealth share/rank trajectory requires modeling the full distribution's evolution, not only the user's line. The exact representation (share of total, percentile rank, or both) and how to caption it neutrally without implying zero-sum are design decisions to resolve in Phase 3.

## Sources

### Primary (HIGH confidence)
- Fagereng, Guiso, Malacrino, Pistaferri (2020), *Heterogeneity and Persistence in Returns to Wealth*, Econometrica — NBER w22822: ~18pp gross-return association across net-worth distribution; ~10pp net of tax; ~500bp raw 10th-90th return spread; 60% permanent component
- Jordà, Knoll, Kuvshinov, Schularick, Taylor (2019), *The Rate of Return on Everything, 1870-2015*, QJE — FRBSF WP 2017-25: ~7% real housing/equity; survivorship sensitivity checks
- McKinsey Global Institute, *The rise and rise of the global balance sheet / Out of balance* (2021/2023): ~80% of 2000-2021 net-worth growth from asset-price inflation; ~1/5 from new saving/investment
- vite.dev/releases — Vite 8.0.10 current stable; Vite 7 EOL
- react.dev/versions — React 19.2.x current stable
- apache/echarts releases + npmjs echarts-for-react — ECharts 6.0.0; echarts-for-react 3.0.6

### Secondary (MEDIUM confidence)
- Bach, Calvet, Sodini (2020) — wealthy earn higher returns via systematic risk and leverage; per PROJECT.md context
- Saez & Zucman — top returns driven by unrealized gains in private business; r > g; per PROJECT.md context
- Kitces, *Volatility Drag* — geometric mean for deterministic path; arithmetic+variance for stochastic; volatility drag ~= half variance
- pkgpulse.com / dev.to 2026 state-management surveys — Zustand the pragmatic default, most-downloaded
- querio.ai / embeddable.com / fusioncharts 2026 chart-library comparisons — ECharts strongest for dense multi-series

### Tertiary (informing design; LOW confidence for exact figures)
- *Analyzing the misperception of exponential growth in graphs*, Cognition (ScienceDirect); *Factors modulating exponential growth bias*, Frontiers in Psychology — log misleads description, linear misleads prediction; educational note mitigates both
- NN/g tooltip guidelines — hover tooltip conventions
- ProjectionLab / cFIREsim / NerdWallet / DQYDJ — competitive feature baseline

---
*Research completed: 2026-05-15*
*Ready for roadmap: yes*
