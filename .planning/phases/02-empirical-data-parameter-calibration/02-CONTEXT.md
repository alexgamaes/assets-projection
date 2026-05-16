# Phase 2: Empirical Data & Parameter Calibration - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers a **frozen, citation-annotated default parameter set** —
return-by-tier curve (4 anchors), drag strength, tier anchors, horizon default —
traced to **corrected** primary literature, plus a **build-enforced sourcing
invariant** that refuses any model parameter lacking a complete source record.
Covers requirements DATA-01..DATA-04.

The engine, types schema, and the `SourcedParam` slot already exist from Phase 1.
This phase: (1) hardens two carried-forward latent bugs before any real data is
loaded, (2) replaces the `SourcedParam.source` shape with a structured record,
(3) calibrates real anchor + drag values from corrected literature, (4) adds the
sourcing-completeness gate, (5) adds a divergence sanity-check on real defaults.

In scope: production default-parameter module, structured `SourceRecord` schema,
the bisect/alpha guards, drag-strength back-solve + its calibration test, the
sourcing-completeness test, the divergence sanity-check, and the PROJECT.md
~18pp shorthand correction.

Out of scope: selectors/derive layer, charts, the VIZ-06 citation UI itself
(Phase 3 — only the data the footer will read is produced here), state/URL, any
UI, sensitivity/confidence bands (explicit v2, out of scope).

</domain>

<decisions>
## Implementation Decisions

### Carried-forward preconditions (CR-01 / CR-02)
- **D-01:** Fix BOTH latent bugs as the **first task of the phase, before any
  real empirical data is loaded**: (a) a root-bracketing guard in `bisect()`
  (CR-01), and (b) an `alpha > 1` domain assertion guarding
  `paretoConditionalMean` / the Pareto tail (CR-02). Source: 01-HUMAN-UAT.md
  test 2 (developer decision 2026-05-16) + 01-REVIEW.md CR-01/CR-02 for exact
  locations.
- **D-02:** Guard failure behavior = **throw with a diagnostic message** naming
  the offending value, the violated bound, and the parameter
  (e.g. `alpha=0.94 ≤ 1 from top01/top1=12.3; Pareto mean undefined`).
  Fail-loud, consistent with the existing `assertReal()` pattern in
  `src/core/types.ts`. No silent clamping.
- **D-03:** Calibration must keep Pareto **alpha > 1** (i.e. `top01/top1 < 10`)
  and the calibrated root must lie inside the validated bisect bracket — these
  are hard preconditions on the chosen anchor values.

### Return-anchor calibration
- **D-04:** When literature gives a range or disagreeing figures, the frozen
  default per tier is the **central / midpoint estimate, triangulated across
  cited sources**. The source record documents the range it was drawn from.
- **D-05:** The **corrected Fagereng framing** (raw ~500bp / ~10pp net-of-tax
  association — NOT a flat 18pp per-tier gap) sizes the median→top **gradient**.
  Each of the 4 anchors (median / top10 / top1 / top01) is then placed using
  triangulated tier-specific evidence (Bach 2020 leverage/systematic-risk,
  Saez-Zucman top-tail, Jordà-Schularick-Taylor asset base). **No literal "18"
  anywhere in the engine** (success criterion 3).
- **D-06:** The PROJECT.md "~18pp gap" shorthand (a cross-cutting blocker flagged
  in STATE.md, "must be corrected before Phase 2 closes") is **corrected within
  this phase** — the PROJECT.md Context bullet is rewritten to the corrected
  Fagereng framing. Additionally, each return anchor's source record records the
  **discarded 18pp misreading and why** (a visible correction trail for the
  sourcing/neutrality audit).

### Drag-strength derivation
- **D-07:** dragStrength is **back-solved from a historical baseline run**: run
  the engine over a 2000–2021-like baseline and choose dragStrength so the
  model's asset-inflation share of net-worth growth matches the McKinsey **~80%**
  figure. The default is empirically calibrated via a documented, reproducible
  procedure — not an asserted constant.
