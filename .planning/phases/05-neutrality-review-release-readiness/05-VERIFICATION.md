---
phase: 05-neutrality-review-release-readiness
verified: 2026-05-17T00:30:00Z
status: human_needed
score: 7/7
overrides_applied: 0
human_verification:
  - test: "Open the running app and confirm the relative-position chart caption renders the neutral no-zero-sum text visibly below the chart (not just in source)"
    expected: "Caption reads: 'This shows the user's rank within the distribution. Rank can move down while the user's real wealth still grows — every tier's wealth increases over this horizon. See the wealth-by-tier chart above for absolute amounts.'"
    why_human: "REL_POS_CAPTION is a module-private constant — no DOM tooling is set up for visual rendering verification; source-read equality was confirmed but visible DOM rendering needs human confirmation"
  - test: "Toggle to nominal basis and confirm the 'while real wealth grew X×' clause still shows a real (lower) multiple rather than the nominal (inflated) multiple"
    expected: "The growth multiple in the rank-delta sentence is basis-invariant (same real value regardless of display basis toggle)"
    why_human: "The CR-01 fix is wired and tested at the selector level but the rendered behaviour on nominal toggle needs visual confirmation in a running browser"
  - test: "Scroll to the footer and confirm the JST survivorship caveat sentence renders visibly (not blank or hidden)"
    expected: "Footer shows a second paragraph containing text about 'markets that survived without revolution or expropriation' and '~0.5pp upward survivorship bias'"
    why_human: "CitationFooter.tsx has the JST_SURVIVORSHIP_CAVEAT constant and rendering <p> confirmed by grep, but visible rendering in the app requires a running browser"
---

# Phase 05: Neutrality Review & Release Readiness — Verification Report

**Phase Goal:** Every on-screen narrative annotation, label, microcopy string, and chart palette decision shipped in Phases 3, 4, and 4.1 is reviewed against the neutrality style guide and corrected, so the released tool describes mechanism as fact without assigning blame or virtue. The carried CR-01 D-14 mislabel is fixed and the JST survivorship caveat is surfaced; Phase 5 exits with zero open FAIL rows in 05-NEUT-02-REVIEW.md.
**Verified:** 2026-05-17T00:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every user-facing string and chart palette choice has been checked against the NEUT-01 style guide with a recorded pass/fail per item | VERIFIED | `05-NEUT-02-REVIEW.md` exists with 77 rows across all 16 shipped surface files, every row citing a specific §-rule (§1–§7). Grep completeness evidence embedded in the artifact. |
| 2 | No value-laden adjectives/verbs, alarm punctuation, or semantic red/green remain in any shipped surface | VERIFIED | 75 PASS + 2 FIXED rows, 0 open FAIL rows in `05-NEUT-02-REVIEW.md`. `!` characters in AppShell.tsx and selectors.ts are TypeScript non-null assertions, not user-facing alarm punctuation. CitationFooter.tsx `grep -c '!'` = 0. |
| 3 | The relative-position chart carries a neutral caption clarifying shares can diverge while all wealth still grows (no zero-sum implication) | VERIFIED (source) / human-needed (render) | `AppShell.tsx:33` contains `REL_POS_CAPTION` with "Rank can move down while the user's real wealth still grows — every tier's wealth increases over this horizon." Source-read equality confirmed. Visual rendering needs human check (Step 8). |
| 4 | Long-run-historical defaults surface their survivorship caveat neutrally in the sourcing affordance | VERIFIED (source) / human-needed (render) | `CitationFooter.tsx:9-14` defines `JST_SURVIVORSHIP_CAVEAT` with traceable claims (~0.5pp, market survival, conservative shading), rendered as second `<p>` at line 44. No SOURCES import (props-only boundary preserved). Visual rendering needs human check (Step 8). |
| 5 | CR-01 D-14 mislabel is fixed: nominal basis no longer passes inflated multiple to the "real wealth grew X×" clause | VERIFIED | `selectors.ts:403` — `realGrowthMultiple: number; // ALWAYS real-basis`. `selectors.ts:681` — computed from `rawResult.series` first/last `userWealth`. `SummaryReadout.tsx:55` — `formatRankDelta(..., summary.realGrowthMultiple)`. `AppShell.tsx:97` — `selectSummary(result, rawResult)`. Commits a2f1e91, 11f9e22, 27705d0 verified in git log. |
| 6 | `tsc --noEmit` passes after the selectSummary signature change | VERIFIED | `npm run typecheck` exits 0 with no output (confirmed live run). |
| 7 | Phase exits with zero open FAIL rows in 05-NEUT-02-REVIEW.md | VERIFIED | `grep -qE 'open FAIL:?\s*0'` matches line 396: "Total rows: 77 · PASS: 75 · FIXED: 2 · open FAIL: 0". `grep -nE '^\|.*\|\s*FAIL\s*\|'` produces no output. |

