# Neutrality Style Guide

**Version:** 1.0 — Phase 3 initial authoring
**Authored against:** CONTEXT.md D-01 through D-04, 03-UI-SPEC.md
**Phase 5 review gate:** This artifact is read directly from the repository during Phase 5 human review. It is not executable.

---

## Section 1 — Copy Lexicon (D-02a)

The purpose of this lexicon is to prevent value-laden language from entering chart titles, axis labels, tooltips, caption text, and any copy visible to the user. The app presents empirically-grounded projections neutrally; the reader draws their own conclusions.

**Banned verbs and their neutral rewrites:**

- "soar" → "increase at a compounding rate"
- "plummet" → "decline over the projection horizon"
- "explode" → "grow rapidly"
- "surge" → "increase sharply"
- "trap" → "the user's projected rank moves downward"
- "crush" → "reduce by a large margin"
- "beat" → "exceed" or "grow faster than"
- "lose" → "decline relative to" or "fall below"

**Banned adjectives:**

- "unfair" → omit or reframe as mechanical description
- "alarming" → omit; describe the magnitude numerically
- "shocking" → omit; let the data speak
- "extreme" → "at the upper end of the distribution" or state the percentile
- "elite" → "top-0.1% wealth holders" (use the percentile label)
- "privileged" → omit; describe the tier by its empirical rank
- "left behind" → "the user's rank moves lower as upper tiers compound faster"

**Banned framing phrases:**

- "the rich get richer" → omit entirely; describe the mechanism: "heterogeneous return rates compound differently across wealth tiers"
- "wealth gap" → "the spread between tier trajectories" or "divergence between wealth tiers"
- "inequality crisis" → omit; cite the specific Fagereng/Bach/JST figures instead
- "falling behind" → "the user's rank declines over the horizon"
- zero-sum framing ("taken from", "at the expense of", "wealth transfer from the poor") → omit or reframe as a structural observation about asset-price inflation as a mechanism (cite McKinsey 2023 figure)
- alarm punctuation ("!") → never use in copy visible to the user

**Neutral rewrite procedure:** If a draft contains a banned term, replace it with a mechanical description of the observed phenomenon. Reference the specific data source if the claim has empirical content.

---

## Section 2 — Chart-Semantic Rules (D-02b)

These rules govern axis labels, series labels, scale copy, and tooltip copy for all three charts.

**Axis label rules:**

- The Y axis on wealth charts must be labelled "Real wealth (today's money)". Do not use "your returns", "wealth gained", "profit", "earnings", or any label that implies a verdict on the outcome.
- The X axis must be labelled "Year". Do not use "Time until retirement", "Years remaining", "Years of growth", or any label that implies a goal or milestone.
- The Y axis on the relative-position chart must be labelled "Percentile rank (0–100)". Do not use "where you stand", "how you compare", or evaluative phrasing.

**Series label rules:**

- Tier series use descriptive labels: "Median (p50)", "Top 10% (p90)", "Top 1% (p99)", "Top 0.1% (p99.9)". These are statistical positions, not judgements.
- Do not use evaluative labels: "laggards", "winners", "losers", "outperformers", "underperformers", "the wealthy", "the poor".
- The user series is labelled "Your wealth" or "Your rank" — descriptive, not evaluative.

**Log-scale explanatory copy:**

- Log scale description: "Logarithmic scale — equal vertical distances represent equal percentage changes. Useful for comparing growth rates across tiers."
- Linear scale description: "Linear scale — equal vertical distances represent equal dollar amounts. Useful for seeing absolute wealth differences."
- Do not characterise either scale as "more honest", "better", "the real picture", or "what they don't want you to see". Both scales reveal different aspects of the same data mechanically.

**Tooltip copy:**

- Tooltips must show numerical values with units (year, dollar amounts, percentile rank, percentage share). No evaluative language in tooltips.
- The divergence-chart tooltip pairs rank with tier label purely as descriptive context: "Rank: X.Xth · Tier: [tier]".

---

## Section 3 — Relative-Position Caption Rule (D-02b + D-04)

The relative-position chart (Chart 3) must always carry a visible fixed caption rendered as a DOM element directly below the chart. This caption is mandatory and must not be tooltip-only, annotation-only, or hidden behind any interaction.

**The rule:** Because rank can move down even when absolute wealth grows (all tiers compound simultaneously), showing rank without context risks a misleading reading. The caption pairs the rank movement with the fact of universal absolute growth, so the reader has full context without needing to cross-reference charts.

**The canonical D-11 caption text (Phase 5 reviews the shipped caption against this verbatim text):**

> "This shows the user's rank within the distribution. Rank can move down while the user's real wealth still grows — every tier's wealth increases over this horizon. See the wealth-by-tier chart above for absolute amounts."

This text is the exact string seeded into `src/ui/HarnessPage.tsx` as `REL_POS_CAPTION` and passed as a prop to `RelativePosChart`. Phase 5 must verify the visible DOM caption matches this text. Any revision to this text requires a corresponding update to this style guide (the two must remain in sync).

---

## Section 4 — Palette Clause (D-03)

No semantic red or green. Color must never imply "good" or "bad", "gain" or "loss", "safe" or "dangerous".

The categorical palette for this application:

- Teal-700 (`#0F766E`) — user line only, used as a neutral findability accent (not a value judgement). The user line receives a distinct color solely so the user can locate their own trajectory among several; the hue carries no evaluative meaning.
- Slate-500 (`#64748B`) — median (p50) tier
- Violet-600 (`#7C3AED`) — top 10% (p90) tier
- Blue-600 (`#2563EB`) — top 1% (p99) tier
- Cyan-600 (`#0891B2`) — top 0.1% (p99.9) tier

These hues are chosen for categorical distinctness at equal perceptual weight. No tier receives a warmer or more saturated hue as a reward signal.

Tier-threshold reference bands use slate-300 (`#CBD5E1`) at 30% opacity or less. These are neutral measurement lines, not alarm indicators.

If the palette is extended in a future phase, every new hue must be evaluated against this rule: does the hue, in isolation or in combination with existing hues, suggest a directional value judgement? If so, substitute a more neutral option before shipping.
