# Walking Skeleton — Assets Projection

**Phase:** 1
**Generated:** 2026-05-15

## Capability Proven End-to-End

> The smallest user-visible capability that exercises the full stack.

This is a **library-only phase** (CONTEXT.md Phase Boundary; ROADMAP goal: "no UI or I/O dependency"). The Walking Skeleton is therefore the engine itself, not a UI/DB/deploy stack:

**`projectionEngine(inputs, params)` accepts typed `(inputs, params)`, runs the year-by-year per-tier annual loop (heterogeneous returns + scalar asset-price-inflation drag + endogenous distribution re-fit + moving-tier user read + relative-position derivation), and returns a `ProjectionResult` whose drag-off single-tier path matches an independent analytic ordinary-annuity closed form within relative error < 1e-9 over the 60-year maximum horizon — proven by a passing numerical golden-master test.**

The "full stack" exercised: typed contracts (`types.ts`) → distribution substrate (`distribution.ts`) → compounding/drag/relative-position (`tiers.ts`/`drag.ts`/`relativePosition.ts`) → orchestration (`engine.ts`) → Vitest verification (golden master + D-12 invariant battery).

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Language | TypeScript 5.9.3 (strict, `noUncheckedIndexedAccess`) | Mandated by CLAUDE.md; static types catch percentile→rate and basis errors that silently corrupt projections |
| Test runner | Vitest 3.2.4 (+ @vitest/coverage-v8) | Mandated by CLAUDE.md; native ESM/TS, golden-master numerical assertions |
| Numeric type | Plain IEEE-754 `number`; round only at display | CLAUDE.md forbids decimal libs — model is rates/multipliers, not cent ledgers; faster, correct at this scale |
| Architecture | Functional core / imperative shell — `src/core/*.ts` pure, zero framework/DOM/fetch imports | ARCHITECTURE.md Pattern 1; correctness is the #1 constraint; engine provable in isolation |
| Module layout | `src/core/{types,distribution,tiers,drag,relativePosition,engine}.ts` + `src/core/__tests__/` | ARCHITECTURE.md layout + a `distribution.ts` deviation justified by D-04/D-05 (continuous curve is a first-class shared substrate) |
| Basis enforcement | Branded `Real`/`Nominal` types + runtime `assertReal` guard at the engine boundary | RESEARCH Pattern 2 — satisfies both the compile-time and the "a test fails" halves of MODEL-05 |
| Distribution model | Lognormal body + Pareto upper tail, calibrated to 4 anchors, closed-form cumulative-share-from-top | D-04; analytic tail extrapolation resolves the PROJECT.md "dynamic tail resolution" follow-up without a 5th anchor |
| Drag coupling | Single scalar real-return haircut = dragStrength × dynamic-top-set growth, applied once/tier/year | D-01/D-02; non-conservation, never a transfer (Pitfalls 3/4) |
| Savings convention | End-of-year ordinary annuity `W' = W·(1+r)+S`, S constant in real terms | Claude's Discretion (keeps the analytic golden master exact); D-08 |
| Params injection | Params/inputs passed in, never imported/fetched by core | ARCHITECTURE.md boundary; tests inject synthetic params; Phase 2 swaps real cited values |
| No deployment / no UI / no real data | Out of scope this phase | ROADMAP strict bottom-up: prove the model before anything renders |

## Stack Touched in Phase 1

- [x] Project scaffold (package.json, tsconfig strict, vitest.config.ts, lint via tsc) — Plan 01
- [x] One real "route": the `projectionEngine(inputs, params)` entry function — Plan 03
- [x] One real "read+write": year-by-year state evolution (anchor wealth re-fit each year) verified by golden master — Plan 03
- [x] One real interaction wired end-to-end: synthetic `(inputs, params)` → ProjectionResult, asserted numerically — Plan 03
- [x] "Deployment": documented local full-stack run command `npx vitest run` (and `--coverage`) exercising the whole engine — Plans 01–04
- [N/A] HTTP/DB/UI/auth deployment — explicitly deferred (library-only phase)

## Out of Scope (Deferred to Later Slices)

> Explicit — prevents later phases re-litigating Phase 1's minimalism.

- Real empirically-sourced cited default parameters and the build-enforced sourcing check (Phase 2)
- The `distributionEvolution: "fixed-shape-scaled"` path is implemented but only `"endogenous"` is the tested default (D-07; UI exposure is v2)
- Selectors / memoized derive layer (Phase 3)
- Charts, log/linear toggle, tooltips, citations UI (Phase 3)
- State store, URL serialization, 2-input UI shell, responsive layout (Phase 4)
- Neutrality style guide + copy review (Phases 3 & 5)
- Cost-of-living / survival-threshold overlay (Deferred Idea — engine's real-basis invariant keeps it feasible later; nothing built now)
- fast-check property tests (optional; example-based tests cover all D-12 invariants — RESEARCH A2)
- Decimal/arbitrary-precision arithmetic (CLAUDE.md forbids; over-engineering per Pitfall 10)
- A 5th (top 0.01%+) distribution anchor — PROJECT.md "dynamic tail resolution" follow-up; resolved analytically by the Pareto tail, revisit only if Phase 2 calibration demands

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this engine skeleton without altering its architectural decisions:

- **Phase 2:** Replace synthetic params with frozen, citation-annotated real defaults; build check rejects any parameter lacking a complete source record (the `SourcedParam` slot already exists).
- **Phase 3:** Memoized selectors shape engine output into three neutral chart types + linear/log toggle + tooltips + citations + neutrality style guide.
- **Phase 4:** 2-input responsive UI shell with instant debounced recompute, horizon control, real/nominal toggle, summary readout — wraps the proven engine.
- **Phase 5:** Neutrality review gate over all shipped copy and chart semantics.
