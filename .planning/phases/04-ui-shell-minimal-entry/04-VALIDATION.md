---
phase: 4
slug: ui-shell-minimal-entry
status: final
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-16
revised: 2026-05-16
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.6 (CLAUDE.md says 3.x — 4.1.6 is authoritative per RESEARCH.md) |
| **Config file** | vite.config.ts / vitest config (existing from prior phases) |
| **Quick run command** | `npm test -- src/state src/ui` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- src/state src/ui`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

> Reconciled against final plan structure after checker revision 2026-05-16.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-T1 | 01 | 1 | ENTRY-01, ENTRY-02, ENTRY-03, ENTRY-04 | T-04-01-01 | setHorizon shallow-clones frozen DEFAULTS; setBasis toggles; seed is 200k | unit (tdd) | `npm test -- src/state/__tests__/store.test.ts` | ❌ (Wave 0 — created by this task) | ⬜ pending |
| 04-01-T2 | 01 | 1 | ENTRY-01, ENTRY-03 (D-02, D-03, D-07) | T-04-01-02 | SOURCES entries have all 6 required SourceRecord fields; sourcing gate stays green | unit | `npm test -- src/core/__tests__/sourcing.test.ts` | ✅ (existing gate) | ⬜ pending |
| 04-01-T3 | 01 | 1 | ENTRY-01, ENTRY-02, ENTRY-03, ENTRY-04 | T-04-01-01 | store actions and seed make store.test.ts GREEN; SEED_WEALTH.value = 200_000 | unit | `npm test -- src/state/__tests__/store.test.ts` | ✅ (created by T1 above) | ⬜ pending |
| 04-02-T1 | 02 | 2 | ENTRY-04, ENTRY-05 | T-04-02-03 | selectReinflated leaves relativePosition.userRank unchanged (D-08); nominal path raises endingWealth without changing startRank/endRank | unit (tdd) | `npm test -- src/state/__tests__/selectors.test.ts` | ✅ (existing file extended) | ⬜ pending |
| 04-02-T2 | 02 | 2 | ENTRY-04, ENTRY-05 (D-14, D-09) | T-04-02-02 | formatRankDelta always pairs rank delta with wealth-growth clause; formatMoneyIllusionCaption returns '' for real, non-empty for nominal | unit (tdd) | `npm test -- src/ui/__tests__/summaryFormatters.test.ts` | ❌ (Wave 0 — created by this task) | ⬜ pending |
| 04-02-T3 | 02 | 2 | ENTRY-04, ENTRY-05 (D-01, D-05, D-08, D-13, D-14, D-15) | T-04-02-01 | LogSliderInput rejects NaN/negative; SummaryReadout delegates to formatRankDelta and formatMoneyIllusionCaption | typecheck + full suite | `npm test && npm run typecheck` | ❌ (created by this task) | ⬜ pending |
| 04-03-T1 | 03 | 3 | ENTRY-01..ENTRY-06 | T-04-03-03 | AppShell wraps projectionEngine in try/catch; null rawResult shows exact diagnostic string; no Calculate gate | typecheck + grep gate | `npm test && npm run typecheck && grep -c 'try' src/ui/AppShell.tsx` | ❌ (created by this task) | ⬜ pending |
| 04-03-T2 | 03 | 3 | ENTRY-01 (D-09, D-15) | — | NEUTRALITY-STYLE-GUIDE.md contains D-09 and D-15 sections | grep | `grep -c 'D-09\|D-15' docs/NEUTRALITY-STYLE-GUIDE.md` | ✅ (existing file extended) | ⬜ pending |
| 04-03-CKP | 03 | 3 | ENTRY-01..ENTRY-06 | T-04-03-01..04 | First-paint render, slider responsiveness, mobile layout, D-09/D-15 display — human confirms | human-verify | (blocking checkpoint — human approves) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 is complete — all test stubs are produced by the plan tasks themselves (TDD pattern), not a separate pre-wave:

- [x] `src/state/__tests__/store.test.ts` — created RED by Plan 01 Task 1 (stubs covering setInputs/setHorizon/setBasis actions and cited seed defaults), turned GREEN by Plan 01 Task 3
- [x] `src/ui/__tests__/summaryFormatters.test.ts` — created RED by Plan 02 Task 2 (stubs for formatRankDelta D-14 and formatMoneyIllusionCaption D-09), turned GREEN by Plan 02 Task 2 implementation
- [x] `src/state/__tests__/selectors.test.ts` — existing file extended by Plan 02 Task 1 (nominal-path and D-08 rank invariant assertions added)
- [x] Framework already present — no install required

No separate Wave 0 plan is needed. Each TDD task writes the RED test file then implements GREEN in the same task. The Nyquist sampling gate is satisfied: every task after the first store test stub has an automated verify command that will catch regressions.

---

## Sampling Continuity Check

No 3 consecutive tasks run without an automated verify command:

1. 04-01-T1 → `npm test -- store.test.ts` (automated)
2. 04-01-T2 → `npm test -- sourcing.test.ts` (automated)
3. 04-01-T3 → `npm test -- store.test.ts` (automated)
4. 04-02-T1 → `npm test -- selectors.test.ts` (automated)
5. 04-02-T2 → `npm test -- summaryFormatters.test.ts` (automated)
6. 04-02-T3 → `npm test && npm run typecheck` (automated)
7. 04-03-T1 → `npm test && npm run typecheck && grep -c 'try' AppShell.tsx` (automated)
8. 04-03-T2 → `grep -c 'D-09\|D-15' NEUTRALITY-STYLE-GUIDE.md` (automated)
9. 04-03-CKP → human-verify checkpoint (blocking)

Maximum gap between automated verifications: 0 (every task has one). Continuity constraint satisfied.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No UI jank during slider drag | ENTRY-02 | Perceptual/timing behavior; useDeferredValue correctness is unit-testable but "no jank" is visual | Drag wealth/savings/horizon sliders rapidly on desktop and a touch device; chart updates without stutter |
| Layout usable mobile + desktop; chart touch-graceful | ENTRY-06 | Responsive/touch behavior across viewports not reliably automatable here | Open at 375px and 1440px widths; verify side panel collapses at lg breakpoint; pinch/drag chart on touch |
| D-09 caption visible in nominal mode, absent in real mode | ENTRY-04 | Conditional render correctness confirmed by formatMoneyIllusionCaption unit test; visual confirm at checkpoint | Toggle basis in the running app; observe caption appear/disappear |
| Engine error diagnostic shown (not stack trace) | T-04-03-03 | Grep gate confirms the try block and string are present; runtime behavior under a thrown error is visually confirmed | (Implicitly verified by grep gate; optional: temporarily cause a throw to test the error path manually) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are a human-verify checkpoint (04-03-CKP)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (0 gaps, see table above)
- [x] Wave 0 covers all test-stub requirements — TDD tasks create RED files then GREEN in-task; no separate wave needed
- [x] No watch-mode flags in any verify command (all use `npm test --` or `grep`, not `vitest watch`)
- [x] Feedback latency < 15s (individual test file runs are < 5s; full suite ~10s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** signed off 2026-05-16 (revised from draft after checker revision)
