---
phase: 4
slug: ui-shell-minimal-entry
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-16
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.6 (CLAUDE.md says 3.x — 4.1.6 is authoritative per RESEARCH.md) |
| **Config file** | vite.config.ts / vitest config (existing from prior phases) |
| **Quick run command** | `npx vitest run src/state src/model/selectors` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/state src/model/selectors`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

> Populated by the planner from PLAN.md task IDs. Rows below are the validation-architecture seed; the planner refines them to match final task IDs.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 4-W0-01 | 00 | 0 | ENTRY-01..06 | — | N/A | unit | `npx vitest run src/state/store.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-01 | 01 | 1 | ENTRY-01, ENTRY-02 | — | store actions mutate inputs/horizon/basis without mutating frozen DEFAULTS | unit | `npx vitest run src/state/store.test.ts` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 1 | ENTRY-04, ENTRY-06 | — | nominal re-inflation + summary selectors leave rank/share unchanged | unit | `npx vitest run src/model/selectors.test.ts` | ✅ | ⬜ pending |
| 4-03-01 | 03 | 2 | ENTRY-01..06 | — | shell renders projection on first paint with no Calculate gate | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/state/store.test.ts` — stubs covering setInputs/setHorizon/setBasis actions and cited seed defaults (ENTRY-01..06)
- [ ] Extend `src/model/selectors.test.ts` — nominal re-inflation selector + summary readout selector fixtures (ENTRY-04, ENTRY-06)
- [ ] Framework already present — no install required

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No UI jank during slider drag | ENTRY-03 | Perceptual/timing behavior; useDeferredValue correctness is unit-testable but "no jank" is visual | Drag wealth/savings/horizon sliders rapidly on desktop and a touch device; chart updates without stutter |
| Layout usable mobile + desktop; chart touch-graceful | ENTRY-05 | Responsive/touch behavior across viewports not reliably automatable here | Open at 375px and 1440px widths; verify side panel collapses at lg breakpoint; pinch/drag chart on touch |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
