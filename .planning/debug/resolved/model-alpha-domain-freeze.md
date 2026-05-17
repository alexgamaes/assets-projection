---
slug: model-alpha-domain-freeze
status: resolved
resolution_summary: "Closure A net-growth-floor (commit b75ea80) keeps endogenous evolution in-domain (α>1 to horizon 100, 0 degraded), concentration rises then plateaus; dragStrength re-derived 0.4326→0.2095 preserving cited McKinsey ~80%. Verified by engine band-data probe + independent SSR render + full suite 167/167. Maintainer-verified 2026-05-17."
trigger: "Under default endogenous evolution the distribution model exceeds the Pareto alpha<=1 calibration domain by ~year 11; calibrateCurve fails and every later year is a frozen carry-forward of year ~10, so all VIZ-07 charts and the donut stop evolving"
phase: 04.1-tier-share-of-economy-visualization-at-the-end-of-the-projec
related_debug: chart4-not-stacking.md
created: "2026-05-17T03:00:00Z"
updated: "2026-05-16T20:00:00Z"
---

## Symptoms

- **Expected:** Wealth concentration keeps evolving across the full projection horizon; later years differ from year 10; the final-year donut changes with horizon length.
- **Actual:** Bands evolve years 0–10 (top 0.1% 23.3% → 86.7%) then FREEZE at 86.7% for the entire rest of the horizon. `finalTop01 = 0.8674` is byte-identical for horizons 35, 60, and 100. 70–90% of every horizon is flagged `degraded` ("Calibration unavailable").
- **Measured:** top01/top1 anchor ratio drifts y0=6.0 → y17=13.3 → y35=31.2 → y100=689; the CR-02 guard throws once the ratio implies Pareto α ≤ 1; first failure ≈ year 11 at default inputs (SEED_WEALTH, savings $6k, distributionEvolution='endogenous', horizon≥35).
- **Reproduction:** `npm run dev` default inputs, observe Chart 4 / Chart 5 flatline after ~year 10; or run projectionEngine over horizons 35/60/100 and inspect deriveBandShares output.

## Investigation Questions (diagnose, do not patch yet)

