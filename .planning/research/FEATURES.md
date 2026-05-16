# Feature Research

**Domain:** Empirically-grounded wealth-projection + inequality-visualization web calculator
**Researched:** 2026-05-15
**Confidence:** MEDIUM-HIGH (calculator UX conventions are well-established and converge across products; the heterogeneous-return + relative-position niche has few direct comparables, so differentiator design is informed-but-novel)

## Feature Landscape

The domain is a fusion of two established product categories:

1. **Compound-growth / FIRE / retirement projection calculators** (ProjectionLab, cFIREsim, NerdWallet, Investor.gov, Vanguard, Boldin) — mature, converged UX conventions.
2. **Income/wealth percentile "where do you rank" tools** (DQYDJ, Abels Calculators, Financial Aha, Engaging Data) — simple single-shot ranking against distribution data.

This tool's novelty is making category 2 *dynamic over time* and feeding it back into category 1's projection (heterogeneous returns by tier + asset-price-inflation drag). No mainstream product combines all three. The competitive bar for table-stakes UX is set by ProjectionLab-class tools; the differentiator space is largely unoccupied.

### Table Stakes (Users Expect These)

Missing any of these makes the tool feel broken or untrustworthy for its stated purpose.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Minimal 2-input start (current wealth + annual savings) → immediate projection | PROJECT goal #5; every modern calculator renders a result before asking for everything | LOW | Inputs must produce a chart on first paint with empirically-derived defaults for everything else. No "Calculate" button gate — recompute live. |
| Time-series growth chart (wealth vs. years) | Universal in every projection calculator; the core artifact | MEDIUM | Line/area chart, log-scale toggle (critical — see Differentiators; exponential growth is illegible on linear axis over long horizons). |
| Adjustable projection horizon (years) | Standard slider in all retirement tools; meaningless without it | LOW | Default ~30–40y; allow up to ~50–60y for divergence to become visible. |
| Real vs. nominal toggle (inflation-adjusted) | Sophisticated users distrust nominal-only; PROJECT centers on *real* returns | MEDIUM | Real is the honest default given the drag mechanism operates on real returns. Nominal as opt-in. |
| Live recompute on input change | ProjectionLab/NerdWallet baseline; "playing with it" requires instant feedback | LOW | Pure client-side computation; debounce slider drags. |
| Hover tooltips on chart (year, value, tier) | NN/g + every charting product; data viz is unreadable without point inspection | LOW | Show wealth, percentile/rank, and tier at hovered year. |
| Final/summary readout (ending wealth, multiple, CAGR) | Every calculator shows the headline number, not just a curve | LOW | "In N years: $X (Yx your starting wealth)." |
| Responsive layout (mobile + desktop) | PROJECT requirement; percentile tools are heavily mobile-accessed | MEDIUM | Chart interactions must degrade gracefully to touch. |
| Visible source citations / "where this number comes from" | PROJECT differentiator is empirical grounding; data tool without sourcing is not credible | LOW-MEDIUM | Short readable source line per parameter ("Source: Fagereng et al. 2020"), expandable detail. Not full URLs in tiny text. |
| Sensible empirical defaults for all hidden parameters | "Don't assume stuff"; user supplies 2 inputs, model supplies the rest from research | MEDIUM | The return-by-tier curve, drag strength, horizon all need researched defaults (PROJECT lists indicative values). |
| Reset to defaults | Standard once overrides exist; users experiment then want baseline back | LOW | Depends on the configuration panel existing. |

### Differentiators (Competitive Advantage)

