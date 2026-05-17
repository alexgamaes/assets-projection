---
phase: 05-neutrality-review-release-readiness
plan: "03"
subsystem: neutrality-review / documentation
tags: [neut-02, neutrality, style-guide, release-gate, vitest, documentation]
dependency_graph:
  requires:
    - "05-01: CR-01 fix (realGrowthMultiple + two-arg selectSummary)"
    - "05-02: JST survivorship caveat in CitationFooter"
  provides:
    - "05-NEUT-02-REVIEW.md: exhaustive per-item neutrality audit with zero open FAIL rows"
    - "NEUT-02 release gate satisfied"
    - "docs/NEUTRALITY-STYLE-GUIDE.md v1.1 (§3 component reference corrected)"
    - "byte-exact Vitest assertions for §5 D-09 caption + §6 D-14 template"
    - "source-read equality documentation for §3 REL_POS_CAPTION + §6 D-15 disclosure"
  affects:
    - docs/NEUTRALITY-STYLE-GUIDE.md
    - src/state/__tests__/selectors.test.ts
    - src/ui/__tests__/summaryFormatters.test.ts
tech_stack:
  added: []
  patterns:
    - "Exhaustive grep-evidence audit: embed grep command + full output in review artifact for auditability (D-02)"
    - "Source-read equality: document non-exported constants as source-read rows rather than adding DOM tooling"
    - "Living-doc version bump: correct stale component references in style guide with version increment, not freeze"
key_files:
  created:
    - .planning/phases/05-neutrality-review-release-readiness/05-NEUT-02-REVIEW.md
  modified:
    - docs/NEUTRALITY-STYLE-GUIDE.md
    - src/state/__tests__/selectors.test.ts
    - src/ui/__tests__/summaryFormatters.test.ts
decisions:
  - "REL_POS_CAPTION not exported from AppShell.tsx: documented as source-read equality row rather than adding DOM tooling (RESEARCH Anti-Pattern)"
  - "Style guide §3 drift resolved as living-doc version bump (1.0 → 1.1): HarnessPage.tsx corrected to AppShell.tsx; no rule change"
  - "§6 D-15 JSX disclosure reviewed as source-read equality (inline JSX with &apos; entity; no jsdom available)"
  - "All COLORS hex values verified byte-exact against §4 palette clause"
metrics:
  duration: "~15 min"
  completed: "2026-05-17"
  tasks_completed: 2
  files_modified: 4
---

# Phase 05 Plan 03: NEUT-02 Exhaustive Neutrality Review Summary

**One-liner:** Produced `05-NEUT-02-REVIEW.md` — 77-row exhaustive per-item neutrality audit of all 16 shipped user-facing surfaces against NEUTRALITY-STYLE-GUIDE.md §1–§7, with byte-exact caption assertions, zero open FAIL rows, and §3 style-guide drift corrected (HarnessPage.tsx → AppShell.tsx, version 1.1).

## What Was Built

### Task 1 — Verbatim-caption byte-exact equality assertions (§3 + §5 + §6 + §7)

Added new Vitest assertions to enforce verbatim caption compliance:

**`src/ui/__tests__/summaryFormatters.test.ts`:**
- New test: byte-exact §6 D-14 template assertion — `formatRankDelta(75, 71, 2.3)` equals `'Distribution position: p75 → p71, while real wealth grew 2.3×.'`
- New test: byte-exact §5 D-09 template assertion — `formatMoneyIllusionCaption('nominal', 0.025, sourceName)` equals the full three-sentence template from style guide §5
- Source-read equality comment block for §6 D-15 inline JSX disclosure (no jsdom available)

**`src/state/__tests__/selectors.test.ts`:**
- Source-read equality comment block for §3 `REL_POS_CAPTION` — the constant is not exported from AppShell.tsx; a DOM test would require adding jsdom tooling (RESEARCH Anti-Pattern); source-read confirms byte-exact match to §3 canonical text
- Note: `SHARE_CAPTION` §7 byte-exact assertion was already present (selectors.test.ts:635-638)

