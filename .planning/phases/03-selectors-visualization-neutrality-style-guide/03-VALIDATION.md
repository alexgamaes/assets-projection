---
phase: 3
slug: selectors-visualization-neutrality-style-guide
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-16
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vite.config.ts (Wave 0 replaces vitest.config.ts) |
| **Quick run command** | `npm run test -- --run src/state/__tests__/selectors.test.ts` |
| **Full suite command** | `npm run test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (planner fills) | — | — | VIZ-01..06 / NEUT-01 | — | N/A | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Replace `package.json` (vitest@4.x for vite@8 peer compatibility)
- [ ] Delete `vitest.config.ts`, add `vite.config.ts`
- [ ] Add `"jsx": "react-jsx"` to `tsconfig.json`
- [ ] `src/state/__tests__/selectors.test.ts` — stubs for selector functions (VIZ-01..06)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chart canvas rendering (ECharts) | VIZ-01..05 | ECharts canvas not unit-testable via jsdom | Open browser harness page; verify chart renders, log/linear toggle, tooltip on hover |
| Neutrality palette (no red/green value-laden colors) | NEUT-01 | Visual judgment | Inspect rendered palette against style guide artifact |

*Selector option-builders have automated verification; chart visuals are manual.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