- **D-08:** Back-solve **target metric = McKinsey ~80% asset-inflation share of
  net-worth growth** over the baseline window (the single cited figure named in
  success criterion 4). (The ~1.3× asset/GDP ratio is NOT the calibration
  target.)
- **D-09:** A **calibration test** runs the engine on the real defaults at the
  back-solved dragStrength and re-asserts the Phase 1 D-12 invariants
  (non-conservation: no tier's loss equals another's gain; infinite-growth
  preserved). Calibration cannot silently introduce a zero-sum / finite-pie
  artifact (Pitfall 4).

### Source-record schema & enforcement
- **D-10:** Replace `SourcedParam.source: string | null` with a structured
  **`SourceRecord`** object: **six required fields** — `sourceName`,
  `figureUsed`, `basis`, `definition`, `yearVintage`, `retrievedDate` (the
  fields enumerated in roadmap success criterion 1) — plus **optional `note`**
  (correction trail / survivorship caveats, e.g. the discarded-18pp trail from
  D-06) and **optional `url`** (citation link the Phase 3 VIZ-06 footer will
  read).
- **D-11:** DATA-04 enforcement = a **dedicated failing test in the existing
  Vitest suite + CI** that enumerates every model parameter in the **frozen
  default set** and fails if any required `SourceRecord` field is missing or
  empty. Consistent with the project's test-as-enforcement pattern (D-12,
  `assertReal`). (Not type-only — a named failing test is more
  self-explanatory.)
- **D-12:** The sourcing gate targets **only the production frozen default
  parameter module**. Phase 1 test fixtures may keep synthetic source-less
  params — DATA-04 is about shipped defaults, not test scaffolding.

### Claude's Discretion
- Exact `SourceRecord` field types (string vs structured `basis: 'real' |
  'nominal'` reuse from the existing branded basis types) — planner/researcher
  choice; must keep the completeness test machine-checkable.
- Module/file layout of the frozen defaults (single `defaults.ts` vs grouped) —
  follow the `core/` functional-core structure from ARCHITECTURE.md unless the
  planner finds reason to deviate. The defaults module is data, not engine
  logic, and must remain injectable (never fetched/imported by `core/`).
