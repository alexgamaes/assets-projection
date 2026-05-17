---
phase: 5
slug: neutrality-review-release-readiness
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-16
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vite.config.ts` (test environment: node — no DOM/jsdom) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run && npx tsc --noEmit` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run && npx tsc --noEmit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | NEUT-02 | — | N/A | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Filled by planner. Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] CR-01 regression test — pure `selectSummary` test asserting the real growth multiple is basis-invariant (no DOM render — test environment is node)

*Static-source-read verifications (review sweep, verbatim caption equality) are auditable assertions in `05-NEUT-02-REVIEW.md`, not automated tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Survivorship caveat renders neutrally in the sourcing affordance | NEUT-02 | No DOM testing library (node env) — visual confirmation only | Run `npx vitest run` then load app, expand CitationFooter, confirm jst2019 survivorship caveat text is shown and §1-compliant |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
