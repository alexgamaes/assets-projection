# Pitfalls Research

**Domain:** Empirically-grounded, neutral wealth-projection web calculator (heterogeneous returns by wealth tier + asset-price-inflation drag + relative-position tracking)
**Researched:** 2026-05-15
**Confidence:** HIGH (core economic-modeling and data-integrity pitfalls verified against primary sources: Fagereng et al. 2020, Jordà-Schularick-Taylor 2019, McKinsey MGI 2021/2023; visualization and floating-point pitfalls verified against peer-reviewed studies and numerical-computing references)

This domain's pitfalls are overwhelmingly *epistemic* (model correctness, data integrity, neutrality), not *technical*. The app is a stateless, no-auth, client-side calculator — security and scale risks are near-zero. The risks that cause rewrites are getting the economics or the citations wrong, because correctness and clarity are the explicit top priorities (Goals 1–4 in PROJECT.md) and the differentiator is empirical grounding.

## Critical Pitfalls

### Pitfall 1: Conflating nominal and real returns within the model

**What goes wrong:**
The model mixes nominal figures (e.g., a nominal equity return, nominal savings contributions) with real figures (e.g., Jordà-Schularick-Taylor's *real* ~7% housing/equity returns, real per-tier targets like "median ~2–3%"). Output looks plausible but is internally incoherent — typically overstating long-horizon wealth by the cumulative inflation factor (a 2x+ error over 40 years at 2–3% inflation).

**Why it happens:**
Different cited sources report in different terms. JST reports *real* total returns. Many "7% stock market" rules of thumb are *nominal*. User-entered savings are in today's nominal currency. Inflation gets dropped silently because no single variable forces the modeler to declare the basis.

**How to avoid:**
Pick **one basis for the entire engine — real (inflation-adjusted) — and enforce it as an explicit, documented invariant.** All per-tier return defaults are stored as real. Convert any nominal source at ingestion, recording the conversion. Label every displayed number "real (today's money)" in the UI. Add a unit/basis field to every parameter object so the type system or schema makes a nominal/real mismatch impossible to introduce silently.

**Warning signs:**
A parameter's source uses "nominal" but the default is used directly; projections that feel "too good"; no inflation parameter anywhere in the model; copy that says "$X in year 2065" without a real/nominal qualifier.

**Phase to address:**
Model-foundation / core-engine phase (before any UI). Encode basis as an invariant in the parameter schema.

---

### Pitfall 2: Misapplying the Fagereng/Bach percentile return gap

**What goes wrong:**
The headline "~18 percentage point gap" from Fagereng et al. (2020) is applied as the spread of *return rates* between the 10th and 90th wealth percentiles. It is not. In Fagereng, moving from the 10th to the 90th percentile of the *net-worth* distribution is *associated with* an ~18pp higher return *before tax* (~10pp net of tax), and the raw cross-sectional spread between the 10th and 90th percentile of *returns* is ~500 basis points (~5pp). Treating "18pp" as the per-tier rate gap inflates top-tier compounding enormously and produces absurd divergence within a decade.

**Why it happens:**
PROJECT.md itself paraphrases this as "~18pp gap between 10th and 90th percentile returns," which is the easy-to-misread shorthand. Secondary summaries blur "association across the wealth distribution," "gross vs net-of-tax," and "spread of returns" into a single number.

**How to avoid:**
Build the tier return curve from *triangulated, explicitly-defined* targets, not a single gap number. Use the indicative real-return-by-tier ladder in PROJECT.md (median ~2–3%, top 10% ~4–5%, top 1% ~6–9%, top 0.1% ~10–15%+) as the calibration target, and document for each tier: which study, which definition of "wealth percentile," gross vs net of tax, real vs nominal. Treat Fagereng's persistence/heterogeneity as *qualitative justification* for a sloped curve, and JST/Saez-Zucman as the *level* anchors. Net-of-tax (~10pp) is the more defensible figure if a single gap is ever cited, given pre-tax/generalized scope.

**Warning signs:**
Any single hardcoded "18" in the engine; top-0.1% wealth exceeding global wealth within the default horizon; a code comment citing Fagereng for a number Fagereng does not state that way.

**Phase to address:**
Data-sourcing / parameter-calibration phase. Each default needs a citation record before the engine consumes it.

---

### Pitfall 3: Double-counting the asset-price-inflation drag

**What goes wrong:**
The drag is applied twice: once implicitly (top-tier returns already reflect asset appreciation, since JST/Fagereng returns *include* capital gains) and again explicitly as a separate "drag on smaller savers." This either crushes lower tiers to zero or, if tuned to look reasonable, makes the drag parameter physically meaningless.

**Why it happens:**
The mechanism is conceptually slippery. The McKinsey MGI finding — that ~80% of 2000–2021 net-worth growth came from asset-price inflation and only ~1/5 from new saving/investment — describes *where measured wealth gains came from*, not a clean subtractable tax on small savers. Modelers reach for an intuitive "big money bids up prices, small savers get less real return" term and add it on top of returns that already embed price appreciation.

**How to avoid:**
Define the drag as a **single, explicit transformation with a stated formula and a clear conceptual story**, applied once. Recommended framing: top-tier *aggregate* compounding raises an asset-price index; the *real* return available to a saver in tier _t_ is their gross asset return minus the portion of price appreciation not backed by their own productive return. Write the conservation/accounting identity down and unit-test that (a) with drag strength zero the model reduces to independent per-tier compounding, (b) infinite growth remains possible for all tiers (no tier forced to negative real wealth purely by drag), (c) turning drag up monotonically widens relative divergence without anyone's nominal wealth shrinking. Cite McKinsey for the *magnitude/plausibility* of the mechanism, not as the formula.

**Warning signs:**
Lower tiers going to zero or negative real wealth under default settings; the drag parameter having no documented derivation; removing the drag term not cleanly collapsing to a baseline model; the words "finite pie" or "zero-sum" appearing anywhere in logic or copy.

**Phase to address:**
Model-foundation / core-engine phase. The drag identity is the single highest-risk piece of math and should be specified and unit-tested before UI work.

---

### Pitfall 4: Accidentally implementing a zero-sum / finite-pie model

**What goes wrong:**
The drag is implemented as a redistribution — wealth gained by the top is subtracted from the bottom — making total modeled wealth conserved. This directly violates an explicit Out-of-Scope boundary ("Finite-world / zero-sum economics") and the Key Decision that infinite growth must remain possible.

**Why it happens:**
Zero-sum is the *easiest* way to make "the top affecting everyone else" produce visible divergence: take from one bucket, add to another. It's a one-line implementation that "feels" like inequality.

**How to avoid:**
Make non-conservation an explicit, tested property. Add a unit test asserting that aggregate real wealth can grow even as relative shares diverge, and a test that no tier's loss is exactly another tier's gain. The drag must act on the *real purchasing power* of returns via an asset-price index, never by moving units between tiers. Code review checklist item: "Is any quantity conserved across tiers? If yes, this is wrong."

**Warning signs:**
Sum of all tiers' wealth constant or only growing by exogenous savings; a transfer/redistribution function in the engine; total wealth independent of drag strength being false (it should be — more drag should not reduce *aggregate* nominal wealth).

**Phase to address:**
Model-foundation / core-engine phase. Bake the non-conservation invariant into the engine's test suite.

---

### Pitfall 5: Geometric vs arithmetic mean return confusion (and ignoring volatility drag)

**What goes wrong:**
Arithmetic mean returns are used in a deterministic compounding projection. Arithmetic averages overstate compounded outcomes whenever returns are volatile (the "volatility drag" ≈ ½·variance). A point-estimate projection using arithmetic means systematically overstates terminal wealth; one using geometric means but presenting it as a single confident line hides sequence/volatility risk entirely.

**Why it happens:**
Sources report both. Headline "average return" figures are often arithmetic (they look bigger). For a deterministic single-path calculator the modeler grabs whatever average is cited without checking which one compounding requires.

**How to avoid:**
For a deterministic single-path projection, use **geometric (compound) mean returns** consistently, and store each return parameter tagged with which mean it is plus the source's reported volatility. State explicitly in copy that the projection is a smoothed compound-growth path, not a forecast, and that real sequences are volatile. If a confidence band is ever added later, use arithmetic mean + variance for the stochastic engine — do not mix. Document the volatility-drag adjustment applied to any arithmetic source figure.

**Warning signs:**
A return default sourced from a "since 1926 the market returned X%" figure with no geometric/arithmetic note; terminal wealth higher than a hand-check geometric compounding; no acknowledgment anywhere that returns vary year to year.

**Phase to address:**
Data-sourcing / parameter-calibration phase (tag each figure); core-engine phase (enforce geometric for deterministic path).

---

### Pitfall 6: Uncited, mis-cited, or stale defaults; conflating "wealth percentile" definitions

**What goes wrong:**
A default ships with no traceable source, with the wrong source, or with figures from a study using an incompatible definition (e.g., one source's "top 1%" is income, another's is net worth; one is US, JST is a 16-country average; Fagereng is Norway administrative data). This breaks the project's central differentiator ("don't assume stuff" — Goal 4, Constraint: Data integrity).

**Why it happens:**
Defaults get tweaked during UI tuning to "look right," losing their provenance. Studies are cited by reputation, not by checking the exact definition and population. Numbers age silently (McKinsey 2000–2021 window, JST through 2015).

**How to avoid:**
Treat every default as a **first-class data record**: `{value, unit, basis (real/nominal, gross/net), definition (income vs net worth, which percentile, population/country, period), source (full citation + URL), retrieved_date}`. Render sourcing visibly in the UI (a "where this number comes from" affordance — required by PROJECT.md). Add a CI/test check that fails the build if any model parameter lacks a complete source record. Never let parameter tuning mutate a value without updating its record. Add a "data as of" date to the UI.

**Warning signs:**
A number in code with no adjacent citation; "tuned to look reasonable" in commit messages; mixing US-specific and cross-country figures in the same tier ladder; no retrieved/as-of dates.

**Phase to address:**
Data-sourcing / parameter-calibration phase — this phase's deliverable *is* the cited parameter set; the engine should refuse uncited parameters.

---

### Pitfall 7: Survivorship / selection bias in cited historical returns

**What goes wrong:**
JST-style long-run returns (~7% real housing/equities) are presented as the universal expected return without noting that long-horizon return series overweight markets that survived (no war/revolution/expropriation wiped them out), biasing historical returns upward. Defaults inherit an optimistic tilt and the "neutral, just the math" claim is undermined by an uncorrected known bias.

**Why it happens:**
JST is authoritative and convenient; its own extensive survivorship sensitivity checks are buried in the appendix and rarely propagated by people citing the headline 7%.

**How to avoid:**
Disclose the bias in the sourcing UI for any long-run-historical default ("long-run survived-market data; may overstate forward returns"). Prefer conservative ends of cited ranges for defaults, and let advanced users push them up. Do not present any single historical figure as a forecast. This is a *framing/transparency* fix, not a model fix.

**Warning signs:**
A flat optimistic default with no caveat; copy implying historical returns are guaranteed forward returns; range midpoints chosen over conservative ends without rationale.

**Phase to address:**
Data-sourcing phase (record the caveat); content/copy phase (surface it neutrally).

---

### Pitfall 8: Editorializing — neutrality leakage in copy and visualization

**What goes wrong:**
Labels, tooltips, color, or annotations imply a critique (or endorsement) of capitalism: red "danger" coloring on top-tier divergence, words like "unfair," "rigged," "trickle-down," "the rich get richer," exclamation framing, or — the inverse — "wealth creation," "rewards for risk-taking." This violates a *hard requirement* (Goal 3, Out-of-Scope: political commentary) and is the most likely silent failure because it creeps in through ordinary UX-writing instinct.

**Why it happens:**
Inequality data is emotionally loaded; default chart libraries use red/green semantically; designers reach for "engaging" copy; the modeler's own priors leak into microcopy and annotation choices.

**How to avoid:**
Establish a **neutral-language and neutral-visualization style guide** as an explicit artifact: descriptive not evaluative labels ("Tier wealth share over time," not "How the rich pull away"); neutral sequential/categorical palettes, no value-laden red/green; no annotations that interpret morality; present mechanism and math only. Add a review gate where copy and chart semantics are checked against the guide before any release. Consider a quick external read by someone not invested in a viewpoint.

**Warning signs:**
Value-laden adjectives or verbs in any string; red = top tier; emoji or punctuation conveying alarm; annotations explaining *why* divergence is good/bad rather than *that* it occurs.

**Phase to address:**
Dedicated neutrality/copy phase, with a recurring review gate every release-bearing phase. The style guide should exist before any user-facing copy is written.

---

### Pitfall 9: Misleading chart scaling for exponential data

**What goes wrong:**
Exponential trajectories are shown on a linear y-axis, where lower tiers look like flat lines hugging zero and only the top tier is visible — exaggerating divergence and obscuring everyone else's growth; OR shown only on a log axis, where users systematically *underestimate* future growth and misread the gap. Peer-reviewed work shows each scale produces opposite, predictable misperceptions: linear misleads trajectory prediction, log misleads magnitude/description.

**Why it happens:**
There is no single "correct" scale; whichever is picked silently biases interpretation, and the modeler picks one without testing comprehension.

**How to avoid:**
Offer **both scales with an explicit, prominent toggle**, defaulting to linear (matches the visceral "exponential" goal — Goal 1) but with a one-line plain-language explanation of what each scale does to perception. Consider a brief inline educational note (shown by research to mitigate both biases). Never show only log without a magnitude reference; never show only linear for multi-tier comparison without acknowledging small tiers are compressed.

**Warning signs:**
Single hardcoded scale; lower tiers indistinguishable from the x-axis at default horizon; no scale toggle; user testing (even informal) showing people misjudge the gap.

**Phase to address:**
Visualization phase. Scale toggle + explanatory copy is a success criterion, not a polish item.

---

### Pitfall 10: Floating-point accumulation error over long horizons

**What goes wrong:**
Naive iterative compounding (`wealth = wealth * (1 + r)` in a loop) over 40–80 years × many tiers accumulates IEEE-754 rounding error. Documented analogues show iterative compound-interest loops drifting by meaningful amounts and catastrophic cancellation when subtracting nearly-equal large terms (relevant to the drag identity, which subtracts price-appreciation components).

**Why it happens:**
JavaScript numbers are binary doubles; long iterative multiplicative loops and the subtraction in the drag term are exactly the patterns that lose significance.

**How to avoid:**
This is a *moderate*, not catastrophic, risk for a visualization tool (sub-cent display drift is invisible) — do not over-engineer with a decimal library unless verification demands it. Prevention: compute with `Math.pow` / closed-form compounding where possible instead of long loops; structure the drag formula to avoid subtracting two large nearly-equal numbers (rearrange algebraically); round only at display. Add a numerical-correctness test comparing the iterative engine against a closed-form reference for a few tiers/horizons, asserting relative error below a tolerance.

**Warning signs:**
Iterative loops where closed-form exists; drag math subtracting two large similar quantities; engine output diverging from a closed-form hand-check beyond ~1e-9 relative error.

**Phase to address:**
Core-engine phase (structure formulas to avoid cancellation; add reference test).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode tier returns as magic numbers in engine | Fast to prototype | Destroys provenance, breaks the project's core differentiator, invites Pitfalls 2/6 | Never — parameters must be cited data records from day one |
| Single hardcoded chart scale | Simpler chart code | Guaranteed perception bias (Pitfall 9); reworking interaction later is costly | Throwaway spike only; never in a release |
| Tune drag strength "until it looks right" | Plausible-looking demo fast | Parameter becomes meaningless; can't defend neutrality/grounding | Never — drag needs a documented identity (Pitfall 3) |
| Deterministic single line, no volatility note | Clean simple UI | Implies false certainty; misrepresents sequence risk | Acceptable for MVP *if* copy explicitly states "smoothed path, not a forecast" |
| Skip basis (real/nominal) tagging on params | Less schema upfront | Pitfall 1 becomes near-inevitable and silent | Never — basis tag is cheap insurance against the worst error |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Charting library (defaults) | Using built-in red/green or "heatmap" palettes that editorialize | Configure a neutral categorical/sequential palette explicitly per the neutrality style guide (Pitfall 8) |
| Charting library (log axis) | Library's log axis with no magnitude reference or explanation | Add explicit scale toggle + plain-language note (Pitfall 9) |
| Cited research PDFs | Citing the headline number from an abstract/secondary summary | Read the exact table/definition; record population, percentile type, gross/net, real/nominal (Pitfalls 2, 6) |

*(No external runtime services — stateless, no-auth, client-side app. Integration risk surface is documentation/data, not APIs.)*

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recomputing full multi-tier × multi-year simulation on every input keystroke | UI jank while dragging a slider | Debounce input; memoize; closed-form per-tier compounding instead of nested loops | Noticeable only at many tiers × long horizon × rapid input; trivial to fix, do not over-engineer |
| Re-rendering entire chart per frame on slider drag | Stutter on low-end devices | Throttle redraw; update data, not full re-mount | Many series + long horizon on mobile |

*Expected scale is one user at a time, client-side, a few tiers, ≤~80 data points per series. Real performance risk is effectively nil — the only trap is gratuitous recomputation on input, which is a UX-smoothness issue, not a scaling one. Do not architect for scale that does not exist.*

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Adding analytics/telemetry that captures user-entered wealth figures | Leaks sensitive personal financial inputs of a tool meant to be private/personal | Keep all computation client-side; if analytics added, never send input values; document this |
| Reflecting user input into the DOM without escaping (e.g., custom labels) | XSS in an otherwise trivial app | Use framework-default escaping; never `innerHTML` user input |

*No accounts, no backend, no persistence (per PROJECT.md) — the security surface is minimal. The only domain-specific concern is not accidentally exfiltrating private financial inputs via analytics.*

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing all configuration on first load | Violates "two-input start" (Goal 5); user bounces before the "aha" | Default view = wealth + annual savings → immediate projection; all overrides behind an explicit "Advanced" disclosure |
| Single confident projection line | User reads a smoothed model as a personal forecast/advice | Neutral copy: "smoothed model of compound growth, not a prediction or advice"; reinforces Out-of-Scope (no advice) |
| Burying the sourcing of defaults | Undermines the trust/grounding that is the differentiator | Visible, lightweight "source" affordance on every default (Pitfall 6) |
| Relative-position chart with no plain explanation | User misreads wealth-share divergence as zero-sum | Neutral caption explaining shares can diverge while all wealth grows (ties to Pitfall 4) |
| Log/linear with no guidance | User systematically misjudges the exponential gap | Scale toggle + one-line explanation (Pitfall 9) |

## "Looks Done But Isn't" Checklist

- [ ] **Return defaults:** Often missing the source record — verify every parameter has `{value, unit, basis, definition, source+URL, retrieved_date}` and the build fails without it
- [ ] **Real vs nominal:** Often silently mixed — verify a single basis invariant is enforced engine-wide and every displayed figure is labeled
- [ ] **Drag mechanism:** Often double-counted or zero-sum — verify unit tests for (drag=0 → baseline), (non-conservation), (infinite growth preserved), (no tier forced negative by drag)
- [ ] **Fagereng citation:** Often mis-stated as "18pp return gap" — verify the code/copy matches what the paper actually says (association across net-worth percentiles, gross vs net, ~500bp raw return spread)
- [ ] **Neutrality:** Often leaks in microcopy/color — verify every string and chart palette checked against the neutral style guide by a reviewer
- [ ] **Chart scale:** Often single-scale — verify both linear and log available with an explanatory note
- [ ] **Numerical correctness:** Often unverified — verify engine output matches a closed-form reference within tolerance over the max horizon
- [ ] **Survivorship caveat:** Often omitted — verify long-run-historical defaults carry a neutral "may overstate forward returns" note

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Nominal/real mixing (P1) | HIGH | Audit every parameter's basis, re-derive, re-run all projections; retrofit basis invariant + tests; all prior screenshots/docs suspect |
| Drag double-count / zero-sum (P3/P4) | HIGH | Re-specify the drag identity from scratch with conservation tests; likely engine rewrite — cheapest if caught in core-engine phase, very expensive post-UI |
| Mis-cited Fagereng gap (P2) | MEDIUM | Re-calibrate tier curve from triangulated targets; update source records and copy; re-validate divergence shape |
| Neutrality leakage (P8) | LOW–MEDIUM | Apply style guide pass over all copy/palette; cheap if guide exists early, expensive if pervasive and shipped |
| Single chart scale (P9) | LOW | Add toggle + note; isolated to visualization layer |
| Floating-point drift (P10) | LOW | Rearrange formulas / add closed-form path; localized |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| P1 Nominal/real conflation | Model-foundation / core-engine | Basis invariant enforced in schema; every output labeled; hand-check vs known real-return compounding |
| P2 Misapplied Fagereng gap | Data-sourcing / calibration | Tier curve traced to triangulated cited targets; no single "18" in code; divergence sanity-checked |
| P3 Drag double-counting | Model-foundation / core-engine | Unit test: drag=0 collapses to baseline; documented drag identity exists |
| P4 Zero-sum model | Model-foundation / core-engine | Unit test: aggregate wealth non-conserved; no transfer function; infinite growth preserved |
| P5 Geometric/arithmetic confusion | Data-sourcing + core-engine | Each return tagged with mean type; deterministic path uses geometric; vs hand-check |
| P6 Uncited/stale/mis-defined defaults | Data-sourcing / calibration | Build fails on incomplete source record; sourcing visible in UI; as-of dates present |
| P7 Survivorship bias | Data-sourcing + content/copy | Caveat recorded and surfaced neutrally; conservative default ends chosen |
| P8 Neutrality leakage | Neutrality/copy phase (+ recurring gate) | Style guide artifact exists; copy & palette review gate per release |
| P9 Misleading chart scale | Visualization | Both scales + explanatory note present; informal comprehension check |
| P10 Floating-point error | Core-engine | Engine vs closed-form reference within relative-error tolerance |

## Sources

- Fagereng, Guiso, Malacrino, Pistaferri (2020), *Heterogeneity and Persistence in Returns to Wealth*, Econometrica — [NBER w22822 PDF](https://www.nber.org/system/files/working_papers/w22822/w22822.pdf), [Econometric Society](https://www.econometricsociety.org/publications/econometrica/2020/01/01/heterogeneity-and-persistence-returns-wealth) (verified: ~18pp association across net-worth percentiles gross / ~10pp net of tax; ~500bp raw 10th–90th return spread; 60% permanent component) — HIGH
- Jordà, Knoll, Kuvshinov, Schularick, Taylor (2019), *The Rate of Return on Everything, 1870–2015*, QJE — [FRBSF WP 2017-25 PDF](https://www.frbsf.org/wp-content/uploads/wp2017-25.pdf), [NBER w24112](https://www.nber.org/papers/w24112) (verified: ~7% real housing/equity; authors run explicit survivorship sensitivity checks) — HIGH
- McKinsey Global Institute, *The rise and rise of the global balance sheet / Out of balance* (2021/2023) — [MGI report](https://www.mckinsey.com/mgi/our-research/out-of-balance-whats-next-for-growth-wealth-and-debt), [feature](https://www.mckinsey.com/industries/financial-services/our-insights/the-rise-and-rise-of-the-global-balance-sheet-how-productively-are-we-using-our-wealth) (verified: ~80% of 2000–2021 wealth growth from asset-price inflation, ~1/5 from new saving/investment) — HIGH
- Kitces, *Volatility Drag: How Variance Drains Investment Returns* — [kitces.com](https://www.kitces.com/blog/volatility-drag-variance-drain-mean-arithmetic-vs-geometric-average-investment-returns/) (geometric for deterministic path, arithmetic+variance for Monte Carlo; volatility drag ≈ ½ variance) — HIGH
- *Analyzing the misperception of exponential growth in graphs*, Cognition (ScienceDirect) — [link](https://www.sciencedirect.com/science/article/abs/pii/S0010027722001007); *Factors modulating exponential growth bias in graphs*, Frontiers in Psychology — [PMC9977824](https://pmc.ncbi.nlm.nih.gov/articles/PMC9977824/) (log misleads description, linear misleads prediction; brief educational intervention mitigates both) — HIGH
- John D. Cook, *Numerical problem with an interest calculation* — [johndcook.com](https://www.johndcook.com/blog/2025/07/20/interest-tech-note/); *Floating-Point Guide — Error Propagation* — [floating-point-gui.de](https://floating-point-gui.de/errors/propagation/) (iterative compounding drift; catastrophic cancellation; round-at-display mitigation) — HIGH
- Project context: `.planning/PROJECT.md` (goals priority order, Out-of-Scope zero-sum boundary, indicative tier ladder to validate, neutrality hard requirement)

---
*Pitfalls research for: empirically-grounded neutral wealth-projection web calculator*
*Researched: 2026-05-15*
