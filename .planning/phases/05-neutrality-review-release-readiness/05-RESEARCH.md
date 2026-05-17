# Phase 5: Neutrality Review & Release Readiness - Research

**Researched:** 2026-05-16
**Domain:** Auditable copy/palette neutrality review of shipped React UI + selector layer; one carried D-14 defect fix
**Confidence:** HIGH (entirely codebase-grounded; no external library research needed)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** The per-item review is recorded in a single dedicated artifact, **`05-NEUT-02-REVIEW.md`**, enumerating every shipped user-facing string and palette decision with an explicit verdict per row. Supersedes the Phase 3 D-01 "no formal pass/fail checklist" stance for this gate.
- **D-02:** The inventory is assembled via an **exhaustive code sweep of the shipped surfaces**, grouped by surface. Sweep `src/ui/*` (AppShell, ControlPanel, SummaryReadout, BasisToggle, HorizonSlider, LogLinearToggle, LogSliderInput, CitationFooter, summaryFormatters), `src/viz/*` (TimeSeriesChart, DivergenceChart, RelativePosChart, TierShareChart, DonutChart), and the selector-layer copy/palette constants in `src/state/selectors.ts`. Inventory must be auditable (demonstrably exhaustive, not sampled).
- **D-03:** Verdicts are rendered by the executing agent and human-confirmable — each row carries PASS/FAIL + one-line rationale citing the specific style-guide section/rule. No mandatory blocking interactive human gate; artifact is structured so a human can scan and override.
- **D-04:** FAIL rows are fixed inline within this phase; each fixed row flips to **FIXED** with the resolving commit/diff reference, then re-verified to PASS. **Phase 5 exits with zero open FAIL rows.** CR-01 is treated as one such row.

### Claude's Discretion
- Exact `05-NEUT-02-REVIEW.md` row schema/columns (as long as per-item, surface-grouped, auditable, records rule checked + fix reference).
- CR-01 fix implementation (derive from pre-reinflation `rawResult` vs add `realGrowthMultiple` field) — cleaner of the equivalents; the `while real wealth grew [G]×` clause must refer to the real growth multiple regardless of active basis; add a regression test.
- Survivorship caveat surfacing — *where* (extend `CitationFooter`, per-source affordance, or near-chart caption), *which* defaults trigger it (JST "Rate of Return on Everything" anchor is primary; confirm against `src/data/sources.ts`), exact neutral wording — grounded in existing `SourceRecord` caveat data and §1 lexicon. Footer currently only says "See sources for definitions and caveats." — caveat is not actually rendered.
- Style-guide-as-living-doc policy — guide amendment + version bump vs frozen guide. Default lean: if a shipped string is non-neutral but no existing rule names it, fix the string AND add the rule (version-bump the guide). Discretion, not locked.
- Whether non-NEUT carried code-review items are folded — the 6 carried Phase-4 warnings (beyond CR-01), 3 Phase-3 advisories, open browser-only UAT items are NOT in NEUT-02 scope by requirement; folding is a planner scope call. Phase boundary stays NEUT-02 + CR-01.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within the NEUT-02 boundary. The four gray areas were left to research/planner discretion under the captured decisions, not deferred to a later phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NEUT-02 | All on-screen narrative annotations and copy pass a neutrality review against the style guide (no critique/endorsement framing; no editorializing) | This research delivers the exhaustive surface inventory (§Exhaustive Surface Sweep), maps every literal to a style-guide rule, identifies the verbatim-caption equality checks, localizes the CR-01 D-14 fix with the recommended implementation, identifies the survivorship-caveat data source and surfacing options, and recommends the review-artifact schema. |
</phase_requirements>

## Summary

This is a **review-and-correct** phase, not a feature phase. The work is: (1) produce an exhaustive, surface-grouped inventory of every user-facing literal and palette constant across `src/ui/*`, `src/viz/*`, and `src/state/selectors.ts`, each scored PASS/FAIL against a specific `NEUTRALITY-STYLE-GUIDE.md` section; (2) fix the carried CR-01 D-14 mislabel; (3) surface the JST survivorship caveat (which exists in `sources.ts` data but is never rendered); (4) byte-verify the four seeded verbatim captions against their canonical templates; (5) emit `05-NEUT-02-REVIEW.md` and exit with zero open FAIL rows.

The codebase is small and fully enumerable: **10 UI files, 5 viz files, 1 selector file** carry user-facing literals. The four seeded verbatim captions (§3 rel-pos, §5 nominal, §6 rank-delta + disclosure, §7 share) are the mechanically strongest rows — three of them already have **byte-exact equality test coverage or constants** in the codebase. CR-01 is the only known FAIL going in and is already localized to exact files/lines by `04-REVIEW.md`.

Two important environment facts the planner must internalize: **(a)** there is **no DOM testing library** in this project — Vitest runs `environment: 'node'`, no `@testing-library/react`, no jsdom/happy-dom. All verification must be done by (i) static reading of source for the review artifact, and (ii) pure-function unit tests for CR-01. A DOM render test is **not** available without adding tooling — do not plan one. **(b)** The style guide references `src/ui/HarnessPage.tsx` (§3) which **does not exist**; the shipped equivalent is `src/ui/AppShell.tsx` with `REL_POS_CAPTION` at line 32-33. This is itself a style-guide-accuracy finding the reviewer should record.

