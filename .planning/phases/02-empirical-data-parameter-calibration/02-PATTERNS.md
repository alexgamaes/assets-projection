# Phase 2: Empirical Data & Parameter Calibration - Pattern Map

**Mapped:** 2026-05-16
**Files analyzed:** 8 (3 modified, 5 new/extended)
**Analogs found:** 8 / 8 (all have strong in-repo analogs — no RESEARCH-only fallbacks needed)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/core/types.ts` (modify: add `SourceRecord`, evolve `SourcedParam.source`) | model (type contract) | transform | `src/core/types.ts` (self — existing `SourcedParam`/`assertReal`) | exact (in-place evolution) |
| `src/core/distribution.ts` (modify: CR-01 bisect guard, CR-02 α>1 guard) | model (numeric core) | transform | `src/core/types.ts:36-40` (`assertReal` fail-loud precedent) | exact (same guard shape) |
| `src/data/sources.ts` (new: citation registry) | config / data | transform (build-time constant) | `src/core/__tests__/testUtils.ts:84-125` (`synParam`/`makeSyntheticParams` frozen-param builder) | role-match |
| `src/data/defaults.ts` (new: frozen `Params` + `SourceRecord`) | config / data | transform (build-time constant) | `src/core/__tests__/testUtils.ts:104-134` (`makeSyntheticParams`/`syntheticInputs`) | role-match |
| `src/core/__tests__/distribution.test.ts` (extend: CR-01/CR-02 throw cases) | test (negative/unit) | request-response | `src/core/__tests__/basis.test.ts` (`.toThrow(/regex/)` negative tests) | exact |
| `src/core/__tests__/sourcing.test.ts` (new: D-11 completeness gate + negative) | test (enforcement) | batch (enumeration) | `src/core/__tests__/invariants.test.ts:54-79` (filesystem-enumeration enforcement test) + `basis.test.ts` (negative test) | exact |
| `src/core/__tests__/calibration.test.ts` (new: drag back-solve + divergence sanity) | test (calibration/sanity) | request-response | `src/core/__tests__/invariants.test.ts:84-210` (engine-output assertions on `makeSyntheticParams`) | exact |
| `src/core/__tests__/invariants.test.ts` (extend: re-run D-12 battery on `DEFAULTS`) | test (invariant) | request-response | `src/core/__tests__/invariants.test.ts:84-210` (self — same battery, swap fixture) | exact (in-place extension) |

## Pattern Assignments

### `src/core/types.ts` — add `SourceRecord`, evolve `SourcedParam` (model, transform)

**Analog:** self — the existing `SourcedParam` (lines 46-61) and the `assertReal` fail-loud guard (lines 36-40) are the precedents to extend, not replace.

**Existing `SourcedParam` to evolve** (`src/core/types.ts:46-61`):
```typescript
export interface SourcedParam {
  /** The parameter value (plain number — basis declared separately). */
  value: number;
  /** Whether this value is real (inflation-adjusted) or nominal. */
  basis: 'real' | 'nominal';
  /** Citation string for empirically sourced values; null for synthetic placeholders. */
  source: string | null;          // <-- D-10: replace with `source: SourceRecord`
  /** Optional explanatory note. */
  note?: string;
}
```

**`assertReal` precedent** the new `SourceRecord` must stay consistent with — reuse the `'real' | 'nominal'` union for `SourceRecord.basis` so it remains machine-checkable (`src/core/types.ts:36-40`):
```typescript
export function assertReal(p: { basis: 'real' | 'nominal' }, ctx: string): void {
  if (p.basis !== 'real') {
    throw new Error(`Basis violation in ${ctx}: expected real, got ${p.basis}`);
  }
}
```

**Doc-comment convention to copy** — every type block carries a `Source:`/decision-ID-annotated JSDoc header (see file header lines 1-10 and the `SourcedParam` "Phase-2-ready" note at lines 47-50). The new `SourceRecord` interface must follow the same JSDoc-per-field style as `Params` (lines 97-133): one `/** ... */` per field, decision IDs (D-10) cited inline.

**Target shape** (from RESEARCH 02-RESEARCH.md:297-315 — six required fields + optional `note`/`url`, `basis` reuses the branded union). This is an export-contract change consumed by Phases 3/4 — keep the JSDoc authoritative-contract framing from the file header.

---

### `src/core/distribution.ts` — CR-01 bisect guard + CR-02 α>1 guard (model, transform)

**Analog:** `src/core/types.ts:36-40` (`assertReal`) — descriptive `Error`, names value + violated bound + parameter, never clamps. D-02 requires this exact shape.

**CR-01 guard site** — `bisect()` (`src/core/distribution.ts:584-609`). Current implementation computes only `fa` and has no bracket/finite check:
```typescript
function bisect(
  f: (x: number) => number,
  lo: number,
  hi: number,
  maxIter = 100,
  tol = 1e-12,
): number {
  let a = lo;
  let b = hi;
  const fa = f(a);
  // ^ insert here: compute fb = f(b); throw on !Number.isFinite(fa|fb);
  //   return a/b on exact zero; throw on fa*fb > 0 (root not bracketed)
  for (let i = 0; i < maxIter; i++) {
    // ... existing loop unchanged ...
```
Fix shape is specified verbatim in `01-REVIEW.md:67-82` and reproduced in `02-RESEARCH.md:264-278`. Copy that block; keep the existing loop body unchanged.

**CR-02 guard site** — `calibrateCurve()` immediately after α is derived (`src/core/distribution.ts:292`):
```typescript
const alpha = Math.log(10) / Math.log(top01Wealth / top1Wealth);
// ^ insert immediately after: if (!(alpha > 1)) throw new Error(`calibrateCurve: ... alpha=${alpha} ≤ 1 (top01/top1=${top01Wealth/top1Wealth}); ...`)
```
`paretoConditionalMean` (`src/core/distribution.ts:235-237`) divides by `(alpha - 1)` and is the math that silently breaks when α≤1 — the guard at line 292 protects every downstream caller (`paretoTailWealthAbove` 248-255, `calibrateCurve` 326, `cumulativeShareFromTop` 454). Guard at the derivation site, not downstream (per `01-REVIEW.md:99-104`).

**Error-message convention** (from `assertReal` + the message specified in `02-RESEARCH.md:283-289`): include the offending numeric value, the violated bound, the parameter name, and the consequence — e.g. `` `bisect: root not bracketed in [${lo}, ${hi}] (f(lo)=${fa}, f(hi)=${fb})` `` and `` `calibrateCurve: Pareto tail index alpha=${alpha} ≤ 1 (top01/top1=${...}); mean wealth is undefined for alpha ≤ 1. Constrain anchors so top01/top1 < 10.` ``

---

### `src/data/sources.ts` & `src/data/defaults.ts` — frozen citation registry + frozen Params (config/data, transform)

**Analog:** `src/core/__tests__/testUtils.ts:84-134` — `synParam`, `makeSyntheticParams`, `syntheticInputs`. This is the only existing code that constructs full `Params`/`SourcedParam` trees; the production module mirrors its structure but with real `SourceRecord`s and `Object.freeze`.

**Param-builder + full-tree shape to mirror** (`src/core/__tests__/testUtils.ts:104-125`):
```typescript
export function makeSyntheticParams(overrides: Partial<Params> = {}): Params {
  const defaults: Params = {
    anchors: {
      median: synParam(50_000, 'real', 'synthetic p50 anchor'),
      top10:  synParam(300_000, 'real', 'synthetic p90 anchor'),
      top1:   synParam(2_000_000, 'real', 'synthetic p99 anchor'),
      top01:  synParam(15_000_000, 'real', 'synthetic p99.9 anchor'),
    },
    returnByTier: {
      median: synParam(0.02, 'real', 'synthetic 2% real return'),
      top10:  synParam(0.04, 'real', 'synthetic 4% real return'),
      top1:   synParam(0.07, 'real', 'synthetic 7% real return'),
      top01:  synParam(0.12, 'real', 'synthetic 12% real return'),
    },
    dragStrength: synParam(0.30, 'real', 'synthetic drag coefficient'),
    horizon: 60,
    distributionEvolution: 'endogenous',
    savings: synParam(1000, 'real', 'synthetic annual savings in real terms'),
  };
  return { ...defaults, ...overrides };
}
```
The production `DEFAULTS` keeps the *same key structure* (`anchors`/`returnByTier`/`dragStrength`/`horizon`/`distributionEvolution`/`savings`) but: (a) every `SourcedParam.source` is a full `SourceRecord` referencing a `SOURCES` registry entry, not `null`; (b) wrapped in `Object.freeze(...)` (RESEARCH 02-RESEARCH.md:328-346); (c) `dragStrength.value` is the back-solved constant with its derivation recorded in `source.note`.

**No-literal-`18` convention** — `testUtils.ts:11-13` and `:92-93` explicitly document the "no hardcoded 18 anywhere" rule (Pitfall 1 / success criterion 3). The data module and its `SourceRecord.note` correction-trail strings must obey the same rule (the discarded-18pp trail describes the misreading without using the literal numeral `18` in code; phrase it so the scoped `! grep -rn '\b18\b' src/core src/data` gate passes — see `02-RESEARCH.md:466`).

**Architecture boundary (hard constraint):** `core/` must never `import` `src/data/*`. Enforced by the existing import-boundary scan in `invariants.test.ts:42-79` (`FORBIDDEN_PATTERN`). `defaults.ts`/`sources.ts` are injected into the engine by tests/composition root only.

---

### `src/core/__tests__/distribution.test.ts` — extend with CR-01/CR-02 throw cases (test, negative)

**Analog:** `src/core/__tests__/basis.test.ts` (whole file) — the canonical `.toThrow(/regex/)` negative-test pattern.

**Negative-test pattern to copy** (`src/core/__tests__/basis.test.ts:27-31`):
```typescript
it('assertReal throws "Basis violation" when basis is nominal', () => {
  expect(() => assertReal({ basis: 'nominal' }, 'returnByTier.median')).toThrow(
    /Basis violation in returnByTier\.median: expected real, got nominal/
  );
});
```

**Existing imports/structure of the file to extend** (`src/core/__tests__/distribution.test.ts:45-56`) — already imports `calibrateCurve` from `../distribution.js` and `Anchors` type; add the throw cases here (do not create a new file):
```typescript
import { describe, it, expect } from 'vitest';
import { DIST_TOL } from './testUtils.js';
import { calibrateCurve, quantile, cdf, percentileOf,
         cumulativeShareFromTop, dynamicTopSetPercentile, returnAtPercentile } from '../distribution.js';
import type { Anchors, ReturnByTier } from '../types.js';
```
Add: `expect(() => calibrateCurve(badAnchors)).toThrow(/alpha=.*≤ 1/)` (top01/top1 ≥ 10 anchors) and an unbracketed-`bisect` throw case (per `02-RESEARCH.md:291`). The doc-comment header (lines 1-44) enumerates covered behaviors with hand-computed fixtures — extend that header to list the new CR-01/CR-02 cases in the same style.

---

### `src/core/__tests__/sourcing.test.ts` — D-11 completeness gate + negative (test, enforcement/batch)

**Analog:** `src/core/__tests__/invariants.test.ts:54-79` (enumeration-driven enforcement test) + `src/core/__tests__/basis.test.ts:27-31` (negative "test the test").

**Enumeration-enforcement pattern to copy** (`src/core/__tests__/invariants.test.ts:54-79`) — iterate a collection, accumulate violations, assert empty with a descriptive joined message:
```typescript
const violations: { file: string; line: number; text: string }[] = [];
for (const file of sources) {
  // ... collect violations ...
}
expect(
  violations,
  `core/ source files must not import ...\nViolations:\n${violations
    .map(v => `  ${v.file}:${v.line}: ${v.text}`)
    .join('\n')}`
).toHaveLength(0);
```

**Negative "test-the-test" pattern** (mirror `basis.test.ts` — a deliberately-broken fixture asserted to fail), shape from `02-RESEARCH.md:387-390`:
```typescript
test('NEGATIVE: a blanked source field fails the gate', () => {
  const bad = { ...DEFAULTS.dragStrength,
    source: { ...DEFAULTS.dragStrength.source, figureUsed: '  ' } };
  expect(() => assertComplete('bad', bad)).toThrow();
});
```

**Required-field enumeration + non-empty/trim check** (from `02-RESEARCH.md:373-386`): assert each of the six required fields is a non-empty trimmed string, `basis` ∈ `{'real','nominal'}`. Targets `DEFAULTS` only — Phase-1 synthetic fixtures are exempt (D-12). Reject `""`/whitespace, not just `null` (Pitfall 6).

---

### `src/core/__tests__/calibration.test.ts` — drag back-solve + divergence sanity (test, calibration)

**Analog:** `src/core/__tests__/invariants.test.ts:84-210` (`describe('MODEL-04 invariants...')`) — runs `projectionEngine` on a `makeSyntheticParams` fixture and asserts on `result.series` snapshots.

**Engine-output assertion pattern to copy** (`src/core/__tests__/invariants.test.ts:90-113`):
```typescript
const params = makeSyntheticParams({ dragStrength: { value: 0, basis: 'real', source: null } });
const result = projectionEngine(syntheticInputs, params);
const finalSnap = result.series.at(-1)!;
// ... derive expected, compare with relErr(...) < tolerance, descriptive message ...
expect(err, `... relErr should be <1e-9; got ${err.toExponential(3)}`).toBeLessThan(1e-9);
```

**Imports/fixture convention** (`src/core/__tests__/invariants.test.ts:16-20`):
```typescript
import { describe, it, expect } from 'vitest';
import { projectionEngine } from '../engine.js';
import { analyticOrdinaryAnnuity, relErr, makeSyntheticParams, syntheticInputs } from './testUtils.js';
```
For Phase 2 this file additionally imports `DEFAULTS` from `../../data/defaults.js` and runs the engine on real defaults. Back-solve harness reuses the (now CR-01-hardened) `bisect` because asset-inflation-share is monotone in `dragStrength` (`02-RESEARCH.md:349-367`); divergence sanity-check follows the relative-bound recommendation in `02-RESEARCH.md:394-406`. Use `relErr`/`DIST_TOL` from `testUtils.ts` — do not introduce ad-hoc epsilons (`testUtils.ts:35-46`).

---

### `src/core/__tests__/invariants.test.ts` — re-run D-12 battery on `DEFAULTS` (test, invariant)

**Analog:** self — the `MODEL-04 invariants` `describe` block (`src/core/__tests__/invariants.test.ts:84-210`). D-09 adds a parallel block (or parametrizes the existing one) that swaps `makeSyntheticParams()` for the real frozen `DEFAULTS` and re-asserts: drag=0 collapse, non-conservation/no-transfer, no negative real wealth, monotone divergence.

**Battery to re-run** — the four `it(...)` cases at lines 90, 126, 165, 189. Keep the existing synthetic cases green; add a `DEFAULTS`-fed mirror (import `DEFAULTS` from `../../data/defaults.js`; engine consumes it via the same `projectionEngine(inputs, params)` boundary). The `sumAnchors` helper (lines 47-49) and the non-conservation reasoning (lines 115-153) carry over unchanged — only the params source changes.

## Shared Patterns

### Fail-loud guard (no silent clamp)
**Source:** `src/core/types.ts:36-40` (`assertReal`)
**Apply to:** `distribution.ts` CR-01 + CR-02 guards (D-02)
```typescript
export function assertReal(p: { basis: 'real' | 'nominal' }, ctx: string): void {
  if (p.basis !== 'real') {
    throw new Error(`Basis violation in ${ctx}: expected real, got ${p.basis}`);
  }
}
```
Convention: throw a descriptive `Error` naming the offending value, the violated bound, and the parameter/context. Never clamp, never return a fallback.

### Negative "test-the-test" discipline
**Source:** `src/core/__tests__/basis.test.ts:27-31, 44-56`
**Apply to:** `distribution.test.ts` (CR-01/CR-02 throws), `sourcing.test.ts` (blanked-field NEGATIVE case)
```typescript
expect(() => /* deliberately broken call */).toThrow(/specific regex on the message/);
```
Every fail-loud guard added in this phase ships with a paired negative test asserting the throw, with a regex on the message text.

### Enumeration-driven enforcement test
**Source:** `src/core/__tests__/invariants.test.ts:54-79`
**Apply to:** `sourcing.test.ts` (enumerate every `SourcedParam` in `DEFAULTS`)
Pattern: walk a collection, accumulate violations into an array, assert `.toHaveLength(0)` (or throw) with a joined human-readable diagnostic listing every offender.

### Shared tolerance / no ad-hoc epsilons
**Source:** `src/core/__tests__/testUtils.ts:29, 44-46` (`DIST_TOL`, `relErr`)
**Apply to:** `calibration.test.ts`, extended `invariants.test.ts`
```typescript
export const DIST_TOL = 1e-6;
export function relErr(actual: number, expected: number): number {
  return Math.abs(actual - expected) / Math.max(Math.abs(expected), 1e-12);
}
```
Use the single documented `relErr` + `DIST_TOL` (loose) / `<1e-9` (golden-master) two-tolerance scheme; do not invent new epsilons.

### Injected-not-imported data boundary
**Source:** `src/core/__tests__/invariants.test.ts:42-79` (`FORBIDDEN_PATTERN` import-boundary scan)
**Apply to:** `src/data/defaults.ts`, `src/data/sources.ts`
`core/` source files are scanned for forbidden imports; `data/` must be passed *into* the engine by tests/composition root, never imported *by* `core/`. The existing scan already enforces a no-`node:`/no-`fs` rule on `core/` — a `core/ → data/` import would also be an architecture violation the planner must guard against (consider extending the scan or a dedicated assertion).

### Decision-ID-annotated JSDoc headers
**Source:** `src/core/types.ts:1-10, 46-50, 97-133`; every test file's header block (e.g. `distribution.test.ts:1-44`, `invariants.test.ts:1-15`)
**Apply to:** all new/modified files
Every module and test opens with a `/** ... */` header naming the requirement/decision IDs covered (e.g. `MODEL-04`, `D-12`, `DATA-04`, `CR-01`) and the patterns/sources it implements. New files (`sources.ts`, `defaults.ts`, `sourcing.test.ts`, `calibration.test.ts`) must carry the same header style; new `SourceRecord` fields get one JSDoc line each citing D-10.

## No Analog Found

None. Every Phase 2 file has a strong in-repo analog. The `data/` directory does not yet exist, but its construction pattern is fully covered by `testUtils.ts`'s `makeSyntheticParams`/`synParam` (same `Params`/`SourcedParam` tree shape, differing only in `Object.freeze` + real `SourceRecord` vs `source:null`). The planner does NOT need to fall back to RESEARCH.md generic patterns for any file.

## Metadata

**Analog search scope:** `src/core/*.ts`, `src/core/__tests__/*.ts` (full `src` tree enumerated; only `core/` exists pre-phase — no `src/data/`, no UI/state/selectors yet, consistent with phase boundary)
**Files scanned:** 13 source/test files (types.ts, distribution.ts, engine.ts, drag.ts, tiers.ts, relativePosition.ts + 7 test files); 4 read in full or targeted (types.ts, testUtils.ts, invariants.test.ts, basis.test.ts) + 3 targeted reads of distribution.ts (paretoConditionalMean/calibrateCurve/bisect) and distribution.test.ts header
**Pattern extraction date:** 2026-05-16