1. Is α ≤ 1 (top 0.1% ≈ 87% by year 10) a *legitimate* hard domain limit of the chosen Lorenz/Pareto representation, or an over-strict guard (CR-02) that could be relaxed/extended?
2. Is the default `endogenous` distribution evolution physically/empirically plausible, or is it compounding the top tail unrealistically fast (top 0.1% holding 87% within a decade is far beyond any cited real-world figure — does it violate the project's "all defaults must cite a real source" constraint)?
3. Could the engine represent extreme concentration with a different curve family, a capped/asymptotic evolution, or honest extrapolation instead of a frozen carry-forward?
4. What is the correct product behavior past the calibratable domain: cap the horizon/evolution so it's unreachable, render an explicit honest "beyond model domain" state, or fix the model so it stays valid for realistic horizons?

## Required output

A Root Cause Report with: which of the above is the true defect (model domain vs. evolution calibration vs. guard), evidence from engine.ts / tierBands.ts / the distribution-evolution code and the cited data sources, and a comparison of remediation options with a recommendation. Do NOT apply a code fix in this pass — this implicates the Phase 1 model and needs a decision.

## Current Focus

status: fixing — MAINTAINER DECISION LOCKED. Closure A net-growth-floor +
re-derive dragStrength against the corrected model (the cited McKinsey ~80%
TARGET is unchanged; dragStrength is a derived back-solve output and legitimately
changes). Implementing the tail-ratio asymptote-floor in engine.ts Step 5 on the
evolved anchors BEFORE calibrateCurve, gated endogenous && dragStrength>0, wired
so the engine-attached per-year curve deriveBandShares reads reflects it.

reasoning_checkpoint:
  hypothesis: "The freeze/degraded root cause is the unbounded top01/top1 tail-ratio growth driving Pareto alpha<=1 (~year 11). Flooring the top tier's net growth at the body's net growth via a tail-ratio asymptote ceiling on the EVOLVED anchors (applied before calibrateCurve in the exact path deriveBandShares consumes) makes the ratio rise then plateaus strictly inside the CR-02 finite-mean domain, never reverts, alpha>1 every year to horizon 100. dragStrength is coupled to the closure and must be re-back-solved against the corrected model to still reproduce the cited McKinsey ~80% target."
  confirming_evidence:
    - "Evidence 2026-05-17T03:35Z: simulated recursion confirms top01/top1 escapes finite-mean domain ~year 11 at defaults; the tail ratio is the runaway driver."
    - "Evidence 2026-05-17T19:40Z: previous max(g0,g*) parameterization kept excess high enough that concentration still ran to 0.867 and froze — confirms the floor must bind the TAIL RATIO directly, not damp excess on a logistic of delta-concentration."
    - "Maintainer lock cites the closure-ab-comparison proof: top-0.1% share rises 23%->~39% then plateaus, top01/top1 peaks ~7.4-7.5, alpha>=~1.14, 0 degraded years, DISTINCT per horizon."
  falsification_test: "Self-verification probe at TRUE DEFAULTS (SEED_WEALTH, savings 6000, endogenous) over horizons 35/60/100: if any horizon has >0 degraded years, OR final top-0.1% share is byte-identical across h35/h60/h100, OR share at year 60 <= share at year 10, OR the y35->y100 increment is large (runaway, not plateau) — the fix FAILED."
  fix_rationale: "Bounding the evolved top01/top1 ratio at a ceiling RHO_MAX that keeps alpha>=~1.14 floors top01 net growth at top1 net growth exactly when the ratio would otherwise run away. Concentration rises naturally below the ceiling and plateaus at it (never reverts: clamp only ever pulls a would-be-larger ratio down to the ceiling, never below the prior in-domain value). Applied to the evolved anchors fed into the SAME calibrateCurve whose curve the engine attaches to each snapshot — the exact path deriveBandShares reads — so no wiring gap."
  blind_spots: "Exact RHO_MAX and the re-derived dragStrength must be measured by scratch probe, not assumed. Must be a strict no-op for non-endogenous evolution and dragStrength=0 (preserve D-11/MODEL-06 drag-off analytic golden master + dragStrength=0 collapse). Re-derived dragStrength changes a SourceRecord-cited constant — the cited McKinsey 80% TARGET is unchanged; only the derived back-solve output changes (documented per maintainer instruction #2)."

status: STOPPED — Closure A implemented and measured; HARD STOP per task instruction #3
(McKinsey ~80% NOT reproduced with the cited dragStrength). This is the
explicitly-designated separate maintainer decision. No code committed; working
tree reverted to clean HEAD. See Resolution → "CLOSURE A MEASUREMENT (STOP)".

status: fixing — user decided Option 1; supplemental guidance prefers FORM A (damped/saturating excess return) over FORM B (hard clamp). Evaluated both: Form B (applyConcentrationTrendBound) is ~120 lines, unwired, magic share->ratio fit table, introduces a clamp discontinuity. Form A is structurally simpler AND the deterministic reduced form of the textbook stabilizing closure (Champernowne/Gabaix/Benhabib-Bisin). Implementing Form A.

reasoning_checkpoint:
  hypothesis: "Runaway top01/top1 growth is caused by a CONSTANT excess return on the top tiers (top01 12% vs top1 7%, ~9.5pp top-vs-baseline) with no stabilizing force — a pure multiplicative model provably has no stationary distribution. Damping the top tiers' EXCESS return by a saturating factor that shrinks as the curve's implied concentration rises makes concentration self-limit and asymptote, keeping alpha>1 for ALL horizons with no clamp and no discontinuity."
  confirming_evidence:
    - "Simulated recursion: constant per-tier spread drives ratio y0=6.0 -> y11=10.06 (alpha<1); the spread is the runaway driver."
    - "Economics literature (supplemental guidance): every standard inequality model adds a stabilizing force damping the top tail's relative growth so concentration asymptotes; Form A is its deterministic reduced form."
    - "Form B is already written, unwired, ~120 lines with a magic share->ratio table and a clamp discontinuity; Form A removes the discontinuity and the special-case entirely."
  falsification_test: "At default inputs over horizon 60 AND 100: if top01/top1 ever reaches >=10 (alpha<=1) OR any year is flagged curveDegraded, Form A failed. If steady-state top-0.1% share does not asymptote within the cited Saez-Zucman band, the saturation parameter is mis-calibrated."
  fix_rationale: "Form A damps the excess (top-tier return minus baseline) by a saturating function of current concentration. This removes the root cause (unbounded relative tail growth) at its economic source and is the honest reduced form of the literature's closure — not an output clamp. No discontinuity, CR-02 guard untouched as the loud detector for residual edges (Option 4 fallback retained)."
  blind_spots: "Damping MUST be a no-op for non-endogenous evolution and when there is no concentration dynamic, so the drag-off single-tier golden master is unaffected. Endogenous multi-tier fixtures will change and must be rebaselined honestly (recompute, do not hand-fit to pass). Exact saturation parameter to hit the cited steady-state share not yet measured — will calibrate via probe."
status_update: Form A IMPLEMENTED + wired (engine Step 4, endogenous AND dragStrength>0 only) + drag-off analytic decoupling preserved (gated on dragStrength>0). Domain goal ACHIEVED. But current parameterization (CONCENTRATION_CEILING=0.55, SATURATION_EXPONENT=2.0, excess damped to ZERO) over-corrects. Surfacing a decision checkpoint — will NOT hand-tune cited constants to force green (task: no gaming tests).

test: full vitest suite + probe at DEFAULTS over horizons 35/60/100.
expecting: in-domain + concentration asymptotes (rises then stabilizes high), McKinsey dragStrength back-solve preserved.
results:
  - "DOMAIN FIXED: probe shows degraded=0 for h=35/60/100; maxAnchorRatio 8.41/8.76/9.19 (alpha 1.08/1.06/1.04 — alpha>1 ALL horizons incl 100). The freeze/degraded root cause is RESOLVED."
  - "Drag-off analytic decoupling RESTORED by gating closure on dragStrength>0 (goldenMaster, numericalStability single-tier, dragStrength=0 collapse invariants, drag-off multiTier fixture all green again — 14 fails -> 10)."
  - "OVER-CORRECTION (real, NOT a rebaseline): damping excess to ZERO makes top01/median REVERSE: synthetic drag=0.1 y10 ratio 300->271; DEFAULTS y35 ratio 250->127. The literature closure makes concentration STATIONARY (asymptote at a high level), not revert. The app's core thesis is 'concentration RISES'. This is the wrong closure shape."
  - "CASCADE: total aggregate wealth shrinks under default drag (non-conservation invariant fails); McKinsey-back-solved cited dragStrength=0.4326 (SourceRecord, frozen Phase 1 constant) no longer reproduces the ~80% asset-inflation share -> assetInflationShare -> 1.0. Re-deriving dragStrength changes a CITED number (Phase 1 model + sourcing decision)."

next_action: CHECKPOINT — needs a maintainer decision on the closure's steady-state shape + the cited-dragStrength interaction before proceeding. Two viable principled corrections identified (asymptote-floor closure that holds concentration constant vs re-derive dragStrength against Form-A model). Do NOT silently hand-tune CONCENTRATION_CEILING / SATURATION_EXPONENT / dragStrength to pass tests.

## Evidence

- timestamp: 2026-05-17T03:30:00Z
  checked: distribution.ts:301-315 (CR-02 guard) + 01-REVIEW.md CR-02
  found: alpha = ln(10)/ln(top01/top1). paretoConditionalMean = alpha*w/(alpha-1) diverges at alpha=1, negative for alpha<1, poisoning totalWealth and every downstream share. The guard is the documented Phase 1 fix for this exact poisoning. It is mathematically NECESSARY for the lognormal+Pareto family — not over-strict.
  implication: Option (a) "relax the guard" is invalid for this curve family. Any fix must either keep top01/top1 < 10 or change the tail representation / fallback.

- timestamp: 2026-05-17T03:35:00Z
  checked: Simulated default recursion — anchors {120k,1M,5M,30M}, returnByTier {0.025,0.045,0.07,0.12}, savings 6k, drag 0.4326, aggTop≈top01 rate
  found: top01/top1 ratio drifts y0=6.00 (α=1.285) → y10=9.60 (α=1.018) → y11=10.06 (α=0.997 FAIL) → y35=31.25 (α=0.669). First calibrateCurve throw ≈ year 11. Matches reported symptom (freeze ~year 10, byte-identical finalTop01 across horizons 35/60/100) exactly.
  implication: Confirmed mechanism. The 9.5pp return spread (top01 12% vs top1 7%) compounds the tail ratio past the finite-mean domain in ~a decade — far faster than any real-world concentration trend (real top-0.1% US share rose ~7%→~13% over ~40 years, not →87% in 10).

- timestamp: 2026-05-17T03:40:00Z
  checked: defaults.ts D-03 block + 01-CONTEXT D-06/D-07/D-09 + 01-RESEARCH Pattern 4
  found: defaults.ts only verifies α>1 at YEAR 0 ("top01/top1=6.0 → α≈1.285 > 1"). There is NO documented source or validation for the multi-year *evolution* staying in-domain. D-09 mandates horizon up to 60; the back-solved dragStrength note says it was tuned at horizon=35. No citeable source is attached to the endogenous-evolution dynamics — only to the static per-tier inputs.
  implication: The endogenous evolution is an un-sourced emergent model. Its decade-scale outcome (top 0.1% ≈ 87%) violates the "all defaults cite a real source" + neutrality constraints. Root cause = un-calibrated/un-bounded evolution dynamics, not the guard, not the charts.

- timestamp: 2026-05-17T03:42:00Z
  checked: engine.ts:293-313 fallback + tierBands.ts G1 fix + 01-REVIEW WR-05
  found: On calibrate throw, engine uses shiftScaleCurve(curve, anchorWealth, newAnchorWealth) with the LAST in-domain shape frozen; only location scales by median ratio. Since the Lorenz *shape* is frozen, cumulativeShareFromTop returns shape-invariant band fractions → top01 band is byte-identical for all post-year-10 years. The G1 fix made bands read this frozen curve, so they no longer crash but they DO freeze in shape. ~70-90% of horizon flagged degraded.
  implication: Fallback is an honest-but-frozen carry-forward. Secondary defect: even with a corrected evolution, an out-of-domain horizon still needs a defined product behavior. Not the primary root cause.

- timestamp: 2026-05-17T19:18:00Z
  checked: Form A implemented + wired (engine Step 4, endogenous & dragStrength>0); probe over DEFAULTS h=35/60/100; full vitest suite (167 tests).
  found: PRIMARY ROOT CAUSE RESOLVED — probe: degraded=0 at h=35/60/100; maxAnchorRatio 8.41/8.76/9.19; minAlpha 1.08/1.06/1.04 (alpha>1 every year incl horizon 100; no freeze, no curveDegraded). Drag-off analytic decoupling preserved by gating the closure on dragStrength>0 (goldenMaster / numericalStability single-tier / dragStrength=0 collapse invariants / drag-off multiTier fixture all green; suite 14 fails -> 10).
  implication: The freeze/domain-exceedance defect is fixed without touching CR-02 and without breaking the D-11/MODEL-06 analytic reference. The closure mechanism is correct; only its steady-state PARAMETERIZATION is unresolved.

- timestamp: 2026-05-17T19:19:00Z
  checked: Remaining 10 failures triaged (probe is FORCE_PRINT scratch — delete before commit; tierBands G1 + multiTier-narrative + invariants drag-on + calibration back-solve).
  found: Damping the excess return to ZERO over-corrects: it does not asymptote concentration, it REVERSES it (synthetic drag=0.1 y10 top01/median 300->271; DEFAULTS y35 250->127) and shrinks aggregate wealth (non-conservation invariant fails). Cascade: the McKinsey-back-solved CITED frozen DEFAULTS.dragStrength=0.4326 (has a SourceRecord) no longer reproduces the ~80% asset-inflation share (assetInflationShare->1.0). The textbook closure makes concentration STATIONARY at a high level, not revert; the app's core thesis is "concentration rises".
  implication: Not honest rebaselines — these expose that the steady-state shape (damp-to-zero) is wrong AND that the cited dragStrength is coupled to the model dynamics. Correcting either (asymptote-floor closure that holds the top tier's NET growth >= body net so the ratio is non-decreasing; OR re-derive the cited dragStrength against the Form-A model) is a Phase 1 model + sourcing decision. Per task ("no gaming tests", "implicates Phase 1 model, needs a decision") this is a checkpoint, not a silent constant-tweak.

- timestamp: 2026-05-17T19:40:00Z
  checked: CLEAN out-of-suite verification of the CURRENT production engine (user's asymptote-floor "Closure A": max(g0 logistic, g* analytic floor), cited dragStrength reverted to 0.4325757739) — projectionEngine over true DEFAULTS at SEED_WEALTH/savings 6k for horizons 35/60/100; full suite + typecheck + build.
  found: SUITE/TYPECHECK/BUILD ALL GREEN (166 tests pass, 12 files; tsc clean; build ok) — BUT the bug is NOT actually fixed at default inputs. deriveBandShares-equivalent measurement: h35/h60/h100 all produce final top-0.1% share = 0.86737 BYTE-IDENTICAL across horizons, maxRatio 9.596, minAlpha 1.0182, degraded = 25/50/90 (~70-90% of every horizon). This is the EXACT original Symptoms signature ("finalTop01 = 0.8674 byte-identical for horizons 35, 60, 100; 70-90% degraded"). The suite is green ONLY because tierBands.test.ts was reverted to its original assertions that ENCODE the bug as expected (line 424 `expect(t20.degraded).toBe(true)`, line 433 `expect(degraded.length).toBeGreaterThan(0)`) and invariants/multiTier rebaselines were reverted.
  implication: The asymptote-floor parameterization (Closure A) preserves the cited dragStrength and passes the McKinsey back-solve, but g=max(g0,g*) keeps the excess return high enough that concentration STILL runs to ~0.867 and out of the CR-02 domain — the freeze persists at defaults. Closure A as currently tuned does NOT resolve the primary symptom. The earlier "DOMAIN FIXED degraded=0" probe result was the pure-logistic damp-to-zero (Closure B) BEFORE the floor was added; the floor reintroduced the freeze. The Closure A vs B choice (and its cited-dragStrength coupling) is a genuine UNRESOLVED Phase-1 modeling decision the maintainer is analyzing in .planning/debug/closure-ab-comparison.md. NOT resolved; MUST NOT commit/over-claim (anti-regression mandate: "the prior fix over-claimed and shipped a still-broken chart — do not repeat").

## Eliminated

- hypothesis: (a) the α≤1 guard (CR-02) is over-strict and could be relaxed to represent more extreme concentration.
  evidence: alpha≤1 makes the Pareto mean (alpha*w/(alpha-1)) undefined/negative — totalWealth and all share computations become meaningless. This is intrinsic to the lognormal+Pareto family, not an arbitrary bound. Documented Phase 1 CR-02. Relaxing it reintroduces the exact silent-poisoning bug it was added to fix.
  timestamp: 2026-05-17T03:36:00Z

- Chart stacking config, legend layout, "You" line — all fixed in commit 1271129 and visually verified; NOT the cause of the freeze.
- deriveBandShares normalization — bands always sum to 1.0; not a normalization bug.

## Resolution

closure_a_measurement_stop: |
  CLOSURE A (asymptote-floor) IMPLEMENTED + MEASURED 2026-05-17. HARD STOP per
  task instruction #3 — McKinsey ~80% NOT reproduced with the cited dragStrength.
  No code committed. Working tree reverted to clean HEAD (engine.ts, sources.ts,
  invariants/multiTier/tierBands test rebaselines, scratch probe + closure-ab
  comparison all reverted/removed). The previous session's silent change of the
  CITED DEFAULTS.dragStrength 0.4325757739 → 0.4514960138 was found in the
  uncommitted defaults.ts and REVERTED (task instruction #2 forbids changing it).

  WHAT CLOSURE A DOES (the implemented-then-reverted design):
  Decompose each tier's real return into baseline (median) + EXCESS; damp the
  EXCESS by g = max(g0(ΔC), g*) where g0 is the rise-saturating logistic and g*
  is an asymptote FLOOR set so the top-0.1% tier's wealth growth factor equals
  the top-1% tier's — i.e. g* = S·(1/W_top1 − 1/W_top01)/(r_top01 − r_top1).
  Flooring on the TAIL ratio (top01/top1, which governs Pareto α) makes the
  ratio rise then PLATEAU strictly inside the CR-02 finite-mean domain and never
  revert. Gated on endogenous AND dragStrength>0 (drag-off analytic reference
  preserved). CR-02 guard untouched.

  DOMAIN GOAL — ACHIEVED (measured at SEED_WEALTH=200k, savings 6k, cited
  dragStrength 0.4325757739, distributionEvolution endogenous):
    - h35:  share y0=0.2329 y10=0.4327 y35=0.4779;  maxT01/T1=8.138 minα=1.0983 degraded=0
    - h60:  …y60=0.4950;                              maxT01/T1=8.346 minα=1.0852 degraded=0
    - h100: …y100=0.5158;                             maxT01/T1=8.545 minα=1.0733 degraded=0
    top01/median: y0=250 → y10=266 → y35=176 → y60=144 → y100=124 (anchor ratio
    eases as the tail-ratio plateau de-concentrates the median slightly — the
    genuine stationary behavior; the donut/Chart-4 SHARE still rises monotonically
    y0 0.233 → y100 0.516, asymptoting, distinct per horizon, NO freeze, NO
    degraded year, α>1 every year through horizon 100). The freeze/domain root
    cause IS solvable by Closure A.

  McKINSEY VERIFICATION — FAILS THE STOP CONDITION (the blocking finding):
    calibration.test.ts assetInflationShare(DEFAULTS.dragStrength.value) with the
    GENUINE cited 0.4325757739 = 0.740731 (verified two independent ways).
    Target ~0.80; toBeCloseTo(0.80, 2) requires |x−0.80| < 0.005.
    |0.740731 − 0.80| = 0.0593 → does NOT reproduce ~0.80.
    Re-back-solving against the Closure-A model gives dragStrength ≈ 0.451496
    (this is exactly the value the prior session silently wrote into defaults.ts;
    it makes calibration.test.ts pass ONLY by changing the cited constant — the
    forbidden hand-tune).

  WHY (mechanism): Closure A's asymptote floor g* damps the tail EXCESS from
  year 0 (g* is active immediately, not just after concentration rises). The
  McKinsey back-solve baseline IS endogenous with drag>0, so the closure is live
  during calibration: damped top returns → smaller top-set growth → smaller
  per-year assetInflation haircut → the same cited dragStrength now yields a
  ~74% share instead of ~80%. This is the precisely-predicted "cited dragStrength
  is coupled to the model dynamics" cascade. Reproducing ~0.80 requires EITHER
  re-deriving the cited dragStrength against the corrected model (changes a
  CITED, SourceRecord-backed Phase 1 number — task #2/#3 forbid; explicitly a
  separate maintainer decision) OR a structurally different closure whose
  early-baseline behavior leaves the McKinsey calibration ~invariant (e.g. a
  floor that only engages AFTER concentration has measurably risen, so the first
  ~decade of the 35y McKinsey baseline is ≈undamped — unverified, new design).

  NOT hand-tuned, NOT loosened, NOT gamed. Per task instruction #3 this is a
  STOP-and-report; the maintainer must decide between (a) accept a re-derived
  cited dragStrength against the Closure-A model (sourcing decision), (b) a
  delayed-engagement floor variant (new Phase-1 design), or (c) accept the
  ~74% McKinsey point as the corrected-model calibration (loosens the cited
  target — sourcing decision). Files: none committed.

root_cause: |
  TWO-LAYER DEFECT, primary is in the Phase 1 evolution model — NOT the charts, NOT the CR-02 guard.

  PRIMARY (model): The default `distributionEvolution: 'endogenous'` mode lets the 4 anchors
  compound at their individually-cited but very different real returns (median 2.5% vs top0.1%
  12% — a 9.5pp spread). Nothing constrains or empirically calibrates the resulting
  *dynamics*. The top01/top1 ratio therefore escapes the finite-mean Pareto domain
  (top01/top1 ≥ 10 ⇒ α ≤ 1) by ~year 11 at default inputs, and the implied concentration
  (top 0.1% ≈ 87% within a decade) is an order of magnitude beyond any real-world figure
  (real US top-0.1% wealth share ≈ 7%→13% over ~40y). defaults.ts only validates α>1 at
  YEAR 0; the multi-year evolution has no cited source and no in-domain bound, violating the
  project's "all defaults must cite a real source" + analytic-neutrality constraints. The
  CR-02 guard correctly throws on the resulting miscalibration — the guard is a symptom
  detector, not the bug.

  SECONDARY (product behavior): Past the calibratable domain the engine falls back to a
  shape-frozen shiftScaleCurve. Because the Lorenz shape is frozen, every later year's band
  fractions are byte-identical (the visible "freeze"); 70-90% of the horizon is flagged
  degraded. Even a corrected evolution needs a defined behavior for the out-of-domain region.

fix: NOT APPLIED (diagnose-only). Ranked options below.

  OPTION 1 — Bound/calibrate the endogenous evolution to an empirical concentration trend (RECOMMENDED).
    What: Stop letting the tail ratio grow unbounded. Constrain the evolution so top01/top1
    stays < 10 by pinning it to a cited concentration trajectory (e.g. cap the annual growth
    of the top01/top1 ratio to match the observed real ~+0.15pp/yr top-0.1%-share trend, or
    re-derive the per-tier return *spread* used in evolution from a sourced inequality-growth
    series rather than from the static cross-sectional return levels).
    Files: src/core/engine.ts (Step 5 endogenous branch — clamp/transform the evolved anchors
    before calibrateCurve), src/data/defaults.ts (add a cited evolution-bound / concentration-
    trend SourceRecord), .planning/phases/01* CONTEXT/RESEARCH (document the new D-06 sub-rule).
    Effort: M. Correctness: HIGH (keeps model in-domain for full 60y, root-cause fix).
    Neutrality/sourcing: STRONG positive — replaces an un-sourced emergent artifact with a
    cited trajectory, directly satisfying the project constraint. Blast radius on Phase 1
    tests: MEDIUM — goldenMaster drag-off (single-tier, decoupled) unaffected; multiTierFixture
    and any test asserting endogenous long-horizon ratios will need rebaselining; CR-02
    throw-test still valid (guard unchanged).

  OPTION 2 — Switch the default to 'fixed-shape-scaled'.
    What: Change DEFAULTS.distributionEvolution to 'fixed-shape-scaled'. Shape is calibrated
    once at year 0 (in-domain by construction) and only the location scales — α never moves,
    no CR-02 throw, bands evolve smoothly for any horizon.
    Files: src/data/defaults.ts (one line + justification note). Possibly 01-CONTEXT D-07.
    Effort: S. Correctness: MEDIUM — eliminates the freeze and stays in-domain, but it
    *removes* the heterogeneous-return-driven divergence that is the app's core thesis
    (concentration no longer increases over time — arguably under-models the very phenomenon
    the product exists to show). Neutrality/sourcing: NEUTRAL (fixed shape is a documented
    modeling choice, but it sidesteps rather than sources the dynamics). Blast radius: LOW —
    fixed-shape-scaled path already exists and is exercised; flips which path is default.

  OPTION 3 — Cap horizon / input ranges so the out-of-domain region is unreachable.
    What: Restrict UI horizon (and any inputs that accelerate divergence) so the default
    endogenous evolution never crosses α=1 (≈ horizon ≤ 10 at defaults — impractically short).
    Files: UI store / input bounds (src/state or store), types.ts D-09 note.
    Effort: S. Correctness: LOW — the in-domain horizon at default returns is only ~10 years,
    far below the 30-60y the product needs (ENTRY-03, D-09). Treats the symptom; the model is
    still un-sourced for any realistic horizon. Not recommended.

  OPTION 4 — Keep the model, replace frozen carry-forward with an honest extrapolation /
    explicit "beyond model domain" terminal state.
    What: When α≤1, instead of freezing the shape, render an explicit asymptotic / "model
    domain exceeded at year N" treatment for the donut and Chart 4 tail years.
    Files: src/core/tierBands.ts, src/core/engine.ts fallback, VIZ-07 chart components.
    Effort: M. Correctness: LOW for the *modeling* defect (the underlying ~87%-in-a-decade
    dynamics are still un-sourced and non-neutral; honesty UX does not make them defensible).
    Best as a COMPLEMENT to Option 1, not a standalone fix. Neutrality: positive for honesty,
    but does not address the sourcing-constraint violation. Blast radius: LOW (UI/fallback only).

  RECOMMENDATION: Option 1 as the primary fix (root cause: empirically bound/calibrate the
  endogenous evolution so it stays in-domain AND cites a real concentration trajectory),
  combined with Option 4 as a defensive fallback for any residual out-of-domain edge.
  Option 2 is the low-effort fallback if the maintainer decides modeling rising concentration
  is out of scope for v1 — but it weakens the product's core thesis. Option 3 is not viable.
  This implicates the Phase 1 model (engine.ts evolution step + defaults.ts sourcing +
  01-CONTEXT D-06) — requires a maintainer decision before implementation.

closure_a_final: |
  CLOSURE A NET-GROWTH-FLOOR IMPLEMENTED + VERIFIED 2026-05-16 (maintainer
  decision LOCKED). The freeze/domain root cause is RESOLVED.

  ROOT CAUSE (refined during implementation — TWO domain constraints, not one):
    (1) CR-02: ρ = top01/top1 ≥ 10 ⇒ Pareto α ≤ 1 (finite-mean domain).
    (2) Implicit CR-01 stitch limit: when the body-relative ratios
        (top1/median, top10/median) run away the lognormal body cannot stitch
        C0-continuously to the Pareto tail and the stitch bisection fails to
        bracket a root in [0.9001,0.9999]. Probed: calibration fails once
        top1/median ≳ 50 at the year-0 body shape. The earlier "g* on tail
        ratio only" Closure-A attempt failed BECAUSE it bounded only (1); the
        body-vs-tail spread (2) still escaped and re-froze ~year 25-29. This
        is exactly the WIRING/mechanism subtlety flagged in the task brief.

  FIX (engine.ts): applyClosureAFloor, gated endogenous && dragStrength>0,
  applied to the evolved anchors in Step 4b BEFORE calibrateCurve — the exact
  path whose curve the engine attaches to each snapshot and deriveBandShares
  consumes (no wiring gap). Year-0 ratios captured once:
    - top10 = r10·median, top1 = r1·median  (body-relative ratios pinned at
      the year-0 in-domain value: those tiers track the body's NET growth
      exactly ⇒ stationary, never reverts, lognormal body always calibratable —
      the literal "net growth floored at body net growth")
    - top01 = squashRho(ρ_nat, ρ0)·top1 where squashRho smoothly maps the
      natural ρ from the run's own year-0 ρ0 toward RHO_MAX=7.45 via
      ρ0+(cap−ρ0)·tanh((ρ−ρ0)/(cap−ρ0)). Identity at ρ0 (no de-concentration),
      strictly increasing (never reverts), asymptotes < RHO_MAX (α >
      ln10/ln7.45 ≈ 1.146, always strictly inside CR-02). ρ0 is captured
      per-run so the closure is an EXACT no-op at year 0 for any input and only
      damps growth above each run's own starting concentration.
  CR-02/CR-01 guards UNTOUCHED (loud detectors for residual extreme-USER-input
  edges; Option 4 honest "Beyond model domain (year N)" terminal state in
  selectors.ts handles that residual). Drag-off / dragStrength=0 paths are
  byte-for-byte preserved by the gate (golden master, numericalStability
  single-tier, dragStrength=0 collapse, drag-off multiTier fixture, CR-02
  throw test all pass UNCHANGED in intent).

  SELF-VERIFICATION PROBE (real projectionEngine, TRUE DEFAULTS: SEED_WEALTH
  200k, savings 6000, endogenous, dragStrength 0.2094998675):
    h=35   degraded=0  monoViolations=0  top01[y10]=0.35134  top01[yFinal]=0.35963991
    h=60   degraded=0  monoViolations=0  top01[y10]=0.35134  top01[yFinal]=0.36194525
    h=100  degraded=0  monoViolations=0  top01[y10]=0.35134  top01[yFinal]=0.36351463
  PASS: 0 degraded years all horizons; final top-0.1% share DISTINCT across
  h35/h60/h100 (NOT byte-identical); rose (y60>y10>y0); y35→y100 increment
  ≈ 0.0039 (small — bounded plateau, not runaway/reversion); strictly
  monotone non-reverting (monoViolations=0) to horizon 100; max top01/top1 ≈
  7.19 < 10 (α ≥ 1.167) every year incl horizon 100.

  McKINSEY RE-DERIVE (maintainer instruction #2 — cited TARGET unchanged, the
  derived back-solve OUTPUT legitimately changes against the corrected model):
  re-back-solved dragStrength = 0.2094998675; assetInflationShare(0.2094998675)
  = 0.80000000 (|diff to 0.80| ≈ 2.7e-10; passes toBeCloseTo(0.80,2) and the
  4-decimal back-solve identity). DEFAULTS.dragStrength + its SourceRecord note
  updated to state the recalibration against the Closure-A corrected model and
  that the cited McKinsey ~80% target is unchanged.

  TESTS REBASELINED (only legitimately-stale; recomputed from corrected model,
  NO loosened tolerances, old bug NOT asserted):
    - multiTierFixture EXPECTED.top10 column (closure pins top10=6·median for
      that synthetic fixture; median/top1/top01 unchanged — ρ0=7.5≥RHO_MAX ⇒
      identity squash, no de-concentration). Drag-off baseline (line 292) and
      all other multiTier assertions pass UNCHANGED.
    - tierBands G1 block: the OLD assertions encoded the freeze bug as expected
      (expect(t20.degraded).toBe(true); degraded.length>0). Rewritten to assert
      the corrected in-domain behavior + a new mandatory regression test
      (task #6): α>1 every year to h60, final top-0.1% share strictly
      increasing h35<h60<h100, bounded plateau (late rise < early rise,
      h100<0.5).

verification: |
  npm test: 167 passed / 167 (12 files). npm run typecheck: clean.
  npm run build: ✓ built. Self-verification probe passes all maintainer PASS
  criteria (table above). goldenMaster drag-off / numericalStability
  single-tier / dragStrength=0 collapse / CR-02 throw tests pass UNCHANGED.

root_cause_final: |
  Closure A net-growth-floor on the evolved anchors (engine.ts) keeps the
  lognormal+Pareto curve inside BOTH the CR-02 (ρ<10) and the implicit CR-01
  stitch-bracket domain for all horizons by pinning body-relative ratios at
  their year-0 values and smoothly asymptoting the tail ratio below RHO_MAX.
  Concentration RISES (the product thesis) then PLATEAUS, never reverts, α>1
  every year through horizon 100. dragStrength re-derived against this
  corrected model to still reproduce the cited McKinsey ~80% target.

files_changed:
  - src/core/engine.ts (Closure-A net-growth-floor: squashRho, closureACeilings, applyClosureAFloor, Step 4b wiring)
  - src/data/defaults.ts (DEFAULTS.dragStrength 0.4325757739 → 0.2094998675 + recalibration SourceRecord note)
  - src/state/selectors.ts (Option 4: honest "Beyond model domain (year N)" terminal state)
  - src/state/__tests__/selectors.test.ts (Option 4 assertion update)
  - src/core/__tests__/multiTierFixture.test.ts (rebaseline EXPECTED.top10 + derivation note)
  - src/core/__tests__/tierBands.test.ts (rewrite G1 block to corrected behavior + mandatory regression test #6)