**Verification:** 170/170 tests green; `npm run typecheck` exits 0.

### Task 2 — Exhaustive surface sweep + 05-NEUT-02-REVIEW.md + §3 drift resolution

**`05-NEUT-02-REVIEW.md` created:**
- 77 review rows across 16 files, surface-grouped
- Embedded grep completeness evidence (full 95-match output)
- Every row cites specific §-rule (§1–§7)
- Verdicts: 75 PASS + 2 FIXED + 0 open FAIL
- Two literal-free viz wrappers (TimeSeriesChart, DivergenceChart) explicitly marked "none — verified"
- `__tests__/` excluded with explanation
- CR-01 recorded as FIXED with Plan-01 commit refs (a2f1e91/11f9e22/27705d0)
- Plan-02 JST survivorship caveat reviewed as its own row vs §1: PASS
- 5 verbatim captions tabulated with verification method

**`docs/NEUTRALITY-STYLE-GUIDE.md` updated (Version 1.0 → 1.1):**
- §3: corrected `src/ui/HarnessPage.tsx` → `src/ui/AppShell.tsx` (lines 32-33), `REL_POS_CAPTION`
- Added correction note in §3 documenting the drift and the version that resolved it
- No rule changes — documentation accuracy fix only

**Verification:** 170/170 tests green; `npm run typecheck` exits 0.

## Verification

- `test -f .planning/phases/05-neutrality-review-release-readiness/05-NEUT-02-REVIEW.md` — FOUND
- `grep -qE 'open FAIL:?\s*0' 05-NEUT-02-REVIEW.md` — matches
- `grep -nE '^\|.*\|\s*FAIL\s*\|' 05-NEUT-02-REVIEW.md` — no output (zero open FAIL rows)
- `grep -n "SHARE_CAPTION" src/state/__tests__/selectors.test.ts` — shows `.toBe(` at line 636
- §3 REL_POS_CAPTION — source-read equality documented in selectors.test.ts comment block
- §5 + §6 templates — exact assertions in summaryFormatters.test.ts
- Style guide §3: `grep "AppShell.tsx" docs/NEUTRALITY-STYLE-GUIDE.md` — confirmed in §3 body and correction note
- `npx vitest run` — 170/170 passed
- `npm run typecheck` — exits 0

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | 0bc236d | test(05-03): add verbatim-caption byte-exact assertions for §5/§6/§7 (NEUT-02) |
| Task 2 | 15752c4 | docs(05-03): exhaustive NEUT-02 review + §3 style-guide drift resolution |

## Deviations from Plan

None - plan executed exactly as written.

The plan anticipated that `REL_POS_CAPTION` might not be exported (Task 1 action: "if it is not module-exported, do NOT add a DOM test … record §3 as a source-read equality row"). REL_POS_CAPTION is indeed not exported; this was handled exactly as prescribed — documented as source-read equality in the test file and in the review artifact.

## Known Stubs

None — this plan produces only documentation artifacts, test assertions, and a style-guide version bump. No UI rendering stubs introduced.

## Threat Flags

None — this plan introduces no new network endpoints, auth paths, file access patterns, or schema changes. The changes are: a `.planning/` markdown artifact, a `docs/` style guide text edit (version bump), and additions to `src/**/__tests__/` files.

## Self-Check: PASSED

- `.planning/phases/05-neutrality-review-release-readiness/05-NEUT-02-REVIEW.md` — FOUND
- `docs/NEUTRALITY-STYLE-GUIDE.md` — FOUND (modified)
- `src/state/__tests__/selectors.test.ts` — FOUND (modified)
- `src/ui/__tests__/summaryFormatters.test.ts` — FOUND (modified)
- Commit 0bc236d — found in git log
- Commit 15752c4 — found in git log
- `open FAIL: 0` line present in 05-NEUT-02-REVIEW.md
- 170/170 Vitest tests passing
- `npm run typecheck` exits 0
