# Phase 5: Neutrality Review & Release Readiness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 5-neutrality-review-release-readiness
**Areas discussed:** Review artifact & method

---

## Gray Areas Presented (selection)

| Area | Selected for discussion |
|------|-------------------------|
| Review artifact & method | ✓ |
| Survivorship caveat surfacing | (left to discretion) |
| CR-01 fix + release scope | (left to discretion) |
| Violation remediation policy | (left to discretion) |

---

## Review artifact & method

### Q1 — How is the per-item review recorded?

| Option | Description | Selected |
|--------|-------------|----------|
| NEUT-02-REVIEW.md enumerated checklist | Single markdown artifact enumerating every shipped string + palette decision with explicit PASS/FAIL/FIXED; supersedes Phase 3 "no checklist" for this gate | ✓ |
| Automated tests + review doc | Verbatim-equality tests for 4 captions + lexicon/palette scan + thinner review doc | |
| Inline-annotated review | Verdicts as a section in phase VERIFICATION/REVIEW output, no standalone artifact | |

**User's choice:** NEUT-02-REVIEW.md enumerated checklist

### Q2 — How is the item inventory assembled?

| Option | Description | Selected |
|--------|-------------|----------|
| Exhaustive code sweep, grouped by surface | Sweep src/ui + src/viz + selectors for every string/label/caption/palette constant; rows grouped by surface; inventory auditable | ✓ |
| Style-guide-rule-driven | Organize by the 7 style-guide sections | |
| Requirement-criterion-driven | One block per ROADMAP success criterion | |

**User's choice:** Exhaustive code sweep, grouped by surface

### Q3 — Who renders the verdict?

| Option | Description | Selected |
|--------|-------------|----------|
| Agent verdict, human-confirmable | Agent assigns verdict + rule-citing rationale; artifact scannable/overridable; no blocking sync gate | ✓ |
| Agent verdict + mandatory human sign-off | Blocking HUMAN-UAT-style sign-off | |
| Split: automated rows + human rows | Deterministic for captions, agent+human-review flag for tone | |

**User's choice:** Agent verdict, human-confirmable

### Q4 — How are FAIL rows handled?

| Option | Description | Selected |
|--------|-------------|----------|
| Fix inline, mark FIXED with diff ref | Every FAIL corrected this phase; row flips FIXED with commit/diff ref, re-verified PASS; zero open FAILs at exit | ✓ |
| Fix inline, defer only on explicit escalation | Default fix-inline; defer only scope-expanding cases as tracked items | |
| Triage first, then batch-fix | Full review before any fixes, then second remediation pass | |

**User's choice:** Fix inline, mark FIXED with diff ref

**Notes:** User selected only the "Review artifact & method" gray area, answered all four questions, then chose "I'm ready for context" — explicitly leaving the remaining gray areas to research/planner discretion.

---

## Claude's Discretion

- Exact `05-NEUT-02-REVIEW.md` row schema/columns.
- CR-01 fix implementation (reviewer-prescribed `rawResult` / `realGrowthMultiple` approach is the strong default).
- Survivorship caveat surfacing — location, triggering defaults, exact neutral wording.
- Style-guide-as-living-doc policy (amend + version-bump vs. freeze).
- Whether non-NEUT carried code-review warnings / browser-only UAT items are folded into "release readiness".

## Deferred Ideas

None — discussion stayed within the NEUT-02 phase boundary.