**Primary recommendation:** Plan as a small wave set — (1) CR-01 fix + pure-function regression test (the only code-correctness change with risk), (2) survivorship-caveat surfacing in `CitationFooter`, (3) the exhaustive review sweep producing `05-NEUT-02-REVIEW.md` with verbatim-caption equality assertions, (4) any FAIL→FIXED string corrections + optional style-guide version bump. Verification = `npm run test` (Vitest, pure functions) + `tsc --noEmit` + the zero-open-FAIL artifact.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Neutrality review artifact | Documentation (`.planning/phases/05-.../05-NEUT-02-REVIEW.md`) | — | Deliverable of record; not runtime code |
| CR-01 real-growth-multiple fix | Selector layer (`selectors.ts`) + page composition (`AppShell.tsx`) | Display formatter (`summaryFormatters.ts` unchanged — it already only renders what it's given) | The bug is *which* multiple is passed in, computed in the selector/composition tier, not in the pure formatter |
| Survivorship caveat surfacing | UI component (`CitationFooter.tsx`) | Data (`sources.ts` — read-only source of caveat text) | Caveat text must be *sourced* from `SourceRecord.note`, rendered by the footer component |
| Verbatim caption verification | Selector constants + UI literals (source-read) + pure unit test | — | Captions are string constants/literals; equality-checkable statically and in Vitest |
| FAIL→FIXED string corrections | Whichever tier owns the offending literal (`ui`/`viz`/`selectors`) | Style guide doc (optional version bump) | Each literal lives in exactly one file |

## Standard Stack

No new libraries. This phase uses only what is already installed and is governed by `CLAUDE.md`'s locked stack.

### Core (already present, used as-is)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | 4.x (`@vitest/coverage-v8` 4.1.6 present) | Pure-function regression test for CR-01 + verbatim-caption equality assertions | Already the project test runner (`npm run test` → `vitest run`); `vite.config.ts` sets `environment: 'node'` [VERIFIED: package.json, vite.config.ts] |
| TypeScript | 5.9.x | `tsc --noEmit` type-check after the CR-01 selector/AppShell change | Project type-check gate (`npm run typecheck`) [VERIFIED: package.json, CLAUDE.md] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | — | No supporting libraries needed; do NOT add `@testing-library/react` or jsdom for this phase — out of scope and unnecessary; CR-01 is testable as a pure selector function |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure-function CR-01 test | DOM render test via @testing-library/react + jsdom | Rejected: requires adding two dev deps + a jsdom Vitest project config; CR-01 is a pure data-flow bug (`selectSummary` over `rawResult` vs reinflated `result`) fully testable without DOM. Adding DOM tooling expands scope beyond NEUT-02. |
| Static source-read review for non-CR-01 rows | Automated DOM scan | Rejected: no render harness exists; the strings are static literals/constants, so a source-grounded review (with exact file:line refs) is exhaustive and auditable by construction. |

**Installation:** None.

## Package Legitimacy Audit

Not applicable — this phase installs no external packages. (Slopcheck not run; no install surface.)

## Architecture Patterns

### System Architecture Diagram

```
                          docs/NEUTRALITY-STYLE-GUIDE.md (contract, read-only this phase*)
                                   │  §1 lexicon · §2 chart-semantic · §3 rel-pos caption
                                   │  §4 palette · §5 nominal caption · §6 D-14/D-15 · §7 share caption
                                   ▼
   ┌─────────────── EXHAUSTIVE SURFACE SWEEP (D-02) ───────────────┐
   │  src/ui/* (10 files)   src/viz/* (5 files)   src/state/selectors.ts │
   │     literals,             chart wrapper          COLORS palette,     │
   │     labels, captions      caption props          axis/series/tooltip │
   │                                                  strings, captions   │
   └───────────────────────────────┬───────────────────────────────┘
                                    ▼
                 per-literal verdict (rule cited)  ──►  05-NEUT-02-REVIEW.md
                                    │                    (D-01/D-03 artifact)
              ┌─────────────────────┼───────────────────────────┐
              ▼                     ▼                           ▼
        PASS rows           FAIL rows (D-04)            CR-01 row (known FAIL)
        (recorded)          fix inline → FIXED          fix selectors/AppShell
                            + commit/diff ref           + Vitest regression test
                                    │
                                    ▼
                       zero open FAIL rows  ──►  release-ready (NEUT-02 satisfied)

  * style guide MAY be version-bumped if a finding exposes an uncovered rule (planner discretion)
  Survivorship caveat: sources.ts (SourceRecord.note, read-only) ──► CitationFooter.tsx (render)
```

### Recommended Work Structure (not new source dirs — this phase edits existing files)
```
.planning/phases/05-neutrality-review-release-readiness/
  └── 05-NEUT-02-REVIEW.md     # NEW — the deliverable of record
src/state/selectors.ts          # EDIT — CR-01 (add realGrowthMultiple to Summary + selectSummary)
src/ui/AppShell.tsx             # EDIT — CR-01 (pass real multiple from rawResult-derived value)
src/ui/SummaryReadout.tsx       # EDIT — CR-01 (pass real multiple into formatRankDelta)
src/ui/CitationFooter.tsx       # EDIT — render the JST survivorship caveat
src/state/__tests__/selectors.test.ts        # EDIT — CR-01 regression test (pure)
src/ui/__tests__/summaryFormatters.test.ts   # (optional) tighten if formatter signature unchanged
docs/NEUTRALITY-STYLE-GUIDE.md  # EDIT (optional) — version bump if a finding exposes a gap; fix HarnessPage→AppShell ref
```

### Pattern 1: Exhaustive surface sweep, grouped by surface (D-02)
**What:** Enumerate every user-facing literal in the 16 source files below. The codebase is small enough that the inventory is *complete by construction* — list each file, each kind of literal, and the rule it maps to.
**When to use:** This is the core method for `05-NEUT-02-REVIEW.md`.

**Auditable file inventory (this IS the exhaustive list — no other files render user-facing copy):**

| Surface (file) | User-facing literals present | Style-guide rule(s) to check against |
|----------------|------------------------------|---------------------------------------|
| `src/ui/AppShell.tsx` | `REL_POS_CAPTION` (L32-33, verbatim §3), `ENGINE_ERROR_MSG` (L36-37), h1 "Wealth projection" (L104), h2 section titles: "Projected wealth over time" (L135), "Wealth by tier over time" (L143), "Position in the wealth distribution over time" (L150-152), "Share of total wealth by tier over time" (L159), "Final-year wealth share by tier" (L172), the two "Shares are identical in real and nominal terms…" notes (L164-166, L177-179) | §1 lexicon, §2 axis/series naming spirit, §3 (REL_POS_CAPTION verbatim) |
| `src/ui/SummaryReadout.tsx` | "Summary" (L25), "Ending wealth (nominal)" / "Ending wealth (real)" (L31), "Growth multiple" (L39), "CAGR" (L45), "% / yr" (L47), the §6 D-15 disclosure `<p>` (L58-61, verbatim §6) | §1, §2 (no verdict labels), §6 (verbatim disclosure + D-14 pairing) |
| `src/ui/summaryFormatters.ts` | `formatRankDelta` template "Distribution position: p… → p…, while real wealth grew …×." (L30-32, verbatim §6), `formatMoneyIllusionCaption` template "These figures are not adjusted for inflation…" (L52-54, verbatim §5) | §5 (verbatim), §6 (verbatim D-14 clause) — **CR-01 lives in the data feeding this, not the template** |
| `src/ui/CitationFooter.tsx` | "Default parameters sourced from:" (L13), "See sources for definitions and caveats." (L31) | §1; **criterion-4 target: caveat not actually rendered today** |
| `src/ui/ControlPanel.tsx` | "Inputs" (L21), `LogSliderInput` `label` props "Current wealth"/"Annual savings" (L25,33) | §1, §2 |
| `src/ui/BasisToggle.tsx` | "Real"/"Nominal" buttons (L28,40), "Real adjusts for inflation; nominal does not." (L45), "Real shows amounts in today's purchasing power. Nominal shows future dollar amounts without adjusting for inflation." (L49-50), aria-label "Display basis" (L15) | §1 (no "more honest"/"better" framing — analog of §2 log-scale rule), §2 |
| `src/ui/HorizonSlider.tsx` | "Projection horizon" (L15), "{value} years" (L16), "10–60 years. Default is 35." (L29) | §1, §2 X-axis rule spirit ("Year", not "years remaining") |
| `src/ui/LogLinearToggle.tsx` | "Log"/"Linear" buttons (L24,36), aria-label "Y-axis scale" (L14), "Scale applies to the two wealth charts." (L44), "Log scale: equal vertical distance represents equal percentage change, making compounding visible. Linear scale: equal vertical distance represents equal absolute change." (L48-49) | §2 log-scale explanatory copy rule (must NOT call either scale "more honest"/"better"/"real picture") |
| `src/ui/LogSliderInput.tsx` | `label` (passed in), formatted `formatWealth` value | §1 (mostly numeric; low risk) |
| `src/ui/__tests__/summaryFormatters.test.ts` | test-only, NOT user-facing | excluded from the sweep (note explicitly for auditability) |
| `src/viz/TimeSeriesChart.tsx` | no literals (caption-less wrapper) | none — record "no user-facing literals (verified)" |
| `src/viz/DivergenceChart.tsx` | no literals | none — record "no user-facing literals (verified)" |
| `src/viz/RelativePosChart.tsx` | renders `caption` prop only (= AppShell `REL_POS_CAPTION`, §3) | §3 (verified via the AppShell constant) |
| `src/viz/TierShareChart.tsx` | renders `caption` prop only (= `SHARE_CAPTION`, §7) | §7 |
| `src/viz/DonutChart.tsx` | renders `caption` prop only (= `SHARE_CAPTION`, §7) | §7 |
| `src/state/selectors.ts` | `COLORS` palette constants (L13-20, §4), `formatWealth` ($, M, k — neutral units), `deriveTier` strings 'top 0.1%'/'top 1%'/'top 10%'/'median' (L46-49), axis names "Year"/"Real wealth (today's money)"/"Percentile rank (0–100)"/"Share of total wealth (%)", series names "Your wealth"/"Median (p50)"/"Top 10% (p90)"/"Top 1% (p99)"/"Top 0.1% (p99.9)"/"Your rank"/band names "Bottom 50%"/"50–90%"/"90–99%"/"99–99.9%"/"Top 0.1%", tooltip templates (Year/Rank/Tier/Wealth/Share %), markLine labels p50/p90/p99/p99.9, donut center text "Top 1% hold … (year N)" / "Beyond model domain (year N)" (L602-605), `SHARE_CAPTION` (L425-426, verbatim §7) | §2 (axis/series/tooltip), §4 (COLORS palette), §1 (no banned verbs in tooltips/center text), §7 (SHARE_CAPTION verbatim) |

**Example sweep command to confirm completeness (auditability evidence to embed in the artifact):**
```bash
# All JSX string literals + template literals across the surfaces (evidence the sweep is exhaustive)
grep -rnoE '"[^"]{2,}"|`[^`]{2,}`' src/ui src/viz src/state/selectors.ts \
  --include='*.ts' --include='*.tsx' | grep -v '__tests__'
```

### Pattern 2: Verbatim caption equality verification (the four strongest rows)
**What:** Four captions are seeded with canonical templates in the style guide. They are mechanically equality-checkable.
**When to use:** These become HIGH-confidence deterministic PASS/FAIL rows.

| Caption | Canonical source (style guide) | Shipped location | How to verify |
|---------|-------------------------------|------------------|----------------|
| §3 rel-pos caption | §3 verbatim block | `AppShell.tsx:32-33` `REL_POS_CAPTION` (passed to `RelativePosChart`) | String equality of `REL_POS_CAPTION` vs §3 text. **Note:** style guide says it lives in `HarnessPage.tsx` — that file does not exist; record as a style-guide accuracy finding. |
| §5 nominal caption | §5 verbatim template (with `[X]%`/`[source name]` substitution) | `summaryFormatters.ts:52-54` `formatMoneyIllusionCaption` | Template-shape equality; `summaryFormatters.test.ts` already asserts the rate/source substitution. Add/confirm an exact-template assertion. |
| §6 D-14 rank-delta clause | §6 "Distribution position: p[NN] → p[MM], while real wealth grew [G]×." | `summaryFormatters.ts:30-32` `formatRankDelta` | Template equality (already covered by `summaryFormatters.test.ts` regex). **CR-01 is NOT a template defect — the template is correct; the *value* passed for `[G]` is wrong in nominal mode.** |
| §6 D-15 disclosure | §6 "Rank can move down while real wealth still grows — every tier's wealth increases over this horizon. See the wealth-by-tier chart for absolute amounts." | `SummaryReadout.tsx:58-61` (hardcoded `<p>`, with `&apos;` for the apostrophe) | Exact-text equality. Watch the JSX `&apos;` → renders as `'`; compare rendered text, not raw JSX. |
| §7 share caption | §7 verbatim template | `selectors.ts:425-426` `SHARE_CAPTION` | **Already byte-exact** to §7 by inspection; `selectors.test.ts` imports `SHARE_CAPTION`. Add an exact-string assertion vs the §7 text if not present. |

### Anti-Patterns to Avoid
- **Sampling the surfaces.** D-02 requires demonstrable exhaustiveness. List every file (including the ones with *no* literals, marked "none — verified") so a reader sees the sweep was complete.
- **Adding a DOM test harness for CR-01.** The bug is a pure data-flow defect; test it as a pure selector function. Adding jsdom/@testing-library is scope creep.
- **Editing the style guide caption text to match a non-conforming shipped string.** If a caption diverges, the *shipped string* is the FAIL and gets fixed (the canonical template is the contract). Only version-bump the guide to *add a missing rule*, never to retro-fit a violation.
- **Treating CR-01 as a `summaryFormatters` template bug.** `formatRankDelta` is correct. The fix is upstream: `selectSummary.growthMultiple` is computed from the (re-inflated) `result` in nominal mode; it must instead receive the real-basis multiple.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Verbatim caption check | A fuzzy/normalized text matcher | Exact `===` string equality in a Vitest assertion against the style-guide text pasted as a constant | The contract is byte-exact (§3/§7 explicitly say "verbatim"); fuzzy matching would hide a real divergence |
| CR-01 real multiple | A second engine call or recomputation in the UI | The already-computed `rawResult` (pre-reinflation) — derive the real growth multiple from it (it is already in `AppShell` scope, line 52-58) | The real-basis series is already computed; no new computation needed |
| Survivorship caveat text | Author new caveat prose | The existing `SOURCES.jst2019.note` survivorship sentence in `src/data/sources.ts` | CLAUDE.md data-integrity rule + CONTEXT.md: "surface the cited caveat, do not invent one" |

**Key insight:** Every artifact this phase needs already exists in the codebase — the canonical caption text (style guide), the localized defect (`04-REVIEW.md`), the caveat data (`sources.ts`). This phase is composition and verification, not authoring.

## CR-01 Deep Dive (the only code-correctness change)

**Confirmed defect (matches `04-REVIEW.md` §CR-01 exactly):**
- `AppShell.tsx:52-58` — `rawResult` = real-basis engine output; `result` = `selectReinflated(rawResult, basis, …)` which, when `basis==='nominal'`, multiplies `userWealth` by `(1+i)^year` (`selectors.ts:373-374`).
- `AppShell.tsx:96` — `summary = selectSummary(result)` → uses the **re-inflated** `result`.
- `selectors.ts:657-671` `selectSummary` — `growthMultiple = end/start` from the nominal series in nominal mode (inflated by `(1+i)^years`).
- `SummaryReadout.tsx:54` — passes `summary.growthMultiple` into `formatRankDelta(...)`, which renders the literal `while real wealth grew {G}×` (`summaryFormatters.ts:31`).
- Result: in nominal mode the clause asserts a *nominal* multiple but labels it "real wealth" → **Style Guide §6 / D-14 violation** ("must refer to the real growth multiple regardless of the active basis").

**Two prescribed fixes (from CONTEXT discretion + 04-REVIEW):**
1. **Derive the rank/growth pairing from `rawResult`.** In `AppShell`, compute a real-basis summary from `rawResult` (`selectSummary(rawResult)`) and use *its* `growthMultiple` for `formatRankDelta`, while keeping `endingWealth` basis-adjusted from `result`.
2. **Add a `realGrowthMultiple` field** to `Summary`; `selectSummary` computes it from a real-basis reference and `SummaryReadout` passes that into `formatRankDelta`.

**Recommendation: Option 2 (`realGrowthMultiple` field) — cleaner.** Rationale:
- `selectSummary` already takes a single `ProjectionResult`. Option 1 forces `AppShell` to call `selectSummary` twice (once on `result`, once on `rawResult`) and stitch two `Summary` objects — leaks the basis concern into the composition layer and is exactly the "split the concern" caveat in `04-REVIEW`.
- Option 2 keeps the basis logic where it belongs (the selector) and makes the invariant *typed*: add `realGrowthMultiple: number` to the `Summary` interface (`selectors.ts:400-406`). Compute it inside `selectSummary` from the real series. But `selectSummary` currently receives the *already-reinflated* `result` — so the cleanest concrete shape is:
  - Give `selectSummary` access to the real-basis start/end. Two viable concrete forms (planner picks): (a) `selectSummary(result, rawResult)` — pass both; compute `endingWealth`/`growthMultiple` from `result`, `realGrowthMultiple` from `rawResult`; or (b) keep `selectSummary(rawResult)` for the real metrics and compute only `endingWealth` display value separately. Form (a) is the minimal, most local change and preserves the existing single derivation path.
- `SummaryReadout.tsx:54` then passes `summary.realGrowthMultiple` (not `summary.growthMultiple`) into `formatRankDelta`. `formatRankDelta`'s signature and template are unchanged (correct already).

**Regression test (pure, no DOM):** Add to `src/state/__tests__/selectors.test.ts` (existing pattern: builds `result` via `projectionEngine(syntheticInputs, makeSyntheticParams(...))`). Assert: for a fixture with nonzero inflation, `selectSummary` over real vs nominal yields an **identical `realGrowthMultiple`** while `endingWealth` differs (real < nominal). This directly encodes the D-14 invariant ("clause identical in real and nominal modes") at the pure-function level — exactly where `04-REVIEW` asked for the test, and runnable under `environment: 'node'`. Optionally also assert in `summaryFormatters.test.ts` that `formatRankDelta` is unchanged.

**Type-check:** Changing the `Summary` interface requires `npm run typecheck` (`tsc --noEmit`) green — `selectSummary` is imported in `selectors.test.ts` and consumed in `AppShell`/`SummaryReadout`; all call sites must be updated.

## Survivorship Caveat Surfacing (criterion 4)

**Which source is survivorship-biased:** `SOURCES.jst2019` (`src/data/sources.ts:158-184`) — Jordà-Schularick-Taylor "The Rate of Return on Everything". Its `note` field already contains the cited caveat:

> "Survivorship bias (Pitfall 7): JST Appendix sensitivity tests indicate ~0.5pp upward bias in reported real equity/housing returns from restricting to markets that survived without revolution/expropriation. Conservative calibration should shade returns ~0.5pp below JST headlines; the PROJECT.md indicative band lower ends reflect this adjustment. …"

(Note: `fagereng2020.note` also carries a milder "Norwegian data covers a high-trust, high-equality economy; may understate heterogeneity" caveat. The **primary** survivorship-biased default per CONTEXT is JST. Planner discretion whether to surface only JST or all `note`-bearing sources; recommend **JST only** for criterion 4's literal scope, kept minimal and neutral.)

**Current state:** `CitationFooter.tsx` renders source names + links + the static phrase "See sources for definitions and caveats." — the caveat text itself is **never rendered** (confirmed: `CitationFooter.tsx:9-35` only maps `c.sourceName`/`c.url`). So criterion 4 is genuinely unmet today.

**Surfacing options (planner's call; recommendation given):**
| Option | Where | Tradeoff |
|--------|-------|----------|
| **A (recommended)** Extend `CitationFooter` | Render a short neutral caveat line drawn from `SOURCES.jst2019.note` (a derived/condensed neutral sentence sourced from that note, not invented) below the citation list | Reuses the existing affordance (CONTEXT: "extends this existing affordance rather than introducing a new one"); single render path; no new component; aligns with `selectCitationFooter` already iterating `SourceRecord[]` |
| B Per-source affordance | Hover/expand each source to show its `note` | More UI surface; closer to v2 CONFIG-02 (per-parameter tooltips) which is OUT OF SCOPE — avoid |
| C Near-chart caption | Caption under the divergence chart | Misplaces a sourcing caveat as a chart annotation; the affordance criterion-4 names is the *sourcing* affordance (the footer) |

**Neutral wording constraint:** must obey §1 lexicon — factual, mechanical, no alarm punctuation, no "unreliable"/"flawed". A neutral condensation of the JST note, e.g. a single sentence stating the long-run historical return figures carry an estimated ~0.5pp upward survivorship bias (markets that survived without expropriation) and that defaults are shaded conservatively below the headline. The exact string is planner/executor discretion but **must be traceable to `jst2019.note`** (data-integrity rule) and itself becomes a NEUT-02 review row checked against §1.

## Review Artifact Schema (recommended for `05-NEUT-02-REVIEW.md`)

Per-item, surface-grouped, auditable, records the rule checked and the fix reference. Recommended Markdown structure:

```markdown
# 05 NEUT-02 Neutrality Review

**Reviewed:** <date> · **Reviewer:** gsd (agent verdict, human-confirmable per D-03)
**Style guide version reviewed against:** NEUTRALITY-STYLE-GUIDE.md v<X>
**Method:** exhaustive code sweep (D-02) — file inventory below is complete by construction
**Exit criterion:** zero open FAIL rows (D-04)

## Sweep Completeness Evidence
- Files swept: src/ui/* (10), src/viz/* (5), src/state/selectors.ts (1) — full list, each accounted for
- Files with no user-facing literals (verified): TimeSeriesChart.tsx, DivergenceChart.tsx
- Excluded (not user-facing): *__tests__*

## Findings (grouped by surface)

### Surface: src/ui/SummaryReadout.tsx
| # | String / literal (verbatim) | Loc | SG rule | Verdict | Rationale | Fix ref |
|---|------------------------------|-----|---------|---------|-----------|---------|
| 1 | "Growth multiple" | L39 | §2 | PASS | descriptive metric label, no verdict framing | — |
| 2 | rank-delta `while real wealth grew G×` (G from nominal series) | L54 | §6/D-14 | **FIXED** | nominal multiple labelled "real" — D-14 violation | <commit sha> / selectors.ts:realGrowthMultiple |
…

### Surface: src/state/selectors.ts
| # | Constant / literal | Loc | SG rule | Verdict | Rationale | Fix ref |
|---|--------------------|-----|---------|---------|-----------|---------|
| n | COLORS.user #0F766E (teal, user line) | L14 | §4 | PASS | findability accent, not semantic red/green; matches §4 palette exactly | — |
…

## Verbatim Caption Equality Checks (deterministic)
| Caption | SG section | Shipped loc | Equality result |
|---------|-----------|-------------|------------------|
| REL_POS_CAPTION | §3 | AppShell.tsx:32 | PASS (byte-exact) |
| SHARE_CAPTION | §7 | selectors.ts:425 | PASS (byte-exact) |
| D-15 disclosure | §6 | SummaryReadout.tsx:58 | PASS (rendered-text equality, &apos;→') |
| nominal caption template | §5 | summaryFormatters.ts:52 | PASS (template + substitution) |

## Style-Guide Findings (living-doc, planner discretion)
- §3 references `src/ui/HarnessPage.tsx` which does not exist; shipped equivalent is `AppShell.tsx` `REL_POS_CAPTION`. Recommend doc correction (+ version bump).

## Summary
- Total rows: N · PASS: x · FIXED: y · open FAIL: 0  ✅ release-ready
```

Column set: **# · string/literal · location · style-guide rule · verdict (PASS/FAIL/FIXED) · rationale · fix-ref**. This satisfies D-01 (literal per-item pass/fail), D-03 (agent verdict + rationale citing the rule, human-scannable), and D-04 (FIXED rows carry commit/diff ref; explicit zero-open-FAIL summary line).

## Common Pitfalls

### Pitfall 1: Comparing raw JSX instead of rendered text for the §6 D-15 disclosure
**What goes wrong:** `SummaryReadout.tsx:58-61` uses `&apos;` ("every tier&apos;s"). A naive `===` of the JSX source vs the §6 text fails spuriously.
**How to avoid:** Compare the *rendered* text (apostrophe), or normalize `&apos;`→`'` before equality. No DOM render is available; do the comparison on the normalized literal.
**Warning sign:** A FAIL on D-15 whose only diff is `&apos;` vs `'`.

### Pitfall 2: Style guide ↔ code drift on the HarnessPage reference
**What goes wrong:** §3 says the §3 caption is "seeded into `src/ui/HarnessPage.tsx`". That file does not exist (Phase 4 replaced the harness with `AppShell.tsx`). A reviewer following the guide literally finds nothing and may mark a false FAIL.
**How to avoid:** Verify against `AppShell.tsx:32-33 REL_POS_CAPTION` (and `RelativePosChart` prop). Record the stale doc reference as a style-guide living-doc finding (recommend correcting it + version bump).

### Pitfall 3: Mis-scoping CR-01 as a formatter/template bug
**What goes wrong:** Editing `formatRankDelta`'s template (it is already correct per §6) instead of the value pipeline.
**How to avoid:** The fix is in `selectSummary`/`AppShell` data flow (which multiple is passed), not the formatter string. Regression test asserts real-basis multiple is basis-invariant.
**Warning sign:** A diff that touches the literal text in `summaryFormatters.ts:31`.

### Pitfall 4: Treating `selectSummary` signature change as local
**What goes wrong:** Adding `realGrowthMultiple` / changing `selectSummary` args breaks `selectors.test.ts` and `AppShell`/`SummaryReadout` typing silently until CI.
**How to avoid:** Run `npm run typecheck` after the change; update all call sites in the same task. The existing `selectors.test.ts` (L657 usage pattern) and `summaryFormatters.test.ts` are the regression surface.

### Pitfall 5: Inventory presented as a sample, not exhaustive
**What goes wrong:** Listing "representative" strings violates D-02's auditability requirement.
**How to avoid:** Include every one of the 16 files, including the two viz wrappers with no literals (marked "none — verified"), plus the grep-evidence command output. Completeness is provable because the surface set is closed and small.

## Code Examples

### CR-01 fix shape (recommended — `realGrowthMultiple`, Form (a))
```typescript
// src/state/selectors.ts — Summary interface gains a real-basis-invariant field
export interface Summary {
  endingWealth: number;       // basis-adjusted (from re-inflated result) — display only
  growthMultiple: number;     // basis-adjusted display multiple
  realGrowthMultiple: number; // ALWAYS real-basis — feeds the §6/D-14 clause
  cagr: number;
  startRank: number;
  endRank: number;
}

// selectSummary takes both the (basis-adjusted) result and the real rawResult
export function selectSummary(r: ProjectionResult, raw: ProjectionResult): Summary {
  const first = r.series[0]!, last = r.series[r.series.length - 1]!;
  const rawFirst = raw.series[0]!, rawLast = raw.series[raw.series.length - 1]!;
  const years = last.year - first.year;
  const start = first.userWealth, end = last.userWealth;
  const rStart = rawFirst.userWealth, rEnd = rawLast.userWealth;
  const rp = r.relativePosition;
  return {
    endingWealth: end,
    growthMultiple: start > 0 ? end / start : 0,
    realGrowthMultiple: rStart > 0 ? rEnd / rStart : 0, // basis-invariant
    cagr: start > 0 && years > 0 ? (end / start) ** (1 / years) - 1 : 0,
    startRank: rp[0]!.userRank,
    endRank: rp[rp.length - 1]!.userRank,
  };
}
```
```tsx
// src/ui/AppShell.tsx — pass both
const summary = useMemo(
  () => (result !== null && rawResult !== null ? selectSummary(result, rawResult) : null),
  [result, rawResult],
);
// src/ui/SummaryReadout.tsx:54 — feed the real multiple into the D-14 clause
{formatRankDelta(summary.startRank, summary.endRank, summary.realGrowthMultiple)}
```

### CR-01 regression test (pure, environment: 'node')
```typescript
// src/state/__tests__/selectors.test.ts
import { selectReinflated, selectSummary } from '../selectors.js';
it('CR-01/D-14: realGrowthMultiple is identical in real and nominal basis', () => {
  const real = selectSummary(result, result);                       // basis=real
  const reinf = selectReinflated(result, 'nominal', 0.025);
  const nominal = selectSummary(reinf, result);                     // basis=nominal
  expect(nominal.realGrowthMultiple).toBeCloseTo(real.realGrowthMultiple, 10);
  expect(nominal.endingWealth).toBeGreaterThan(real.endingWealth);  // nominal inflated
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phase 3 D-01: no formal pass/fail checklist (deferred to Phase 5) | D-01 (this phase): single `05-NEUT-02-REVIEW.md` per-item pass/fail artifact | This phase | The checklist deferral is now resolved here — this is that gate |
| Style guide §3 cites `HarnessPage.tsx` | Shipped code uses `AppShell.tsx` `REL_POS_CAPTION` | Phase 4 | Stale doc reference; record as living-doc finding |

**Deprecated/outdated:** Style-guide §3's `HarnessPage.tsx` reference (file removed in Phase 4).

## Runtime State Inventory

This is a copy/code review phase with one localized code fix. No databases, services, OS registrations, secrets, or build artifacts embed a renamed string.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — verified (no datastore; pure client app, no persistence per REQUIREMENTS Out-of-Scope) | none |
| Live service config | None — verified (no backend/services; static SPA per CLAUDE.md) | none |
| OS-registered state | None — verified (no OS registrations) | none |
| Secrets/env vars | None — verified (no secrets; no env-dependent copy) | none |
| Build artifacts | None — verified (Vite static build; no name-embedded artifacts; CR-01 is a source edit, recompiled by `vite build`) | none |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `selectSummary` signature change (adding `realGrowthMultiple` / second arg) only impacts `AppShell`, `SummaryReadout`, `selectors.test.ts` | CR-01 Deep Dive | Low — small codebase; `tsc --noEmit` will surface any missed call site. Planner should add "run typecheck" as a verification step. |
| A2 | The JST `note` is the correct/only primary survivorship caveat to surface for criterion 4 | Survivorship Caveat | Low — CONTEXT explicitly names JST as primary; `fagereng2020.note` is secondary and milder. If reviewer wants both, scope is trivially wider. |
| A3 | No DOM render test is expected/required for this phase's verification | Standard Stack | Low — no DOM tooling exists; CONTEXT D-03 is satisfied by the static artifact + pure tests; consistent with project "automation verifies, browser-only → UAT" pattern. |
| A4 | The §7 `SHARE_CAPTION` is byte-exact to the style guide §7 text | Pattern 2 | Low — verified by inspection (selectors.ts:425-426 vs §7); the executor must still add the explicit equality assertion. |

## Open Questions (RESOLVED)

1. **Living-doc policy decision (planner's call per CONTEXT discretion)** — RESOLVED: Plan 05-03 Task 2 locks the guide minor version bump + the `HarnessPage.tsx`→`AppShell.tsx` §3 correction as a mandatory acceptance criterion.
   - What we know: default lean is "fix string + add rule + version bump" for uncovered gaps; the `HarnessPage.tsx` stale ref is a concrete doc-accuracy finding.
   - What's unclear: whether the planner version-bumps the guide this phase or freezes it.
   - Recommendation: bump the guide minor version to (a) correct the `HarnessPage.tsx`→`AppShell.tsx` reference and (b) add any rule a FAIL exposes; record the version reviewed-against in `05-NEUT-02-REVIEW.md`.

2. **Exact survivorship caveat wording** — RESOLVED: executor discretion per CONTEXT.md, bound to `SOURCES.jst2019.note` (no invented prose) and reviewed as its own NEUT-02 row against §1 in Plan 05-02 / 05-03.
   - What we know: must be a neutral condensation of `SOURCES.jst2019.note`, §1-compliant, rendered in `CitationFooter`.
   - What's unclear: the precise sentence (executor discretion).
   - Recommendation: one factual sentence, traceable to the JST note, no alarm punctuation; then review it as its own NEUT-02 row against §1.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Vitest | CR-01 regression test, caption equality assertions | ✓ | `vitest run` via `npm run test`; coverage-v8 4.1.6 | — |
| TypeScript (`tsc --noEmit`) | Type-check after `Summary` change | ✓ | 5.9.x (`npm run typecheck`) | — |
| @testing-library/react / jsdom | (NOT required — no DOM test planned) | ✗ | — | Pure-function test of `selectSummary`; static source-read review for non-CR-01 rows |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** DOM test tooling absent — fallback is the pure-function CR-01 test + static source review (sufficient; do not add tooling).

## Validation Architecture

`workflow.nyquist_validation: true` → section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (`@vitest/coverage-v8` 4.1.6) |
| Config file | `vite.config.ts` (`test.environment: 'node'`) |
| Quick run command | `npm run test` (`vitest run`) |
| Full suite command | `npm run test` then `npm run typecheck` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NEUT-02 (CR-01) | Real growth multiple identical across basis (D-14 invariant) | unit | `npm run test` (selectors.test.ts new case) | ✅ extend `src/state/__tests__/selectors.test.ts` |
| NEUT-02 (§7) | `SHARE_CAPTION` byte-equals style-guide §7 | unit | `npm run test` | ✅ extend `src/state/__tests__/selectors.test.ts` |
| NEUT-02 (§5/§6) | Nominal & rank-delta templates conform | unit | `npm run test` | ✅ `src/ui/__tests__/summaryFormatters.test.ts` (exists) |
| NEUT-02 (review) | Zero open FAIL rows; every surface accounted for | manual-only (artifact) | n/a — `05-NEUT-02-REVIEW.md` review (D-03 agent verdict, human-confirmable) | ❌ new artifact (deliverable) |
| NEUT-02 (typing) | `Summary` change compiles across call sites | typecheck | `npm run typecheck` | ✅ existing |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test && npm run typecheck`
- **Phase gate:** Full suite green + `05-NEUT-02-REVIEW.md` with zero open FAIL rows before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] CR-01 regression case in `src/state/__tests__/selectors.test.ts` — covers NEUT-02/D-14 (new test case in existing file; no new infra)
- [ ] Optional explicit `SHARE_CAPTION === §7 text` assertion in `selectors.test.ts`
- *(No framework install needed — Vitest + tsc already configured. No new test files required, only new cases in existing files.)*

## Security Domain

`security_enforcement` not present in `.planning/config.json` (treat as enabled), but this phase ships **no new external input handling, auth, crypto, network, or storage**. It is a copy review + one internal data-flow fix on an already-shipped static SPA.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth (no accounts — REQUIREMENTS Out-of-Scope) |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No backend |
| V5 Input Validation | no (unchanged) | Existing numeric clamps in `LogSliderInput`/store unchanged this phase |
| V6 Cryptography | no | None |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tooltip/caption HTML injection | Tampering | Already mitigated: tooltip strings built from numeric model output only (`selectors.ts` T-03-03 notes); this phase introduces no user-derived strings — survivorship caveat text is a static constant from `sources.ts`, not user input |

No security action items for this phase.

## Sources

### Primary (HIGH confidence)
- Codebase (read directly this session): `src/ui/*` (10 files), `src/viz/*` (5 files), `src/state/selectors.ts`, `src/data/sources.ts`, `src/core/types.ts`, `src/state/__tests__/selectors.test.ts`, `src/ui/__tests__/summaryFormatters.test.ts`, `package.json`, `vite.config.ts` — [VERIFIED: codebase grep/read]
- `docs/NEUTRALITY-STYLE-GUIDE.md` §1–§7 — [VERIFIED: read]
- `.planning/phases/04-ui-shell-minimal-entry/04-REVIEW.md` §CR-01 — [VERIFIED: read]
- `.planning/phases/05-.../05-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md` §Phase 5, `.planning/config.json`, `CLAUDE.md` — [VERIFIED: read]

### Secondary (MEDIUM confidence)
- None — no external research required.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Surface inventory: HIGH — closed, small file set fully read; completeness provable by enumeration + grep evidence
- CR-01 fix: HIGH — defect confirmed against source lines; 04-REVIEW corroborates; fix is a local pure-function change
- Survivorship caveat: HIGH — caveat text confirmed present in `sources.ts:jst2019.note`; footer confirmed not rendering it
- Verbatim captions: HIGH — all four located in source; §7 confirmed byte-exact by inspection
- Test approach: HIGH — `vite.config.ts` confirms `environment: 'node'`, no DOM lib present

**Research date:** 2026-05-16
**Valid until:** 2026-06-15 (stable; codebase-internal — only invalidated by edits to the swept files before planning)
