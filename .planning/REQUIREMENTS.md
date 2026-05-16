# Requirements: Assets Projection

**Defined:** 2026-05-15
**Core Value:** Make the exponential, distribution-dependent nature of capital returns viscerally clear — using real historical data, presented neutrally — so a person can see both their own trajectory and how their relative position shifts over time.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Empirical Data (DATA)

- [ ] **DATA-01**: Every default model parameter is stored with an attached citation (source name, the specific figure used, year/vintage) in a single sourced-parameter data model
- [ ] **DATA-02**: Return-by-tier anchors are calibrated from primary literature with corrected interpretations (Fagereng 2020 raw 10th–90th real-return spread ≈ 500bp / ~10pp net-of-tax — NOT a flat 18pp per-tier gap; Bach 2020; Saez & Zucman; Jordà-Schularick-Taylor)
- [ ] **DATA-03**: Asset-price-inflation drag magnitude is grounded in a defensible cited figure (McKinsey 2023: ~80% of 2000–2021 net-worth growth from asset-price inflation; Piketty r>g) without implying a finite-pie transfer
- [ ] **DATA-04**: The engine rejects/refuses any model parameter that lacks a source record (sourcing is an enforced invariant, not a convention)

### Model Engine (MODEL)

- [ ] **MODEL-01**: A pure, framework-free, deterministic projection engine computes year-by-year wealth from `(inputs, params)` with no UI or I/O dependencies
- [ ] **MODEL-02**: Return rate is a function of wealth percentile/tier (heterogeneous return curve) with a defensible, sourced interpolation across anchors; the user's own trajectory uses the rate for their moving tier
- [ ] **MODEL-03**: The engine projects the full wealth distribution across all tiers (not just the user's line), enabling relative-position derivation
- [ ] **MODEL-04**: Asset-price-inflation drag is computed from aggregate top-tier growth and applied as a real-return haircut across tiers, preserving infinite-growth possibility (drag=0 → baseline; non-conservation; no zero-sum transfer)
- [ ] **MODEL-05**: Nominal vs. real basis is an explicit schema-level invariant carried through every computation
- [ ] **MODEL-06**: The engine is covered by numerical unit tests using citeable synthetic fixtures (drag-zero baseline, non-conservation, infinite-growth-preserved, long-horizon floating-point stability)

### Entry & UX (ENTRY)

- [ ] **ENTRY-01**: User inputs current wealth + annual savings and immediately sees a projection (no "Calculate" button gate; all other parameters defaulted from empirical data)
- [ ] **ENTRY-02**: Projection recomputes live on input change (debounced for slider drags)
- [ ] **ENTRY-03**: User can adjust the projection horizon (default ~30–40y, up to ~50–60y)
- [ ] **ENTRY-04**: User can toggle real vs. nominal view (real is the honest default)
- [ ] **ENTRY-05**: A summary readout shows ending wealth, growth multiple, and CAGR
- [ ] **ENTRY-06**: Layout is responsive across mobile and desktop, with chart interactions degrading gracefully to touch

### Visualization (VIZ)

- [ ] **VIZ-01**: A time-series wealth chart renders the user's trajectory over the horizon
- [ ] **VIZ-02**: A linear/log scale toggle is available, with neutral explanatory copy of what each scale reveals
- [ ] **VIZ-03**: Hover/tap tooltips show year, wealth, percentile/rank, and tier at the inspected point
- [ ] **VIZ-04**: A multi-tier comparison overlay plots the user vs. representative tiers (median, top 1%, top 0.1%) in one frame
- [ ] **VIZ-05**: A relative-position trajectory shows the user's wealth share/rank changing over the horizon
- [ ] **VIZ-06**: Visible source citations are present (footer line minimum) tracing displayed defaults to named research
- [ ] **VIZ-07**: A tier share-of-economy view shows each wealth-percentile tier (median, top10, top1, top01) and the user as a fraction of total distribution wealth — as a 100%-stacked-area trajectory across the horizon plus an end-of-horizon donut — using the existing categorical palette (no semantic red/green) and a mandatory neutral caption clarifying shares can shift while every tier's real wealth still grows (no zero-sum implication)

### Neutrality (NEUT)

- [ ] **NEUT-01**: A neutrality style guide artifact exists (copy + chart palette rules) describing mechanisms as fact, never assigning blame or virtue
- [ ] **NEUT-02**: All on-screen narrative annotations and copy pass a neutrality review against the style guide (no critique/endorsement framing; no editorializing)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Configuration (CONFIG)

- **CONFIG-01**: Advanced configuration panel to override return curve, drag strength, horizon, and other parameters (progressive disclosure — opt-in, behind a collapsed panel; goal #5 outranks #6)
- **CONFIG-02**: Inline per-parameter source tooltips (hover/tap a parameter → citation + figure + link)
- **CONFIG-03**: Reset to defaults

### Sharing (SHARE)

- **SHARE-01**: Full model state (inputs + overrides) serialized to a shareable URL and restored on load (replaces accounts)
- **SHARE-02**: Scenario comparison — save/compare 2–3 parameter sets side by side (client-side, pairs with URL state)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User accounts / saved profiles | Personal tool; no server-side persistence — shareable URL is the saved state |
| Tax / jurisdiction modeling | Enormous jurisdiction-specific complexity; undermines neutral generalized framing; defaults are pre-tax |
| Personalized financial advice / recommendations | Converts a neutral math model into advice; violates neutrality (goal #3) |
| Finite-pie / zero-sum inequality framing | Analytically wrong for this model; drag is asset-price inflation, growth stays possible |
| Political commentary / "is this fair?" framing | Hard neutrality requirement (goal #3) |
| Monte Carlo / stochastic return simulation | Orthogonal to the deterministic structural-divergence thesis; would muddy the core message |
| Detailed budgeting / cashflow / expense modeling | Massive scope; contradicts the minimal 2-input start |
| Real-time market data feeds / live API | Fragility + maintenance burden; thesis is long-run historical returns |
| Every parameter exposed on first screen | Violates goal #5 (don't overwhelm); progressive disclosure instead |
| Sensitivity/confidence band, regional default sets, chart image export | v2+ — only if validated and sourced to the same standard |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MODEL-01 | Phase 1 | Pending |
| MODEL-02 | Phase 1 | Pending |
| MODEL-03 | Phase 1 | Pending |
| MODEL-04 | Phase 1 | Pending |
| MODEL-05 | Phase 1 | Pending |
| MODEL-06 | Phase 1 | Pending |
| DATA-01 | Phase 2 | Pending |
| DATA-02 | Phase 2 | Pending |
| DATA-03 | Phase 2 | Pending |
| DATA-04 | Phase 2 | Pending |
| VIZ-01 | Phase 3 | Pending |
| VIZ-02 | Phase 3 | Pending |
| VIZ-03 | Phase 3 | Pending |
| VIZ-04 | Phase 3 | Pending |
| VIZ-05 | Phase 3 | Pending |
| VIZ-06 | Phase 3 | Pending |
| VIZ-07 | Phase 4.1 | Pending |
| NEUT-01 | Phase 3 | Pending |
| ENTRY-01 | Phase 4 | Pending |
| ENTRY-02 | Phase 4 | Pending |
| ENTRY-03 | Phase 4 | Pending |
| ENTRY-04 | Phase 4 | Pending |
| ENTRY-05 | Phase 4 | Pending |
| ENTRY-06 | Phase 4 | Pending |
| NEUT-02 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26 ✓
- Unmapped: 0

---
*Requirements defined: 2026-05-15*
*Last updated: 2026-05-15 after roadmap creation (traceability populated)*
