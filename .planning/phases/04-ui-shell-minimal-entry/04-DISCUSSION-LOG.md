# Phase 4: UI Shell & Minimal Entry - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 4-ui-shell-minimal-entry
**Areas discussed:** Input controls & instant-play feel, Real vs. nominal toggle, Layout & responsive structure, Summary readout

---

## Input controls & instant-play feel

### Q1 — Input entry mechanism
| Option | Description | Selected |
|--------|-------------|----------|
| Slider + linked numeric field | Drag to play fast, type for precision | ✓ |
| Numeric fields only | Simplest, precise, less playful | |
| Sliders only | Max playful, poor precision | |

**User's choice:** Slider + linked numeric field

### Q2 — Slider ranges / defaults
| Option | Description | Selected |
|--------|-------------|----------|
| Broad, log-ish wealth scale | $0→$10M wealth, $0→$200k savings | |
| Modest-saver range | $0→$1M wealth, $0→$50k savings | |
| You decide (planner picks) | Defer to planner, grounded in tier boundaries | |

**User's choice:** Free text — "use a round-up version of median values (US median wealth ~$192k → round to $200k); sliders should be logarithmic; savings range maybe $2k up to $2M per year"
**Notes:** Drove D-02 (rounded-up median seed defaults, replaces $120k placeholder), D-04 (broad logarithmic spans, savings ~$2k–$2M).

### Q3 — Should seed defaults be cited like model params?
| Option | Description | Selected |
|--------|-------------|----------|
| Cite them too (consistent) | Source seed defaults (e.g. US Fed SCF), surface in citation affordance | ✓ |
| Unsourced starting point | Only model params need citations | |
| Cite, but planner picks source | Require citation, defer dataset choice | |

**User's choice:** Cite them too (consistent)

### Q4 — Horizon control affordance
| Option | Description | Selected |
|--------|-------------|----------|
| Slider with year readout | Linear slider ~10→60y, default ~35y | ✓ |
| Preset chips + slider | Quick chips plus fine slider | |
| You decide (planner) | Defer affordance, lock defaults | |

**User's choice:** Slider with year readout

---

## Real vs. nominal toggle

### Q1 — Resolve ENTRY-04 toggle vs. locked real-only engine
| Option | Description | Selected |
|--------|-------------|----------|
| Display-layer re-inflation, sourced | Engine real-only; add sourced inflation default; nominal = real×(1+i)^year in display layer | ✓ |
| Ship real-only + neutral note | Defer toggle, real only | |
| Toggle = relabel only | No numeric re-inflation (likely fails neutrality) | |

**User's choice:** Display-layer re-inflation, sourced

### Q2 — Toggle scope + default basis
| Option | Description | Selected |
|--------|-------------|----------|
| All money surfaces, real default | Re-inflate Chart 1, Chart 2, readout; Chart 3 unaffected | ✓ |
| Charts only, readout always real | Mixed-basis screen | |
| You decide (planner) | Defer surfaces | |

**User's choice:** All money surfaces, real default

### Q3 — Inflation rate fixed or adjustable?
| Option | Description | Selected |
|--------|-------------|----------|
| Fixed sourced default (v1) | Single cited long-run figure, not a control | ✓ |
| Adjustable now | Expose as input (pulls v2 config into Phase 4) | |

**User's choice:** Fixed sourced default (v1)

### Q4 — Money-illusion neutrality safeguard
| Option | Description | Selected |
|--------|-------------|----------|
| Neutral basis caption + sourced rate | Fixed caption when nominal active, cites rate, seeded into style guide | ✓ |
| Real default + caption only on nominal | Minimal copy | |
| You decide (planner, style-guide-bound) | Defer wording | |

**User's choice:** Neutral basis caption + sourced rate

---

## Layout & responsive structure

### Q1 — Desktop control panel placement
| Option | Description | Selected |
|--------|-------------|----------|
| Sticky left/side panel | Persistent panel, charts scroll beside | ✓ |
| Top control bar | Scrolls out of view | |
| Sticky top bar | Pinned top bar | |

**User's choice:** Sticky left/side panel

### Q2 — Mobile control behavior
| Option | Description | Selected |
|--------|-------------|----------|
| Controls stack on top, charts below | Full-width block above charts, no hidden UI | ✓ |
| Collapsible sticky bottom sheet | Pull-up sheet, more complex | |
| Sticky compact top bar | Condensed pinned controls | |

**User's choice:** Controls stack on top, charts below

### Q3 — Touch tooltip degradation
| Option | Description | Selected |
|--------|-------------|----------|
| Tap-to-inspect, tap-away dismiss | Standard ECharts touch; preserves D-08/D-11 | ✓ |
| Tap + draggable scrubber | Richer mobile exploration, more code | |
| You decide (planner) | Defer affordance, hard requirement on safeguards | |

**User's choice:** Tap-to-inspect, tap-away dismiss

---

## Summary readout

### Q1 — Readout placement
| Option | Description | Selected |
|--------|-------------|----------|
| In the sticky side panel | Always visible while tweaking | |
| Banner above the charts | Headline strip, scrolls away | |
| You decide (planner) | Defer placement, lock metrics + basis-tracking | ✓ |

**User's choice:** You decide (planner)

### Q2 — Additional content beyond the 3 metrics
| Option | Description | Selected |
|--------|-------------|----------|
| Just the 3 required metrics | Minimal | |
| Add ending rank/percentile | Ties to relative-position thesis | ✓ |
| You decide (planner) | Defer, with neutral-framing requirement | |

**User's choice:** Add ending rank/percentile
**Notes:** Triggered a follow-up on neutral framing (Pitfall-4 zero-sum risk for a bare rank stat).

### Q3 — Neutral framing for the rank stat
| Option | Description | Selected |
|--------|-------------|----------|
| Pair rank with ending wealth + micro-caption | Absolute rank beside wealth + neutral line | |
| Rank as delta, not absolute | Show p75→p71 paired with wealth growth | ✓ |
| You decide (planner, style-guide-bound) | Defer presentation | |

**User's choice:** Rank as delta, not absolute

---

## Claude's Discretion

- Recompute/debounce mechanics (debounce ms, type-vs-drag timing) — technical.
- Typed-value validation/clamping for out-of-range inputs (Zod boundary).
- Summary readout placement (explicitly deferred — "you decide").
- Exact slider min/max/step, precise seed default figures + dataset vintage, the inflation-rate figure + source, the side-panel collapse breakpoint, small-screen chart min-height.

## Deferred Ideas

- User-adjustable inflation rate — v2 CONFIG-01.
- Absolute ending rank as a headline stat — rejected (Pitfall-4); replaced by rank-delta.
- Collapsible bottom-sheet / sticky compact mobile controls — rejected for v1; revisit on feedback.
- Richer per-parameter sourcing panel — remains Phase 5 scope.
