# Phase 5: Neutrality Review & Release Readiness - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver NEUT-02: every shipped user-facing string and chart palette decision
from Phases 3, 4, and 4.1 is reviewed against `docs/NEUTRALITY-STYLE-GUIDE.md`
and corrected, so the released tool describes mechanism as fact without
assigning blame or virtue.

In scope (per ROADMAP §"Phase 5" success criteria):
- A recorded pass/fail per shipped user-facing string and palette choice,
  checked against the NEUT-01 style guide.
- Removal of any value-laden adjectives/verbs, alarm punctuation, or semantic
  red/green remaining on a shipped surface.
- The relative-position chart neutral no-zero-sum caption (already seeded as
  D-11) is verified against its canonical text.
- The long-run-historical defaults surface their survivorship caveat neutrally
  in the sourcing affordance (this copy does not yet exist in the UI).
- The carried mandatory **CR-01** fix: the nominal-basis growth multiple is
  currently mislabeled "real wealth grew G×" (D-14 violation) — corrected and
  re-verified as a NEUT-02 row.

Out of scope: new model parameters, new chart types, advanced configuration
(v2 CONFIG-01), URL-shared state (v2 SHARE-01). The review covers
already-shipped surfaces; it does not add product capability.

</domain>

<decisions>
## Implementation Decisions

### Review artifact & method (discussed)
- **D-01:** The per-item review is recorded in a single dedicated artifact,
  **`05-NEUT-02-REVIEW.md`**, that enumerates every shipped user-facing string
  and palette decision with an explicit verdict per row. This satisfies
  ROADMAP criterion 1 ("recorded pass/fail per item") **literally**, and
  **supersedes the Phase 3 D-01 "no formal pass/fail checklist template"
  stance for this gate specifically** (Phase 3 deferred the checklist to the
  Phase 5 review gate; this is that gate).
- **D-02:** The item inventory is assembled via an **exhaustive code sweep of
  the shipped surfaces**, grouped by surface. Sweep `src/ui/*` (AppShell,
  ControlPanel, SummaryReadout, BasisToggle, HorizonSlider, LogLinearToggle,
  LogSliderInput, CitationFooter, summaryFormatters), `src/viz/*`
  (TimeSeriesChart, DivergenceChart, RelativePosChart, TierShareChart,
  DonutChart), and the selector-layer copy/palette constants in
  `src/state/selectors.ts` — every literal string, axis/series/tooltip label,
  caption, and palette constant becomes an enumerated row grouped by its
  surface. The inventory itself must be auditable (a reviewer can see the
  sweep was exhaustive, not sampled).
- **D-03:** Verdicts are **rendered by the executing agent and
  human-confirmable** — each row carries a PASS/FAIL verdict plus a one-line
  rationale citing the specific style-guide section/rule it was checked
  against. No mandatory blocking interactive human gate during execution;
  the artifact is structured so a human can scan and override (consistent
  with the project's existing automation-verifies + browser-only-items-to-UAT
  pattern). Neutrality remains a hard release gate, but the gate mechanism
  here is the recorded, overridable artifact — not a synchronous human
  sign-off step.
- **D-04:** FAIL rows are **fixed inline within this phase**; each fixed row
  flips to **FIXED** and records the commit/diff reference that resolved it,
  then is re-verified to PASS. **Phase 5 exits with zero open FAIL rows** —
  "release readiness" means no shipped neutrality violation remains. The
  carried CR-01 nominal-growth-multiple mislabel is treated as one such row
  and resolved this way.

### Claude's Discretion
- **Exact `05-NEUT-02-REVIEW.md` row schema/columns** (e.g., surface · string
  · style-guide rule · verdict · rationale · fix-ref) — planner's call, as
  long as it is per-item, surface-grouped, auditable, and records the rule
  checked against and the fix reference for FIXED rows.
