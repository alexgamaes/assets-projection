# Phase 4: UI Shell & Minimal Entry - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 replaces the Phase 3 dev-harness chrome (`src/ui/HarnessPage.tsx`)
with a **real, responsive 2-input entry shell** wrapped around the already-
proven engine + memoized selectors + three ECharts charts. It delivers:

- Two primary inputs — **current wealth** and **annual savings** — that on
  first paint immediately render a projection with **no Calculate gate**;
  all model parameters stay defaulted from the Phase 2 empirical data layer.
- **Live, debounced recompute** wired through the existing
  `useProjectionStore` (Zustand) → memoized selectors → ECharts option
  pipeline (`store.ts` already flags "Phase 4 adds setInputs actions").
- A **horizon control** (default ~35y, range ~10–60y).
- A **real/nominal toggle** (real is the default; ENTRY-04).
- A **summary readout** (ending wealth, growth multiple, CAGR, plus a
  neutral rank delta).
- A **responsive layout** that degrades gracefully to mobile/touch
  (ENTRY-06).

Covers ENTRY-01, ENTRY-02, ENTRY-03, ENTRY-04, ENTRY-05, ENTRY-06.

**Carried forward, still binding (not re-discussed):** the stacked three-
chart layout with equal card treatment and the shared log/linear toggle
defaulting to log (Phase 3 D-06/D-07); neutral copy + value-free palette
with Phase 5 as the gating review; Tailwind v4 utilities only, no design
system (CLAUDE.md); the `params → memoized selector → model output →
ECharts option` pattern (charts never transform raw engine output inline).

**Out of scope:** the Phase 5 neutrality review pass (NEUT-02) that gates
all copy/palette added here; advanced configuration of model parameters
(v2 CONFIG-01); URL-shared state (v2 SHARE-01). Per-parameter sourcing
panel beyond the VIZ-06 footer remains Phase 5 unless the planner finds
the footer insufficient.

</domain>

<decisions>
## Implementation Decisions

### Input controls & instant-play feel
- **D-01:** Each primary input is a **logarithmic slider linked to a
  numeric field** — drag to play fast (feeds ENTRY-02 debounced
  recompute), type for precision. Applies to current wealth and annual
  savings.
- **D-02:** **Default seed values are rounded-up real-world medians.**
  Default current wealth ≈ rounded-up US median net worth (~$200k —
  replaces the current `store.ts` placeholder `$120,000`). Default annual
  savings ≈ rounded-up median savings figure.
