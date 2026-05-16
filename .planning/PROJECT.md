# Assets Projection

## What This Is

A web-based wealth projection calculator that models capital growth using empirically-grounded *heterogeneous* returns — not the naive flat "7%" assumption. It shows how return rates differ by where you sit in the wealth distribution, and how concentrated capital at the top drags on real returns for everyone below via asset-price inflation. It is primarily a personal exploration tool, deployed publicly so anyone can open it and play.

## Core Value

Make the exponential, distribution-dependent nature of capital returns viscerally clear — using real historical data, presented neutrally — so a person can see both their own trajectory and how their relative position shifts over time.

## Goals (priority order)

These are the user's stated goals, in strict priority order. When tradeoffs arise, earlier goals win over later ones.

1. **Make it easy to visualize and understand the exponential nature of capital returns.**
2. **Include wealth inequality** — you are not in a vacuum; people with larger wealth will likely impact you.
3. **Be neutral and unbiased** — this is neither a critique nor an endorsement of capitalism; we are only trying to understand the mathematics behind it.
4. **Use historical data to derive default values** — don't assume; ground defaults in real research.
5. **Keep it simple and clear to use** — don't overwhelm the user with options; let them start playing with it immediately.
6. **Allow configuration of different values and settings** — advanced users can override defaults.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Minimal entry: user inputs current wealth + annual savings and immediately sees a projection
- [ ] Heterogeneous return model: return rate is a function of the user's wealth percentile/tier, grounded in empirical research (Fagereng et al. 2020, Bach et al. 2020, Saez & Zucman, Jordà-Schularick-Taylor)
- [ ] Asset-price-inflation drag: aggregate top-tier compounding bids up asset prices and erodes the real return available to smaller savers (no finite-pie assumption — infinite growth still possible)
- [ ] Relative-position tracking: show the user's wealth share / rank over time as higher tiers compound faster
- [ ] Clear visualization of exponential growth (charts that make compounding and divergence legible)
- [ ] Historical-data-derived default values for all model parameters (with visible sourcing)
- [ ] Configurable settings: user can override defaults (return curve, drag strength, horizon, etc.) and experiment
- [ ] Neutral, unbiased framing — neither a critique nor an endorsement of capitalism; just the mathematics
- [ ] Responsive web app built on a modern, maintainable frontend framework

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- User accounts / login — personal tool; no need to persist per-user state server-side
- Personalized financial advice — this is an educational/exploratory model, not advice
- Tax/jurisdiction-specific modeling — adds large complexity; defaults are pre-tax, generalized
- Finite-world / zero-sum economics — explicitly assume infinite growth is possible; drag comes from asset-price inflation, not a fixed pie
- Political commentary or editorializing — neutrality is a hard requirement

## Current State

- **Phase 1 (Model Foundation) complete (2026-05-16):** pure, framework-free, deterministic projection engine — heterogeneous returns by percentile, asset-price-inflation drag, relative-position derivation, nominal/real basis invariant — proven by 44 numerical unit tests (tsc strict, 0 todo). Library only; no UI/IO. Requirements stay in Active (ship-to-validate semantics; engine not yet user-facing).
- **Carried into Phase 2:** documented preconditions from review CR-01/CR-02 — calibration must keep Pareto alpha > 1 (top01/top1 < 10) and validate bisect bracket coverage before loading real empirical anchors (see `.planning/phases/01-model-foundation/01-HUMAN-UAT.md`).

## Context

- Primary user is the project owner; public access is a convenience, not a product mandate. Polish matters less than correctness and clarity of the model.
- The differentiator is empirical grounding. Defaults must trace to real research, not assumptions. Key sources identified during initialization:
  - **Fagereng, Guiso, Malacrino, Pistaferri (2020)** — heterogeneity & persistence in returns to wealth; raw cross-sectional 10th–90th return spread ~500bp (~5pp); moving from the 10th to 90th net-worth percentile is *associated* with a ~10pp higher return net of tax — used only as qualitative gradient justification, not a per-tier rate gap; per-tier levels triangulated from Bach/Saez-Zucman/JST (D-06).
  - **Bach, Calvet, Sodini (2020)** — the wealthy earn higher returns via more systematic risk and leverage.
  - **Saez & Zucman** — top returns driven by unrealized gains in private business; r > g.
  - **Jordà, Schularick, Taylor — "The Rate of Return on Everything" (1870–2015)** — long-run real returns: housing ~7%, equities ~7%, bonds ~2.5%, cash ~1%.
  - **Piketty (r > g)**, **McKinsey Global Institute (2023)** — asset-price inflation outpaced GDP ~1.3× (2000–2021), grounding the drag mechanism.
- Indicative real-return-by-tier defaults to validate during research: median ~2–3%, top 10% ~4–5%, top 1% ~6–9%, top 0.1% ~10–15%+.

## Constraints

- **Tech stack**: Modern, responsive, maintainable frontend framework — exact choice deferred to domain research.
- **Data integrity**: All default parameters must cite a real source; "don't assume stuff."
- **Neutrality**: Presentation and copy must remain analytically neutral.
- **Simplicity**: Default experience must not overwhelm — start playable with two inputs; advanced configuration is opt-in.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Heterogeneous returns by wealth percentile (not flat rate) | Core differentiator; reflects empirical reality | — Pending |
| Drag mechanism = asset-price inflation (not finite pie) | Allows infinite growth while still modeling top-tier impact on others | — Pending |
| Minimal input = wealth + annual savings | Lowers friction; "let them start playing with it" | — Pending |
| Public web app, no accounts | Personal tool shared publicly; no per-user persistence needed | — Pending |
| Empirically-sourced defaults, configurable overrides | Neutral + grounded, but user can explore | — Pending |
| Default tier anchors = median / top 10% / top 1% / top 0.1% (continuous interpolated curve, not buckets) | Literature reliably cites returns down to ~top 0.1%; deeper tiers aren't cleanly citeable (goal #4) | — Pending |

## Follow-ups / Later Analysis

<!-- Deferred questions to revisit; not blocking current roadmap. -->

- **Dynamic tail resolution.** Concern: as wealth concentrates over the horizon, mass may push further into the extreme tail (top 0.01%, 0.001%, …) and the fixed 4-anchor curve could under-resolve where the action moves. Revisit during/after Phase 2 calibration: consider whether a top 0.01%+ anchor (citeable source required — Saez-Zucman ultra-wealth or caveated estimate) or an adaptive tail is warranted for the relative-position model (VIZ-05 / MODEL-03). Not blocking; keep 4 anchors for now.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-16 after Phase 1 (Model Foundation) completion*
