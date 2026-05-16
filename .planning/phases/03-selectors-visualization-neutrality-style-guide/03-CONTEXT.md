# Phase 3: Selectors, Visualization & Neutrality Style Guide - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 makes the proven Phase 1/2 engine **legible**. It delivers:
a **memoized selector layer** (charts never transform raw engine output
inline — `Zustand params → memoized selector → model output → ECharts
option`), **three neutral chart types** (time-series wealth growth,
multi-tier divergence overlay, relative-position trajectory), a
**linear/log scale toggle** with neutral explanatory copy, **hover/tap
tooltips**, **visible source citations**, and the **neutrality style guide
artifact** (NEUT-01). Covers VIZ-01..VIZ-06, NEUT-01.

In scope: the Vite/React/ECharts scaffold (none exists yet), the selector
modules, the three chart React components, a minimal dev harness page that
renders the charts from hardcoded default params, the shared log/linear
toggle, tooltips, the footer citation affordance (VIZ-06 minimum), and the
neutrality style guide markdown artifact.

Out of scope (Phase 4): the 2-input entry shell, live debounced recompute,
horizon control, real/nominal toggle, summary readout, mobile/touch
interaction polish. Out of scope (Phase 5): the neutrality review pass that
gates copy/palette against this phase's style guide.

</domain>

<decisions>
## Implementation Decisions

