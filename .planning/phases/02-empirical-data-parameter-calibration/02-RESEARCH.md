# Phase 2: Empirical Data & Parameter Calibration - Research

**Researched:** 2026-05-16
**Domain:** Empirical economics calibration + machine-checkable sourcing invariant for a deterministic numerical core (TS 5.9 strict / Vitest 3, functional core)
**Confidence:** HIGH (primary economic figures cross-verified vs PITFALLS.md HIGH-confidence primary-source reads + independent WebSearch; code fix shapes verified directly against `src/core/distribution.ts` and `01-REVIEW.md`)

## Summary

This phase produces no new engine math. It (1) hardens two latent silent-failure bugs in `src/core/distribution.ts` before any real data is loaded, (2) evolves `SourcedParam.source: string|null` into a structured `SourceRecord`, (3) calibrates four real return-by-tier anchors + a drag strength from corrected primary literature, (4) adds a Vitest enforcement test that fails the build when any shipped default lacks a complete source record, and (5) adds a divergence sanity-check that runs on the real calibrated defaults. Every decision is locked in `02-CONTEXT.md` (D-01..D-12) — this research is prescriptive about *how*, not *whether*.

The single highest-risk artifact is **dragStrength**: it has no off-the-shelf derivation and its credibility rests entirely on a documented, reproducible back-solve procedure (D-07/D-08) targeting the McKinsey ~80% asset-inflation-share figure — not on the number itself. The single highest-risk *misreading* is the Fagereng "~18pp" shorthand: the engine must contain no literal `18`, and the corrected ~500bp-raw / ~10pp-net-of-tax framing must be traceable in PROJECT.md and in every anchor's source record. Both are explicitly locked decisions; the work is execution discipline, not investigation.

**Primary recommendation:** Sequence the phase strictly: (Wave A) CR-01/CR-02 guards + their failing tests FIRST, before any real data exists; (Wave B) `SourceRecord` type migration; (Wave C) calibrated `data/defaults.ts` + `data/sources.ts` with the corrected Fagereng framing + back-solved dragStrength + PROJECT.md correction; (Wave D) the sourcing-completeness enforcement test + divergence sanity-check + D-09 non-conservation re-assertion on real defaults. Wave A must merge green before any anchor numbers are written, because the guards are what make a bad calibration *fail loudly* instead of silently poisoning the curve.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Carried-forward preconditions (CR-01 / CR-02)**
- **D-01:** Fix BOTH latent bugs as the **first task of the phase, before any real empirical data is loaded**: (a) a root-bracketing guard in `bisect()` (CR-01), and (b) an `alpha > 1` domain assertion guarding `paretoConditionalMean` / the Pareto tail (CR-02).
- **D-02:** Guard failure behavior = **throw with a diagnostic message** naming the offending value, the violated bound, and the parameter (e.g. `alpha=0.94 ≤ 1 from top01/top1=12.3; Pareto mean undefined`). Fail-loud, consistent with `assertReal()`. No silent clamping.
- **D-03:** Calibration must keep Pareto **alpha > 1** (i.e. `top01/top1 < 10`) and the calibrated root must lie inside the validated bisect bracket — hard preconditions on the chosen anchor values.

**Return-anchor calibration**
- **D-04:** When literature gives a range or disagreeing figures, the frozen default per tier is the **central / midpoint estimate, triangulated across cited sources**. The source record documents the range it was drawn from.
- **D-05:** The **corrected Fagereng framing** (raw ~500bp / ~10pp net-of-tax association — NOT a flat 18pp per-tier gap) sizes the median→top **gradient**. Each of the 4 anchors is placed using triangulated tier-specific evidence (Bach 2020 leverage/systematic-risk, Saez-Zucman top-tail, Jordà-Schularick-Taylor asset base). **No literal "18" anywhere in the engine.**
- **D-06:** The PROJECT.md "~18pp gap" shorthand is **corrected within this phase** — the PROJECT.md Context bullet is rewritten to the corrected Fagereng framing. Each return anchor's source record records the **discarded 18pp misreading and why**.

**Drag-strength derivation**
- **D-07:** dragStrength is **back-solved from a historical baseline run**: run the engine over a 2000–2021-like baseline; choose dragStrength so the model's asset-inflation share of net-worth growth matches McKinsey **~80%**. Documented, reproducible procedure — not an asserted constant.
- **D-08:** Back-solve **target metric = McKinsey ~80% asset-inflation share of net-worth growth** over the baseline window. (The ~1.3× asset/GDP ratio is NOT the calibration target.)
- **D-09:** A **calibration test** runs the engine on real defaults at the back-solved dragStrength and re-asserts the Phase 1 D-12 invariants (non-conservation; infinite-growth preserved). No zero-sum / finite-pie artifact (Pitfall 4).

**Source-record schema & enforcement**
- **D-10:** Replace `SourcedParam.source: string | null` with a structured **`SourceRecord`**: **six required fields** — `sourceName`, `figureUsed`, `basis`, `definition`, `yearVintage`, `retrievedDate` — plus **optional `note`** (correction trail) and **optional `url`** (Phase 3 VIZ-06 footer link).
- **D-11:** DATA-04 enforcement = a **dedicated failing test in the existing Vitest suite + CI** that enumerates every model parameter in the frozen default set and fails if any required `SourceRecord` field is missing or empty. (Not type-only.)
- **D-12:** The sourcing gate targets **only the production frozen default parameter module**. Phase 1 test fixtures may keep synthetic source-less params.

