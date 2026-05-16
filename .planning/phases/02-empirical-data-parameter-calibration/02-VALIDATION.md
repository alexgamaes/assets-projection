---
phase: 2
slug: empirical-data-parameter-calibration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | vitest config (Vite-shared) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run && npx tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

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
| 2-01-01 | 01 | 1 | DATA-01..04 | — | Fail-loud guards reject out-of-domain values (no silent clamp) | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Per-task rows are finalized by the planner once PLAN.md task IDs exist; this contract sets the sampling rules and infrastructure they must satisfy.*

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] CR-01 bisect root-bracketing guard test — must exist before real anchors loaded
- [ ] CR-02 alpha>1 / Pareto domain assertion test
- [ ] Phase 1 fixture migration for the new `SourceRecord` shape (keeps existing suite green)

*Existing Vitest + CI infrastructure covers all phase requirements; no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Corrected Fagereng framing is faithfully reflected in source records | DATA-02 | Requires human reading of primary literature against recorded figures | Reviewer cross-checks each anchor `SourceRecord.figureUsed`/`note` against cited primary sources |

*All other phase behaviors have automated verification (sourcing-completeness test, drag calibration test, divergence sanity-check, invariant battery).*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
