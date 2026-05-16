# Phase 3: Selectors, Visualization & Neutrality Style Guide - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 3-selectors-visualization-neutrality-style-guide
**Areas discussed:** Neutrality style guide form, Three-chart presentation, Relative-position chart design

---

## Neutrality style guide form

| Option | Description | Selected |
|--------|-------------|----------|
| Repo markdown artifact | Versioned doc, prose rules, not executable; release-gate checklist alongside | ✓ |
| Markdown + codified palette tokens | Prose guide + no-red/green palette as Tailwind/TS tokens charts import | |
| Lint-enforced lexicon | Markdown + machine-checkable banned-words list wired into a CI test | |

**User's choice:** Repo markdown artifact

| Option | Description | Selected |
|--------|-------------|----------|
| Copy lexicon | Banned value-laden words + neutral rewrites | ✓ |
| Palette rules | Explicit no semantic red/green; neutral tier hues | |
| Chart-semantic rules | Neutral labels, relative-position caption rule, log-copy tone | ✓ |
| Pass/fail checklist | Per-item Phase 5 review template | |

**User's choice:** Copy lexicon + Chart-semantic rules

| Option | Description | Selected |
|--------|-------------|----------|
| Brief palette clause | Short explicit "no semantic red/green" clause to satisfy NEUT-01 | ✓ |
| Full palette section | Dedicated palette-rules section with named neutral hues | |
| Fold into chart-semantic rules | No-red/green as one bullet inside chart-semantic rules | |

**User's choice:** Brief palette clause
**Notes:** Reconciliation question — palette rules are mandated by ROADMAP success criterion 5 / NEUT-01 even though the palette section wasn't initially selected; resolved with a brief explicit clause. Enforcement is the Phase 5 human review gate, not a lint test.

---

## Three-chart presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal dev harness page | Phase 3 scaffolds Vite/React/ECharts + bare page rendering 3 charts from hardcoded defaults | ✓ |
| Charts as components only | Selectors + components + Storybook/test rendering, no app page | |
| Full scaffold + placeholder shell | Fuller page Phase 4 mostly keeps (risks Phase 4 scope bleed) | |

**User's choice:** Minimal dev harness page

| Option | Description | Selected |
|--------|-------------|----------|
| Stacked vertically | All three visible, scroll: growth → divergence → relative-position | ✓ |
| Tabbed / switchable | One frame, toggle which chart shows | |
| Primary + two secondary | Large growth chart, two smaller below | |

**User's choice:** Stacked vertically

| Option | Description | Selected |
|--------|-------------|----------|
| Log default, growth+divergence only | Shared toggle, log default on the two wealth charts; relative-position always linear | ✓ |
| Linear default, growth+divergence only | Same scope, starts linear | |
| Per-chart toggle | Independent control per wealth chart | |

**User's choice:** Log default, growth+divergence only

| Option | Description | Selected |
|--------|-------------|----------|
| All series at that year | Combined tooltip: every line at year + user percentile/rank + tier | ✓ |
| Hovered series only | Just the line under cursor | |
| You decide | Planner picks, keeping VIZ-03 fields present | |

**User's choice:** All series at that year

---

## Relative-position chart design

| Option | Description | Selected |
|--------|-------------|----------|
| Rank (percentile) line | Single userRank 0–100 line vs year; userShare in tooltip only | ✓ |
| Wealth-share line | userShare fraction-of-total vs year (tiny-number legibility risk) | |
| Both, dual-panel | Two stacked sub-charts: rank + share | |

**User's choice:** Rank (percentile) line

| Option | Description | Selected |
|--------|-------------|----------|
| Neutral caption + paired readout | Caption + tooltip pairs rank with growing real wealth | ✓ |
| Caption only | Just the caption; rank shown in isolation | |
| Invert axis | Flip axis direction (rejected as non-neutral) | |

**User's choice:** Neutral caption + paired readout

| Option | Description | Selected |
|--------|-------------|----------|
| User line only | Just the user's rank trajectory | |
| Faint tier-threshold bands | Add unobtrusive neutral median/top10/top1/top0.1 reference bands | ✓ |
| You decide | Planner chooses, kept neutral | |

**User's choice:** Faint tier-threshold bands

---

## Claude's Discretion

- Exact path/filename of the style guide artifact.
- Initial lexicon-seed authorship and exact banned-word list.
- Selector module layout and memoization mechanism.
- ECharts option construction, axis units/formatting, time-series series composition, dev-harness page chrome.
- Citation affordance: VIZ-06 footer-line minimum (area not selected for deep discussion).

## Deferred Ideas

- Richer per-parameter sourcing panel + survivorship-caveat surfacing → Phase 5 scope.
- Per-chart independent log/linear toggle → rejected for v1.
- Tabbed/switchable layout and primary+secondary hierarchy → rejected for neutrality/narrative reasons.