### Claude's Discretion
- Exact `SourceRecord` field types (string vs structured `basis: 'real' | 'nominal'` reuse) — must keep the completeness test machine-checkable.
- Module/file layout of the frozen defaults (single `defaults.ts` vs grouped) — follow `core/`-adjacent functional-core structure from ARCHITECTURE.md; defaults are data, injected, never imported by `core/`.
- Precise shape of the divergence sanity-check (bound + horizon definition) — must run on the real calibrated defaults.
- Horizon default value within ENTRY-03's ~30–40y band — a UX default, not a sourced model parameter (DATA-04 does not apply); planner may set it.

### Deferred Ideas (OUT OF SCOPE)
- **Dynamic tail resolution** (top 0.01%+ anchor / adaptive tail) — keep 4 anchors; revisit only if real anchors show under-resolution. Not acted on here.
- **Cost-of-living / survival-threshold overlay** — own sourced basket; v2/backlog. Not in scope.
- **~1.3× asset/GDP ratio as a drag cross-check** — D-08 uses the ~80% share as the sole back-solve target; ~1.3× is at most an optional later sanity cross-check, not required this phase.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | Every default parameter stored with attached citation (source name, figure, year/vintage) in a single sourced-parameter data model | `SourceRecord` schema (Standard Stack §"SourceRecord shape"); single `data/defaults.ts` + `data/sources.ts` registry (Architecture Patterns Pattern 2) |
| DATA-02 | Return-by-tier anchors calibrated from primary literature with corrected interpretations (Fagereng raw ~500bp / ~10pp net-of-tax — NOT flat 18pp; Bach; Saez-Zucman; JST) | Calibration procedure §"Return-anchor triangulation"; verified figures in Code Examples; Pitfall 1 (mis-applied Fagereng gap) |
| DATA-03 | Asset-price-inflation drag magnitude grounded in defensible cited figure (McKinsey ~80%; Piketty r>g) without implying finite-pie transfer | Back-solve procedure §"dragStrength back-solve"; D-09 non-conservation re-assertion; Pitfall 2 |
| DATA-04 | Engine rejects/refuses any parameter lacking a source record (enforced invariant) | Vitest enforcement-test pattern §"Don't Hand-Roll" + Code Examples §"Sourcing-completeness test"; mirrors `assertReal` test-as-enforcement precedent |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CR-01 bisect bracket guard | Model Core (`src/core/distribution.ts`) | — | Pure numeric solver; fail-loud belongs where the math is, beside `assertReal` |
| CR-02 alpha>1 domain assertion | Model Core (`calibrateCurve` in `distribution.ts`) | — | Calibration is the only place α is derived; guard at derivation site |
| `SourceRecord` type contract | Model Core (`src/core/types.ts`) | Data module | Public export contract consumed by Phase 3 VIZ-06; lives with the other type contracts |
| Frozen default parameter values | Data module (`src/data/`) | — | Empirical constants, injected into core, never imported by `core/` (ARCHITECTURE boundary) |
| Citation registry | Data module (`src/data/sources.ts`) | — | Single source of truth for value↔citation pairing |
| dragStrength back-solve procedure | Test / tooling (Vitest) | Data module | The procedure derives the number; the derived number is then frozen in the data module with its derivation recorded in `note` |
| Sourcing-completeness enforcement | Test (Vitest + CI) | — | Test-as-enforcement precedent (`assertReal`, D-12 invariant battery) |
| Divergence sanity-check | Test (Vitest) | Model Core | Runs the real engine on real defaults; an assertion on engine output, not new engine logic |
| Horizon default | Data / config (UX default) | — | Not a sourced model parameter (DATA-04 excludes it per D-12 discretion) |

## Standard Stack

This phase adds **zero runtime dependencies**. The entire stack already exists in `package.json`.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.9.3 | `SourceRecord` type contract, branded basis reuse | Already installed; strict mode is the project invariant carrier `[VERIFIED: package.json]` |
| Vitest | 3.2.4 | Guard tests, sourcing-completeness enforcement test, divergence sanity-check, drag back-solve harness | Already the test runner; test-as-enforcement is the established project pattern `[VERIFIED: package.json]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | — | No new packages. Zod is listed in CLAUDE.md as a *boundary-validation* option but is NOT installed and is NOT needed here: D-11 mandates a **named failing Vitest test**, not a schema validator, and the data module is build-time-frozen, not a runtime input boundary. Introducing Zod here would add a runtime dependency to a pure-core project for zero benefit. `[ASSUMED]` (judgement; A1) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest enumeration test (D-11) | TypeScript "all fields required" type only | Rejected by D-11 explicitly: a type error is less self-explanatory than a named failing test, and an empty-string `""` satisfies a `string` type but is not a valid citation. Type + test is fine; type *only* is non-compliant. |
| Hand-rolled deep "non-empty" check | Zod schema | Rejected: adds a runtime dep to a framework-free core for a build-time data file; a ~15-line recursive non-empty assertion in the test is simpler and has no dependency cost. |

**Installation:** None.

**Version verification:**
```bash
# Verified from package.json (no registry call needed — nothing new installed)
typescript 5.9.3 · vitest 3.2.4 · @vitest/coverage-v8 3.2.4 · tsx 4.22.0
```

## Package Legitimacy Audit

**Not applicable — this phase installs zero external packages.** No registry verification, slopcheck, or postinstall audit required. All tooling (`typescript`, `vitest`, `@vitest/coverage-v8`, `tsx`, `@types/node`) was vetted and locked in Phase 1's `package.json`; this phase adds nothing.

## Architecture Patterns

### System Architecture Diagram

```
                       ┌─────────────────────────────────────────┐
  primary literature   │  src/data/sources.ts                     │
  (Fagereng/Bach/      │  citation registry: {id → SourceRecord}  │
   Saez-Zucman/JST/    └────────────────┬────────────────────────┘
   McKinsey)                             │ referenced by id
        │ (corrected reading,            ▼
        │  triangulated)        ┌─────────────────────────────────┐
        └──────────────────────▶│  src/data/defaults.ts           │
                                │  frozen Params: each value +    │
                                │  SourceRecord (6 req fields)    │
                                │  dragStrength = back-solved #   │
                                └───────┬──────────────┬──────────┘
                                        │ injected      │ enumerated by
                                        ▼ (never        ▼
              ┌──────────────────────────┐  imported  ┌───────────────────────┐
              │ src/core/ (PURE)         │  by core)  │ sourcing-completeness │
              │  calibrateCurve()        │            │ test (D-11, Vitest+CI)│
              │   └─ CR-02 α>1 guard ────┐│            │  fails build if any   │
              │  bisect()                ││            │  required field empty │
              │   └─ CR-01 bracket guard ││            └───────────────────────┘
              │  projectionEngine()      ││
              └──────────┬───────────────┘│
                         │ runs on real   │ throws (fail-loud,
                         │ defaults        │ assertReal-style)
            ┌────────────▼─────────────┐  └──▶ diagnostic message
            │ Wave-D Vitest checks:    │       (offending value+bound+param)
            │ · drag back-solve harness│
            │   → solves McKinsey ~80% │
            │ · D-09 non-conservation  │
            │ · divergence sanity-check│
            └──────────────────────────┘