- **CR-01 fix implementation** — the reviewer's prescribed approach (derive
  the summary growth pairing from the pre-reinflation `rawResult`, or add a
  `realGrowthMultiple` field) is the strong default; the planner/executor
  may choose the cleaner of those equivalents as long as the
  `while real wealth grew [G]×` clause refers to the real growth multiple
  regardless of active basis (Style Guide §6 / D-14), with a regression test.
- **Survivorship caveat surfacing** (criterion 4) — *where* (extend
  `CitationFooter`, a per-source affordance, or a caption near the affected
  charts), *which* defaults trigger it (the long-run-historical JST "Rate of
  Return on Everything" anchor is the primary survivorship-biased source —
  confirm against `src/data/sources.ts` caveat fields), and the exact neutral
  wording. Not locked here; planner/researcher decides, grounded in the
  existing `SourceRecord` caveat data and the §1 lexicon rules. The footer
  today only says "See sources for definitions and caveats." — the caveat is
  not actually rendered.
- **Style-guide-as-living-doc policy** — whether a finding that exposes a gap
  the guide does not cover triggers a guide amendment + version bump within
  this phase, or the guide is frozen and only current rules are checked. Not
  discussed; planner's call. Default lean: if a shipped string is
  non-neutral but no existing rule names it, fix the string and add the rule
  (version-bump the guide) so the guide stays the single source of truth —
  but this is discretion, not a locked decision.
- **Whether non-neutrality carried code-review items are folded** — the 6
  carried Phase-4 warnings (beyond CR-01), 3 Phase-3 advisory warnings, and
  the open browser-only UAT items are NOT in NEUT-02 scope by requirement;
  folding any as "release readiness" is a planner scope call, not a locked
  decision. Phase boundary stays NEUT-02 + CR-01.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirement & roadmap (the verification contract)
- `.planning/REQUIREMENTS.md` §"Neutrality (NEUT)" — NEUT-02 (the requirement
  this phase delivers) + traceability row → Phase 5.
- `.planning/ROADMAP.md` §"Phase 5: Neutrality Review & Release Readiness" —
  goal + 4 success criteria (recorded pass/fail per item; no value-laden
  language/alarm punctuation/semantic red-green; relative-position no-zero-sum
  caption; survivorship caveat in the sourcing affordance).
- `.planning/PROJECT.md` — goal #3 (neutral, unbiased — hard requirement) and
  the Phase 4 completion note carrying **CR-01 as a mandatory NEUT-02
  pre-condition**.

### Neutrality contract (the artifact reviewed against)
- `docs/NEUTRALITY-STYLE-GUIDE.md` — the full artifact this phase reviews
  every shipped surface against. Section map:
  §1 Copy Lexicon (banned verbs/adjectives/framing/alarm punctuation);
  §2 Chart-Semantic Rules (axis/series/scale/tooltip labels);
  §3 Relative-Position Caption Rule (D-11 verbatim text);
  §4 Palette Clause (no semantic red/green; the 5-hue categorical palette);
  §5 D-09 Nominal Mode Caption Rule (verbatim template);
  §6 D-15 Rank-Delta Neutral Disclosure Rule (D-14 pairing — **the rule CR-01
  violates**);
  §7 D-16 Share-of-Economy Neutral Disclosure Rule (verbatim caption).

### The carried defect (CR-01)
- `.planning/phases/04-ui-shell-minimal-entry/04-REVIEW.md` §"CR-01" — exact
  defect description, affected files (`src/ui/SummaryReadout.tsx:54`,
  `src/state/selectors.ts:400-414`, `src/ui/AppShell.tsx:55-76`), and the
  prescribed fix (derive the summary growth pairing from the pre-reinflation
  `rawResult` / add a `realGrowthMultiple` field).

### Prior phase neutrality decisions (still binding)
- `.planning/phases/03-selectors-visualization-neutrality-style-guide/03-CONTEXT.md`
  — D-01 (style guide is the Phase-5-reviewed artifact; **a formal checklist
  was deferred to this gate** — D-01 here resolves that), D-02..D-04 (lexicon,
  chart-semantic, palette clause, D-11 caption seeding).
