# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-05-17
**Phases:** 6 (incl. inserted 4.1) | **Plans:** 20 | **Sessions:** ~3 days of work (2026-05-15 → 2026-05-17), 176 commits

### What Was Built
- Pure, framework-free, deterministic projection engine (heterogeneous returns, asset-price-inflation drag, nominal/real basis invariant) proven by numerical unit tests.
- Citation-enforced empirical default parameter set with a build-time sourcing-completeness gate.
- Five neutral ECharts visualizations (growth, divergence, relative-position, tier-share, donut) driven by memoized Zustand selectors, with a governing neutrality style guide.
- Responsive 2-input instant-projection UI shell with live recompute, real/nominal toggle, and neutral error containment.
- A neutrality release gate: exhaustive 77-row NEUT-02 review closing with zero open FAIL rows.

### What Worked
- **Strict bottom-up phase order** (engine → data → selectors → UI → review) meant correctness-critical math was locked and unit-tested before any UI depended on it. Zero rework of the engine after Phase 1.
- **Pure functions + framework-free `src/core/*`** kept the model unit-testable in isolation (170 tests, sub-second runs) and made the import-boundary scan a meaningful invariant.
- **Citation-as-a-build-gate** (DATA-04) structurally enforced the "don't assume stuff" constraint instead of relying on reviewer vigilance.
- **Neutrality style guide authored mid-project (Phase 3) then enforced as a Phase 5 gate** — caught a real shipped data-integrity bug (top-1%/top-10% donut mislabel) that automated tests had green-lit.
- Wave-based execute-phase with worktree-isolated executors ran cleanly; per-plan SUMMARY + post-merge test gate caught nothing broken because phases were well-decomposed.

### What Was Inefficient
- **Browser-only UAT accumulated unverified across every phase** — 15 HUMAN-UAT scenarios deferred to milestone close because no DOM/render test tooling was ever configured. The "ship-to-validate" pattern became "ship-without-validating-the-visual-layer."
- **REQUIREMENTS.md traceability never auto-updated** — all 25 rows still read `Pending` at audit time despite phases completing; required a 3-source cross-reference (VERIFICATION + SUMMARY + traceability) to confirm coverage.
- **SUMMARY.md `requirements_completed` frontmatter under-populated** — milestone accomplishment auto-extraction produced garbage ("One-liner:" noise) and had to be hand-curated.
- **Nyquist validation left partial in 4 of 6 phases** — never blocked, but never closed either.
- A stale quick-task index entry (`260516-lpb`, status `missing`) was a false positive — completed work the audit couldn't see.

### Patterns Established
- Framework-free pure model in `src/core/*`; UI is a thin selector-driven shell. Keep this boundary.
- Every shipped parameter carries a `SourceRecord`; the sourcing gate fails the build otherwise.
- Neutrality style guide is a versioned artifact (`docs/NEUTRALITY-STYLE-GUIDE.md`) reviewed as an explicit release gate, not ad-hoc.
- Code-review `--fix` after the verification gate is high-value: it caught and fixed a Critical correctness bug post-verification.

### Key Lessons
1. **Visual/DOM test tooling should be set up in the first UI phase, not deferred.** A whole milestone shipped with the entire render layer confirmed only by source-read and human eyeballing-later. Configure a render harness (e.g. Testing Library / Playwright) before Phase 4-class work in v1.1.
2. **A passing test suite is not a correctness oracle when tests assert the implementation.** The donut-label bug shipped because the test encoded the same wrong expression — adversarial/independent review (the neutrality gate) is what caught it. Keep an independent-review gate.
3. **Requirement traceability needs an automated writer.** Manual/`Pending`-forever traceability tables erode trust in the audit; the 3-source cross-reference worked but was expensive.
4. **`tech_debt` ≠ `gaps_found`.** Distinguishing deferred validation from functional gaps let v1.0 ship honestly with eyes open rather than being blocked on polish.

### Cost Observations
- Model mix: orchestration on Opus; executors/verifier/reviewer/fixer on Sonnet (per `model_profile: quality`).
- Sessions: single continuous session through Phase 5 + review + milestone close.
- Notable: worktree-isolated Sonnet executors completed each plan in ~3–15 min; the only stream-idle timeout was a code-reviewer run, recovered by re-spawn with a tighter "write once" directive.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~1 | 6 | Baseline: strict bottom-up, citation-gated data, neutrality release gate |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 170 | model layer near-exhaustive; UI render layer unverified by automation | Pure `src/core/*` model, no runtime deps beyond React/ECharts/Zustand stack |

### Top Lessons (Verified Across Milestones)

1. Bottom-up correctness-first sequencing prevents engine rework (v1.0 — to be re-confirmed).
2. Structural enforcement (build gates) beats reviewer vigilance for hard constraints (v1.0 — to be re-confirmed).