- The precise shape of the divergence sanity-check (success criterion 5: "no
  tier exceeds plausible bounds within the default horizon") — bound definition
  and horizon left to planner; must run on the real calibrated defaults.
- Horizon default value within ENTRY-03's ~30–40y band — a UX default, not a
  sourced model parameter (DATA-04 does not apply to it); planner may set it.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope, requirements & carried-forward preconditions
- `.planning/PROJECT.md` — core value, goal priority order, Key Decisions
  (4-anchor curve, drag = asset-price inflation not finite pie, real-only), the
  cited source list, indicative real-return-by-tier defaults to validate, and
  the "Dynamic tail resolution" follow-up. **Contains the ~18pp shorthand that
  D-06 requires correcting in this phase.**
- `.planning/REQUIREMENTS.md` §"Empirical Data (DATA)" — DATA-01..DATA-04, the
  binding requirements; also the v2/out-of-scope list (sensitivity bands are
  out of scope → single point estimate per param).
- `.planning/ROADMAP.md` §"Phase 2" — goal and 5 success criteria.
- `.planning/phases/01-model-foundation/01-HUMAN-UAT.md` — test 2: the exact
  CR-01/CR-02 Phase 2 PRECONDITION text (developer decision to fix in Phase 2).
- `.planning/phases/01-model-foundation/01-CONTEXT.md` — locked Phase 1
  decisions D-01..D-12 (drag coupling, distribution curve, dynamic top set,
  test rigor) that the calibrated values must remain consistent with.

### Engine architecture & domain risk (highest priority)
- `.planning/research/PITFALLS.md` — Pitfall 1 (nominal/real conflation),
  Pitfall 3 (drag double-counting), **Pitfall 4 (zero-sum/finite-pie — drag
  must stay non-conserved; binds D-09)**, Pitfall 5 (geometric vs arithmetic
  means).
- `.planning/research/ARCHITECTURE.md` — functional-core/imperative-shell
  layering, `core/` module layout, zero-framework-imports boundary, params
  injected (never fetched) — constrains where the frozen defaults module lives.

### Code to read before implementing
- `src/core/types.ts` — current `SourcedParam`, `Anchors`, `ReturnByTier`,
  `Params`, branded `Real`/`Nominal` + `assertReal()`. D-10 modifies the
  `source` shape here; the export contract is consumed by Phases 3/4.
- `src/core/distribution.ts` — `bisect()` (CR-01 guard site), Pareto
  tail / `paretoConditionalMean` (CR-02 alpha>1 guard site).
- `.planning/phases/01-model-foundation/01-REVIEW.md` §CR-01/CR-02 — exact bug
  locations and recommended fix shape.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/core/types.ts` — `SourcedParam` was deliberately built Phase-2-ready
  (`source: string | null` placeholder); D-10 evolves it into `SourceRecord`.
  Branded `Real`/`Nominal` + `assertReal()` is the precedent for D-02's
  fail-loud guards.
- Phase 1 D-12 invariant battery (`src/core/__tests__/invariants.test.ts`) — the
  non-conservation/infinite-growth assertions D-09 re-runs on real defaults.
- Existing Vitest + CI pipeline — host for the D-11 sourcing-completeness test
  (test-as-enforcement is the established pattern).

### Established Patterns
- Pure deterministic `core/*.ts`, zero framework/DOM/fetch imports, params
  injected. The frozen defaults are **data injected into** the engine, never
  imported by `core/`.
- Plain `number` math, round at display (CLAUDE.md). TypeScript 5.9 strict +
  Vitest 3.
- Fail-loud guards that throw a descriptive, testable error (`assertReal`) —
  D-02 follows this exact shape.

### Integration Points
- D-10's `SourceRecord` is the typed contract Phase 3 VIZ-06 reads to render
  visible citations (the optional `url`/`note` exist for that consumer).
- The frozen defaults module is what Phase 4's ENTRY-01 "all other parameters
  defaulted from the empirical data layer" depends on.

</code_context>

<specifics>
## Specific Ideas

- The Fagereng correction is the spine of this phase: the engine must contain
  **no literal "18"** and the corrected ~500bp/~10pp framing must be traceable
  in both PROJECT.md and the per-anchor source records (D-05, D-06).
- dragStrength is the single highest-epistemic-risk parameter (no off-the-shelf
  derivation); its credibility rests entirely on the documented, reproducible
  back-solve procedure (D-07/D-08), not on the number itself.

</specifics>

<deferred>
## Deferred Ideas

- **Dynamic tail resolution** (from PROJECT.md follow-ups) — whether a top
  0.01%+ anchor or adaptive tail is warranted. Phase 1 D-04's analytic Pareto
  tail already extrapolates beyond top 0.1%; keep 4 anchors for now. Revisit
  during/after this phase's calibration only if real anchors show the curve
  under-resolving where mass moves. Not acted on here.
- **Cost-of-living / survival-threshold reference overlay** (from 01-CONTEXT
  deferred) — would need its own sourced data basket; still a v2 / backlog
  candidate. Not in scope.
- **~1.3× asset/GDP ratio as a drag cross-check** (raised, not chosen) — D-08
  uses the ~80% share as the sole back-solve target; the ~1.3× figure could
  later serve as an optional sanity cross-check but is not required this phase.

None of the above expand Phase 2 scope — discussion stayed within the phase
boundary.

</deferred>

---

*Phase: 2-empirical-data-parameter-calibration*
*Context gathered: 2026-05-16*