### Neutrality style guide (NEUT-01)
- **D-01:** The style guide is a **plain versioned repo markdown artifact**
  (prose rules, not executable). No codified palette tokens, no lint/CI
  lexicon test. Enforcement is the **Phase 5 human review gate**, which
  reads this artifact. (Exact path is Claude's discretion — see below.)
- **D-02:** The guide covers a **copy lexicon** (banned value-laden
  words/verbs/adjectives, alarm punctuation, blame/virtue framing, with
  neutral rewrites) and **chart-semantic rules** (neutral axis/series
  labels, the relative-position caption rule, log-scale explanatory-copy
  tone).
- **D-03:** To satisfy the locked NEUT-01 / ROADMAP success-criterion-5
  requirement that the guide include palette rules, include a **brief
  explicit palette clause**: "no semantic red/green; color must never imply
  good/bad." A full dedicated palette section and a formal pass/fail
  checklist template were explicitly NOT chosen.
- **D-04:** The neutral caption text for the relative-position chart
  (D-11) is **seeded into this style guide** when authored, so Phase 5
  reviews it against the same artifact. (Links D-02 ↔ D-11.)

### Three-chart presentation
- **D-05:** Phase 3 stands up the **Vite/React/ECharts scaffold** plus a
  **minimal dev harness page** that renders the three charts from
  **hardcoded default params** (no input UI). Phase 4 replaces the page
  chrome with the real 2-input shell. Charts must be visibly real this
  phase.
- **D-06:** The three charts are **stacked vertically**, all visible at
  once, in order: **time-series growth → multi-tier divergence overlay →
  relative-position trajectory**. Phase 4 keeps this arrangement (no
  visual-hierarchy primary/secondary treatment — neutrality).
- **D-07:** **One shared linear/log toggle**, defaulting to **log**,
  governs only the two wealth-magnitude charts (time-series + divergence).
  The relative-position chart is **always linear** with no toggle. Neutral
  plain-language copy explains what each scale reveals (VIZ-02).
- **D-08:** The divergence-overlay tooltip is a **combined tooltip showing
  all series at the inspected year** (user + median + top1% + top0.1%,
  each with wealth) plus the user's percentile/rank and tier — the VIZ-03
  required fields present at the inspected point.

### Relative-position chart design (no mainstream precedent)
- **D-09:** The chart plots the **user's rank (percentile, 0–100) line**
  vs year as the primary trace. `userShare` (fraction of total wealth) is
  surfaced **in the tooltip only**, not as the plotted axis (avoids the
  tiny-share flat-line legibility problem). Standard axis orientation
  (p100 at top); **no axis inversion** (axis tricks are themselves
  non-neutral).
- **D-10:** Add **faint, unobtrusive neutral tier-threshold reference
  bands/lines** for the median / top10 / top1 / top0.1 percentile
  boundaries so the user sees which tier they cross. Must stay neutral and
  not duplicate the divergence-overlay story.
- **D-11:** Neutrality safeguard (Phase 5 will gate this): a **fixed
  neutral caption** stating shares/rank can move while all tiers' real
  wealth still grows, AND the tooltip **pairs the user's rank with their
  growing real wealth at that same year** so a downward rank trend is
  never shown in isolation (defuses the zero-sum misread).

### Claude's Discretion
- Exact path/filename of the style guide artifact (proposed
  `.planning/` or `docs/NEUTRALITY-STYLE-GUIDE.md`) — planner's choice;
  must be a stable versioned location the Phase 5 gate can cite.
- Who authors the initial lexicon seed and its exact banned-word list —
  planner/executor, grounded in PROJECT.md's neutrality constraint.
- Selector module layout and memoization mechanism (Zustand selector vs
  `useMemo` vs reselect-style) — follow CLAUDE.md's stack pattern and
  ARCHITECTURE.md functional-core/imperative-shell layering.
- ECharts option construction details, axis units/formatting, time-series
  chart series composition (which lines), and exact dev-harness page
  chrome — planner/executor, kept neutral per the style guide.
- Citation affordance: **VIZ-06 footer-line minimum** (not selected for
  deep discussion). A footer tracing displayed defaults to named research
  satisfies VIZ-06; a richer per-parameter sourcing panel and the
  survivorship-caveat surfacing are deferred to Phase 5 scope unless the
  planner finds the footer insufficient.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope, requirements & roadmap
- `.planning/ROADMAP.md` §"Phase 3" — goal and 5 success criteria
  (success criterion 5 mandates the palette-rules clause; D-03).
- `.planning/REQUIREMENTS.md` §"Visualization (VIZ)" / §"Neutrality
  (NEUT)" — VIZ-01..VIZ-06, NEUT-01 binding requirements; v2/out-of-scope
  list (sensitivity bands out of scope).
- `.planning/PROJECT.md` — core value ("relative position shifts over
  time"), neutrality constraint, the cited source list the VIZ-06 footer
  traces to, and the locked stack/Key Decisions.
- `.planning/phases/05-*/` (ROADMAP §"Phase 5") — Phase 5 gates this
  phase's copy/palette; the style guide D-01..D-04 is the artifact it
  consumes (success criterion 3: neutral relative-position caption).

### Stack & architecture (binding)
- `CLAUDE.md` §"Technology Stack" / §"Stack Patterns by Variant" — locked
  stack (React 19, Vite 8, ECharts 6 + echarts-for-react, Zustand,
  Tailwind v4, Vitest) and the mandatory selector pattern
  (`params → memoized selector → model output → ECharts option`); charts
  must NOT transform raw engine output inline.
- `.planning/research/ARCHITECTURE.md` — functional-core/imperative-shell
  layering; `core/` stays framework-free; selectors/charts are the
  imperative shell consuming injected engine output.
- `.planning/research/STACK.md` — version compatibility detail for the
  scaffold Phase 3 stands up.

### Engine output contract (consumed by selectors/charts)
- `src/core/types.ts` — `ProjectionResult`, `YearSnapshot`
  (`anchorWealth`, `userWealth`, `userPercentile`, `topSetPercentile`,
  `assetInflation`), `relativePosition: Array<{year, userShare,
  userRank}>`, and `SourceRecord` (`url`/`note` fields the VIZ-06 footer
  reads).
- `src/core/engine.ts` — `projectionEngine(inputs, params)` signature
  the selectors call.
- `src/core/relativePosition.ts` — `deriveShares` (origin of
  `userShare`/`userRank` for D-09/D-11).
- `src/data/defaults.ts` — frozen `DEFAULTS: Params` the dev harness
  feeds the engine (D-05).
- `src/data/sources.ts` — `SOURCES` registry the citation footer
  (VIZ-06) traces displayed defaults to.

### Prior phase decisions (still binding)
- `.planning/phases/02-empirical-data-parameter-calibration/02-CONTEXT.md`
  — D-10 SourceRecord shape (the VIZ-06 footer contract), real-only basis.
- `.planning/phases/01-model-foundation/01-CONTEXT.md` — engine output
  semantics (dynamic top set, endogenous re-fit, real-only).
- `.planning/research/PITFALLS.md` — Pitfall 4 (zero-sum/finite-pie) binds
  the relative-position neutrality safeguard D-11.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/core/engine.ts` `projectionEngine(inputs, params)` and the typed
  `ProjectionResult` — the sole data source the memoized selectors wrap.
- `src/data/defaults.ts` frozen `DEFAULTS` — feeds the Phase 3 dev harness
  directly (no input UI needed this phase).
- `src/data/sources.ts` `SOURCES` + `SourceRecord.url/note` — the typed
  citation data the VIZ-06 footer renders (built Phase-3-ready in Phase 2).

### Established Patterns
- Functional core / imperative shell: `core/` is framework-free; charts +
  selectors are the new imperative shell and must consume engine output
  via injected params, never import params into `core/`.
- Plain `number` math, round at display (CLAUDE.md) — formatting/rounding
  happens in the selector/chart layer, not the engine.
- Test-as-enforcement is the project's enforcement idiom — but for NEUT-01
  the user deliberately chose human-gated review (Phase 5), not a lint
  test (D-01).

### Integration Points
- No `package.json`/Vite scaffold exists — Phase 3 creates it (D-05);
  this is the project's first framework code. Phase 4 builds on this
  scaffold and keeps the stacked-chart layout (D-06).
- The selector layer is the contract Phase 4's live recompute will drive
  (Zustand params changing → memoized selectors → charts).

</code_context>

<specifics>
## Specific Ideas

- The relative-position chart is the project's signature, precedent-free
  visualization — its credibility rests on the D-11 neutrality safeguard
  (caption + rank-paired-with-growing-real-wealth tooltip), not on the
  line itself. This is the highest design risk in the phase.
- Log scale ON by default for the wealth charts is a deliberate choice to
  make compounding legible immediately (the project's core value), with
  linear as the opt-in comparison.

</specifics>

<deferred>
## Deferred Ideas

- **Richer per-parameter sourcing panel** (beyond the VIZ-06 footer
  minimum) and **neutral survivorship-caveat surfacing** — acknowledged;
  belongs to Phase 5 scope (NEUT-02 / ROADMAP Phase 5 success criterion 4)
  unless the planner finds the footer insufficient for VIZ-06.
- **Per-chart independent log/linear toggle** — considered, rejected for
  v1 in favor of one shared toggle (D-07). Revisit only if user feedback
  needs it.
- **Tabbed/switchable chart layout** and **primary+secondary hierarchy** —
  considered, rejected for neutrality and narrative reasons (D-06).

None of the above expand Phase 3 scope — discussion stayed within the
phase boundary.

</deferred>

---

*Phase: 3-selectors-visualization-neutrality-style-guide*
*Context gathered: 2026-05-16*
