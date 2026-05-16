# Phase 1: Model Foundation - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers a **pure, framework-free, deterministic projection engine** that
computes year-by-year per-tier wealth from `(inputs, params)` — heterogeneous
returns by wealth tier, asset-price-inflation drag, and relative-position
derivation — proven correct by numerical unit tests against synthetic citeable
fixtures. **No UI, no I/O, no real empirical data** (real sourced defaults are
Phase 2). Covers requirements MODEL-01..MODEL-06.

In scope: `core/` engine math, parameter/types schema with nominal/real basis
invariant, the distribution model, the drag coupling, relative-position math, and
the numerical test suite (synthetic params only).

Out of scope: real cited defaults (Phase 2), selectors/derive layer, charts,
state/URL, any UI, the cost-of-living overlay (see Deferred).

</domain>

<decisions>
## Implementation Decisions

### Drag coupling (asset-price-inflation)
- **D-01:** Drag is a **single scalar real-return haircut applied once** to every
  tier's growth per year. Conceptual story (locked by research): top-tier
  aggregate compounding bids up an asset-price index; the haircut is the part of
  price appreciation not backed by a tier's own productive return. Never a
  transfer/redistribution; non-conservation is a tested invariant.
- **D-02:** Driver formula: `assetInflation_n = dragStrength × (aggregate
  wealth-growth rate of the dynamic top set in year n)`. Linear in
  `dragStrength`; `dragStrength = 0` ⇒ exact collapse to independent per-tier
  baseline.
- **D-03:** **Dynamic top set** (not a hardcoded cutoff): each year the "top" is
  the smallest group of top percentiles whose cumulative-from-top wealth = 50%
  of total wealth, evaluated as the **exact interpolated percentile** on the
  continuous distribution curve (D-04). Self-tightening as concentration rises
  (≈top 10% early → top 1% → top 0.1% later). No discrete whole-tier stepping
  (rejected — produces meaningless chart kinks).

### Distribution representation
- **D-04:** Wealth distribution modeled as a **continuous parametric curve:
  lognormal body + Pareto upper tail**, calibrated to pass through the 4 sourced
  anchors (median / top10 / top1 / top0.1). The Pareto tail extrapolates
  analytically beyond top 0.1% — this resolves the PROJECT.md "dynamic tail
  resolution" follow-up without a 5th hardcoded anchor.
- **D-05:** This single curve is the shared substrate for: the dynamic top-set
  50% threshold (D-03), return-curve interpolation across percentiles, the
  user's moving-tier rate (D-06), and relative-position rank/share derivation.
- **D-06:** **Evolution = endogenous annual re-fit (default).** Track wealth at
  each of the 4 anchor percentiles year by year (each compounds at its own tier
  return minus drag); re-fit the lognormal+Pareto curve each year to those
  evolving points; re-read the user's percentile off the fresh curve each year
  so the user's return follows their moving tier (MODEL-02).
- **D-07:** Engine exposes a params-level switch `distributionEvolution`:
  `"endogenous"` (default, D-06) vs `"fixed-shape-scaled"` (calibrate shape once
  at year 0, only shift/scale). Engine supports both from day one; UI exposure of
  this knob is a later/v2 concern, not Phase 1.