- **D-03:** **Seed defaults must be cited** like model parameters
  (data-integrity constraint applies). Add a real source (e.g., US Federal
  Reserve Survey of Consumer Finances median net worth; exact dataset is
  planner/researcher's choice) to `src/data/sources.ts` the same way
  Phase 2 did, and surface it through the existing citation affordance.
- **D-04:** Slider span is **broad and logarithmic** so the low end stays
  usable: annual savings ~$2k → ~$2M/yr; current wealth similarly broad.
  Exact min/max/step is planner's, grounded in the empirical tier
  boundaries in `src/data/defaults.ts` so the span meaningfully covers
  median → top tiers. Typed field handles values outside the slider span.
- **D-05:** Horizon is a **linear slider with a live year readout**,
  default ~35y, range ~10–60y (ENTRY-03).

### Real vs. nominal toggle (ENTRY-04 — flagged tension resolved)
- **D-06:** The engine **stays locked real-only** (Phase 1/2 invariant
  untouched). The nominal view is produced by **display-layer
  re-inflation**: `nominal = real × (1 + i)^year`, applied in the
  selector/display layer only, never in `core/`.
- **D-07:** This requires **one new sourced inflation-rate default**
  (single cited long-run figure, e.g. long-run US CPI/PCE). It is added to
  `src/data/defaults.ts` + `src/data/sources.ts` under the same Phase 2
  sourcing-completeness gate. It is **fixed for v1, not a user control**
  (adjustable inflation is v2 CONFIG-01, out of scope — goal #5).
- **D-08:** **Default basis = real** ("real is the honest default",
  ENTRY-04). The toggle re-inflates **all money surfaces consistently** —
  Chart 1, Chart 2, and the summary readout. Chart 3 (rank/percentile) is
  unitless and unaffected.
- **D-09:** **Money-illusion neutrality safeguard:** when nominal is
  active, a **fixed neutral caption** states the figures are not
  inflation-adjusted and cites the inflation rate used. This mirrors the
  D-11 caption pattern from Phase 3 and **is seeded into
  `docs/NEUTRALITY-STYLE-GUIDE.md`** so Phase 5 (NEUT-02) gates the exact
  wording against the same artifact.

### Layout & responsive structure
- **D-10:** Desktop layout = a **sticky side panel** holding all controls
  (2 inputs + horizon + log/linear toggle + real/nominal toggle), with the
  three stacked charts scrolling beside it. Controls stay reachable while
  exploring (reinforces the play→watch loop).
- **D-11:** On mobile the side panel **collapses to a full-width block
  stacked above the charts** (no hidden UI, no bottom sheet). Simplest
  graceful degradation (ENTRY-06). The Phase 3 single-column stacked-chart
  order is preserved.
- **D-12:** Hover tooltips degrade to **tap-to-inspect with tap-away
  dismiss** (standard ECharts touch behavior). Hard requirement: every
  Phase 3 tooltip safeguard works on touch — the D-08 combined divergence
  tooltip and the D-11 rank-paired-with-real-wealth tooltip must never
  become hover-only.

### Summary readout (ENTRY-05)
- **D-13:** The readout shows the three required metrics — **ending
  wealth, growth multiple, CAGR** — and **tracks the active real/nominal
  basis** (D-08).
- **D-14:** It also surfaces the user's **distribution position as a rank
  delta, not a bare absolute** (e.g. `p75 → p71`), **paired with the
  wealth growth** over the same horizon. A bare absolute rank stat outside
  Chart 3's caption context is the Pitfall-4 zero-sum misread and is
  explicitly rejected.
- **D-15:** The rank-delta stat carries a **neutral disclosure** (rank can
  shift while real wealth still grows) whose exact wording is **seeded
  into `docs/NEUTRALITY-STYLE-GUIDE.md`** for the Phase 5 gate. The rank
  stat is **never shown in isolation** from growing wealth.

### Claude's Discretion
- **Recompute/debounce mechanics** (debounce ms, type-vs-drag recompute
  timing, debounced slider drag) — technical, planner's call; the locked
  requirement is ENTRY-02 (live recompute, debounced for slider drags, no
  jank) and ENTRY-01 (no Calculate gate, projection on first paint).
- **Typed-value validation/clamping** for out-of-slider-range inputs —
  planner's, must keep the engine from receiving `NaN`/negative/absurd
  values (CLAUDE.md notes Zod as the boundary-validation option).
- **Summary readout placement** — explicitly deferred to planner ("you
  decide"); the three metrics, the rank-delta treatment (D-14), and
  basis-tracking (D-13) are locked, placement is not.
- Exact slider min/max/step, the precise rounded-up seed default figures
  and which SCF/dataset vintage backs them, the inflation-rate figure and
  its source, breakpoint where the side panel collapses, chart min-height
  on small screens — planner/researcher, grounded in the cited sources and
  empirical tier boundaries.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope, requirements & roadmap
- `.planning/ROADMAP.md` §"Phase 4: UI Shell & Minimal Entry" — goal and 5
  success criteria (no Calculate gate; live debounced recompute; horizon +
  real/nominal toggle; summary readout; mobile/touch).
- `.planning/REQUIREMENTS.md` §"Entry & UX (ENTRY)" — ENTRY-01..ENTRY-06
  binding requirements; §"v2 Requirements" (CONFIG-01 adjustable params,
  SHARE-01 URL state) and §"Out of Scope" confirm what Phase 4 must NOT
  pull in.
- `.planning/PROJECT.md` — core value, neutrality constraint, simplicity
  constraint (goal #5 — two-input start, don't overwhelm), data-integrity
  constraint ("don't assume stuff — cite a source") which D-03/D-07 extend
  to seed/inflation defaults.

### Prior phase decisions (still binding)
- `.planning/phases/03-selectors-visualization-neutrality-style-guide/03-CONTEXT.md`
  — D-06 stacked equal-treatment chart layout, D-07 shared log/linear
  toggle (default log), D-08 combined divergence tooltip, D-09/D-10/D-11
  relative-position chart + caption neutrality safeguard (Phase 4 must
  preserve these on touch — D-12).
- `.planning/phases/03-selectors-visualization-neutrality-style-guide/03-UI-SPEC.md`
  — the visual/interaction contract Phase 4 extends (typography scale,
  spacing scale, neutral palette, card treatment, ECharts textStyle rules,
  tooltip contracts). Phase 4 adds controls but must stay within this
  contract.
- `.planning/phases/02-empirical-data-parameter-calibration/02-CONTEXT.md`
  — the `SourceRecord` shape and sourcing-completeness Vitest gate that
  D-03 (seed defaults) and D-07 (inflation rate) must satisfy.
- `.planning/phases/01-model-foundation/01-CONTEXT.md` — engine real-only
  basis invariant that D-06 must not violate (re-inflation is display-only).

### Stack & architecture (binding)
- `CLAUDE.md` §"Technology Stack" / §"Stack Patterns by Variant" — locked
  stack; mandatory `params → memoized selector → model output → ECharts
  option` pattern; Zod for boundary input validation; Tailwind v4
  utilities, no design system; round-at-display (re-inflation lives in the
  display layer).
- `.planning/research/ARCHITECTURE.md` — functional-core/imperative-shell;
  `core/` stays framework-free, the new input controls + re-inflation are
  imperative shell.
- `.planning/research/PITFALLS.md` §"Pitfall 4" (zero-sum/finite-pie) —
  binds the D-14/D-15 rank-delta neutrality safeguard and the D-09 nominal
  money-illusion safeguard.

### Engine / data contracts (consumed, not modified)
- `src/core/types.ts` — `Inputs`, `Params`, `ProjectionResult`,
  `YearSnapshot`, `relativePosition[]`, branded `Real`/`Nominal` basis,
  `assertReal`; `SourceRecord` shape for D-03/D-07 citations.
- `src/core/engine.ts` — `projectionEngine(inputs, params)`; stays
  real-only (D-06).
- `src/state/store.ts` — `useProjectionStore`; Phase 4 adds `setInputs`
  actions here (existing comment marks the seam). Replace the placeholder
  `currentWealth: 120_000` with the cited median seed default (D-02).
- `src/state/selectors.ts` — the memoized selector layer; nominal
  re-inflation (D-06/D-08) and the summary-readout derivation (D-13/D-14)
  belong here, not in `core/`.
- `src/data/defaults.ts` / `src/data/sources.ts` — where the seed-default
  and inflation-rate citations (D-03/D-07) are added under the Phase 2
  sourcing gate.
- `docs/NEUTRALITY-STYLE-GUIDE.md` — D-09 (nominal not-adjusted caption)
  and D-15 (rank-delta disclosure) wording is seeded here for the Phase 5
  gate; existing D-11 caption pattern is the model to follow.
- `src/ui/HarnessPage.tsx` — the dev-harness page Phase 4 replaces with
  the real shell (reuse its chart-section structure and selector wiring).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useProjectionStore` (Zustand, `src/state/store.ts`): already holds
  `inputs`/`params`; comment explicitly marks "Phase 4 will add
  setInputs/setParams actions" — the designated integration seam.
- `src/state/selectors.ts`: memoized selectors already map engine output →
  ECharts option for all three charts. Nominal re-inflation and the
  summary-readout metrics plug in here as new memoized selectors.
- `src/ui/HarnessPage.tsx`: the stacked-chart section structure, the
  shared log/linear toggle wiring, and the citation footer are all
  reusable — Phase 4 swaps the static module-level `projectionEngine` call
  for a live store subscription and adds the control panel.
- `src/ui/LogLinearToggle.tsx`, `src/ui/CitationFooter.tsx`,
  `src/viz/*Chart.tsx`: existing, neutral, Phase-3-verified components the
  shell composes around.
- `src/data/sources.ts` `SourceRecord` + the sourcing-completeness Vitest
  gate: the proven pattern D-03/D-07 reuse for the seed/inflation
  citations.

### Established Patterns
- Functional core / imperative shell: `core/` is framework-free and
  real-only. The nominal re-inflation (D-06) MUST live in the selector/
  display layer — putting it in `core/` violates the basis invariant.
- `params → memoized selector → model output → ECharts option`
  (CLAUDE.md, mandatory): live recompute = store input change →
  selectors recompute → charts re-render. No inline transforms in charts.
- Round-at-display: formatting/re-inflation happen in the selector/chart
  layer, never in the engine.
- Sourcing-as-enforced-invariant (Phase 2): every shipped default carries
  a `SourceRecord`, build-enforced by a Vitest gate. D-03/D-07 add new
  defaults and must pass this same gate.

### Integration Points
- `store.ts` gains `setInputs` (and the seed default changes from
  `120_000` to the cited median per D-02).
- New `setInputs` → existing selectors → existing charts is the live
  recompute path (ENTRY-02); debounce wraps the slider→store write.
- The real/nominal toggle adds a basis flag to the store; a new memoized
  re-inflation selector reads it and the inflation default.
- The new control panel is a new imperative-shell component composed into
  the page that replaces `HarnessPage.tsx`.

</code_context>

<specifics>
## Specific Ideas

- The "open it and immediately play" loop is the felt goal: log sliders +
  sticky always-visible controls + an always-visible summary readout so
  every drag produces instant visible cause→effect across charts and
  metrics.
- Logarithmic sliders are a deliberate choice (mirrors the Phase 3 log-
  default rationale) — a $2k and a $2M annual-savings world must both be
  reachable without the low end collapsing to a dead zone.
- The rank stat as a **delta** (`p75 → p71`) rather than an absolute is
  the user's explicit framing: it shows movement happening *alongside*
  wealth growth, which is the project's whole thesis and its biggest
  neutrality risk.
- Real stays the default everywhere; nominal is an opt-in that always
  announces itself as not-inflation-adjusted with a cited rate — honesty
  over impressive-looking numbers.

</specifics>

<deferred>
## Deferred Ideas

- **User-adjustable inflation rate** — considered, rejected for v1; it is
  v2 CONFIG-01 (advanced parameter override). v1 ships a fixed cited
  inflation default (D-07).
- **Absolute ending rank/percentile as a headline stat** — considered,
  rejected: a bare absolute rank outside the D-11 caption context is the
  Pitfall-4 zero-sum misread. Replaced by the rank-delta-paired-with-
  wealth treatment (D-14).
- **Collapsible bottom-sheet / sticky compact mobile controls** —
  considered, rejected for v1 in favor of the simpler stack-on-top
  (D-11). Revisit only on real mobile-usability feedback.
- **Richer per-parameter sourcing panel** (beyond the VIZ-06 footer) —
  remains Phase 5 scope (carried from Phase 3), unless the planner finds
  the footer insufficient for surfacing the new seed/inflation citations.

None of the above expand Phase 4 scope — discussion stayed within the
phase boundary.

</deferred>

---

*Phase: 4-ui-shell-minimal-entry*
*Context gathered: 2026-05-16*
