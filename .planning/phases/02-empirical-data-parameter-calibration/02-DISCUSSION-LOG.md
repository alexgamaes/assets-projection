# Phase 2: Empirical Data & Parameter Calibration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 2-empirical-data-parameter-calibration
**Areas discussed:** CR-01/CR-02 precondition handling, Return-anchor estimate selection, Drag-strength derivation philosophy, Source-record schema & enforcement strictness

---

## CR-01/CR-02 precondition handling

| Option | Description | Selected |
|--------|-------------|----------|
| Fix both first, then calibrate | Bracket guard + alpha>1 assertion as first task before real data | ✓ |
| Document & constrain only | No engine change; constrain calibrated anchors only | |
| Fix alpha guard only | Alpha assertion only; bracket as documented constraint | |

**User's choice:** Fix both first, then calibrate.

| Option | Description | Selected |
|--------|-------------|----------|
| Throw with diagnostic | Error names offending value, bound, parameter (assertReal pattern) | ✓ |
| Throw plus calibration-time check | Same throw + dedicated default-set assertion | |
| Clamp to safe domain | Silently clamp; rejected (hides errors) | |

**User's choice:** Throw with diagnostic.
**Notes:** Calibration-time check folded into the D-11 sourcing/divergence test discussion rather than duplicated here.

---

## Return-anchor estimate selection

| Option | Description | Selected |
|--------|-------------|----------|
| Central/midpoint, triangulated | Central estimate across cited sources; range recorded | ✓ |
| Conservative low end | Lower end of ranges; risks muting the thesis | |
| Headline from single strongest source | One authoritative source per param | |

**User's choice:** Central/midpoint, triangulated.

| Option | Description | Selected |
|--------|-------------|----------|
| Gradient = corrected spread, anchors triangulated | ~500bp/~10pp sizes gradient; anchors placed via tier-specific evidence; no literal "18" | ✓ |
| Anchor endpoints only | Fix median + top0.1 from spread; interpolate middle | |
| Document old vs corrected delta | Same as recommended + record discarded 18pp in notes | |

**User's choice:** Gradient = corrected spread, anchors triangulated.

| Option | Description | Selected |
|--------|-------------|----------|
| Correct PROJECT.md + trail in source notes | Fix shorthand this phase + discarded-18pp trail per anchor | ✓ |
| Correct PROJECT.md only | Fix shorthand, no per-param trail | |
| Defer to phase transition | Let /gsd-transition fix at close | |

**User's choice:** Correct PROJECT.md + record trail in source notes.
**Notes:** Closes the STATE.md cross-cutting "~18pp must be corrected before Phase 2 closes" blocker; the discarded-figure trail also satisfied the rejected "document delta" option's intent.

---

## Drag-strength derivation philosophy

| Option | Description | Selected |
|--------|-------------|----------|
| Back-solve from historical baseline run | Choose dragStrength so model matches McKinsey ~80% over baseline | ✓ |
| Documented heuristic with stated assumptions | Closed-form mapping with explicit assumptions | |
| Treat ~80% as direct coefficient | dragStrength ≈ 0.8 directly; weakest derivation | |

**User's choice:** Back-solve from a historical baseline run.

| Option | Description | Selected |
|--------|-------------|----------|
| McKinsey ~80% asset-inflation share | Match share of net-worth growth from haircut | ✓ |
| McKinsey ~1.3× asset/GDP ratio | Growth-ratio target instead | |
| Both as cross-check | Solve on ~80%, verify ~1.3× | |

**User's choice:** McKinsey ~80% asset-inflation share.

| Option | Description | Selected |
|--------|-------------|----------|
| Calibration test asserts non-conservation | Re-run D-12 invariants at calibrated dragStrength | ✓ |
| Bound dragStrength to safe range | Guard by construction | |
| Rely on existing Phase 1 tests | Trust structural D-12 battery | |

**User's choice:** Calibration test asserts non-conservation.

---

## Source-record schema & enforcement strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Structured object, required fields | 6 required fields (sourceName, figureUsed, basis, definition, yearVintage, retrievedDate) | ✓ |
| Structured object + optional notes/url | Same 6 + optional url/note | |
| Keep string, enforce by convention | Freeform string; weak enforcement | |

**User's choice:** Structured object, required fields.

| Option | Description | Selected |
|--------|-------------|----------|
| Add optional note + url fields | 6 required + optional note (trail) + url (VIZ-06) | ✓ |
| Fold trail into definition field | Overload definition; no structured url | |
| Add optional note only, no url | Defer url to Phase 3 | |

**User's choice:** Add optional note + url fields.
**Notes:** Reconciled with the Area-2 decision that each anchor must carry the discarded-18pp trail, and forward-looks to Phase 3 VIZ-06 citations.

| Option | Description | Selected |
|--------|-------------|----------|
| Failing test in suite + CI | Enumerates frozen defaults; fails on missing field | ✓ |
| Type-level impossibility + runtime guard | No null in types + validator | |
| Both: types forbid null AND completeness test | Belt-and-braces | |

**User's choice:** Failing test in the suite + CI.

| Option | Description | Selected |
|--------|-------------|----------|
| Gate only the frozen default set | Test fixtures may keep synthetic null | ✓ |
| Gate defaults; synthetic explicitly tagged | Synthetic must carry synthetic:true | |
| No synthetic anywhere | Remove all source:null repo-wide | |

**User's choice:** Gate only the frozen default set.

---

## Claude's Discretion

- Exact `SourceRecord` field types (reuse of branded basis types).
- Module/file layout of the frozen defaults module (within `core/` architecture).
- Precise shape of the divergence sanity-check (success criterion 5).
- Horizon default value within ENTRY-03's ~30–40y band (UX default, not sourced).

## Deferred Ideas

- Dynamic tail resolution (top 0.01%+ anchor / adaptive tail) — revisit post-calibration only if needed.
- Cost-of-living / survival-threshold overlay — v2 / backlog.
- ~1.3× asset/GDP ratio as an optional drag cross-check — not required this phase.
