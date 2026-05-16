# Phase 1: Model Foundation - Research

**Researched:** 2026-05-15
**Domain:** Deterministic numerical wealth-projection engine (functional core, no UI/IO) — TypeScript + Vitest, lognormal+Pareto distribution math, asset-price-inflation drag coupling
**Confidence:** HIGH (architecture, stack, pitfalls, test design — all backed by project research docs + verified npm registry); MEDIUM (specific distribution-calibration numerics — math is standard but the exact lognormal+Pareto stitching is a design choice this phase must lock)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Drag coupling (asset-price-inflation)**
- **D-01:** Drag is a single scalar real-return haircut applied once to every tier's growth per year. Conceptual story: top-tier aggregate compounding bids up an asset-price index; the haircut is the part of price appreciation not backed by a tier's own productive return. Never a transfer/redistribution; non-conservation is a tested invariant.
- **D-02:** Driver formula: `assetInflation_n = dragStrength × (aggregate wealth-growth rate of the dynamic top set in year n)`. Linear in `dragStrength`; `dragStrength = 0` ⇒ exact collapse to independent per-tier baseline.
- **D-03:** Dynamic top set (not a hardcoded cutoff): each year the "top" is the smallest group of top percentiles whose cumulative-from-top wealth = 50% of total wealth, evaluated as the exact interpolated percentile on the continuous distribution curve (D-04). Self-tightening as concentration rises (≈top 10% early → top 1% → top 0.1% later). No discrete whole-tier stepping (rejected — meaningless chart kinks).

**Distribution representation**
- **D-04:** Wealth distribution modeled as a continuous parametric curve: lognormal body + Pareto upper tail, calibrated to pass through the 4 sourced anchors (median / top10 / top1 / top0.1). The Pareto tail extrapolates analytically beyond top 0.1% — resolves the PROJECT.md "dynamic tail resolution" follow-up without a 5th hardcoded anchor.
- **D-05:** This single curve is the shared substrate for: the dynamic top-set 50% threshold (D-03), return-curve interpolation across percentiles, the user's moving-tier rate (D-06), and relative-position rank/share derivation.
- **D-06:** Evolution = endogenous annual re-fit (default). Track wealth at each of the 4 anchor percentiles year by year (each compounds at its own tier return minus drag); re-fit the lognormal+Pareto curve each year to those evolving points; re-read the user's percentile off the fresh curve each year so the user's return follows their moving tier (MODEL-02).
- **D-07:** Engine exposes a params-level switch `distributionEvolution`: `"endogenous"` (default, D-06) vs `"fixed-shape-scaled"` (calibrate shape once at year 0, only shift/scale). Engine supports both from day one; UI exposure is later/v2.