### Savings & inflation handling
- **D-08:** Savings contribution is **constant in real (today's-money) terms**
  across the full horizon. No in-engine inflation parameter is introduced — keeps
  the real-only basis invariant clean (Pitfall 1). (Implicitly assumes nominal
  savings rises with inflation.)
- **D-09:** Engine must support a **maximum horizon of 60 years** (covers
  ENTRY-03's upper bound; not user-facing beyond that in v1).

### Test rigor & correctness
- **D-10:** Golden-master reference is **both**: (a) a drag-off single-tier
  **analytic closed form** (compound interest + ordinary-annuity formula) used
  for the long-horizon tolerance criterion, and (b) a small **hand-derived
  multi-tier fixture** (2–3 tiers, ~5y, drag on, including re-fit + dynamic top
  set) for the coupling pipeline.
- **D-11:** Documented relative-error tolerance: **< 1e-9** vs the drag-off
  analytic reference over the 60-year max horizon.
- **D-12:** Required invariant tests (synthetic fixtures): drag=0 ⇒ independent
  per-tier baseline; non-conservation (no tier's loss equals another's gain);
  infinite-growth preserved (no tier forced to negative real wealth by drag
  alone); long-horizon floating-point stability; basis-mismatch test fails
  (MODEL-05).

### Claude's Discretion
- Savings timing: **end-of-year ordinary-annuity convention**
  (`W_{n+1} = W_n·(1+r) + S`) — chosen so the analytic golden-master reference
  stays exact. (User deferred this decision.)
- Basis-enforcement mechanism (branded TS types vs runtime-tagged basis field vs
  Zod) — not discussed; planner/researcher to choose the approach that makes a
  nominal/real mismatch a hard test failure per MODEL-05. The *requirement* is
  fixed; the mechanism is open.
- Parameter object shape ({value, basis, source, note}-style) and how the
  "source present" structure is represented while values are synthetic
  placeholders — open; structure must be ready for Phase 2 real citations.
- Module layout — follow the functional-core structure from
  `.planning/research/ARCHITECTURE.md` (`core/` with engine/tiers/drag/
  relativePosition/types) unless the planner finds reason to deviate.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope & requirements
- `.planning/PROJECT.md` — core value, goal priority order, Key Decisions
  (heterogeneous returns; drag = asset-price inflation not finite pie; 4 anchors;
  real-only), and the "Dynamic tail resolution" follow-up (addressed by D-04).
- `.planning/REQUIREMENTS.md` §"Model Engine (MODEL)" — MODEL-01..MODEL-06, the
  binding requirements for this phase.
- `.planning/ROADMAP.md` §"Phase 1: Model Foundation" — goal and 5 success
  criteria.

### Engine architecture & domain risk (highest priority)
- `.planning/research/PITFALLS.md` — Pitfall 1 (nominal/real conflation →
  real-only invariant), Pitfall 3 (drag double-counting), Pitfall 4 (zero-sum/
  finite-pie — must stay non-conserved), Pitfall 5 (geometric vs arithmetic
  means — use geometric for the deterministic path). These are the correctness
  landmines for Phase 1.
- `.planning/research/ARCHITECTURE.md` — functional-core / imperative-shell
  layering, `core/` module layout, `projectionEngine(inputs, params)` sketch,
  tier-coupling/drag data-flow diagram, and the zero-framework-imports boundary
  rule.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield repo (only `.planning/`, `CLAUDE.md`, `README.md`,
  `LICENSE`). No source code exists yet.

### Established Patterns
- ARCHITECTURE.md prescribes the pattern to follow: pure deterministic
  `core/*.ts` modules, zero framework/DOM/fetch imports, params passed in (never
  fetched). This is the structural contract for Phase 1.
- Stack (CLAUDE.md): TypeScript 5.9 + Vitest 3 for the engine and its tests.
  Plain `number` math (no decimal libs — rates/multipliers, round at display).

### Integration Points
- Phase 2 will replace synthetic test params with real cited defaults — the
  Phase 1 parameter schema must leave a typed slot for source/citation metadata.

</code_context>

<specifics>
## Specific Ideas

- The dynamic top-set definition (D-03) is the user's own framing: "include all
  the percentiles that have over 50% of total wealth ... today ~10%, next years
  only 1% and so on." Preserve this self-tightening behavior exactly.
- Real-basis decision is reinforced by the deferred cost-of-living idea — a
  survival-threshold overlay only makes sense against real (today's-money)
  wealth, which the engine already guarantees. Keep the door open; change
  nothing in Phase 1.

</specifics>

<deferred>
## Deferred Ideas

- **Cost-of-living / survival-threshold reference overlay** — a toggleable
  (off/on) informational reference line showing how much wealth/income is needed
  to "actually survive" (food, housing, etc.), for human context on the wealth
  numbers. **Not in v1 REQUIREMENTS.md.** New capability: needs its own sourced
  data basket (Phase 2-type sourcing) + visualization work (Phase 3-type) + a
  neutrality review (a "you need $X to survive" line carries framing risk under
  NEUT-01). Candidate for the roadmap backlog / a v2 requirement. Not acted on in
  Phase 1; engine's real-basis invariant already keeps it feasible later.
- **User-as-test-particle, basis-enforcement mechanism, param schema & source
  field** — surfaced as candidate gray areas but not discussed. Left to
  researcher/planner discretion (see Claude's Discretion); recorded so they are
  not silently dropped. Default expectation: the user is a tracked trajectory
  that reads the distribution curve but does not perturb the aggregate/anchors
  (negligible single-saver mass) — confirm during planning.

</deferred>

---

*Phase: 1-model-foundation*
*Context gathered: 2026-05-15*
