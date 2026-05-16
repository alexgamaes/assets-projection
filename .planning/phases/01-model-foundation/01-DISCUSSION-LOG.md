# Phase 1: Model Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 1-model-foundation
**Areas discussed:** Drag coupling formula, Distribution representation, Tier movement, Test rigor & tolerance, Savings & inflation handling

---

## Drag coupling formula

### Drag driver

| Option | Description | Selected |
|--------|-------------|----------|
| Top-tier wealth growth rate | `assetInflation_n = dragStrength × aggregate top growth rate`; simple, monotonic, collapses to 0; matches ARCHITECTURE sketch | ✓ |
| Top-tier share of total wealth | Inflation scales with concentration; self-reinforcing but hard to cite, runaway risk | |
| Top growth above a baseline | Only excess-over-reference growth feeds inflation; defensible but adds a baseline param | |

**User's choice:** Top-tier wealth growth rate

### Top set definition

| Option | Description | Selected |
|--------|-------------|----------|
| Top 1% + top 0.1% | Wealthy tiers driving asset-price inflation | |
| Top 10% and above | Broader capital-owning set | |
| Configurable threshold | Sourced/overridable param | |
| **Other (user)** | Dynamic: smallest set of top percentiles holding ≥50% of total wealth; ~10% today, tightening to ~1% as concentration rises | ✓ |

**User's choice:** Free-text — dynamic 50%-of-total-wealth top set, self-tightening over the horizon.
**Notes:** Boundary method (discrete whole-tier vs interpolated) deferred and resolved with Distribution representation. Locked as "exact interpolated percentile where cumulative-from-top wealth = 50%, on a continuous distribution." User asked for a recommendation; agreed to the continuous-parametric-distribution approach that resolves drag boundary + return interpolation + relative position coherently.

---

## Distribution representation

### Parametric form

| Option | Description | Selected |
|--------|-------------|----------|
| Lognormal body + Pareto tail | Empirically standard; best fit to all 4 anchors + concentration; more calibration params | ✓ |
| Pure Pareto | Simplest, one shape param; mis-fits the body/median | |
| Piecewise log-linear through anchors | Minimal assumptions, hits anchors exactly; less smooth, needs tail extrapolation rule | |

**User's choice:** Lognormal body + Pareto tail
**Notes:** Pareto tail extrapolates past top 0.1% — addresses the PROJECT.md "dynamic tail resolution" follow-up without a 5th anchor.

### Tier movement / evolution

| Option | Description | Selected |
|--------|-------------|----------|
| Re-fit curve each year from evolving anchors | Endogenous; distribution diverges per the thesis; user percentile re-read each year | ✓ (default) |
| Fixed-shape curve, scaled over time | Shape can't change; concentration can't rise | ✓ (selectable) |
| User percentile fixed at entry | Kills MODEL-02 moving tier | |

**User's choice:** Free-text — "1 by default, but allowing to choose 2"
**Notes:** Default = endogenous re-fit; engine exposes `distributionEvolution` param switch for the fixed-shape-scaled alternative. UI exposure is a later/v2 concern.

---

## Test rigor & tolerance

### Closed-form reference

| Option | Description | Selected |
|--------|-------------|----------|
| Drag-off single-tier analytic | Exact compound-interest + annuity closed form | |
| Full multi-tier hand-derived fixture | Whole pipeline incl. drag/re-fit; spreadsheet-derived, brittle | |
| Both | Analytic for tolerance criterion + hand-derived fixture for coupling | ✓ |

**User's choice:** Both

### Horizon & tolerance

| Option | Description | Selected |
|--------|-------------|----------|
| 60y, rel-err < 1e-9 | Covers ENTRY-03 bound; tight, achievable for double-precision | ✓ |
| 60y, rel-err < 1e-6 | Looser; could mask small bugs | |
| 100y, rel-err < 1e-9 | Extra headroom; not user-facing in v1 | |

**User's choice:** 60y, rel-err < 1e-9

---

## Savings & inflation handling

### Savings behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Constant real | Fixed in today's-money terms; no in-engine inflation param; cleanest under real-only invariant | ✓ |
| Constant nominal (deflated) | Real value erodes; introduces a nominal concept into a real-only core | |
| Real, growth-indexed | Real growth at a configurable rate; extra sourced param + knob | |

**User's choice:** Constant real

### Savings timing

| Option | Description | Selected |
|--------|-------------|----------|
| End of year | Ordinary annuity; matches closed-form reference | ✓ (Claude's discretion) |
| Start of year | Annuity due; slightly higher terminal wealth | |
| You decide | Defer to Claude | ✓ |

**User's choice:** "You decide" → Claude chose end-of-year (ordinary annuity) to keep the analytic golden-master exact.

---

## Claude's Discretion

- Savings timing → end-of-year ordinary annuity (`W_{n+1} = W_n·(1+r) + S`).
- Basis-enforcement mechanism (branded types vs runtime field vs Zod) — not discussed; requirement MODEL-05 fixed, mechanism open.
- Parameter object shape and synthetic-placeholder source structure — open; must be Phase-2-ready.
- Module layout — follow ARCHITECTURE.md functional-core structure unless planner finds reason to deviate.

## Deferred Ideas

- **Cost-of-living / survival-threshold reference overlay** — toggleable informational reference line; not in v1 requirements; new capability needing its own sourced data + viz + neutrality review. Roadmap backlog / v2 candidate. Not acted on in Phase 1.
- **User-as-test-particle, basis-enforcement mechanism, param schema & source field** — candidate gray areas surfaced but not discussed; left to researcher/planner discretion, recorded so not dropped.
