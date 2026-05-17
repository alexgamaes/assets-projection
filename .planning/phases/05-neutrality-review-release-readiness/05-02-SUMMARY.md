---
phase: 05-neutrality-review-release-readiness
plan: 02
subsystem: ui
tags: [react, tailwind, neutrality, citation, survivorship-bias, jst2019]

# Dependency graph
requires:
  - phase: 05-01
    provides: CR-01 fix, providing clean selector baseline for full suite green
provides:
  - JST survivorship caveat rendered in CitationFooter (ROADMAP Phase 5 criterion 4 met)
  - §1-compliant static caveat constant traceable to SOURCES.jst2019.note
affects:
  - 05-03 (NEUT-02 review artifact will score this as a PASS row)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static §1-compliant caveat constant defined in the component file — props-only boundary preserved, no SOURCES import"

key-files:
  created: []
  modified:
    - src/ui/CitationFooter.tsx

key-decisions:
  - "Inline caveat as static constant in CitationFooter.tsx (not imported from sources.ts, not passed as prop) — satisfies props-only boundary and makes grep-based acceptance criterion verifiable directly on the component file"

patterns-established:
  - "Sourced-caveat pattern: define §1-compliant static string with traceability comment citing source file and line range, render as second <p> in same Tailwind class family"

requirements-completed: [NEUT-02]

# Metrics
duration: 8min
completed: 2026-05-17
---

# Phase 5 Plan 02: Survivorship Caveat in CitationFooter Summary

**JST survivorship-bias caveat (~0.5pp upward bias from market-survival restriction) surfaced neutrally in CitationFooter as a §1-compliant static sentence traceable to SOURCES.jst2019.note, meeting ROADMAP Phase 5 criterion 4**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-17T06:32:00Z
- **Completed:** 2026-05-17T06:40:40Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added `JST_SURVIVORSHIP_CAVEAT` static constant in `CitationFooter.tsx` — a §1-compliant single-sentence condensation of `SOURCES.jst2019.note` (lines 173-182), stating the ~0.5pp upward bias mechanism and conservative default shading
- Rendered as a second `<p>` inside the existing `<footer>` using the same `text-sm text-slate-600` Tailwind class family for visual consistency
- Component remains props-only (no `import { SOURCES }` added); all factual claims traceable to jst2019.note
- `npm run typecheck` exits 0; all 168 Vitest tests green

## Source Traceability

The `JST_SURVIVORSHIP_CAVEAT` string is a neutral condensation of `src/data/sources.ts` lines 173-182 (`SOURCES.jst2019.note`). Key traceable claims:

| Claim in caveat | Source span in jst2019.note |
|---|---|
| "markets that survived without revolution or expropriation" | "markets that survived without revolution/expropriation" (line 175) |
| "~0.5pp upward survivorship bias in reported real equity and housing returns" | "~0.5pp upward bias in reported real equity/housing returns" (lines 174-175) |
| "default parameters are shaded conservatively below the JST headline figures" | "Conservative calibration should shade returns ~0.5pp below JST headlines; the PROJECT.md indicative band lower ends reflect this adjustment" (lines 176-178) |

## Task Commits

1. **Task 1: Render a sourced, §1-compliant JST survivorship caveat in CitationFooter** - `d497356` (feat)

**Plan metadata:** (committed with SUMMARY.md)

## Files Created/Modified

- `src/ui/CitationFooter.tsx` — Added `JST_SURVIVORSHIP_CAVEAT` static constant and second `<p>` rendering it in the `<footer>`

## Decisions Made

- Defined the caveat as a static string constant in `CitationFooter.tsx` itself rather than passing via props from AppShell. The string is a pure static literal (not dynamically derived from runtime SOURCES data) so inline definition satisfies both the props-only boundary (no `import { SOURCES }`) and the grep-based acceptance criterion (the literal is in the component file).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Criterion 4 (survivorship caveat in sourcing footer) is now met and ready for the NEUT-02 exhaustive review sweep in Plan 03
- The new sentence will appear as a NEUT-02 review row in the 05-NEUT-02-REVIEW.md artifact; verdict should be PASS (§1-compliant, no banned terms, no alarm punctuation, traceable to jst2019.note)

## Self-Check: PASSED

- `src/ui/CitationFooter.tsx` — FOUND
- Commit `d497356` — FOUND
- `grep -niE "survivorship|0\.5pp" src/ui/CitationFooter.tsx` — matches (lines 5, 7, 9, 11, 12, 44)
- `grep -c '!' src/ui/CitationFooter.tsx` — 0 (no alarm punctuation)
- `grep -n "SOURCES\|import.*sources" src/ui/CitationFooter.tsx` — comment only, no import
- `npm run typecheck` — exit 0
- `npx vitest run` — 168 tests passed

---
*Phase: 05-neutrality-review-release-readiness*
*Completed: 2026-05-17*