```

Data flows one direction: literature → `sources.ts`/`defaults.ts` → injected into pure `core/` → asserted by Wave-D tests. `core/` never imports `data/` (ARCHITECTURE boundary). The guards (CR-01/CR-02) sit *inside* `core/` so a bad calibration throws instead of silently producing junk.

### Recommended Project Structure

```
src/
├── core/
│   ├── types.ts          # D-10: add SourceRecord; evolve SourcedParam.source
│   ├── distribution.ts   # D-01: CR-01 bisect guard + CR-02 α>1 guard
│   └── __tests__/
│       ├── distribution.test.ts   # extend: CR-01/CR-02 throw cases
│       ├── invariants.test.ts     # D-09: re-run on real defaults
│       ├── sourcing.test.ts       # NEW — D-11 completeness enforcement
│       ├── calibration.test.ts    # NEW — drag back-solve + divergence sanity
│       └── ...
└── data/                 # NEW — empirical params, injected, never imported by core/
    ├── defaults.ts        # frozen Params (Object.freeze / as const) w/ SourceRecord
    └── sources.ts         # citation registry: SourceRecord per study
```

Rationale: `data/` mirrors ARCHITECTURE.md's prescribed layout (data imported by composition root / tests, passed *into* core, never imported *by* core). Splitting `sources.ts` (the registry of studies) from `defaults.ts` (value↔source pairing) keeps citations and values in one auditable place while letting Phase 3's VIZ-06 footer read the registry.

### Pattern 1: Fail-loud domain guard mirroring `assertReal`

**What:** A guard that throws a descriptive, testable `Error` naming the offending value, the violated bound, and the parameter — never clamps silently.
**When to use:** CR-01 (bisect bracket) and CR-02 (α>1), per D-02. This is the *exact* shape of the existing `assertReal()` in `types.ts:36-40`.
**Example:** see Code Examples §"CR-01 / CR-02 guards".

### Pattern 2: Params as injected, citation-annotated frozen data

**What:** `Object.freeze`d default `Params` where every `SourcedParam` carries a complete `SourceRecord`; the registry in `sources.ts` is the single citation source of truth.
**When to use:** Always for shipped defaults (ARCHITECTURE Pattern 2; DATA-01).
**Example:** see Code Examples §"defaults.ts shape".

### Pattern 3: Calibration-as-procedure, value-as-frozen-result

**What:** dragStrength is *derived* by a reproducible Vitest harness that back-solves the McKinsey ~80% target; the resulting number is then frozen in `defaults.ts` with the derivation recorded in `note`. The test re-derives it to prove reproducibility (assert the frozen constant reproduces ~80% within tolerance).
**When to use:** dragStrength only (D-07/D-08). Return anchors are triangulated point estimates, not back-solved.
**Why:** Pitfall 2 / technical-debt row "tune drag until it looks right — Never". The credibility is in the procedure, not the number.

### Pattern 4: Test-as-enforcement (sourcing completeness)

**What:** A named Vitest test enumerates every parameter in the frozen default set and asserts every required `SourceRecord` field is present and non-empty (empty string / whitespace fails).
**When to use:** DATA-04 / D-11. Mirrors the D-12 invariant battery and `assertReal` precedent.
**Example:** see Code Examples §"Sourcing-completeness test".

### Anti-Patterns to Avoid
- **Any literal `18` in the engine or defaults** — success criterion 3 + Pitfall 1. Even in a comment citing Fagereng for a number Fagereng does not state that way.
- **Silent clamp on α≤1 or unbracketed bisect** — D-02 forbids it; clamping hides a bad calibration and reintroduces the CR-01/CR-02 silent-failure class.
- **Drag tuned "until the chart looks right"** — must be back-solved against the McKinsey ~80% target with the procedure recorded (PITFALLS technical-debt table: "Never").
- **`core/` importing `data/defaults.ts`** — breaks the injection boundary; defaults must be passed in by tests/composition root.
- **Treating registry existence of a figure as verification** — every empirical number must trace to the primary-source definition (population, percentile type, gross/net, real/nominal), not a secondary summary (Pitfall 1, Pitfall — uncited/mis-defined defaults).
- **Empty-string source fields passing the gate** — the completeness test must reject `""`/whitespace, not just `null`/`undefined`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Root-bracketing failure detection | A heuristic "looks converged" check | Explicit `f(lo)*f(hi) > 0` ⇒ throw + non-finite endpoint check (01-REVIEW CR-01 fix) | The exact fix is already specified in 01-REVIEW.md:67-82; reuse it verbatim |
| α≤1 infinite-mean tail detection | Post-hoc "is totalWealth negative?" check downstream | `if (!(alpha > 1)) throw` at the calibration site (01-REVIEW CR-02 fix) | Guard at derivation (`distribution.ts:292`), not after poisoning downstream math (01-REVIEW CR-02 fix:99-104) |
| Schema completeness validation | A Zod runtime schema (new dependency) | A ~15-line recursive non-empty assertion inside the named Vitest test | Build-time data file, not a runtime boundary; D-11 mandates a test, not a validator; zero-dep core |
| Numerical root-finding | A new solver | The existing hardened `bisect()` (after CR-01 fix) | Already implemented and tested; the drag back-solve is monotone in dragStrength → reuse `bisect` |
| Standard-normal / lognormal / Pareto math | Re-deriving | Existing `distribution.ts` helpers | All present and Phase-1-tested; calibration only feeds them anchor values |

**Key insight:** Phase 2 writes almost no new math. The CR-01/CR-02 fixes are *verbatim from 01-REVIEW.md*. The drag back-solve *reuses the (now-guarded) bisect* because asset-inflation-share is monotone in dragStrength. The only genuinely new code is the `SourceRecord` type, the data module, and three Vitest files.

## Common Pitfalls

### Pitfall 1: Mis-applying the Fagereng "~18pp" figure (Pitfall 2 in PITFALLS.md)
**What goes wrong:** Treating "~18pp" as the per-tier real-return gap between median and top. Inflates top-tier compounding absurdly; top-0.1% exceeds global wealth within a decade.
**Why it happens:** PROJECT.md itself paraphrases it as "~18pp gap between 10th and 90th percentile returns" — the easy-to-misread shorthand (the cross-cutting blocker STATE.md flags). Fagereng's actual statement: moving from the 10th→90th percentile of the *net-worth* distribution is *associated with* an ~18pp higher return *gross of tax* / ~10pp *net of tax*; the raw cross-sectional 10th–90th spread of *returns* is ~500bp (~5pp). `[VERIFIED: WebSearch — econometricsociety.org / NBER w22822; cross-checked PITFALLS.md HIGH]`
**How to avoid:** Build the curve from triangulated, explicitly-defined per-tier targets (D-04/D-05). Use Fagereng's heterogeneity/persistence as *qualitative justification for a sloped curve*; use JST (level/asset base), Bach (leverage & systematic-risk gradient), Saez-Zucman (top-tail) as the *level anchors*. Prefer the net-of-tax (~10pp) figure if a single gradient figure is ever cited (pre-tax/generalized scope). Record the discarded 18pp misreading + why in each anchor's `note` (D-06).
**Warning signs:** Any literal `18` in code/defaults/comments; top-0.1% wealth exceeding plausible bounds within the default horizon; a comment citing Fagereng for a number it does not state that way.

### Pitfall 2: Drag back-solve drifting into a finite-pie artifact (Pitfall 4 in PITFALLS.md)
**What goes wrong:** The chosen dragStrength reproduces ~80% asset-inflation share but accidentally makes some tier's loss equal another's gain (zero-sum), or forces a tier to negative real wealth.
**Why it happens:** Calibrating to a single aggregate target without re-checking the structural invariants.
**How to avoid:** D-09 — after back-solving dragStrength, re-run the Phase 1 D-12 invariant battery (`invariants.test.ts`) on the *real* defaults: aggregate real wealth can still grow; no tier's loss exactly equals another's gain; drag=0 still collapses to baseline. The McKinsey figure is the magnitude/plausibility anchor for the *mechanism*, not the formula.
**Warning signs:** Sum of tiers conserved; a transfer term appears; a tier hits negative real wealth at the back-solved dragStrength; the words "finite pie"/"zero-sum" anywhere in logic or copy.

### Pitfall 3: Calibration choosing anchors that re-trip CR-01/CR-02 (D-03)
**What goes wrong:** Real anchors with `top01/top1 ≥ 10` ⇒ α≤1; or a stitch/50%-share root outside the hardcoded `[0.9001,0.9999]` / `[0.0001,0.9999]` brackets ⇒ (pre-fix) silent junk, (post-fix) a thrown error mid-calibration.
**Why it happens:** Real top-tail concentration is exactly what this app models; α≤1 is *plausible*, not exotic (01-REVIEW CR-02: top1=$2M, top01=$30M → α≈0.85).
**How to avoid:** D-03 makes `top01/top1 < 10` and bracket-coverage *hard preconditions on the chosen anchor values*. After picking candidate anchors, compute α = ln(10)/ln(top01/top1) by hand and confirm α>1 *before* freezing. The guards (Wave A) ensure that if a later edit violates this it fails loudly rather than silently.
**Warning signs:** `top01/top1 ≥ 10` for the chosen defaults; CR-01/CR-02 guard throws when `calibrateCurve(DEFAULTS.anchors)` is called.

### Pitfall 4: Survivorship-biased level anchors presented as forecast (Pitfall 7 in PITFALLS.md)
**What goes wrong:** JST ~7% real housing/equity used as a universal expected return without recording the survived-market upward bias.
**How to avoid:** Record the survivorship caveat in the relevant anchor `SourceRecord.note` now (surfaced neutrally in Phase 5). Prefer conservative ends of cited ranges where D-04 leaves latitude; document the choice.
**Warning signs:** A flat optimistic anchor with no caveat note; range midpoint chosen over a conservative end with no recorded rationale.

### Pitfall 5: Geometric vs arithmetic mean confusion (Pitfall 5 in PITFALLS.md)
**What goes wrong:** An anchor sourced from an arithmetic "average return" headline used directly in the deterministic compounding path overstates terminal wealth (volatility drag ≈ ½·variance).
**How to avoid:** Each return anchor's `SourceRecord.note` (or `definition`) records whether the source figure is geometric or arithmetic and the reported volatility; the deterministic path requires geometric. Document any volatility-drag adjustment applied to an arithmetic source figure.
**Warning signs:** An anchor from a "since 1926 the market returned X%" figure with no geometric/arithmetic note.

### Pitfall 6: Sourcing gate that passes on empty/whitespace fields
**What goes wrong:** `source: ""` satisfies a `string` type and a naive `!= null` check; the build passes with an effectively uncited default.
**How to avoid:** The D-11 test must assert each required field is a non-empty trimmed string (and `basis` is `'real'|'nominal'`). Test the test: include a deliberately-blanked fixture asserting it *fails* (negative test), mirroring the basis-mismatch negative test from Phase 1.

## Runtime State Inventory

This phase touches no databases, services, OS registrations, secrets, or external state. It is a code/data/test change in a framework-free library with no I/O.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no datastore exists (library-only project, `package.json` name `assets-projection-core`, no DB/persistence) | None |
| Live service config | None — no external services (verified: no network/fetch imports anywhere; ARCHITECTURE "no backend") | None |
| OS-registered state | None — no scheduled tasks/daemons; pure `npm test` library | None |
| Secrets/env vars | None — no `.env`, no secrets referenced | None |
| Build artifacts | `SourceRecord` migration changes `src/core/types.ts` — the exported type contract Phase 3/4 consume; no compiled artifact to reinstall (no build step yet, `tsc --noEmit` only). Downstream consumers are in-repo only. | Update any Phase-1 test fixtures that construct `SourcedParam` with `source: string\|null` to the new shape (D-12 allows fixtures to stay source-less, but the *type* changes — fixtures must still compile). |

**The one real cross-cutting effect:** the D-10 type change to `SourcedParam`/`SourceRecord` is a breaking change to a contract that Phase 1 test files already use. Every `SourcedParam` construction in `src/core/__tests__/*` must still type-check after the migration (they may keep synthetic/absent citations per D-12, but the *field shape* changes). The planner must include a task to migrate existing fixtures, or the Phase 1 suite goes red.

## Code Examples

### CR-01 / CR-02 guards (verbatim from 01-REVIEW.md, the locked fix shape)

```typescript
// src/core/distribution.ts — bisect (CR-01). Source: 01-REVIEW.md:67-82
function bisect(f: (x: number) => number, lo: number, hi: number,
                maxIter = 100, tol = 1e-12): number {
  let a = lo, b = hi;
  const fa = f(a);
  const fb = f(b);
  if (!Number.isFinite(fa) || !Number.isFinite(fb)) {
    throw new Error(`bisect: non-finite endpoint f(${lo})=${fa}, f(${hi})=${fb}`);
  }
  if (fa === 0) return a;
  if (fb === 0) return b;
  if (fa * fb > 0) {
    throw new Error(`bisect: root not bracketed in [${lo}, ${hi}] (f(lo)=${fa}, f(hi)=${fb})`);
  }
  // ... existing loop unchanged ...
}

// src/core/distribution.ts — calibrateCurve, immediately after `alpha` is computed
// (after line 292). Source: 01-REVIEW.md:99-104
const alpha = Math.log(10) / Math.log(top01Wealth / top1Wealth);
if (!(alpha > 1)) {
  throw new Error(
    `calibrateCurve: Pareto tail index alpha=${alpha} ≤ 1 ` +
    `(top01/top1=${top01Wealth / top1Wealth}); mean wealth is undefined for alpha ≤ 1. ` +
    `Constrain anchors so top01/top1 < 10.`
  );
}
```
Both mirror `assertReal()` in `types.ts:36-40` (descriptive `Error`, names value+bound+param, no clamp) — satisfies D-02. Add negative tests: `expect(() => calibrateCurve(badAnchors)).toThrow(/alpha=.*≤ 1/)` and an unbracketed-bisect throw case. (`distribution.test.ts` already imports the module; WR-01/WR-02 near-uniform & degenerate-anchor cases are good companion tests but are warnings, not D-01 scope — note for planner.)

### SourceRecord shape (D-10)

```typescript
// src/core/types.ts
export interface SourceRecord {
  sourceName: string;     // e.g. "Fagereng, Guiso, Malacrino, Pistaferri (2020), Econometrica"
  figureUsed: string;     // the exact figure taken, e.g. "net-of-tax 10pp 10th→90th net-worth assoc. (gradient justification)"
  basis: 'real' | 'nominal';  // reuse the existing branded-basis vocabulary
  definition: string;     // population/percentile-type/gross-net/period — guards Pitfall (mis-defined)
  yearVintage: string;    // data vintage, e.g. "Norway admin records, 2004–2015"
  retrievedDate: string;  // ISO date the figure was read from primary source
  note?: string;          // OPTIONAL: correction trail (discarded 18pp + why, D-06), survivorship/geo-vs-arith caveats
  url?: string;           // OPTIONAL: primary-source link the Phase 3 VIZ-06 footer renders
}

// Evolve SourcedParam: replace `source: string | null` with the structured record.
export interface SourcedParam {
  value: number;
  basis: 'real' | 'nominal';
  source: SourceRecord;   // was: string | null
  note?: string;
}
```
Discretion note (A2): reusing `basis: 'real' | 'nominal'` for `SourceRecord.basis` keeps it machine-checkable and consistent with the engine's branded vocabulary; a free-string basis would weaken the gate. Recommended, not locked.

### defaults.ts shape (DATA-01 / Pattern 2)

```typescript
// src/data/sources.ts — citation registry (one entry per study)
export const SOURCES = {
  fagereng2020: { sourceName: "Fagereng et al. (2020), Econometrica", url: "https://www.nber.org/papers/w22822", /* ... */ },
  // bach2020, saezZucman, jst2019, mckinsey2023 ...
} as const;