**Score:** 7/7 truths verified (3 require human visual confirmation of rendering)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.planning/phases/05-neutrality-review-release-readiness/05-NEUT-02-REVIEW.md` | Exhaustive per-item review with zero open FAIL rows | VERIFIED | File exists, 77 rows, summary line confirms "open FAIL: 0". Grep completeness evidence embedded. |
| `src/state/selectors.ts` | `realGrowthMultiple` field + two-arg `selectSummary(result, rawResult)` | VERIFIED | `realGrowthMultiple` at lines 403 (interface) and 681 (computed). `selectSummary` two-arg signature at line 667. |
| `src/state/__tests__/selectors.test.ts` | CR-01/D-14 regression test + source-read equality for §3 REL_POS_CAPTION | VERIFIED | CR-01/D-14 test present (commit a2f1e91 RED, 11f9e22 GREEN). §3 REL_POS_CAPTION documented as source-read equality comment block at line 647+. SHARE_CAPTION byte-exact `.toBe(` assertion at line 636. |
| `src/ui/AppShell.tsx` | `selectSummary(result, rawResult)` call | VERIFIED | Line 97 confirmed by grep. |
| `src/ui/SummaryReadout.tsx` | `summary.realGrowthMultiple` in formatRankDelta call | VERIFIED | Line 55 confirmed by grep. |
| `src/ui/CitationFooter.tsx` | JST survivorship caveat rendered as second `<p>`; no SOURCES import | VERIFIED | `JST_SURVIVORSHIP_CAVEAT` constant at lines 9-14, rendered at line 44. No `import.*sources` found. |
| `docs/NEUTRALITY-STYLE-GUIDE.md` | Version bumped to 1.1; §3 HarnessPage.tsx corrected to AppShell.tsx | VERIFIED | Header shows `**Version:** 1.1`. §3 body and correction note confirmed at lines 86 and 88. |
| `src/ui/__tests__/summaryFormatters.test.ts` | Byte-exact §6 D-14 template assertion + §5 D-09 template assertion | VERIFIED | `formatRankDelta(75, 71, 2.3)` byte-exact `.toBe(` at line 51. `formatMoneyIllusionCaption` byte-exact `.toBe(` at line 88. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/ui/AppShell.tsx` | `selectSummary(result, rawResult)` | `summary` useMemo threading rawResult | WIRED | Line 97: `selectSummary(result, rawResult)` confirmed by grep |
| `src/ui/SummaryReadout.tsx` | `formatRankDelta` | `summary.realGrowthMultiple` argument | WIRED | Line 55: `formatRankDelta(summary.startRank, summary.endRank, summary.realGrowthMultiple)` confirmed by grep |
| `05-NEUT-02-REVIEW.md` | `docs/NEUTRALITY-STYLE-GUIDE.md §1–§7` | Every row cites specific section/rule | WIRED | All 77 rows contain §-rule citations; artifact header records "Style guide version reviewed against: 1.1" |
| `src/state/__tests__/selectors.test.ts` | `SHARE_CAPTION` | `expect(SHARE_CAPTION).toBe(...)` | WIRED | Line 636 confirmed by grep |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `SummaryReadout.tsx` D-14 clause | `summary.realGrowthMultiple` | `rawResult.series[0].userWealth` / `rawResult.series[last].userWealth` in `selectSummary` (selectors.ts:668-669, 681) | Yes — from real projection engine output | FLOWING |
| `CitationFooter.tsx` caveat | `JST_SURVIVORSHIP_CAVEAT` | Static string constant traceable to `SOURCES.jst2019.note` (sources.ts:173-182) | N/A — static/sourced constant (not dynamic data) | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 170/170 Vitest tests pass (includes CR-01/D-14 regression + byte-exact caption assertions) | `npx vitest run` | 170 passed (12 test files) | PASS |
| tsc --noEmit exits 0 after two-arg selectSummary signature change | `npm run typecheck` | Exits 0, no output | PASS |
| 05-NEUT-02-REVIEW.md exists with zero open FAIL rows | `grep -qE 'open FAIL:\s*0' 05-NEUT-02-REVIEW.md` | Match at line 396 | PASS |
| No open FAIL rows in review tables | `grep -nE '^\|.*\|\s*FAIL\s*\|' 05-NEUT-02-REVIEW.md` | No output | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| NEUT-02 | 05-01-PLAN.md, 05-02-PLAN.md, 05-03-PLAN.md | All on-screen narrative annotations and copy pass a neutrality review against the style guide | SATISFIED | `05-NEUT-02-REVIEW.md` exhaustive 77-row review; zero open FAIL rows; CR-01 fixed; survivorship caveat surfaced |

**Orphaned requirements:** None. REQUIREMENTS.md maps only NEUT-02 to Phase 5, and all three plans declare `requirements: [NEUT-02]`.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | No TBD/FIXME/XXX markers, no stub returns, no hardcoded empty data in phase-modified files |

---

### Human Verification Required

The automated checks all pass. Three items need visual confirmation in a running browser because no DOM tooling (jsdom) is configured in this project's test setup:

#### 1. Relative-Position Chart Caption Renders Visibly

**Test:** Start the app (`npm run dev`), wait for a projection to compute, scroll to the "Position in the wealth distribution over time" chart and confirm a caption paragraph is visible below it.
**Expected:** Caption text: "This shows the user's rank within the distribution. Rank can move down while the user's real wealth still grows — every tier's wealth increases over this horizon. See the wealth-by-tier chart above for absolute amounts."
**Why human:** `REL_POS_CAPTION` is a module-private constant (not exported) — a DOM-rendering test would require jsdom tooling not present. Source-read equality was confirmed; visible render requires a browser.

#### 2. CR-01 Nominal-Basis Invariance Renders Correctly

**Test:** Start the app, note the growth multiple in the rank-delta clause (e.g. "while real wealth grew 3.2×"). Toggle to Nominal basis. Confirm the multiple in the same clause stays the same (real-basis value), while the "Ending wealth (nominal)" figure above it increases.
**Expected:** The "while real wealth grew X×" value is identical in both real and nominal basis; only the "Ending wealth" label and value change.
**Why human:** The CR-01 selector-level fix is fully wired and regression-tested. Visual confirmation of the nominal-mode rendered behaviour requires running the app.

#### 3. JST Survivorship Caveat Renders Visibly in Footer

**Test:** Start the app, scroll to the bottom citation footer and confirm a second paragraph is present below the citations and the "See sources for definitions and caveats." line.
**Expected:** Paragraph containing: "The long-run historical return figures (Jordà, Schularick, Taylor 2019) are drawn from markets that survived without revolution or expropriation, introducing an estimated ~0.5pp upward survivorship bias in reported real equity and housing returns. The default parameters are shaded conservatively below the JST headline figures to account for this adjustment."
**Why human:** `CitationFooter.tsx` has the constant and `<p>` render confirmed by grep; but whether the footer actually appears in the rendered DOM (no conditional guards hiding it) requires visual verification in a running browser.

---

### Gaps Summary

No gaps. All automated checks pass:

- CR-01 D-14 mislabel: fixed and regression-tested (commits a2f1e91, 11f9e22, 27705d0)
- JST survivorship caveat: surfaced in CitationFooter (commit d497356)
- Exhaustive 77-row neutrality review: zero open FAIL rows (commit 15752c4)
- §3 style-guide drift: corrected in docs/NEUTRALITY-STYLE-GUIDE.md v1.1 (commit 15752c4)
- Byte-exact caption assertions: added for §5, §6, §7 (commit 0bc236d)
- Full Vitest suite: 170/170 green
- tsc --noEmit: exits 0

Three human verification items remain for visual DOM rendering confirmation. These are standard end-of-phase human checks for a frontend app without DOM test tooling — they do not indicate implementation gaps.

---

**Advisory note (out of scope):** The separate code review `05-REVIEW.md` flagged a pre-existing donut-label concentration bug in `src/state/selectors.ts` (the `userBandIdx` concentration fix). This is a functional correctness issue in the VIZ-07 donut chart, not a neutrality/NEUT-02 issue. It does not block the NEUT-02 release gate but should be tracked as a follow-up defect for the donut chart display layer.

---

_Verified: 2026-05-17T00:30:00Z_
_Verifier: Claude (gsd-verifier)_