- `.planning/phases/04-ui-shell-minimal-entry/04-CONTEXT.md` — D-09 (nominal
  not-adjusted caption) and D-14/D-15 (rank-delta pairing + disclosure)
  seeded into the style guide for this gate.
- `.planning/phases/04.1-tier-share-of-economy-visualization-at-the-end-of-the-projec/04.1-CONTEXT.md`
  — D-10/D-16 (share-of-economy caption seeded into the style guide §7 for
  this gate).

### Surfaces under review (shipped code)
- `src/ui/*` and `src/viz/*` — all user-facing components (the sweep targets).
- `src/state/selectors.ts` — `COLORS` palette constants, `SHARE_CAPTION`, and
  any copy produced in the selector layer.
- `src/ui/CitationFooter.tsx` — the current sourcing affordance (criterion 4
  target; currently does not render caveat text).
- `src/data/sources.ts` / `src/data/defaults.ts` / `src/core/types.ts` — the
  `SourceRecord` caveat fields the survivorship-caveat copy must draw from
  (data integrity: surface the cited caveat, do not invent one).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Style guide §3/§5/§6/§7 each define a **verbatim caption template** already
  seeded — these become deterministic equality-checkable rows in the review
  (high-confidence PASS/FAIL).
- `04-REVIEW.md` already localizes CR-01 to exact files/lines and prescribes
  the fix — the executor does not need to re-diagnose it.
- `CitationFooter.tsx` already iterates `SourceRecord[]` and links sources;
  the survivorship-caveat surfacing extends this existing affordance rather
  than introducing a new one.

### Established Patterns
- Neutrality is a contractually-constrained hard release gate, not a
  stylistic preference (PROJECT.md goal #3); the style guide is the single
  source of truth and is read directly during this phase.
- Project verification pattern: automation/agent verifies, browser-only and
  judgement items recorded for human confirmation — D-03 follows this
  (agent verdict, human-confirmable artifact) rather than a blocking sync
  gate.
- Data integrity ("don't assume stuff — cite a source"): the survivorship
  caveat must be sourced from the existing `SourceRecord` caveat data, not
  authored ad hoc.

### Integration Points
- New `05-NEUT-02-REVIEW.md` artifact under the phase directory.
- CR-01 fix touches `src/ui/SummaryReadout.tsx`, `src/state/selectors.ts`,
  `src/ui/AppShell.tsx` (+ a regression test).
- Survivorship caveat surfacing touches `src/ui/CitationFooter.tsx` (or a
  near-chart caption) and reads `src/data/sources.ts` caveat fields.
- A FAIL→FIXED row may touch any shipped `src/ui`/`src/viz`/`selectors`
  string or palette constant; possible style-guide version bump if a finding
  exposes an uncovered gap (planner discretion).

</code_context>

<specifics>
## Specific Ideas

- The review artifact is the deliverable of record: a surface-grouped,
  exhaustive, per-item `05-NEUT-02-REVIEW.md` where every row names the
  style-guide rule it was checked against, carries an agent verdict, and —
  for any FAIL — flips to FIXED with the resolving commit/diff reference.
- "Release readiness" is operationalized concretely: **zero open FAIL rows at
  phase exit.** No shipped neutrality violation remains; CR-01 is one of
  those rows.
- The four seeded verbatim captions (§3/§5/§6/§7) are the mechanically
  strongest rows — verify the shipped DOM text equals the canonical template
  exactly.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within the NEUT-02 phase boundary. The other
identified gray areas (survivorship-caveat surfacing specifics, CR-01 fix
implementation choice, style-guide-living-doc policy, and whether non-NEUT
carried review/UAT items are folded) were intentionally left to
research/planner discretion under the captured decisions rather than deferred
to a later phase.

</deferred>

---

*Phase: 5-neutrality-review-release-readiness*
*Context gathered: 2026-05-16*
