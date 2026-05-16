# Roadmap: Assets Projection

## Overview

This project delivers a browser-only, correctness-first wealth-projection calculator whose differentiator is empirical grounding and heterogeneous returns by wealth tier. The model is the product, so the journey is strictly bottom-up: a pure, unit-tested projection engine is proven correct in isolation first; empirically-sourced parameters are calibrated against primary literature and injected into it second; the engine output is then made legible through neutral, citation-bearing visualizations; a minimal 2-input UI shell wraps everything as the access mechanism; and a final neutrality review gate ensures all shipped copy describes mechanism without editorializing. Nothing user-facing exists until the model beneath it is trustworthy.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Model Foundation** - Pure, deterministic, unit-tested projection engine with the nominal/real basis and non-conservation invariants baked in
- [ ] **Phase 2: Empirical Data & Parameter Calibration** - Frozen, citation-annotated default parameter set with build-enforced sourcing, calibrated from corrected primary literature
- [ ] **Phase 3: Selectors, Visualization & Neutrality Style Guide** - Three neutral chart types with linear/log toggle, tooltips, visible citations, and the neutrality style guide artifact
- [ ] **Phase 4: UI Shell & Minimal Entry** - Responsive 2-input instant-projection shell with real/nominal toggle, horizon control, and summary readout
- [ ] **Phase 5: Neutrality Review & Release Readiness** - All shipped copy and chart semantics reviewed and signed off against the style guide

## Phase Details

### Phase 1: Model Foundation
**Goal**: A pure, framework-free, deterministic projection engine that computes year-by-year per-tier wealth — including heterogeneous returns, asset-price-inflation drag, and relative-position derivation — proven correct by numerical unit tests against synthetic citeable fixtures, with no UI or I/O dependency.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: MODEL-01, MODEL-02, MODEL-03, MODEL-04, MODEL-05, MODEL-06
**Success Criteria** (what must be TRUE):
  1. Running the engine test suite produces a verified year-by-year projection from `(inputs, params)` with zero framework/DOM/fetch imports in `core/`
  2. The engine projects every wealth tier (not just the user's line), and a test confirms the user's trajectory uses the return rate for their moving tier
  3. A unit test confirms drag=0 collapses to independent per-tier baseline, aggregate real wealth can grow unbounded, and no tier is forced to negative real wealth by drag alone (non-conservation, no transfer function)
  4. Every parameter object carries an explicit nominal/real basis field; a test fails if a value of one basis is consumed where the other is expected
  5. Engine output matches a closed-form compounding reference within a documented relative-error tolerance over the maximum horizon
**Plans**: 4 plans
Plans:
- [x] 01-01-PLAN.md — Scaffold + branded basis invariant + Wave-0 test skeleton
- [x] 01-02-PLAN.md — Lognormal+Pareto distribution curve with closed-form top-share (spike)
- [x] 01-03-PLAN.md — Engine vertical slice: tiers + scalar drag + loop + golden master
- [ ] 01-04-PLAN.md — D-12 invariant battery + hand-derived multi-tier fixture

### Phase 2: Empirical Data & Parameter Calibration
**Goal**: A frozen, citation-annotated default parameter set (return-by-tier curve, drag strength, tier boundaries, horizon default) traced to corrected primary literature, with a build check that refuses any parameter lacking a complete source record.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. Every default model parameter carries a complete source record (source name, specific figure used, basis, definition, year/vintage, retrieved date) in a single sourced-parameter data model
  2. The build/test pipeline fails when any model parameter lacks a complete source record (sourcing is an enforced invariant, not a convention)
  3. The return-by-tier anchors reflect the corrected Fagereng framing (raw ~500bp / ~10pp net-of-tax association — NOT a flat 18pp per-tier gap), triangulated across cited anchors, with no single hardcoded "18" in the engine
  4. The drag-strength parameter has a documented derivation anchored to the McKinsey ~80% figure without implying a finite-pie transfer
  5. The engine, running on these real defaults, produces a divergence sanity-check that no tier exceeds plausible bounds within the default horizon
**Plans**: TBD

### Phase 3: Selectors, Visualization & Neutrality Style Guide
**Goal**: The engine's output is made legible through three neutral chart types (time-series growth, multi-tier divergence overlay, relative-position trajectory) driven by memoized selectors, with a linear/log toggle, hover/tap tooltips, visible source citations, and an explicit neutrality style guide artifact governing copy and palette.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: VIZ-01, VIZ-02, VIZ-03, VIZ-04, VIZ-05, VIZ-06, NEUT-01
**Success Criteria** (what must be TRUE):
  1. A time-series wealth chart renders the user's trajectory over the horizon, fed by memoized selectors (charts never transform raw engine output inline)
  2. A linear/log scale toggle is present with neutral plain-language copy explaining what each scale reveals
  3. Hover/tap tooltips show year, wealth, percentile/rank, and tier at the inspected point
  4. A multi-tier comparison overlay plots the user vs. median/top 1%/top 0.1% in one frame, and a separate relative-position trajectory shows the user's wealth share/rank changing over the horizon
  5. Visible source citations (footer minimum) trace displayed defaults to named research, and a neutrality style guide artifact (copy + palette rules, no value-laden red/green) exists before any user-facing copy is finalized
**Plans**: TBD
**UI hint**: yes

### Phase 4: UI Shell & Minimal Entry
**Goal**: A responsive UI shell where the user enters current wealth + annual savings and immediately sees a projection (no Calculate gate), with live debounced recompute, an adjustable horizon, a real/nominal toggle, and a summary readout — the access mechanism around the proven model.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: ENTRY-01, ENTRY-02, ENTRY-03, ENTRY-04, ENTRY-05, ENTRY-06
**Success Criteria** (what must be TRUE):
  1. On first paint, entering current wealth + annual savings renders a projection with no Calculate button, all other parameters defaulted from the empirical data layer
  2. Changing an input recomputes the projection live, debounced for slider drags, with no UI jank
  3. The user can adjust the projection horizon (default ~30–40y, up to ~50–60y) and toggle real vs. nominal view (real is the default)
  4. A summary readout shows ending wealth, growth multiple, and CAGR
  5. The layout is usable across mobile and desktop, with chart interactions degrading gracefully to touch
**Plans**: TBD
**UI hint**: yes

### Phase 5: Neutrality Review & Release Readiness
**Goal**: Every on-screen narrative annotation, label, microcopy string, and chart palette decision shipped in Phases 3 and 4 is reviewed against the neutrality style guide and corrected, so the released tool describes mechanism as fact without assigning blame or virtue.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: NEUT-02
**Success Criteria** (what must be TRUE):
  1. Every user-facing string and chart palette choice has been checked against the NEUT-01 style guide with a recorded pass/fail per item
  2. No value-laden adjectives/verbs, alarm punctuation, or semantic red/green remain in any shipped surface
  3. The relative-position chart carries a neutral caption clarifying shares can diverge while all wealth still grows (no zero-sum implication)
  4. Long-run-historical defaults surface their survivorship caveat neutrally in the sourcing affordance
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Model Foundation | 3/4 | In Progress|  |
| 2. Empirical Data & Parameter Calibration | 0/TBD | Not started | - |
| 3. Selectors, Visualization & Neutrality Style Guide | 0/TBD | Not started | - |
| 4. UI Shell & Minimal Entry | 0/TBD | Not started | - |
| 5. Neutrality Review & Release Readiness | 0/TBD | Not started | - |