**Savings & inflation handling**
- **D-08:** Savings contribution is constant in real (today's-money) terms across the full horizon. No in-engine inflation parameter. (Implicitly assumes nominal savings rises with inflation.)
- **D-09:** Engine must support a maximum horizon of 60 years.

**Test rigor & correctness**
- **D-10:** Golden-master reference is both: (a) a drag-off single-tier analytic closed form (compound interest + ordinary-annuity) for the long-horizon tolerance criterion, and (b) a small hand-derived multi-tier fixture (2–3 tiers, ~5y, drag on, including re-fit + dynamic top set) for the coupling pipeline.
- **D-11:** Documented relative-error tolerance: < 1e-9 vs the drag-off analytic reference over the 60-year max horizon.
- **D-12:** Required invariant tests (synthetic fixtures): drag=0 ⇒ independent per-tier baseline; non-conservation (no tier's loss equals another's gain); infinite-growth preserved (no tier forced to negative real wealth by drag alone); long-horizon floating-point stability; basis-mismatch test fails (MODEL-05).

### Claude's Discretion

- **Savings timing:** end-of-year ordinary-annuity convention (`W_{n+1} = W_n·(1+r) + S`) — chosen so the analytic golden-master reference stays exact.
- **Basis-enforcement mechanism** (branded TS types vs runtime-tagged basis field vs Zod) — researcher/planner choice; requirement (a nominal/real mismatch is a hard test failure, MODEL-05) is fixed, mechanism is open.
- **Parameter object shape** (`{value, basis, source, note}`-style) and how "source present" structure is represented while values are synthetic placeholders — open; structure must be Phase-2-ready.
- **Module layout** — follow ARCHITECTURE.md (`core/` with engine/tiers/drag/relativePosition/types) unless planner finds reason to deviate.

### Deferred Ideas (OUT OF SCOPE)

- **Cost-of-living / survival-threshold reference overlay** — not in v1; needs own sourcing + viz + neutrality review. Engine's real-basis invariant keeps it feasible later; change nothing in Phase 1.
- **User-as-test-particle / param-source-field exact shape** — default expectation: the user is a tracked trajectory that reads the distribution curve but does NOT perturb the aggregate/anchors (negligible single-saver mass). Confirm during planning.
- Real cited defaults (Phase 2), selectors/derive layer, charts, state/URL, any UI.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MODEL-01 | Pure, framework-free, deterministic engine `(inputs, params) → results`, no UI/IO | Functional-core/imperative-shell pattern (ARCHITECTURE.md); `core/` zero-framework-import boundary enforced by lint + a test that scans imports. Determinism = no `Date.now`/`Math.random`/`fetch`. |
| MODEL-02 | Return = f(wealth percentile/tier), heterogeneous curve; user's trajectory uses moving-tier rate | Continuous lognormal+Pareto curve (D-04/D-05); monotone-interpolated return-by-percentile function; user percentile re-read off the re-fitted curve each year (D-06). |
| MODEL-03 | Engine projects full distribution across all tiers (not just user line) | Track 4 anchor wealth trajectories + the continuous curve each year; relative-position derived from cumulative-share integral of the curve. |
| MODEL-04 | Drag from aggregate top-tier growth applied as real-return haircut; drag=0→baseline, non-conservation, no zero-sum | D-01/D-02/D-03 scalar-haircut identity; Pitfalls 3 & 4 give the exact invariants to test. |
| MODEL-05 | Nominal/real basis is an explicit schema-level invariant through every computation | Branded-type or tagged-field basis mechanism (Claude's Discretion); a deliberate basis-mismatch must fail compilation or a test. |
| MODEL-06 | Numerical unit tests with citeable synthetic fixtures (drag-zero, non-conservation, infinite-growth, long-horizon FP stability) | Golden-master design (D-10/D-11/D-12): analytic closed-form reference + hand-derived multi-tier fixture; Vitest 3. |
</phase_requirements>

## Summary

Phase 1 is a **pure numerical-correctness phase**: a framework-free TypeScript `core/` library that, given `(inputs, params)`, deterministically produces year-by-year per-tier wealth with a heterogeneous return curve, a scalar asset-price-inflation drag, and relative-position derivation — all proven against analytic references to <1e-9 relative error. There is **no UI, no I/O, no real data**. The risk surface is entirely *epistemic and numerical* (PITFALLS.md is unambiguous: security/scale risks are near-zero; the rewrite-causing failures are getting the drag identity, the nominal/real basis, or the distribution math wrong). All four highest-severity pitfalls (P1 nominal/real, P3 drag double-count, P4 zero-sum, P10 floating-point) are assigned to *this* phase, so the test suite is the deliverable as much as the engine is.

The stack is locked by CLAUDE.md and verified against the npm registry: TypeScript 5.9.3, Vitest 3.2.4, plain IEEE-754 `number` math (no decimal libraries — the model computes rates/multipliers, not cent-accurate ledgers; round only at display, which is out of scope here anyway). The architecture is locked by ARCHITECTURE.md: functional core / imperative shell, `core/{engine,tiers,drag,relativePosition,types}.ts` with zero framework imports, params injected (never fetched). The savings convention is locked to end-of-year ordinary annuity (`W_{n+1} = W_n·(1+r) + S`) specifically so the closed-form golden master stays exact.

The one genuinely open *design* problem this phase must close is the **distribution layer**: stitching a lognormal body to a Pareto upper tail, calibrating both to 4 percentile anchors, and computing the **cumulative-wealth-share-from-the-top** function in closed form so the "dynamic top set = smallest top group holding 50% of total wealth" (D-03) is an exact interpolated percentile, not a bucketed approximation. The Pareto tail has clean closed forms for both the quantile and the top-share integral; the lognormal body uses the standard erf-based CDF/quantile. The two pieces must be stitched continuously (C0 at minimum; C1 in density is desirable to avoid a kink that would later show as a chart artifact). This is the single component most worth a small dedicated spike before the engine loop is written.

**Primary recommendation:** Build strictly bottom-up in this order: (1) `types.ts` with the branded-basis invariant; (2) the distribution module (lognormal+Pareto calibration + quantile + closed-form top-share + monotone return-by-percentile) with its *own* numerical unit tests against hand-computed Pareto values; (3) `tiers.ts` per-tier compounding with the ordinary-annuity convention; (4) `drag.ts` scalar-haircut coupling; (5) `relativePosition.ts`; (6) `engine.ts` orchestrating the annual loop with endogenous re-fit; (7) the golden-master + invariant test battery. Verify each layer's math against a closed form before composing the next. The walking-skeleton slice for a library-only phase = the thinnest `(inputs, params) → ProjectionResult` path exercised by one drag-off single-tier test that matches the analytic annuity formula exactly.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Year-by-year per-tier compounding | Model Core (`core/tiers.ts`) | — | Pure deterministic math; the product's #1 constraint lives here |
| Heterogeneous return-by-percentile curve | Model Core (`core/` distribution module) | — | Return = f(curve position); MODEL-02 |
| Asset-price-inflation drag coupling | Model Core (`core/drag.ts`) | — | Highest-risk math (P3/P4); must be isolated + unit-tested |
| Continuous wealth distribution (lognormal+Pareto) | Model Core (`core/` distribution module) | — | Shared substrate for D-03/D-05/D-06; pure analytic |
| Dynamic top-set (50% cumulative share) | Model Core (distribution module + engine) | — | Closed-form cumulative-share inversion on the curve |
| Relative-position / wealth-share derivation | Model Core (`core/relativePosition.ts`) | — | MODEL-03; derived from the curve's share integral |
| Nominal/real basis invariant | Model Core (`core/types.ts`) | (compiler / Vitest) | MODEL-05; type-system or test enforces it |
| Parameter injection (synthetic now, cited Phase 2) | Composition root / test harness | — | Core never imports data (ARCHITECTURE.md boundary) |
| UI / state / selectors / charts | **OUT OF SCOPE** (Phases 3–5) | — | Explicitly excluded by phase boundary |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.9.3 | Engine + numerical model language | Locked by CLAUDE.md (TS 5.9.x). Static types catch percentile→rate and basis (nominal/real) errors that would silently corrupt projections. `[VERIFIED: npm registry]` latest 5.9.x is 5.9.3 |
| Vitest | 3.2.4 | Unit + golden-master numerical tests | Locked by CLAUDE.md (Vitest 3.x). Latest 3.x is 3.2.4. Native ESM/TS, zero extra config for a pure-TS lib. `[VERIFIED: npm registry]` |
| Plain `number` (IEEE-754) | n/a (language) | All model arithmetic | CLAUDE.md "What NOT to Use" explicitly forbids decimal.js/big.js — model is rates/multipliers, not cent ledgers; doubles are correct and faster. PITFALLS.md P10 agrees decimal libs are over-engineering here. `[CITED: CLAUDE.md]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitest/coverage-v8 | 3.2.4 | Coverage of the correctness-critical core | Recommended: a correctness-first engine should report coverage so untested branches in drag/distribution math are visible. `[VERIFIED: npm registry]` (matches Vitest version) |
| tsx | 4.22.0 | Run ad-hoc TS reference scripts (e.g., compute golden-master fixture values) outside Vitest | Optional dev aid for generating/printing hand-derived fixture expected values. Not a runtime dep. `[VERIFIED: npm registry]` |
| fast-check | 4.8.0 | Property-based tests for invariants (monotonicity of return curve, drag=0 collapse, non-conservation) | Optional but high-value: invariants like "drag↑ ⇒ divergence↑ monotonically" and "return curve strictly monotone in percentile" are naturally property-based. Use for invariant families, keep golden-master as explicit example tests. `[ASSUMED]` (well-known library; not mandated by CLAUDE.md — planner should confirm adding a dep is acceptable for a solo tool) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Branded TS types for basis | Runtime-tagged `{basis: 'real'\|'nominal'}` field + assertion helper | Branded types make a mismatch a *compile* error (strongest, zero runtime cost) but cannot be asserted by a runtime test "fails" the way MODEL-05's "a test fails if a value of one basis is consumed where the other is expected" implies. **Recommended hybrid:** branded compile-time type *plus* a thin runtime `assertReal()` guard at the engine boundary so there is both a type error and a testable runtime failure. See Pattern 2. |
| Branded TS types | Zod schema with `.brand()` | Zod adds a dependency and runtime parse cost for what is an internal invariant (no untrusted input in Phase 1 — no UI/IO). Defer Zod to the input/URL boundary (Phase 4). CLAUDE.md lists Zod only for the user-input boundary. |
| fast-check property tests | Pure example-based Vitest tests only | Example tests are sufficient for the locked invariants (D-12); property tests add coverage of the *space* but also a dependency. Acceptable to ship Phase 1 with example tests only and add fast-check if an invariant proves hard to pin with examples. |
| Manual lognormal CDF (erf) | jStat / simple-statistics | Adds a dependency for ~15 lines of an Abramowitz-Stegun erf approximation. For one distribution a hand-rolled, unit-tested erf is leaner and keeps `core/` dependency-free (aligns with the zero-framework-imports spirit). See Don't-Hand-Roll caveat. |

**Installation:**
```bash
npm install -D typescript@5.9.3 vitest@3.2.4 @vitest/coverage-v8@3.2.4 tsx@4.22.0
# optional, if planner approves a property-testing dep:
npm install -D fast-check@4.8.0
```

**Version verification:** All four core dev deps verified live against the npm registry on 2026-05-15: `typescript` latest-5.9.x = **5.9.3**, `vitest` latest-3.x = **3.2.4**, `@vitest/coverage-v8` latest-3.x = **3.2.4**, `tsx` = **4.22.0**, `fast-check` = **4.8.0** (last modified 2026-05-11). Node present locally is v25.9.0 (npm 11.12.1) — comfortably above Vitest 3 / TS 5.9 minimums.

## Package Legitimacy Audit

> slopcheck could not be installed in this environment (`pip install slopcheck` produced no binary). Per protocol, every recommended package is therefore tagged `[ASSUMED]` and the planner MUST gate each install behind a `checkpoint:human-verify` task — even though all are extremely well-known. Registry existence was confirmed via `npm view` (necessary, not sufficient).

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| typescript | npm | ~12 yrs | ~70M/wk | github.com/microsoft/TypeScript | unavailable | Approved — mandated by CLAUDE.md, first-party Microsoft |
| vitest | npm | ~3 yrs | ~10M/wk | github.com/vitest-dev/vitest | unavailable | Approved — mandated by CLAUDE.md |
| @vitest/coverage-v8 | npm | ~3 yrs | high (Vitest org) | github.com/vitest-dev/vitest | unavailable | Approved — same monorepo as Vitest |
| tsx | npm | ~3 yrs | ~5M/wk | github.com/privatenumber/tsx | unavailable | Approved — optional dev aid |
| fast-check | npm | ~8 yrs | high | github.com/dubzzz/fast-check | unavailable | Flagged — optional; planner adds checkpoint before adding the dep |

**Packages removed due to slopcheck [SLOP] verdict:** none (slopcheck unavailable; none suspected — all are flagship ecosystem tools verified via `npm view` with known first-party GitHub repos)
**Packages flagged as suspicious [SUS]:** none. fast-check flagged only because it is *optional and not mandated by CLAUDE.md* — planner should insert a `checkpoint:human-verify` before adding it, not because legitimacy is in doubt.

## Architecture Patterns

### System Architecture Diagram

```
              synthetic params (test harness / composition root — NOT imported by core)
                              │
                              ▼
        inputs ──►  projectionEngine(inputs, params)            [pure · deterministic · no DOM/fetch]
                              │
                              ▼  year 0 calibration
        ┌─────────── distribution.calibrate(4 anchors) ──► {lognormalParams, paretoParams, stitchPoint}
        │                     │
        │   FOR year n = 0 .. horizon (≤60):
        │     ┌───────────────┴────────────────────────────────────────────┐
        │     │ 1. dynamicTopSet: invert cumulativeShareFromTop(curve)=0.50 │  (D-03, closed-form)
        │     │        ▼                                                    │
        │     │ 2. aggTopGrowth = wealth-growth rate of that top set        │  (D-02)
        │     │        ▼                                                    │
        │     │ 3. assetInflation_n = dragStrength × aggTopGrowth           │  (D-01/D-02 — scalar)
        │     │        ▼                                                    │
        │     │ 4. for each anchor tier: realReturn_t − assetInflation_n    │  (haircut, applied ONCE)
        │     │        ▼                                                    │
        │     │ 5. compound anchor wealth: W' = W·(1+r_eff) + S  (ordinary  │  (tiers.ts; D-08 real S)
        │     │        ▼                                              annuity)│
        │     │ 6. re-fit curve to evolved 4 anchors (endogenous)  OR        │  (D-06 / D-07 switch)
        │     │    shift-scale fixed shape (fixed-shape-scaled)             │
        │     │        ▼                                                    │
        │     │ 7. re-read user percentile off fresh curve → user tier rate │  (MODEL-02 moving tier)
        │     │        ▼                                                    │
        │     │ 8. snapshot(tiers, userWealth, topSetPercentile, year)      │
        │     └─────────────────────────────────────────────────────────────┘
        │                     │
        ▼                     ▼
   relativePosition.deriveShares(series)  ──►  ProjectionResult { series[], relativePosition[] }
                              │
                              ▼
                  consumed by Phase 3 selectors (NOT this phase)
```

Trace the primary use case: a single `(inputs, params)` call calibrates the curve at year 0, then iterates the 8-step annual block to `horizon`, then derives shares — returning one typed `ProjectionResult`. With `dragStrength = 0`, steps 1–4 produce `assetInflation_n = 0` and step 5 collapses exactly to independent per-tier annuity compounding (the closed-form golden master, D-02/D-10).

### Recommended Project Structure
```
src/
└── core/                       # ZERO framework/DOM/fetch imports — lint + test enforced
    ├── types.ts                # Inputs, Params, Basis (branded), TierTimeSeries, ProjectionResult
    ├── distribution.ts         # lognormal+Pareto: calibrate / quantile / cdf /
    │                           #   cumulativeShareFromTop (closed form) / returnAtPercentile
    ├── tiers.ts                # per-tier ordinary-annuity compounding
    ├── drag.ts                 # scalar asset-price-inflation haircut (D-01/D-02)
    ├── relativePosition.ts     # wealth-share / rank derivation from the curve
    ├── engine.ts               # projectionEngine(inputs, params): the annual loop
    └── __tests__/
        ├── distribution.test.ts        # vs hand-computed Pareto/lognormal values
        ├── goldenMaster.test.ts        # drag-off single-tier vs analytic annuity (<1e-9, 60y)
        ├── multiTierFixture.test.ts    # hand-derived 2–3 tier, ~5y, drag-on
        ├── invariants.test.ts          # drag=0 baseline / non-conservation / infinite-growth
        ├── basis.test.ts               # MODEL-05: basis-mismatch must fail
        └── numericalStability.test.ts  # 60y FP-stability
```
> Note: ARCHITECTURE.md prescribes `core/` at `src/core/`; only `src/core/` (and a Vitest/TS config) exists after Phase 1. `distribution.ts` is added vs the ARCHITECTURE.md sketch because D-04/D-05 make the continuous curve a first-class shared substrate — this is the "reason to deviate" the CONTEXT.md module-layout discretion anticipates.

### Pattern 1: Functional Core, Imperative Shell (locked by ARCHITECTURE.md)
**What:** All numerical logic in pure functions `(inputs, params) → results`; no framework, DOM, fetch, `Date.now`, or `Math.random` anywhere in `core/`.
**When to use:** Always here — correctness is the #1 constraint; this is what makes the engine provable in isolation.
**Example:**
```typescript
// core/engine.ts — Source: ARCHITECTURE.md Pattern 1 (adapted to D-03/D-06)
export function projectionEngine(inputs: Inputs, params: Params): ProjectionResult {
  let curve = calibrateCurve(params.anchors);          // year 0
  let anchorWealth = initAnchorWealth(params.anchors);
  const series: YearSnapshot[] = [];
  for (let year = 0; year <= params.horizon; year++) {
    const topSet = dynamicTopSet(curve);               // invert cumShareFromTop = 0.5  (D-03)
    const aggTopGrowth = topSetGrowthRate(anchorWealth, topSet, params);
    const assetInflation = params.dragStrength * aggTopGrowth;          // D-02 (scalar, once)
    anchorWealth = stepAnchors(anchorWealth, params, assetInflation, inputs); // D-01/D-08
    curve = params.distributionEvolution === 'endogenous'
      ? refitCurve(anchorWealth)                        // D-06
      : shiftScale(curve, anchorWealth);                // D-07 fixed-shape-scaled
    const userPct = curve.percentileOf(userWealthAt(series, inputs));   // MODEL-02 moving tier
    series.push(snapshot(anchorWealth, curve, userPct, year));
  }
  return { series, relativePosition: deriveShares(series) };
}
```

### Pattern 2: Branded Basis Invariant (recommended for MODEL-05 — Claude's Discretion)
**What:** A nominal value and a real value are *distinct types* at compile time, plus a runtime guard at the engine boundary so a deliberate mismatch produces a *testable* failure (MODEL-05 wording requires "a test fails").
**When to use:** Every parameter and every intermediate wealth/return quantity.
```typescript
// core/types.ts
declare const BasisTag: unique symbol;
export type Real<T = number>    = T & { readonly [BasisTag]: 'real' };
export type Nominal<T = number> = T & { readonly [BasisTag]: 'nominal' };

export const asReal    = (x: number): Real    => x as Real;
export const asNominal = (x: number): Nominal => x as Nominal;

// Runtime guard so MODEL-05's "a test fails" is satisfiable, not only compile-time:
export function assertReal(p: { basis: 'real' | 'nominal' }, ctx: string): void {
  if (p.basis !== 'real') throw new Error(`Basis violation in ${ctx}: expected real, got ${p.basis}`);
}
// Param objects carry a runtime basis tag too (Phase-2-ready shape):
export interface SourcedParam {
  value: number;
  basis: 'real' | 'nominal';
  source: string | null;   // synthetic placeholders => null; Phase 2 fills real citation
  note?: string;
}
```
The engine accepts only `Real<number>` internally; the boundary calls `assertReal` so `basis.test.ts` can feed a `nominal` param and assert a thrown error. This satisfies both the type-level and the test-failure halves of MODEL-05.

### Pattern 3: Closed-Form Cumulative-Share-From-Top (enables D-03 exact interpolated top set)
**What:** The dynamic top set needs the *smallest top fraction p whose members hold 50% of total wealth*. With a Pareto upper tail (index α > 1, scale x_m), the share of total wealth held by the top fraction q (the top q quantile and above) has a clean closed form; the lognormal body's partial expectation uses the standard `Φ` shift identity. Compute total wealth and "wealth above quantile w" analytically, then invert `cumShareFromTop(p) = 0.5` with monotone bisection (the share function is strictly monotone in p, so bisection converges to the exact interpolated percentile — no bucket stepping, satisfying D-03's "no discrete whole-tier stepping").
**Why closed form, not summation over tiers:** D-03 explicitly rejects discrete whole-tier stepping ("meaningless chart kinks"). PITFALLS.md P10 warns iterative summation also risks FP error; closed-form partial expectations avoid both.
**Key formulas (standard, verify in `distribution.test.ts`):**
- Pareto(α, x_m), α > 1: mean above threshold w (≥ x_m) and tail mass `P(X>w) = (x_m/w)^α`; share of total wealth above w has the well-known closed form (the "top 20%→80%" family). `[CITED: en.wikipedia.org/wiki/Pareto_distribution]`
- Lognormal(μ, σ): `E[X · 1{X≤w}] = e^{μ+σ²/2} · Φ((ln w − μ − σ²)/σ)` — standard partial-expectation identity used for the body's contribution. `[CITED: standard lognormal partial-expectation identity; en.wikipedia.org/wiki/Log-normal_distribution]`
- Stitch the body and tail at a calibrated quantile so the CDF is continuous (C0). Aim for matching density (C1) at the stitch to avoid a kink that would surface as a chart artifact in Phase 3.

### Pattern 4: Endogenous Re-fit vs Fixed-Shape-Scaled (D-06/D-07)
**What:** Each year the 4 anchor wealth values evolve independently; the curve is re-derived from the 4 evolved points (`endogenous`, default) or its year-0 shape is only shifted/scaled (`fixed-shape-scaled`). The switch is a `Params` field; both code paths exist from day one but only `endogenous` is the tested default.
**Calibration is over-determined or exactly-determined:** 4 anchors → solve lognormal (μ, σ) from the body anchors and Pareto (α, x_m) from the upper anchors, with continuity at the stitch as the closing constraint. Document which anchors pin which parameters (e.g., median pins μ; median+top10 pin σ; top1+top0.1 pin α; continuity pins x_m). This mapping is a design decision the plan must lock and unit-test.

### Anti-Patterns to Avoid
- **Model logic outside `core/` pure functions** (ARCHITECTURE.md Anti-Pattern 1) — N/A risk here since there is no UI, but the import-boundary test must still exist so it stays true through Phase 3+.
- **Hard-coded magic constants in the engine** (Anti-Pattern 2 / PITFALLS P6) — all numbers arrive via `params`; even synthetic test values are `SourcedParam` objects (`source: null` placeholder), so Phase 2 only swaps values+citations, never the schema.
- **Drag as a finite-pie transfer** (Anti-Pattern 3 / PITFALLS P4) — never subtract one tier's gain from another's balance. Code-review checklist item: "Is any quantity conserved across tiers? If yes, it is wrong."
- **Double-counting the drag** (PITFALLS P3) — the haircut is applied exactly once per tier per year, in step 4 of the loop, derived from aggregate top growth — not also baked into the per-tier return inputs.
- **Iterative tier-summation for the 50% top set** — use the closed-form share inversion (Pattern 3), not a loop over discrete tiers (D-03 + P10).
- **Subtracting two large nearly-equal numbers in the drag formula** (PITFALLS P10) — keep the drag as `r_eff = r − assetInflation` (a small minus a small), never reconstruct it via differences of large compounded balances.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Compound-interest + savings reference | A bespoke iterative "reference" that re-implements the same loop | The textbook closed forms: future value `W0·(1+r)^n` + ordinary annuity `S·((1+r)^n − 1)/r` | A reference that shares the engine's loop structure can share its bug. The golden master MUST be an independent closed form (D-10). `[CITED: standard time-value-of-money formulae]` |
| Test framework / assertions / fp-closeness | Custom test runner or `Math.abs(a-b) < eps` helper sprinkled everywhere | Vitest 3 `expect(x).toBeCloseTo(...)` / explicit relative-error helper used uniformly | Vitest is mandated; one shared `relErr(actual, expected)` helper documented to the <1e-9 tolerance (D-11) keeps the criterion consistent and auditable |
| Decimal/arbitrary-precision arithmetic | Pull in decimal.js/big.js "to be safe" | Plain `number`; round only at display (out of scope here) | CLAUDE.md explicitly forbids it; PITFALLS P10 confirms it is over-engineering for rates/multipliers `[CITED: CLAUDE.md "What NOT to Use"]` |
| Normal CDF `Φ` / `erf` | A novel approximation | A single, *unit-tested* Abramowitz-Stegun (7.1.26) erf, OR a vetted micro-lib | ~15 lines, deterministic, keeps `core/` dependency-free. Hand-rolling is acceptable *only* with its own table-of-known-values test. `[ASSUMED]` (standard approximation; accuracy must be tested to the engine's tolerance) |

**Key insight:** The two things you must NOT hand-roll loosely are the **golden-master reference** (must be an independent textbook closed form, never a paraphrase of the engine loop) and the **fp-tolerance criterion** (one documented helper, not ad-hoc epsilons). Everything else in this phase is *intentionally* hand-built pure math — that is the deliverable — but each pure function needs its own against-known-values test before composition.

## Common Pitfalls

(Full analysis in `.planning/research/PITFALLS.md`; the four assigned to this phase, condensed:)

### Pitfall 1: Nominal/real conflation (PITFALLS P1 — HIGH, MODEL-05)
**What goes wrong:** A nominal figure is consumed where the engine expects real; long-horizon wealth overstated by the cumulative inflation factor (2x+ over 40y).
**Why:** No single variable forces the modeler to declare basis; sources mix conventions.
**How to avoid:** Branded basis types + runtime `assertReal` at the boundary (Pattern 2). Engine is real-only (D-08: savings constant in real terms, no in-engine inflation parameter). `basis.test.ts` feeds a nominal param and asserts failure.
**Warning signs:** Any param without a `basis` field; a nominal "7%" used directly; projections that "feel too good."

### Pitfall 2: Drag double-counting (PITFALLS P3 — HIGH, MODEL-04)
**What goes wrong:** Drag applied twice (once implicit in returns that already embed asset appreciation, once explicit) → lower tiers crushed to zero or the parameter becomes meaningless.
**How to avoid:** One explicit transformation, stated formula (D-01/D-02), applied once in loop-step 4. Unit-test: `dragStrength=0` ⇒ *exact* collapse to independent per-tier annuity baseline (bit-for-bit modulo <1e-9).
**Warning signs:** Removing the drag term not cleanly collapsing to baseline; lower tiers → negative real wealth under defaults.

### Pitfall 3: Accidental zero-sum / finite-pie model (PITFALLS P4 — HIGH, MODEL-04)
**What goes wrong:** Drag implemented as redistribution (top's gain subtracted from bottom) → total wealth conserved, violating an explicit Out-of-Scope boundary.
**How to avoid:** Non-conservation is a *tested invariant* (D-12): assert aggregate real wealth can grow while shares diverge, and that no tier's loss equals another's gain. No transfer function may exist in `drag.ts`.
**Warning signs:** Sum of tiers constant or only growing by exogenous savings; any function moving units between tiers.

### Pitfall 4: Floating-point accumulation over 60y (PITFALLS P10 — MODERATE, MODEL-06)
**What goes wrong:** Naive `w = w*(1+r)` loop over 60y × tiers drifts; catastrophic cancellation in the drag subtraction.
**How to avoid:** Compare the iterative engine to the closed form to <1e-9 relative error over the 60y max horizon (D-11). Structure drag as `r − assetInflation` (small−small), never as a difference of large compounded balances. Do NOT reach for a decimal library (over-engineering — P10 explicit).
**Warning signs:** Engine output diverging from closed-form hand-check beyond ~1e-9; drag math subtracting two large near-equal numbers.

### Pitfall 5: Distribution stitch kink (this-phase design risk, MEDIUM)
**What goes wrong:** Lognormal body and Pareto tail joined only C0 (continuous value, discontinuous density) → a slope kink at the stitch that, once Phase 3 renders the curve / relative-position chart, shows as an unexplained inflection (a "meaningless chart kink" — exactly what D-03 forbids for the top-set, and equally bad here).
**How to avoid:** Calibrate so density matches (C1) at the stitch quantile, or document and test the residual discontinuity is below a stated threshold. Add a `distribution.test.ts` case asserting continuity (and ideally C1) at the stitch.
**Warning signs:** Re-fit producing a non-monotone return-by-percentile curve; visible derivative jump at the stitch percentile.

## Runtime State Inventory

Not applicable — greenfield phase, no rename/refactor/migration. No stored data, live services, OS-registered state, secrets, or build artifacts exist (verified: repo contains only `.planning/`, `CLAUDE.md`, `README.md`, `LICENSE`, `.claude/`, `.git/` — no `src/`, no `package.json`, no `node_modules/`).

## Code Examples

### Closed-form golden master (drag-off single tier — D-10/D-11)
```typescript
// core/__tests__/goldenMaster.test.ts — independent textbook reference, NOT the engine loop
function analyticOrdinaryAnnuity(W0: number, r: number, S: number, n: number): number {
  // end-of-year ordinary annuity (Claude's Discretion convention)
  const growth = Math.pow(1 + r, n);
  const annuity = r === 0 ? S * n : S * (growth - 1) / r;
  return W0 * growth + annuity;
}
const relErr = (a: number, e: number) => Math.abs(a - e) / Math.max(Math.abs(e), 1e-12);

test('drag-off single tier matches analytic annuity to <1e-9 over 60y', () => {
  const params = makeSyntheticParams({ dragStrength: 0, horizon: 60 /* single-tier */ });
  const result = projectionEngine(syntheticInputs, params);
  const expected = analyticOrdinaryAnnuity(W0, r, S, 60);
  expect(relErr(result.series.at(-1)!.tierWealth.single, expected)).toBeLessThan(1e-9);
});
```

### Invariant: drag=0 ⇒ independent per-tier baseline (D-12, MODEL-04)
```typescript
test('dragStrength=0 collapses to independent per-tier compounding', () => {
  const withDrag0 = projectionEngine(inputs, withParams({ dragStrength: 0 }));
  for (const tier of TIERS) {
    const independent = analyticOrdinaryAnnuity(W0[tier], r[tier], S, params.horizon);
    expect(relErr(withDrag0.series.at(-1)!.tierWealth[tier], independent)).toBeLessThan(1e-9);
  }
});
```

### Invariant: non-conservation / no zero-sum (D-12, MODEL-04)
```typescript
test('aggregate real wealth is NOT conserved and grows; no transfer', () => {
  const r = projectionEngine(inputs, withParams({ dragStrength: 0.3 }));
  const total0 = sumTiers(r.series[0]), totalN = sumTiers(r.series.at(-1)!);
  expect(totalN).toBeGreaterThan(total0);                 // infinite growth preserved
  // more drag must NOT reduce aggregate nominal/real wealth (P4 warning sign)
  const heavier = projectionEngine(inputs, withParams({ dragStrength: 0.6 }));
  // no tier's loss equals another's gain: pairwise deltas don't net to zero by construction
  expect(sumTiers(heavier.series.at(-1)!)).toBeGreaterThan(total0);
});
```

### Basis invariant must fail (D-12, MODEL-05)
```typescript
test('consuming a nominal param where real is expected throws', () => {
  const bad = withParams({ /* a return param tagged */ basis: 'nominal' });
  expect(() => projectionEngine(inputs, bad)).toThrow(/Basis violation/);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat 7% real-return assumption | Heterogeneous return-by-percentile curve | Project thesis (Fagereng 2020 et al.) | The entire point — engine return is `f(curve position)`, not a scalar |
| Discrete wealth buckets / fixed top-x% cutoff | Continuous lognormal+Pareto curve with dynamic 50%-share top set | Locked D-03/D-04 | No chart kinks; tail extrapolates analytically (resolves PROJECT.md "dynamic tail resolution" follow-up without a 5th anchor) |
| Decimal libraries "for safety" in finance JS | Plain `number`, round at display | CLAUDE.md decision | Correct for rates/multipliers; faster; less bundle (display rounding is out of scope this phase) |
| Vitest 2 / TS 5.x earlier | Vitest 3.2.4 / TS 5.9.3 | Verified 2026-05-15 | Stay within CLAUDE.md-locked majors (Vitest 3.x, TS 5.9.x); do NOT jump to TS 6 / Vitest 4 (registry latest, but outside locked majors) |

**Deprecated/outdated:**
- Treating Fagereng's "~18pp" as a per-tier *rate* gap — PITFALLS P2 (Phase 2 concern, but flagged: no single hardcoded "18" anywhere in the engine even as a synthetic placeholder; synthetic anchors should be obviously-synthetic round numbers).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Hand-rolled Abramowitz-Stegun erf is accurate enough for the engine's <1e-9 tolerance | Don't Hand-Roll / Stack Alternatives | If A&S 7.1.26 (~1e-7 abs error) is insufficient, the lognormal CDF caps achievable precision below the <1e-9 golden-master tolerance — but note the <1e-9 criterion (D-11) is specifically the *drag-off single-tier* path, which uses pure annuity math and NOT the erf, so risk is contained. A higher-precision erf may still be needed for distribution tests. Planner should set a separate, looser documented tolerance for distribution-math tests. |
| A2 | fast-check is acceptable to add as a dev dependency for a solo tool | Supporting stack | Low — purely additive; if rejected, example-based tests cover all D-12 invariants. Not on critical path. |
| A3 | Anchor→parameter mapping (median→μ, median+top10→σ, top1+top0.1→α, continuity→x_m) is well-posed | Pattern 4 | If the 4 anchors over- or under-determine the lognormal+Pareto pair, calibration may need least-squares or a different anchor assignment. Mitigated by making this a locked, unit-tested design decision early (recommend a spike). |
| A4 | C1 (density-matched) stitch is achievable with 4 anchors plus continuity | Pattern 3 / Pitfall 5 | If 4 anchors + C0 + C1 over-constrain, may only get C0; then the residual density jump must be bounded and documented rather than eliminated. Affects chart smoothness in Phase 3, not engine correctness. |
| A5 | User trajectory does not perturb the aggregate/anchors (negligible single-saver mass) | Phase boundary (CONTEXT deferred) | If the user *should* affect the distribution, the loop structure changes (user becomes a tracked anchor). CONTEXT.md flags this for planning confirmation — must be resolved before the engine loop is finalized. |

## Open Questions (RESOLVED)

> All three questions were resolved during planning and routed into executable tasks (plan-checker, iteration 1):
> - **Q1 (calibration/stitch)** → RESOLVED: Plan 01-02 is a dedicated distribution-calibration spike that locks the anchor→(μ,σ,α,x_m) assignment + stitch point in its `<interfaces>` and proves it against hand-computed anchors in `distribution.test.ts` before the engine loop.
> - **Q2 (tolerance scheme)** → RESOLVED: Two-tolerance scheme baked into 01-01/01-02 — `<1e-9` for the drag-off annuity golden master (D-11), `DIST_TOL=1e-6` for distribution-curve math.
> - **Q3 (user-as-test-particle)** → RESOLVED: Default "no perturbation" confirmed and asserted in Plan 01-03 (per CONTEXT.md deferred note).

1. **Anchor→(μ,σ,α,x_m) calibration well-posedness and the stitch point.**
   - What we know: lognormal CDF/quantile and Pareto quantile/top-share all have standard closed forms; 4 anchors + continuity is *roughly* the right number of constraints.
   - What's unclear: the exact assignment of anchors to parameters, whether the system is exactly-determined or needs least-squares, and where (which quantile) the body/tail stitch sits.
   - Recommendation: a small dedicated **spike/plan early in the phase** that locks the calibration scheme and proves it against hand-computed anchor values in `distribution.test.ts` *before* the engine loop is written. This is the highest-uncertainty design item.

2. **Achievable numerical tolerance for distribution math vs the <1e-9 annuity tolerance.**
   - What we know: D-11's <1e-9 is explicitly the drag-off single-tier *annuity* path (pure power/annuity math — easily achievable).
   - What's unclear: erf/quantile precision will not reach 1e-9 with a cheap approximation; the distribution tests need their own documented (looser) tolerance.
   - Recommendation: planner defines two tolerances — `<1e-9` for the closed-form annuity golden master (D-11, fixed), and a separate documented tolerance (e.g., `<1e-6`) for distribution-curve tests, justified by the chosen erf method.

3. **User-as-test-particle (A5).** Resolve the CONTEXT.md-deferred question — does the user perturb anchors? Default assumption is *no*. Must be confirmed before finalizing the loop.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest, tsx, TS toolchain | ✓ | v25.9.0 | — (well above Vitest 3 / TS 5.9 minimums) |
| npm | Installing dev deps | ✓ | 11.12.1 | — |
| TypeScript 5.9.x | Engine + type-level basis invariant | ✗ (not yet installed) | target 5.9.3 | none — must `npm install -D` (greenfield, no `package.json` yet) |
| Vitest 3.x | Numerical test suite | ✗ (not yet installed) | target 3.2.4 | none — must install |
| Internet / npm registry | One-time dependency install | ✓ (registry reachable; verified versions live) | — | — |

**Missing dependencies with no fallback:** None blocking — TS/Vitest simply need a first `npm install` (expected for a greenfield first phase; the plan's first task is project scaffold: `package.json`, `tsconfig.json`, `vitest.config.ts`).
**Missing dependencies with fallback:** None.

## Validation Architecture

> `workflow.nyquist_validation` is `true` in config — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 (verified npm registry) |
| Config file | none yet — created in Wave 0 (`vitest.config.ts`, `tsconfig.json`, `package.json`) |
| Quick run command | `npx vitest run core/__tests__/goldenMaster.test.ts` |
| Full suite command | `npx vitest run` (optionally `--coverage` via @vitest/coverage-v8) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MODEL-01 | `core/` has zero framework/DOM/fetch imports; engine pure & deterministic | unit (static import scan) | `npx vitest run core/__tests__/invariants.test.ts -t "no framework imports"` | ❌ Wave 0 |
| MODEL-02 | Return = f(percentile); user uses moving-tier rate | unit | `npx vitest run core/__tests__/distribution.test.ts` | ❌ Wave 0 |
| MODEL-03 | Full distribution projected; shares derivable | unit | `npx vitest run core/__tests__/multiTierFixture.test.ts` | ❌ Wave 0 |
| MODEL-04 | drag=0→baseline; non-conservation; infinite growth; no transfer | unit + property | `npx vitest run core/__tests__/invariants.test.ts` | ❌ Wave 0 |
| MODEL-05 | Basis mismatch fails | unit (+ type-level) | `npx vitest run core/__tests__/basis.test.ts` | ❌ Wave 0 |
| MODEL-06 | Engine vs closed-form <1e-9 over 60y; FP stability | unit (golden master) | `npx vitest run core/__tests__/goldenMaster.test.ts core/__tests__/numericalStability.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run core/__tests__/goldenMaster.test.ts` (fast, the load-bearing correctness gate)
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green + (recommended) coverage of `core/drag.ts` and the distribution module before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `package.json` + `tsconfig.json` (strict, `noUncheckedIndexedAccess`) + `vitest.config.ts` — greenfield scaffold; framework install `npm install -D typescript@5.9.3 vitest@3.2.4 @vitest/coverage-v8@3.2.4 tsx@4.22.0`
- [ ] `core/__tests__/goldenMaster.test.ts` — covers MODEL-06 (closed-form annuity reference)
- [ ] `core/__tests__/distribution.test.ts` — covers MODEL-02 (lognormal+Pareto vs hand-computed values)
- [ ] `core/__tests__/invariants.test.ts` — covers MODEL-04 + MODEL-01 import-scan
- [ ] `core/__tests__/basis.test.ts` — covers MODEL-05
- [ ] `core/__tests__/multiTierFixture.test.ts` — covers MODEL-03 (hand-derived 2–3 tier, drag-on, D-10b)
- [ ] `core/__tests__/numericalStability.test.ts` — covers MODEL-06 60y FP stability
- [ ] A shared `testUtils.ts`: `relErr`, `analyticOrdinaryAnnuity`, synthetic param/fixture builders

## Security Domain

> `security_enforcement` not set in config (treat as enabled); however this phase has an effectively null security surface — pure in-process numerical library, no UI, no I/O, no untrusted input, no network, no persistence (confirmed by PITFALLS.md "Security Mistakes": no accounts/backend/persistence; the only domain concern is not exfiltrating user inputs via analytics, which is a UI-phase concern, not Phase 1).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth anywhere in the product |
| V3 Session Management | no | Stateless, no sessions |
| V4 Access Control | no | No protected resources |
| V5 Input Validation | no (this phase) | No external input in Phase 1 (synthetic params only); user-input validation is Phase 4 (Zod at the boundary per CLAUDE.md) |
| V6 Cryptography | no | No secrets, no crypto |

### Known Threat Patterns for a pure numerical core

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Supply-chain (malicious dev dependency) | Tampering | Pin exact versions; legitimacy audit above; planner gates installs behind `checkpoint:human-verify` (slopcheck unavailable) |
| Non-determinism leaking in (`Date.now`/`Math.random`) | (correctness, not security) | Import-scan + determinism test in `invariants.test.ts` (MODEL-01) |

No further security work required for Phase 1; revisit at Phase 4 (user-input boundary) and Phase 5.

## Sources

### Primary (HIGH confidence)
- `.planning/research/ARCHITECTURE.md` — functional core/imperative shell, `core/` layout, engine sketch, drag data-flow, zero-import boundary (project research doc, read directly)
- `.planning/research/PITFALLS.md` — P1/P3/P4/P10 (the four Phase-1-assigned correctness landmines) with primary-literature backing (read directly)
- `./CLAUDE.md` — locked stack (TS 5.9.x, Vitest 3.x, plain `number`, no decimal libs), "What NOT to Use"
- `.planning/phases/01-model-foundation/01-CONTEXT.md` — D-01..D-12 locked decisions + Claude's Discretion
- npm registry via `npm view` (2026-05-15) — typescript 5.9.3, vitest 3.2.4, @vitest/coverage-v8 3.2.4, tsx 4.22.0, fast-check 4.8.0 (live verification)

### Secondary (MEDIUM confidence)
- en.wikipedia.org/wiki/Pareto_distribution — Pareto quantile/top-share closed forms (standard, cross-checked against MIT 14.999 Lecture 8 and stats.libretexts Pareto page)
- en.wikipedia.org/wiki/Log-normal_distribution — lognormal CDF/quantile and partial-expectation identity (standard)
- MIT 14.999 Topics in Inequality Lecture 8; Blanchet/Fournier/Piketty "Generalized Pareto Curves" (WID.world) — top-share-by-quantile derivation via quantile-function integration (corroborates Pattern 3)

### Tertiary (LOW confidence — flagged for spike validation)
- The exact 4-anchor → (μ,σ,α,x_m) + stitch-point assignment (Open Question 1 / A3/A4) — no single authoritative recipe found; standard pieces exist but the specific stitching is a design choice this phase must lock and unit-test.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — locked by CLAUDE.md, every version live-verified against npm registry
- Architecture: HIGH — fully specified in ARCHITECTURE.md (project research doc); only deviation (`distribution.ts`) is justified by D-04/D-05
- Pitfalls: HIGH — PITFALLS.md backs each with primary literature; the 4 Phase-1 ones map 1:1 to D-12 test invariants
- Distribution calibration numerics: MEDIUM — component formulas are textbook-standard, but the 4-anchor stitch is a design decision requiring an early spike (Open Question 1)

**Research date:** 2026-05-15
**Valid until:** 2026-06-14 (stable domain — pure math + locked stack; only risk is TS 5.9.x / Vitest 3.x patch bumps within the locked majors)