// src/data/defaults.ts — frozen, every value carries a complete SourceRecord
export const DEFAULTS = Object.freeze({
  returnByTier: {
    median: { value: /* triangulated central est. */, basis: 'real',
              source: { sourceName: "...", figureUsed: "...", basis: 'real',
                        definition: "real net-worth-percentile return, generalized pre-tax",
                        yearVintage: "...", retrievedDate: "2026-05-16",
                        note: "Discarded the '~18pp flat per-tier gap' misreading: Fagereng's "
                            + "~18pp is a gross-of-tax 10th→90th net-worth ASSOCIATION (~10pp "
                            + "net of tax; raw return spread ~500bp), not a per-tier rate gap." } },
    // top10, top1, top01 — each triangulated (Bach/Saez-Zucman/JST), each with its own note
  },
  dragStrength: { value: /* BACK-SOLVED constant */, basis: 'real',
                  source: { /* mckinsey2023 */, figureUsed: "≈80% of 2000–2021 net-worth growth from asset-price inflation",
                            note: "Back-solved (not asserted): dragStrength chosen so the engine's "
                                + "asset-inflation share of net-worth growth over a 2000–2021-like "
                                + "baseline ≈ McKinsey 80%. Procedure in calibration.test.ts." } },
  // anchors (the 4 wealth-LEVEL anchors feeding calibrateCurve) similarly sourced
}) ;
```
Constraint check before freezing: compute `alpha = Math.log(10)/Math.log(top01.value/top1.value)` for the chosen `anchors` — **must be > 1** (D-03/Pitfall 3).

### dragStrength back-solve harness (D-07/D-08, Pattern 3)

```typescript
// src/core/__tests__/calibration.test.ts
// asset-inflation share of net-worth growth is monotone increasing in dragStrength
// at fixed baseline ⇒ reuse the (CR-01-hardened) bisect to solve for the ~80% target.
function assetInflationShare(dragStrength: number): number {
  const params = { ...BASELINE_2000_2021_PARAMS, dragStrength: { value: dragStrength, basis: 'real', source: /*...*/ } };
  const r = projectionEngine(BASELINE_INPUTS, params);
  // share = cumulative asset-inflation contribution ÷ total net-worth growth over window
  return /* derived from r.series assetInflation vs total growth */;
}
test('dragStrength reproduces McKinsey ~80% asset-inflation share', () => {
  const solved = bisectPublic(d => assetInflationShare(d) - 0.80, 0, /* hi */ 0.5);
  expect(assetInflationShare(DEFAULTS.dragStrength.value)).toBeCloseTo(0.80, 2); // frozen value reproduces target
  expect(DEFAULTS.dragStrength.value).toBeCloseTo(solved, 4);                    // and equals the back-solve
});
```
Open question O-1 below: the exact definition of "asset-inflation share of net-worth growth" in terms of `YearSnapshot.assetInflation` vs total growth must be pinned during planning so it provably matches McKinsey's "share of net-worth growth from asset-price inflation" definition (not, e.g., the ~1.3× asset/GDP ratio, which D-08 explicitly excludes).

### Sourcing-completeness test (D-11 / DATA-04)

```typescript
// src/core/__tests__/sourcing.test.ts
const REQUIRED: (keyof SourceRecord)[] =
  ['sourceName','figureUsed','basis','definition','yearVintage','retrievedDate'];