These are where the tool earns its existence. They map directly to PROJECT goals #1, #2, #4.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Heterogeneous return curve by wealth percentile/tier | THE core differentiator (Key Decision in PROJECT). No mainstream calculator does this — all assume one flat rate | HIGH | Return = f(percentile). Grounded in Fagereng 2020 (~18pp 10th–90th gap), Bach 2020, Saez & Zucman. User's own trajectory uses the rate for *their* moving tier; tiers above use theirs. Needs a defensible interpolation across the indicative anchors (median ~2–3%, top 10% ~4–5%, top 1% ~6–9%, top 0.1% ~10–15%+). |
| Asset-price-inflation drag mechanism | PROJECT's distinctive non-zero-sum modeling: top-tier compounding bids up asset prices, eroding real returns for smaller savers — *without* a finite-pie assumption | HIGH | Drag is a function of aggregate top-tier growth, subtracted from lower tiers' *real* return. Must preserve "infinite growth still possible" (Out of Scope: zero-sum). Grounded in McKinsey 2023 (~1.3× asset-price vs GDP), Piketty r>g. Most modeling-sensitive component — flag for deep validation. |
| Relative-position tracking over time (wealth share / rank trajectory) | Turns the static "where do you rank" tool into a *dynamic* one — the visceral "you fall behind even while growing" insight (PROJECT goal #2) | HIGH | Second chart or overlay: user's percentile/share over the horizon. Requires modeling the full distribution's evolution, not just the user's line. Depends on heterogeneous return curve. |
| Log-scale / "true exponential" visualization mode | PROJECT goal #1 is making exponentiality *viscerally clear*; linear axes hide it, log axes reveal constant-rate lines and divergence as fans | MEDIUM | Toggle between linear (intuitive magnitude) and log (reveals growth-rate differences as slope). Annotate what the user is seeing neutrally. |
| Multi-tier comparison overlay (you vs. median vs. top 1% vs. top 0.1%) | Makes divergence legible in one frame — the "fan opening up" that flat-rate tools cannot show | MEDIUM | Plot several representative tier trajectories alongside the user's. Directly serves goals #1 and #2. |
| Scenario comparison (save/compare 2–3 parameter sets side by side) | ProjectionLab-class expectation for "what-if"; here it lets users test drag strength / savings rate against each other | MEDIUM | Client-side only (no accounts). Pairs naturally with shareable URL state. |
| Shareable URL state (full config encoded in link) | Replaces accounts entirely (Out of Scope: no login); enables sharing a specific scenario — the public-tool sharing path | MEDIUM | Serialize all inputs/overrides to query/hash params; restore on load. Critical because there is no server persistence. |
| Inline source tooltips on every default value | Elevates "cite sources" from a footer to a trust-building interaction at the point of doubt | MEDIUM | Hover/tap a parameter → citation + the specific figure used + link. This is the empirical-grounding differentiator made tangible. |
| Neutral narrative annotations on the chart | Goal #3: explain *what* the math shows without editorializing — "your tier compounds at r₁; the tier above at r₂" stated as fact | MEDIUM | Copy discipline is a feature here. Describe mechanism, never assign blame or virtue. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| User accounts / saved profiles | Every commercial calculator has them; "let me save my plan" | Explicitly Out of Scope; adds backend, auth, privacy/data-retention burden for a personal exploratory tool | Shareable URL state — the link *is* the saved state, zero backend |
| Tax / jurisdiction modeling (Roth, brackets, state) | ProjectionLab-class tools make this a headline feature; users will ask | Out of Scope; enormous complexity, jurisdiction-specific, undermines neutral generalized framing; defaults are pre-tax | State clearly "pre-tax, generalized" in copy; one global optional flat-tax override at most, deferred |
| Personalized financial advice / recommendations ("you should save more") | Calculators often nudge; users expect a verdict | Out of Scope; converts a neutral math model into advice, violates goals #3; liability/credibility risk | Show trajectories and let the user draw conclusions; descriptive not prescriptive copy |
| Finite-pie / zero-sum inequality framing | Intuitive way to "explain" inequality; emotionally resonant | Out of Scope and analytically wrong for this model; drag is asset-price inflation, growth stays possible | Asset-price-inflation drag mechanism (the differentiator) — models impact without a fixed pie |
| Political commentary / "is this fair?" framing | Inequality tools often editorialize; engagement bait | Hard neutrality requirement (goal #3); destroys the "just the mathematics" positioning | Neutral narrative annotations stating mechanisms as fact only |
| Monte Carlo / stochastic return simulation | FIRE-tool table stakes (cFIREsim, ProjectionLab); users may expect ranges | High complexity; orthogonal to the thesis. The point is *deterministic structural divergence by tier*, not return volatility. Variance bands would muddy the core message | Deterministic tiered projection first; optional simple ±band sensitivity slider far later if validated |
| Detailed budgeting / cashflow / expense modeling | Boldin/ProjectionLab model expenses, pensions, one-offs | Massive scope; contradicts "minimal 2-input start"; not the thesis | Single annual-savings input; keep the model about returns and position, not cashflow |
| Every-parameter exposed on the first screen | "Power users want control" → goal #6 | Violates goal #5 (don't overwhelm); goal #5 outranks #6 in PROJECT priority order | Progressive disclosure: 2 inputs visible, advanced config behind a collapsed panel |
| Real-time market data feeds / live API integration | "Make it current" | Adds fragility, cost, and an empirical-claims maintenance burden; thesis is long-run historical returns, not today's prices | Static researched constants from named papers (Jordà-Schularick-Taylor etc.), with the data vintage cited |

## Feature Dependencies

```
Minimal 2-input start
    └──requires──> Empirical default parameter set (return curve, drag, horizon)
                       └──requires──> Source citation data model (each param ↔ source)

Heterogeneous return curve by percentile
    └──requires──> Empirical default parameter set
    └──enables──> Relative-position tracking
                       └──requires──> Distribution-evolution model (all tiers, not just user)
    └──enables──> Multi-tier comparison overlay

Asset-price-inflation drag
    └──requires──> Heterogeneous return curve (aggregate top-tier growth is its input)
    └──affects───> Real vs. nominal toggle (drag is defined on real returns)

Time-series growth chart
    └──requires──> Live recompute engine
    └──enhanced-by──> Log-scale mode
    └──enhanced-by──> Hover tooltips
    └──enhanced-by──> Multi-tier comparison overlay

Configuration panel (overrides)
    └──requires──> Empirical default parameter set (overrides need a baseline)
    └──enables──> Reset to defaults
    └──enables──> Scenario comparison
                       └──pairs-with──> Shareable URL state

Shareable URL state
    └──requires──> Serializable full model state
    └──replaces──> User accounts (anti-feature)

Inline source tooltips ──enhances──> Source citation data model
Neutral narrative annotations ──conflicts──> Political commentary (anti-feature)
```

### Dependency Notes

- **Relative-position tracking requires a distribution-evolution model:** to show the user's *share/rank* changing, the engine must project every tier's wealth, not only the user's line. This is the heaviest hidden dependency and the main reason relative-position is HIGH complexity. It must come after the heterogeneous return curve is stable.
- **Drag requires the return curve:** the drag magnitude is derived from aggregate top-tier compounding, so the curve must exist and be parameterized before drag can be computed.
- **Everything user-facing requires the empirical default set + citation data model:** these are foundational — the 2-input start, the curve, and the tooltips all read from the same sourced-parameter store. Build this data layer first.
- **Shareable URL state must encode the full model, including overrides:** if added after the config panel without planning the serialization format, it forces a refactor. Design state serialization alongside the config panel, not after.
- **Log-scale + multi-tier overlay are the payload of goal #1:** individually MEDIUM, together they are what actually makes exponentiality and divergence "viscerally clear." Treat as a pair.

## MVP Definition

### Launch With (v1)

The model is the product (PROJECT: "polish matters less than correctness and clarity of the model").

- [ ] Empirical default parameter set + source citation data model — foundational; everything reads from it
- [ ] Client-side projection engine: heterogeneous return curve by tier — the core differentiator; without it this is just another flat calculator
- [ ] Asset-price-inflation drag mechanism — the second core differentiator; the non-zero-sum thesis
- [ ] Minimal 2-input start with immediate projection — goal #5; the on-ramp
- [ ] Time-series growth chart with linear/log toggle + hover tooltips — goal #1 made legible
- [ ] Multi-tier comparison overlay (you vs. median vs. top 1% / 0.1%) — makes divergence visible in one frame
- [ ] Relative-position trajectory (share/rank over time) — goal #2; the distinctive insight
- [ ] Visible source citations (footer line minimum) — empirical-grounding credibility, goal #4
- [ ] Real vs. nominal toggle, adjustable horizon — table-stakes correctness for a real-returns model
- [ ] Responsive layout — PROJECT requirement

### Add After Validation (v1.x)

- [ ] Advanced configuration panel (override return curve, drag strength, etc.) — trigger: core model trusted and stable; goal #6 (lower priority than #5)
- [ ] Inline per-parameter source tooltips — trigger: config panel exists (tooltips attach to parameters)
- [ ] Shareable URL state — trigger: config panel exists so there is non-trivial state worth sharing
- [ ] Reset to defaults — trigger: overrides exist
- [ ] Scenario comparison (2–3 side by side) — trigger: shareable state + config panel proven

### Future Consideration (v2+)

- [ ] Optional simple ±sensitivity band — only if users repeatedly request uncertainty representation and it does not muddy the deterministic thesis
- [ ] Alternative regional/country default sets — only if a non-US empirical dataset is sourced to the same standard
- [ ] Export chart/image for sharing — defer; shareable URL covers the primary sharing need

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Empirical default + citation data model | HIGH | MEDIUM | P1 |
| Heterogeneous return curve by tier | HIGH | HIGH | P1 |
| Asset-price-inflation drag | HIGH | HIGH | P1 |
| Minimal 2-input start | HIGH | LOW | P1 |
| Growth chart + linear/log toggle + tooltips | HIGH | MEDIUM | P1 |
| Multi-tier comparison overlay | HIGH | MEDIUM | P1 |
| Relative-position trajectory | HIGH | HIGH | P1 |
| Real vs. nominal toggle + horizon | MEDIUM | LOW | P1 |
| Visible source citations (footer) | HIGH | LOW | P1 |
| Responsive layout | MEDIUM | MEDIUM | P1 |
| Advanced configuration panel | MEDIUM | MEDIUM | P2 |
| Inline source tooltips | MEDIUM | MEDIUM | P2 |
| Shareable URL state | MEDIUM | MEDIUM | P2 |
| Scenario comparison | MEDIUM | MEDIUM | P2 |
| Reset to defaults | LOW | LOW | P2 |
| Sensitivity band | LOW | MEDIUM | P3 |
| Regional default sets | MEDIUM | HIGH | P3 |
| Chart image export | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | FIRE/projection tools (ProjectionLab, cFIREsim, NerdWallet) | Percentile tools (DQYDJ, Abels, Financial Aha) | Our Approach |
|---------|---|---|---|
| Return assumption | Single flat rate (sometimes pre/post-retirement split); user-set | N/A — not a projection | **Heterogeneous curve by wealth percentile, empirically anchored** (unoccupied space) |
| Inequality / relative position | Absent | Static one-shot "you rank Nth percentile today" | **Dynamic rank/share trajectory over the horizon** |
| Inflation handling | Adjustable inflation rate; real/nominal | N/A | Real-first, drag operates on real returns (mechanism, not just a rate) |
| Onboarding | Multi-field forms; some show result early (NerdWallet) | Single input, instant rank | 2-input instant projection; advanced behind progressive disclosure |
| Sourcing | Generally weak / opaque assumptions | Cite Census/SCF/Fed at page level | Per-parameter citations to named papers — sourcing as a first-class feature |
| Persistence | Accounts / saved plans (ProjectionLab, Boldin) | None | No accounts; shareable URL state |
| Stochastic modeling | Monte Carlo / historical backtest common | None | Deliberately deterministic (anti-feature) — clarity of structural divergence over variance |
| Scenario comparison | Side-by-side scenarios (ProjectionLab) | None | Client-side compare, paired with URL state (v1.x) |

## Sources

- ProjectionLab feature set / Monte Carlo / scenario comparison — https://projectionlab.com/monte-carlo , https://projectionlab.com/fire (MEDIUM, vendor docs)
- Retirement calculator UX conventions (adjustable inflation, pre/post return split, scenario ranges) — https://www.whitecoatinvestor.com/best-retirement-calculators-2025/ , https://www.nerdwallet.com/investing/calculators/retirement-calculator (MEDIUM)
- Investor.gov / Vanguard baseline compound-interest calculator conventions — https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator (HIGH, authoritative)
- Percentile "where do you rank" tool patterns — https://www.financialaha.com/articles/net-worth-percentile-calculator-where-you-rank/ , https://abelscalculators.com/wealth-percentile.html (MEDIUM)
- r>g / heterogeneous-returns inequality simulation framing — https://cepr.org/voxeu/columns/heterogeneous-returns-wealth-and-inequality-comeback-r-g , https://markov.elpatron.me/ (MEDIUM)
- Tooltip + chart source-citation UX best practice — https://www.nngroup.com/articles/tooltip-guidelines/ , https://academy.datawrapper.de/article/231-how-to-insert-links (MEDIUM/HIGH, NN/g authoritative)
- Empirical model anchors (Fagereng 2020, Bach 2020, Saez & Zucman, Jordà-Schularick-Taylor, Piketty, McKinsey 2023) — per `.planning/PROJECT.md` Context (HIGH, pre-identified during initialization)

---
*Feature research for: empirically-grounded wealth-projection + inequality-visualization web calculator*
*Researched: 2026-05-15*
