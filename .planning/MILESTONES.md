# Milestones

## v1.0 MVP (Shipped: 2026-05-17)

**Phases completed:** 6 phases, 20 plans, 28 tasks
**Scope:** Phases 1 → 5 (incl. inserted 4.1) · ~7,965 LOC TS/TSX · 176 commits · 3 days (2026-05-15 → 2026-05-17)

**Delivered:** A browser-only, correctness-first wealth-projection calculator that models capital growth with empirically-grounded heterogeneous returns by wealth tier, presented neutrally with visible citations.

**Key accomplishments:**

- **Pure, deterministic projection engine** (Phase 1) — lognormal-body + Pareto-tail wealth distribution with closed-form top-share, bisection inversion, strictly-monotone heterogeneous return curve, asset-price-inflation drag, and schema-level nominal/real basis invariant. Framework-free `src/core/*`, proven by numerical unit tests.
- **Citation-enforced empirical defaults** (Phase 2) — frozen, fully-sourced `DEFAULTS`/`SOURCES` calibrated from corrected primary literature (Fagereng, Bach, JST, McKinsey), with a build-enforced sourcing-completeness gate that refuses any unsourced parameter.
- **Five neutral visualizations + style guide** (Phases 3, 4.1) — time-series growth, multi-tier divergence, relative-position trajectory, 100%-stacked tier-share, and end-of-horizon donut; all driven by memoized selectors with a log/linear toggle, tooltips, and the NEUTRALITY-STYLE-GUIDE.md governing copy & palette.
- **Responsive instant-projection UI shell** (Phase 4) — `AppShell` + `ControlPanel` rendering on first paint with `useDeferredValue` live recompute, log-scale wealth/savings sliders, horizon control, real/nominal toggle, summary readout, and neutral engine-error containment.
- **Neutrality release gate** (Phase 5) — CR-01 D-14 mislabel fixed (basis-invariant real growth multiple), JST survivorship caveat surfaced, and an exhaustive 77-row NEUT-02 review closing with zero open FAIL rows. A subsequent code-review fix also corrected a top-1%/top-10% donut-label data-integrity bug.

**Verification:** 25/25 requirements SATISFIED · cross-phase integration clean (0 orphaned/missing/broken) · E2E flow verified · 170/170 tests green · tsc strict · build clean.

**Known deferred items at close: 12** (see STATE.md → Deferred Items) — 15 browser-only HUMAN-UAT scenarios across Phases 02–05, Nyquist partial in 4 phases, 1 false-positive stale quick task, and a non-blocking ECharts bundle-size advisory. All are deferred validation/polish, not correctness gaps (audit status: `tech_debt`).

---