function assertComplete(path: string, p: SourcedParam) {
  for (const f of REQUIRED) {
    const v = p.source[f];
    if (f === 'basis') { expect(['real','nominal']).toContain(v); continue; }
    expect(typeof v === 'string' && v.trim().length > 0,
      `${path}.source.${f} missing/empty`).toBe(true);
  }
}
test('every shipped default parameter has a complete SourceRecord', () => {
  for (const [path, p] of enumerateSourcedParams(DEFAULTS)) assertComplete(path, p);
});
test('NEGATIVE: a blanked source field fails the gate', () => {
  const bad = { ...DEFAULTS.dragStrength, source: { ...DEFAULTS.dragStrength.source, figureUsed: '  ' } };
  expect(() => assertComplete('bad', bad)).toThrow();
});
```
Targets `DEFAULTS` only — Phase 1 synthetic fixtures are exempt (D-12). The negative test mirrors the Phase 1 basis-mismatch negative test (test-the-test discipline).

### Divergence sanity-check (success criterion 5)

```typescript
// src/core/__tests__/calibration.test.ts
test('no tier exceeds plausible bounds within the default horizon (real defaults)', () => {
  const r = projectionEngine(REPRESENTATIVE_INPUTS, { ...DEFAULTS, horizon: DEFAULT_HORIZON });
  const last = r.series.at(-1)!;
  // bound: top01 must not exceed total distribution wealth, and must stay finite/positive.
  expect(Number.isFinite(last.anchorWealth.top01)).toBe(true);
  expect(last.anchorWealth.top01).toBeLessThan(/* documented plausible ceiling, e.g. multiple-of-total */);
});
```
Bound + horizon definitions are Claude's discretion (D-11/discretion); recommend the bound be **relative** (e.g. top01 wealth ≤ a documented multiple of total distribution wealth, and all anchors finite/positive) rather than an absolute dollar figure, since the curve is parametric and absolute caps would be arbitrary. Horizon: use the planner-set ENTRY-03 default (~30–40y).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PROJECT.md "~18pp gap between 10th and 90th percentile returns" | Corrected: ~500bp raw 10th–90th *return* spread; ~18pp gross / ~10pp net-of-tax *association across net-worth percentiles* | This phase (D-06) | The shorthand is a known cross-cutting blocker (STATE.md); engine must contain no literal `18` |
| `SourcedParam.source: string \| null` (Phase-1 placeholder) | Structured `SourceRecord` (6 required fields + optional note/url) | This phase (D-10) | Breaking type change; Phase 1 fixtures must be migrated to still compile |
| Drag strength as an asserted constant | Back-solved from McKinsey ~80% share via reproducible procedure | This phase (D-07/D-08) | Credibility moves from the number to the documented procedure |

**Deprecated/outdated:**
- The flat-18pp reading of Fagereng — analytically wrong (Pitfall 1); replaced by triangulated per-tier anchors.
- Treating dragStrength as tunable-to-taste — replaced by the back-solve procedure (PITFALLS technical-debt: "Never").

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | No Zod / no new runtime dependency is correct for D-11 (a Vitest test, not a schema validator, is mandated; data is build-time-frozen) | Standard Stack | Low — even if Zod were added it would be additive; the test is required regardless. CLAUDE.md lists Zod for *runtime input boundaries*, which this is not. |
| A2 | `SourceRecord.basis` should reuse the `'real' \| 'nominal'` union (machine-checkable, consistent) rather than a free string | Code Examples | Low — explicitly Claude's discretion in CONTEXT.md; recommendation only |
| A3 | The corrected Fagereng figures (raw ~500bp 10th–90th return spread; ~18pp gross / ~10pp net-of-tax net-worth-percentile association) are accurate | Pitfall 1 / Code Examples | Medium-Low — cross-verified WebSearch (econometricsociety.org / NBER w22822) AND PITFALLS.md HIGH-confidence primary-source read; planner should still confirm at the exact table during calibration (D-04 requires reading the table-level definition anyway) |
| A4 | Specific frozen anchor *values* and the back-solved dragStrength *number* are NOT asserted here | Calibration sections | N/A by design — D-04/D-07 make these a calibration *procedure* output; this research prescribes the procedure and the corrected framing, not the final numbers (which require primary-source table reading during execution) |

## Open Questions (RESOLVED)

1. **Exact "asset-inflation share of net-worth growth" metric definition for the back-solve.**
   - What we know: D-08 fixes the *target* (McKinsey ~80%) and excludes the ~1.3× ratio. `YearSnapshot.assetInflation` is the per-year haircut; total growth is derivable from the series.
   - What's unclear: the precise numerator/denominator (cumulative asset-inflation contribution ÷ total net-worth growth over 2000–2021-like window) that provably corresponds to McKinsey's definition ("share of net-worth growth from asset-price inflation, vs ~1/5 from new saving/investment").
   - RESOLVED: Plan 02-04 Task 2 pins the metric in `calibration.test.ts` as an explicit, commented formula = cumulative asset-inflation contribution ÷ total real net-worth growth over the window, with a comment stating it maps to McKinsey's "share of net-worth growth from asset-price inflation" and explicitly excludes the ~1.3× asset/GDP ratio (D-08).

2. **"2000–2021-like baseline" parameterization.**
   - What we know: the back-solve runs the engine over a baseline run (D-07).
   - What's unclear: what inputs/anchor values constitute the baseline (the same calibrated defaults? a historical-anchor variant?).
   - RESOLVED: Plan 02-04 Task 2 uses the calibrated real `DEFAULTS` as the 2000–2021-like baseline (simplest, self-consistent, avoids a second sourced data set out of scope per Deferred); the choice is documented in the dragStrength `note`.

3. **Plausible-bounds definition for the divergence sanity-check.**
   - What we know: success criterion 5 + Claude's discretion (relative bound recommended).
   - RESOLVED: Plan 02-04 Task 2's divergence sanity-check uses a documented relative ceiling — `top01` ≤ a documented multiple of total distribution wealth, all anchors finite & positive, over the default horizon — with the multiple's rationale stated in a one-line comment in `calibration.test.ts`.

## Environment Availability

Skipped — no external dependencies. Phase 2 is a code/data/test change in a framework-free library run via `npm test` (Vitest 3.2.4, already installed). No tools, services, runtimes, or network beyond the existing Node/Vitest toolchain (verified in Phase 1).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 `[VERIFIED: package.json]` |
| Config file | `vitest.config.ts` (exists, reviewed in 01-REVIEW files list) |
| Quick run command | `npx vitest run src/core/__tests__/<file>.test.ts` |
| Full suite command | `npm test` (= `vitest run`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-01/CR-01 | `bisect` throws on unbracketed / non-finite endpoints | unit (negative) | `npx vitest run src/core/__tests__/distribution.test.ts` | ❌ Wave 0 (extend existing file) |
| D-01/CR-02 | `calibrateCurve` throws when α≤1 (top01/top1≥10) | unit (negative) | `npx vitest run src/core/__tests__/distribution.test.ts` | ❌ Wave 0 (extend existing file) |
| DATA-01/D-10 | `SourceRecord` type compiles; defaults carry it | typecheck + unit | `npm run typecheck && npx vitest run src/core/__tests__/sourcing.test.ts` | ❌ Wave 0 |
| DATA-04/D-11 | Build fails if any frozen default lacks a complete source record (+ negative test) | unit (enforcement) | `npx vitest run src/core/__tests__/sourcing.test.ts` | ❌ Wave 0 |
| DATA-02/D-05 | No literal `18` in engine/defaults; anchors triangulated | unit + grep | `npx vitest run src/core/__tests__/calibration.test.ts` + `! grep -rn '\b18\b' src/core src/data` (scoped, reviewed) | ❌ Wave 0 |
| DATA-03/D-07/D-08 | Frozen dragStrength reproduces McKinsey ~80% share & equals the back-solve | unit (calibration) | `npx vitest run src/core/__tests__/calibration.test.ts` | ❌ Wave 0 |
| DATA-03/D-09 | Real defaults preserve non-conservation & infinite-growth (Pitfall 4) | unit (invariant) | `npx vitest run src/core/__tests__/invariants.test.ts` | ✅ exists — extend to run on `DEFAULTS` |
| SC-5 | No tier exceeds plausible bounds within default horizon on real defaults | unit (sanity) | `npx vitest run src/core/__tests__/calibration.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run typecheck && npx vitest run <touched test file>`
- **Per wave merge:** `npm test` (full suite — must stay green; Wave A must merge green before any anchor numbers exist)
- **Phase gate:** `npm run typecheck && npm test` fully green before `/gsd:verify-work`; plus the scoped no-literal-`18` grep.

### Wave 0 Gaps
- [ ] `src/core/__tests__/sourcing.test.ts` — covers DATA-01, DATA-04 (D-11 enumeration + negative blank-field test)
- [ ] `src/core/__tests__/calibration.test.ts` — covers DATA-02 (triangulation/no-18), DATA-03 (drag back-solve), SC-5 (divergence sanity)
- [ ] Extend `src/core/__tests__/distribution.test.ts` — CR-01/CR-02 throw cases (negative tests)
- [ ] Extend `src/core/__tests__/invariants.test.ts` — D-09 re-run of D-12 battery on `DEFAULTS`
- [ ] Migrate existing Phase-1 fixtures constructing `SourcedParam` to the new `SourceRecord` shape so the suite still compiles (D-10 breaking type change)
- Framework install: none (Vitest 3.2.4 present)

## Security Domain

Per `.planning/research/PITFALLS.md` §"Security Mistakes": this is a stateless, no-auth, no-backend, no-network, no-persistence client-side/library project. This phase adds **no input boundaries** (the data module is a build-time-frozen constant, not runtime user input) and **no I/O**.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No access-controlled resources |
| V5 Input Validation | no (this phase) | Phase 2 introduces no runtime input boundary; the D-11 completeness test is a build-time correctness gate, not input validation. User-input validation (Zod) is a Phase 4 concern. |
| V6 Cryptography | no | No crypto |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Supply-chain (malicious dependency) | Tampering | N/A this phase — zero new dependencies (see Package Legitimacy Audit) |
| Data-integrity drift (uncited/mis-defined default silently shipped) | Tampering / Repudiation (epistemic) | The D-11 sourcing-completeness gate + the corrected-Fagereng correction trail in `note` *is* the domain-specific integrity control; this is the phase's security-equivalent |

The dominant risk class for this domain is **epistemic integrity** (wrong/uncited economics), not classical AppSec — the D-11 enforcement gate and the per-anchor correction trail are the controls that matter.

## Sources

### Primary (HIGH confidence)
- `src/core/distribution.ts` (read in full) — CR-01 `bisect` (l.584-609), CR-02 `paretoConditionalMean`/`calibrateCurve` α derivation (l.235-237, 292, 326-327)
- `src/core/types.ts` (read in full) — `assertReal` fail-loud precedent (l.36-40), `SourcedParam` (l.52-61)
- `.planning/phases/01-model-foundation/01-REVIEW.md` — exact CR-01/CR-02 fix shapes (l.52-106), WR-01/WR-02 companion warnings
- `.planning/phases/01-model-foundation/01-HUMAN-UAT.md` — test 2: CR-01/CR-02 carried-forward Phase 2 precondition (developer decision)
- `.planning/research/PITFALLS.md` — Pitfalls 1–7 with HIGH-confidence primary-source verification (Fagereng/JST/McKinsey table-level reads)
- `.planning/research/ARCHITECTURE.md` — functional-core boundary, `data/` injected-not-imported rule, Pattern 2
- `02-CONTEXT.md`, `01-CONTEXT.md`, `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md` — locked decisions, requirement IDs, the ~18pp blocker
- `package.json` (read) — exact installed toolchain versions

### Secondary (MEDIUM confidence)
- WebSearch — econometricsociety.org / NBER w22822 (Fagereng 2020): confirmed ~18pp gross / ~10pp net-of-tax 10th→90th net-worth association; ~500bp raw return spread in working-paper version. Cross-checked against PITFALLS.md HIGH primary read.
- WebSearch — mckinsey.com MGI "Out of balance / future of wealth and growth" (2023): confirmed ≈80% of 2000–2021 net-worth growth from asset-price inflation, ~1/5 from new investment. Cross-checked against PITFALLS.md HIGH primary read.

### Tertiary (LOW confidence)
- None relied upon. Final frozen anchor *values* and the dragStrength *number* are deliberately deferred to execution-time primary-source table reading (D-04/D-07), not asserted here.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new deps; toolchain verified from package.json
- Architecture / fix shapes: HIGH — CR-01/CR-02 fixes copied verbatim from 01-REVIEW.md; verified against the actual `distribution.ts` line numbers
- Calibration framing: HIGH — corrected Fagereng / McKinsey figures cross-verified (WebSearch + PITFALLS.md HIGH primary reads); exact frozen numbers correctly deferred to execution per D-04/D-07
- Pitfalls: HIGH — derived from project's own HIGH-confidence PITFALLS.md plus locked CONTEXT decisions
- Enforcement/test patterns: HIGH — mirror the established `assertReal` / D-12 invariant-battery precedent in-repo

**Research date:** 2026-05-16
**Valid until:** 2026-06-15 (stable — economic primary sources are fixed historical literature; toolchain is locked). The only volatility is execution-time primary-source table reading, which is intended.
