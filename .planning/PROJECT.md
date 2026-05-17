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

- ✓ Minimal entry: wealth + annual savings → instant projection on first paint — v1.0 (ENTRY-01..06)
- ✓ Heterogeneous return model: return rate as a function of wealth percentile, grounded in corrected primary literature — v1.0 (MODEL-01..06, DATA-01..04)
- ✓ Asset-price-inflation drag: scalar top-tier-growth drag, infinite-growth-preserving, no finite-pie/transfer — v1.0 (MODEL-04)
- ✓ Relative-position tracking: rank/share over time + tier share-of-economy (stacked-area + donut) — v1.0 (VIZ-05, VIZ-07)
- ✓ Clear visualization of exponential growth: 5 neutral chart types with log/linear toggle and tooltips — v1.0 (VIZ-01..07)
- ✓ Historical-data-derived defaults with visible sourcing: citation-enforced `DEFAULTS`/`SOURCES`, build-gated — v1.0 (DATA-01..04)
- ✓ Neutral, unbiased framing: NEUTRALITY-STYLE-GUIDE.md authored + enforced as a release gate, zero open FAIL — v1.0 (NEUT-01, NEUT-02)
- ✓ Responsive web app on a modern maintainable stack: Vite 8 + React 19 + ECharts 6 + Zustand 5 + Tailwind v4 — v1.0

### Active

<!-- Current scope. Building toward these (next milestone). -->

- [ ] Configurable settings: user can override defaults (return curve, drag strength, tier anchors, horizon) and experiment — partially deferred from v1.0 (advanced overrides not yet exposed in UI)

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
- **Phase 2 (Empirical Data & Parameter Calibration) complete (2026-05-16):** frozen, citation-annotated `DEFAULTS` (`src/data/defaults.ts` + `src/data/sources.ts`) — return-by-tier curve, back-solved `dragStrength` (McKinsey ~80% asset-inflation share), tier boundaries, horizon — every shipped value carries a complete `SourceRecord`, build-enforced by a sourcing-completeness Vitest gate. CR-01/CR-02 latent bugs hardened to fail loud. 58 tests, tsc strict. One open manual item: DATA-02 primary-source faithfulness cross-check (`02-HUMAN-UAT.md`). Requirements stay in Active (ship-to-validate; not yet user-facing).
- **Phase 3 (Selectors, Visualization & Neutrality Style Guide) complete (2026-05-16):** the engine's output is made legible via three neutral chart types — time-series growth, multi-tier divergence overlay, relative-position trajectory — driven by memoized selectors (`src/state/selectors.ts`), with a shared linear/log toggle, hover/tap tooltips (year/wealth/rank/tier), a visible citation footer, and the NEUT-01 neutrality style guide artifact (`docs/NEUTRALITY-STYLE-GUIDE.md`) governing copy and palette. Full Vite 8 + React 19 + ECharts 6 + Tailwind v4 scaffold landed; vitest upgraded 3→4. 89 tests green, tsc strict, build clean. VIZ-01..06 + NEUT-01 verified by automation; 5 browser-only UAT items open (`03-HUMAN-UAT.md`). 3 advisory code-review warnings logged (`03-REVIEW.md`). Requirements stay in Active (ship-to-validate; full UI shell lands Phase 4).
- **Phase 4 (UI Shell & Minimal Entry) complete (2026-05-16):** the proven model is now user-facing — a responsive `AppShell` + `ControlPanel` rendering a projection on first paint (no Calculate gate), with `useDeferredValue`-debounced live recompute, log-scale wealth/savings sliders, horizon slider, real/nominal `BasisToggle`, and a `SummaryReadout` (ending wealth, growth multiple, CAGR, rank-delta). Cited `SEED_WEALTH` (SCF 2022, $200k) and `INFLATION_RATE` (BLS CPI-U, 2.5%) defaults added; Phase 3 `HarnessPage` retired; style guide extended with D-09 (nominal caption) and D-15 (rank-delta disclosure). 125 tests green, tsc strict, build clean. ENTRY-01..ENTRY-06 verified by automation; 6 browser-only UAT items open (`04-HUMAN-UAT.md`). Code review: 1 critical + 6 warnings (`04-REVIEW.md`). **CR-01 carried into Phase 5 as a mandatory NEUT-02 pre-condition:** nominal-basis growth multiple is mislabeled "real wealth grew G×" (D-14 violation). Requirements stay in Active (ship-to-validate; neutrality sign-off lands Phase 5).
- **Phase 5 (Neutrality Review & Release Readiness) complete (2026-05-17):** NEUT-02 release gate cleared. Carried CR-01 D-14 mislabel fixed — `realGrowthMultiple` added to `Summary`, `selectSummary` made two-arg `(result, rawResult)`, wired through `AppShell`/`SummaryReadout` so the "real wealth grew G×" clause is basis-invariant. JST survivorship caveat now surfaced as a neutral second `<p>` in `CitationFooter` (`JST_SURVIVORSHIP_CAVEAT`, traceable to `sources.jst2019.note`). Deliverable of record `05-NEUT-02-REVIEW.md`: 77-row surface-grouped review, 75 PASS + 2 FIXED, **zero open FAIL**; byte-exact verbatim-caption Vitest assertions added; `NEUTRALITY-STYLE-GUIDE.md` bumped 1.0→1.1 (§3 drift resolved). 170 tests green, tsc strict, build clean. 3 browser-only UAT items open (`05-HUMAN-UAT.md`, approved to ship). **Follow-up tracked:** advisory `05-REVIEW.md` flagged a pre-existing Critical donut-label bug — `selectors.ts` renders the top-10% share as "Top 1% hold X%" (test WR-04 asserts the same wrong value); outside NEUT-02 scope, not a neutrality-gate blocker, but a data-integrity defect to fix next.

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
| Heterogeneous returns by wealth percentile (not flat rate) | Core differentiator; reflects empirical reality | ✓ Good — shipped v1.0, strictly-monotone curve unit-tested |
| Drag mechanism = asset-price inflation (not finite pie) | Allows infinite growth while still modeling top-tier impact on others | ✓ Good — scalar drag, non-conservation invariant tested (MODEL-04) |
| Minimal input = wealth + annual savings | Lowers friction; "let them start playing with it" | ✓ Good — first-paint projection, no Calculate gate (ENTRY-01..06) |
| Public web app, no accounts | Personal tool shared publicly; no per-user persistence needed | ✓ Good — static SPA, no backend/auth |
| Empirically-sourced defaults, configurable overrides | Neutral + grounded, but user can explore | ⚠️ Revisit — defaults shipped & citation-gated; UI override surface deferred to v1.1 |
| Default tier anchors = median / top 10% / top 1% / top 0.1% (continuous interpolated curve, not buckets) | Literature reliably cites returns down to ~top 0.1%; deeper tiers aren't cleanly citeable (goal #4) | ✓ Good — 4-anchor interpolated curve shipped; dynamic tail still a deferred follow-up |

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
*Last updated: 2026-05-17 after v1.0 MVP milestone (Phases 1–5 shipped; audit status tech_debt — 25/25 requirements satisfied, browser-UAT/Nyquist polish deferred)*
