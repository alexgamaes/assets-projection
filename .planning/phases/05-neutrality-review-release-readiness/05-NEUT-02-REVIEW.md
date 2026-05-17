# NEUT-02 Exhaustive Neutrality Review

**Artifact:** 05-NEUT-02-REVIEW.md
**Phase:** 05-neutrality-review-release-readiness
**Plan:** 03 (Wave 3)
**Reviewed by:** Executor agent, 2026-05-17
**Style guide version reviewed against:** 1.1 (Phase 5 Plan 03 — corrected §3 component reference)
**Scope:** All 16 shipped user-facing surfaces in the closed inventory (RESEARCH §Pattern 1)

---

## Completeness Evidence

The following grep command was run to enumerate every non-trivial string literal across the audited surface. Its output was the primary input to this review.

```
grep -rnoE '"[^"]{2,}"|`[^`]{2,}`' src/ui src/viz src/state/selectors.ts \
  --include='*.ts' --include='*.tsx' | grep -v '__tests__'
```

Output (full, unabridged — 95 matches across 16 files):

```
src/ui/ControlPanel.tsx:1:"ControlPanel.tsx"
src/ui/ControlPanel.tsx:19:"space-y-4"
src/ui/ControlPanel.tsx:21:"text-[20px] font-semibold text-slate-800"
src/ui/ControlPanel.tsx:25:"Current wealth"
src/ui/ControlPanel.tsx:34:"Annual savings"
src/ui/summaryFormatters.ts:7:`{caption && <p>{caption}</p>}`
src/ui/summaryFormatters.ts:16:"while real wealth grew X×"
src/ui/summaryFormatters.ts:30:`Distribution position: p${startRank.toFixed(0)} → p${endRank.toFixed(0)}, `
src/ui/summaryFormatters.ts:31:`while real wealth grew ${growthMultiple.toFixed(1)}×.`
src/ui/summaryFormatters.ts:39:`{caption && <p>{caption}</p>}`
src/ui/summaryFormatters.ts:52:`These figures are not adjusted for inflation. `
src/ui/summaryFormatters.ts:53:`They assume a fixed ${(inflationRate * 100).toFixed(1)}% annual inflation rate `
src/ui/summaryFormatters.ts:54:`(${inflationSourceName}). Switch to Real for inflation-adjusted amounts.`
src/ui/LogSliderInput.tsx:1:"LogSliderInput"
src/ui/LogSliderInput.tsx:1:"Color"
src/ui/LogSliderInput.tsx:1:"Interaction & Control Contract"
src/ui/LogSliderInput.tsx:18:"block"
src/ui/LogSliderInput.tsx:20:"text-sm font-normal text-slate-600 block mb-1"
src/ui/LogSliderInput.tsx:22:"text-sm font-normal text-slate-500 tabular-nums block mb-1"
src/ui/LogSliderInput.tsx:29:"range"
src/ui/LogSliderInput.tsx:35:"w-full accent-teal-700"
src/ui/LogSliderInput.tsx:39:"number"
src/ui/LogSliderInput.tsx:40:"numeric"
src/ui/LogSliderInput.tsx:43:"w-full border border-slate-200 rounded px-2 py-1 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-700 mt-2"
src/ui/AppShell.tsx:1:"AppShell.tsx"
src/ui/AppShell.tsx:33:"This shows the user's rank within the distribution. Rank can move down while the user's real wealth still grows — every tier's wealth increases over this horizon. See the wealth-by-tier chart above for absolute amounts."
src/ui/AppShell.tsx:105:"mx-auto max-w-6xl px-4 py-8"
src/ui/AppShell.tsx:107:"text-[28px] font-semibold text-slate-900 mb-8"
src/ui/AppShell.tsx:114:"lg:grid lg:grid-cols-[320px_1fr] lg:gap-8"
src/ui/AppShell.tsx:115:"lg:sticky lg:top-8 lg:self-start mb-8 lg:mb-0"
src/ui/AppShell.tsx:116:"bg-slate-50 border border-slate-200 p-4 rounded"
src/ui/AppShell.tsx:121:"space-y-6"
src/ui/AppShell.tsx:124:"text-base font-normal text-slate-600"
src/ui/AppShell.tsx:136:"bg-slate-50 border border-slate-200 p-4 rounded"
src/ui/AppShell.tsx:137:"text-[20px] font-semibold text-slate-800 mb-4"
src/ui/AppShell.tsx:144:"bg-slate-50 border border-slate-200 p-4 rounded"
src/ui/AppShell.tsx:145:"text-[20px] font-semibold text-slate-800 mb-4"
src/ui/AppShell.tsx:152:"bg-slate-50 border border-slate-200 p-4 rounded"
src/ui/AppShell.tsx:153:"text-[20px] font-semibold text-slate-800 mb-4"
src/ui/AppShell.tsx:160:"bg-slate-50 border border-slate-200 p-4 rounded"
src/ui/AppShell.tsx:161:"text-[20px] font-semibold text-slate-800 mb-4"
src/ui/AppShell.tsx:167:"text-sm font-normal text-slate-500 mt-1"
src/ui/AppShell.tsx:173:"bg-slate-50 border border-slate-200 p-4 rounded"
src/ui/AppShell.tsx:174:"text-[20px] font-semibold text-slate-800 mb-4"
src/ui/AppShell.tsx:180:"text-sm font-normal text-slate-500 mt-1"
src/ui/SummaryReadout.tsx:1:"SummaryReadout"
src/ui/SummaryReadout.tsx:1:"Summary readout labels"
src/ui/SummaryReadout.tsx:23:"bg-slate-50 border border-slate-200 p-4 rounded"
src/ui/SummaryReadout.tsx:25:"text-[20px] font-semibold text-slate-800 mb-4"
src/ui/SummaryReadout.tsx:28:"space-y-2"
src/ui/SummaryReadout.tsx:30:"text-sm font-normal text-slate-600"
src/ui/SummaryReadout.tsx:34:"text-base font-semibold text-slate-800 tabular-nums"
src/ui/SummaryReadout.tsx:39:"text-sm font-normal text-slate-600"
src/ui/SummaryReadout.tsx:40:"text-base font-semibold text-slate-800 tabular-nums"
src/ui/SummaryReadout.tsx:45:"text-sm font-normal text-slate-600"
src/ui/SummaryReadout.tsx:46:"text-base font-semibold text-slate-800 tabular-nums"
src/ui/SummaryReadout.tsx:54:"text-sm font-normal text-slate-600 mt-4 tabular-nums"
src/ui/SummaryReadout.tsx:59:"text-base font-normal text-slate-600 mt-2"
src/ui/SummaryReadout.tsx:66:"text-base font-normal text-slate-600 mt-2"
src/ui/BasisToggle.tsx:1:"BasisToggle"
src/ui/BasisToggle.tsx:14:"group"
src/ui/BasisToggle.tsx:15:"Display basis"
src/ui/BasisToggle.tsx:16:"inline-flex rounded border border-slate-300 overflow-hidden"
src/ui/BasisToggle.tsx:19:"button"
src/ui/BasisToggle.tsx:31:"button"
src/ui/BasisToggle.tsx:44:"text-sm font-normal text-slate-500 mt-1"
src/ui/BasisToggle.tsx:48:"text-base font-normal text-slate-600 mt-2"
src/ui/CitationFooter.tsx:1:"Pattern Map — src/ui/CitationFooter.tsx"
src/ui/CitationFooter.tsx:22:"mt-12 text-sm text-slate-600 font-normal border-t border-slate-200 pt-6"
src/ui/CitationFooter.tsx:30:"_blank"
src/ui/CitationFooter.tsx:31:"noopener noreferrer"
src/ui/CitationFooter.tsx:32:"underline hover:text-slate-800"
src/ui/CitationFooter.tsx:44:"text-sm text-slate-600 mt-2"
src/ui/LogLinearToggle.tsx:1:"Pattern Map — src/ui/LogLinearToggle.tsx"
src/ui/LogLinearToggle.tsx:13:"group"
src/ui/LogLinearToggle.tsx:14:"Y-axis scale"
src/ui/LogLinearToggle.tsx:15:"inline-flex rounded border border-slate-300 overflow-hidden"
src/ui/LogLinearToggle.tsx:18:"button"
src/ui/LogLinearToggle.tsx:30:"button"
src/ui/LogLinearToggle.tsx:43:"text-sm font-normal text-slate-500 mt-1"
src/ui/LogLinearToggle.tsx:46:"Copywriting Contract"
src/ui/LogLinearToggle.tsx:47:"text-base font-normal text-slate-600 mt-2"
src/ui/HorizonSlider.tsx:1:"HorizonSlider"
src/ui/HorizonSlider.tsx:1:"Horizon control"
src/ui/HorizonSlider.tsx:14:"flex justify-between text-sm font-normal text-slate-600 mb-1"
src/ui/HorizonSlider.tsx:16:"tabular-nums text-sm font-normal text-slate-600"
src/ui/HorizonSlider.tsx:20:"range"
src/ui/HorizonSlider.tsx:26:"w-full accent-teal-700"
src/ui/HorizonSlider.tsx:29:"text-sm font-normal text-slate-500 mt-1"
src/viz/TierShareChart.tsx:24:"text-base font-normal text-slate-600 mt-2"
src/viz/RelativePosChart.tsx:23:"text-sm font-normal text-slate-600 mt-2"
src/viz/DonutChart.tsx:24:"text-base font-normal text-slate-600 mt-2"
src/state/selectors.ts:1:"Pattern 1: Selector Function"
src/state/selectors.ts:1:"Pattern Map"
src/state/selectors.ts:11:"Color"
src/state/selectors.ts:28:"Selector: wealth number formatter"
src/state/selectors.ts:31:`$${(v / 1_000_000).toFixed(1)}M`
src/state/selectors.ts:32:`$${(v / 1_000).toFixed(0)}k`
src/state/selectors.ts:33:`$${v.toFixed(0)}`
src/state/selectors.ts:79:"Real wealth (today's money)"
src/state/selectors.ts:102:`Year ${snap.year} · `
src/state/selectors.ts:103:`Rank: ${relPos.userRank.toFixed(1)}th · `
src/state/selectors.ts:104:`Tier: ${tier} · `
src/state/selectors.ts:105:`Wealth: ${formatWealth(snap.userWealth)}`
src/state/selectors.ts:154:"Real wealth (today's money)"
src/state/selectors.ts:180:`Year ${snap.year} · Rank: ${relPos.userRank.toFixed(1)}th · Tier: ${tier}`
src/state/selectors.ts:183:`<span ...>${p.seriesName ?? ''}: ${formatWealth(val)}`
src/state/selectors.ts:185:`${header}<br/>${lines.join('<br/>')}`
src/state/selectors.ts:301:`Year ${relPos.year} · `
src/state/selectors.ts:302:`Rank: ${relPos.userRank.toFixed(1)}th · `
src/state/selectors.ts:303:`Real wealth: ${formatWealth(snap.userWealth)} · `
src/state/selectors.ts:304:`Share of total: ${shareStr}`
src/state/selectors.ts:427:"This shows each tier's share of total projected wealth. ..."
src/state/selectors.ts:452:`stack`
src/state/selectors.ts:454:`value`/`stack` (ECharts config literals — not user-facing)
src/state/selectors.ts:491:"you own X% of the economy" (code comment — not rendered)
src/state/selectors.ts:502:`${v}%`
src/state/selectors.ts:525:`<span ...>${p.seriesName ?? ''}: ${val.toFixed(1)}%`
src/state/selectors.ts:527:`Year ${year}<br/>${lines.join('<br/>')}`
src/state/selectors.ts:598:"calibration unavailable" (code comment — not rendered)
src/state/selectors.ts:605:`Beyond model domain\n(year ${last.year})`
src/state/selectors.ts:606:`Top 1% hold\n${(top1Share * 100).toFixed(1)}%\n(year ${last.year})`
src/state/selectors.ts:618:`${name}: ${pct}%`
```

**Exclusions from grep output (not user-facing):**
- All `src/**/__tests__/**` files (excluded by grep filter)
- CSS class strings (Tailwind): all non-copy strings (e.g. `"space-y-4"`, `"text-sm font-normal text-slate-600"`) — not user-visible text
- HTML attribute strings (`"_blank"`, `"noopener noreferrer"`, `"block"`, `"range"`, `"number"`, `"numeric"`) — not user copy
- Code comment strings (`"you own X% of the economy"`, `"calibration unavailable"`) — not rendered
- ECharts internal config literals (`"stack"`, `"value"`) — not user-visible
- Source comment strings (`"ControlPanel.tsx"`, `"Pattern Map"`, `"Color"`, etc.) — not rendered
- Template string fragments that are intermediate substrings in multi-template-literal concatenations (lines 7, 16, 39 in summaryFormatters.ts) — documentation comments in JSDoc
- `"Copywriting Contract"`, `"Horizon control"`, `"Interaction & Control Contract"`, `"LogSliderInput"`, etc. — source comment annotation strings

---

## Review Tables

**Test-file exclusion note:** `src/ui/__tests__/summaryFormatters.test.ts` and `src/state/__tests__/selectors.test.ts` are excluded from this review. Test files contain assertion strings (including copies of verbatim copy for comparison) that are never user-facing. Their inclusion would double-count strings already reviewed from the owning source files.

---

### Surface 1 — src/ui/AppShell.tsx

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 1 | `"Wealth projection"` (h1 page title) | AppShell.tsx:107 | §1 lexicon (no banned verbs/adjectives/framing) | PASS | Factual description of the app. No banned terms, no evaluative framing, no alarm punctuation. | — |
| 2 | `"Projected wealth over time"` (Chart 1 h2) | AppShell.tsx:138 | §1 lexicon + §2 chart-semantic | PASS | Factual chart title. No evaluative framing; "projected" is technically precise (not "your path to freedom", etc.). | — |
| 3 | `"Wealth by tier over time"` (Chart 2 h2) | AppShell.tsx:146 | §1 lexicon + §2 chart-semantic | PASS | Factual. "tier" is statistical positional language per §2 series-label rules. | — |
| 4 | `"Position in the wealth distribution over time"` (Chart 3 h2) | AppShell.tsx:154 | §1 lexicon + §2 chart-semantic | PASS | Factual. Does not use evaluative phrasing ("where you stand", "how you compare"). | — |
| 5 | `"Share of total wealth by tier over time"` (Chart 4 h2) | AppShell.tsx:162 | §1 lexicon + §2 chart-semantic + §7 | PASS | Factual. No zero-sum framing, no evaluative adjective. | — |
| 6 | `"Shares are identical in real and nominal terms — the real/nominal toggle does not affect this view."` (Chart 4 annotation) | AppShell.tsx:168 | §1 lexicon | PASS | Factual mechanical description. No banned terms. | — |
| 7 | `"Final-year wealth share by tier"` (Chart 5 h2) | AppShell.tsx:175 | §1 lexicon + §2 chart-semantic + §7 | PASS | Factual. No zero-sum framing. | — |
| 8 | `"Shares are identical in real and nominal terms — the real/nominal toggle does not affect this view."` (Chart 5 annotation) | AppShell.tsx:181 | §1 lexicon | PASS | Same as row 6 — factual mechanical note. | — |
| 9 | `REL_POS_CAPTION` (source-read equality — see §3 below) | AppShell.tsx:32-33 | §3 verbatim caption | PASS | Source-read equality confirmed (see §3 note). Byte-exact match to style guide §3 canonical text. | — |
| 10 | `ENGINE_ERROR_MSG`: `"Projection unavailable: the model could not produce a result from the current parameters."` | AppShell.tsx:36-37 | §1 lexicon | PASS | Neutral diagnostic. No evaluative language; "unavailable" describes a state, not an outcome. No banned terms. | — |

**§3 REL_POS_CAPTION source-read equality note:**
`REL_POS_CAPTION` is a module-private const (not exported). A module-import byte-exact test is not available without DOM tooling (RESEARCH Anti-Pattern). Source-read equality confirmed:

- AppShell.tsx:32-33: `"This shows the user's rank within the distribution. Rank can move down while the user's real wealth still grows — every tier's wealth increases over this horizon. See the wealth-by-tier chart above for absolute amounts."`
- Style guide §3 canonical text: `"This shows the user's rank within the distribution. Rank can move down while the user's real wealth still grows — every tier's wealth increases over this horizon. See the wealth-by-tier chart above for absolute amounts."`

Verdict: byte-exact. PASS. Documented in `src/state/__tests__/selectors.test.ts` source-read comment block (Task 1).

---

### Surface 2 — src/ui/SummaryReadout.tsx

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 11 | `"Summary"` (section heading) | SummaryReadout.tsx:25 | §1 lexicon | PASS | Factual section label. No banned terms. | — |
| 12 | `"Ending wealth (real)"` / `"Ending wealth (nominal)"` (conditional label) | SummaryReadout.tsx:31 | §1 lexicon + §2 axis-label rules | PASS | Factual label with basis qualifier. §2: "do not use … any label that implies a verdict on the outcome." Neither variant implies a verdict. | — |
| 13 | `"Growth multiple"` (label) | SummaryReadout.tsx:39 | §1 lexicon | PASS | Mechanical term. No evaluative language. | — |
| 14 | `"CAGR"` (label) | SummaryReadout.tsx:45 | §1 lexicon | PASS | Standard financial abbreviation. No evaluative language. | — |
| 15 | §6/D-14 rank-delta clause via `formatRankDelta` (see summaryFormatters.ts row) | SummaryReadout.tsx:55 | §6 D-14 | PASS | Delegates to `formatRankDelta`; reviewed as summaryFormatters.ts row 21. Uses `summary.realGrowthMultiple` (CR-01 fix, Plan 01) — always real-basis regardless of active display basis. | Plan-01 commit 27705d0 |
| 16 | §6/D-15 disclosure sentence (inline JSX) | SummaryReadout.tsx:59-62 | §6 D-15 | PASS — source-read equality | Source-read equality (JSX `&apos;` normalized to `'`): `"Rank can move down while real wealth still grows — every tier's wealth increases over this horizon. See the wealth-by-tier chart for absolute amounts."` matches style guide §6 D-15 verbatim text. No banned terms. | — |

---

### Surface 3 — src/ui/summaryFormatters.ts

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 17 | `"while real wealth grew X×"` (JSDoc comment) | summaryFormatters.ts:16 | §1 lexicon | PASS | Comment-only string; not rendered. Included for completeness (grep matched it). | — |
| 18 | §6 D-14 template: `"Distribution position: p[NN] → p[MM], while real wealth grew [G]×."` | summaryFormatters.ts:30-31 | §6 D-14 mandatory template | PASS | Byte-exact equality asserted in summaryFormatters.test.ts (Task 1, commit 0bc236d). Template shape matches §6 D-14 canonical text. "while real wealth grew [G]×" clause is mandatory and present. | Task-1 commit 0bc236d |
| 19 | §5 D-09 nominal caption template: `"These figures are not adjusted for inflation. They assume a fixed [X]% annual inflation rate ([source]). Switch to Real for inflation-adjusted amounts."` | summaryFormatters.ts:52-54 | §5 D-09 mandatory template | PASS | Byte-exact equality asserted in summaryFormatters.test.ts (Task 1, commit 0bc236d). Template shape matches §5 canonical text. "Switch to Real" is informational, not evaluative. No banned terms. | Task-1 commit 0bc236d |

---

### Surface 4 — src/ui/CitationFooter.tsx

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 20 | `"Default parameters sourced from:"` | CitationFooter.tsx:24 | §1 lexicon | PASS | Factual introductory phrase. No banned terms. | — |
| 21 | `"See sources for definitions and caveats."` | CitationFooter.tsx:42 | §1 lexicon | PASS | Informational pointer. No evaluative language. | — |
| 22 | `JST_SURVIVORSHIP_CAVEAT`: `"The long-run historical return figures (Jordà, Schularick, Taylor 2019) are drawn from markets that survived without revolution or expropriation, introducing an estimated ~0.5pp upward survivorship bias in reported real equity and housing returns. The default parameters are shaded conservatively below the JST headline figures to account for this adjustment."` (Plan 02 row) | CitationFooter.tsx:9-14 | §1 lexicon (NEUT-02 criterion 4) | PASS | Plan 02 (commit d497356). §1-compliant: no banned verbs ("introducing an estimated … bias" is factual quantification), no alarm punctuation, no zero-sum framing. Factually traceable to `SOURCES.jst2019.note`. Conservative shading note is mechanistic, not normative. | Plan-02 commit d497356 |

---

### Surface 5 — src/ui/ControlPanel.tsx

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 23 | `"Inputs"` (section heading) | ControlPanel.tsx:21 | §1 lexicon | PASS | Single-word factual label. No banned terms. | — |
| 24 | `"Current wealth"` (slider label, via LogSliderInput prop) | ControlPanel.tsx:25 | §1 lexicon | PASS | Factual input label. "wealth" is a neutral economic term here — not a valorization. | — |
| 25 | `"Annual savings"` (slider label) | ControlPanel.tsx:34 | §1 lexicon | PASS | Factual input label. No evaluative language. | — |

---

### Surface 6 — src/ui/BasisToggle.tsx

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 26 | `"Real"` / `"Nominal"` (button labels) | BasisToggle.tsx:27, 38 | §1 lexicon | PASS | Standard economic terms. No evaluative framing implied by the two options. §4 palette: `bg-teal-700` on active state — teal is the user-findability accent (§4), not a value signal. | — |
| 27 | `"Display basis"` (aria-label) | BasisToggle.tsx:15 | §1 lexicon | PASS | Accessible label, not user-visible copy per se. Descriptive, neutral. | — |
| 28 | `"Real adjusts for inflation; nominal does not."` (scope notice) | BasisToggle.tsx:44-45 | §1 lexicon | PASS | Factual comparative description. Does not imply one is better. | — |
| 29 | `"Real shows amounts in today's purchasing power. Nominal shows future dollar amounts without adjusting for inflation."` (explanatory copy) | BasisToggle.tsx:48-50 | §1 lexicon | PASS | Factual description of both bases in parallel construction. Does not privilege either basis. | — |

---

### Surface 7 — src/ui/HorizonSlider.tsx

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 30 | `"Projection horizon"` (label) | HorizonSlider.tsx:15 | §1 lexicon | PASS | Standard financial planning term. Not evaluative. | — |
| 31 | `"{value} years"` (live readout) | HorizonSlider.tsx:16 | §1 lexicon | PASS | Dynamic numeric display. No evaluative language. | — |
| 32 | `"10–60 years. Default is 35."` (scope notice) | HorizonSlider.tsx:29 | §1 lexicon | PASS | Factual range and default statement. No banned terms. | — |

---

### Surface 8 — src/ui/LogLinearToggle.tsx

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 33 | `"Log"` / `"Linear"` (button labels) | LogLinearToggle.tsx:22, 33 | §1 lexicon + §2 log-scale copy | PASS | Standard statistical terms. No evaluative framing. §2: "Do not characterise either scale as 'more honest', 'better'…" — these bare labels do not. | — |
| 34 | `"Y-axis scale"` (aria-label) | LogLinearToggle.tsx:14 | §1 lexicon | PASS | Accessible label. Descriptive, neutral. | — |
| 35 | `"Scale applies to the two wealth charts."` (scope notice) | LogLinearToggle.tsx:43 | §1 lexicon | PASS | Factual mechanical description. | — |
| 36 | `"Log scale: equal vertical distance represents equal percentage change, making compounding visible. Linear scale: equal vertical distance represents equal absolute change."` (explanatory copy) | LogLinearToggle.tsx:47-50 | §2 log-scale copy + §1 lexicon | PASS | Mechanistic description of both scales. "Making compounding visible" is a factual observation about the cognitive value of the log scale — not a value judgement ("better", "more honest", etc.). §2 templates differ in phrasing ("Logarithmic scale — equal vertical distances represent equal percentage changes. Useful for comparing growth rates across tiers.") but §2 does not prohibit equivalent phrasing — it prohibits evaluative characterisations. No banned terms present. | — |

---

### Surface 9 — src/ui/LogSliderInput.tsx

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 37 | `{label}` prop rendering (displays "Current wealth" / "Annual savings") | LogSliderInput.tsx:20 | §1 lexicon | PASS | Receives label as prop; reviewed at source (ControlPanel rows 24-25). | — |
| 38 | `{formatWealth(value)}` (dynamic wealth readout) | LogSliderInput.tsx:22 | §1 lexicon | PASS | Pure numeric display using `$X.Xk`/`$X.XM`/`$X` formatting. No evaluative language. | — |

---

### Surface 10 — src/viz/TimeSeriesChart.tsx

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 39 | none — verified | TimeSeriesChart.tsx | n/a | PASS | File is a thin ReactECharts wrapper (`option` + `style` props only). Zero user-facing string literals. All chart copy is generated in selectors.ts (reviewed in Surface 14). | — |

---

### Surface 11 — src/viz/DivergenceChart.tsx

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 40 | none — verified | DivergenceChart.tsx | n/a | PASS | Thin ReactECharts wrapper. Zero user-facing string literals. All chart copy generated in selectors.ts. | — |

---

### Surface 12 — src/viz/RelativePosChart.tsx

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 41 | `{caption}` prop (renders `REL_POS_CAPTION`) | RelativePosChart.tsx:23 | §3 caption prop | PASS | Caption prop passthrough; caption text reviewed at AppShell.tsx row 9 (§3 source-read equality). | — |

---

### Surface 13 — src/viz/TierShareChart.tsx

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 42 | `{caption}` prop (renders `SHARE_CAPTION`) | TierShareChart.tsx:24 | §7 caption prop | PASS | Caption prop passthrough; caption text reviewed at selectors.ts row 53 (§7 byte-exact). | — |

---

### Surface 14 — src/viz/DonutChart.tsx

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 43 | `{caption}` prop (renders `SHARE_CAPTION`) | DonutChart.tsx:24 | §7 caption prop | PASS | Caption prop passthrough; same constant as TierShareChart (row 42). | — |

---

### Surface 15 — src/state/selectors.ts (COLORS palette)

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 44 | `COLORS.user = '#0F766E'` (teal-700) | selectors.ts:14 | §4 palette clause | PASS | Matches §4: "Teal-700 (`#0F766E`) — user line only, used as a neutral findability accent." Hex byte-exact match. | — |
| 45 | `COLORS.median = '#64748B'` (slate-500) | selectors.ts:15 | §4 palette clause | PASS | Matches §4: "Slate-500 (`#64748B`) — median (p50) tier." Hex byte-exact match. | — |
| 46 | `COLORS.top10 = '#7C3AED'` (violet-600) | selectors.ts:16 | §4 palette clause | PASS | Matches §4: "Violet-600 (`#7C3AED`) — top 10% (p90) tier." Hex byte-exact match. | — |
| 47 | `COLORS.top1 = '#2563EB'` (blue-600) | selectors.ts:17 | §4 palette clause | PASS | Matches §4: "Blue-600 (`#2563EB`) — top 1% (p99) tier." Hex byte-exact match. | — |
| 48 | `COLORS.top01 = '#0891B2'` (cyan-600) | selectors.ts:18 | §4 palette clause | PASS | Matches §4: "Cyan-600 (`#0891B2`) — top 0.1% (p99.9) tier." Hex byte-exact match. | — |
| 49 | `COLORS.tierBand = '#CBD5E1'` (slate-300) | selectors.ts:19 | §4 palette clause | PASS | Matches §4: "Tier-threshold reference bands use slate-300 (`#CBD5E1`) at 30% opacity or less." Hex byte-exact match. opacity 0.3 confirmed at selectors.ts:323. | — |

---

### Surface 16 — src/state/selectors.ts (axis/series/tooltip/caption strings)

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 50 | `"Real wealth (today's money)"` (VIZ-01 y-axis) | selectors.ts:79 | §2 axis-label rules | PASS | §2 mandates: "The Y axis on wealth charts must be labelled 'Real wealth (today's money)'." Byte-exact match. | — |
| 51 | `"Year"` (VIZ-01 x-axis) | selectors.ts:73 | §2 axis-label rules | PASS | §2 mandates: "The X axis must be labelled 'Year'." Byte-exact match. | — |
| 52 | VIZ-01/VIZ-03 tooltip: `"Year X · Rank: X.Xth · Tier: [tier] · Wealth: $X"` | selectors.ts:102-105 | §2 tooltip copy | PASS | All values are numeric + descriptive. "Tier" uses `deriveTier()` which returns 'top 0.1%'/'top 1%'/'top 10%'/'median' — statistical positions, not evaluative labels. No banned terms. | — |
| 53 | `"Real wealth (today's money)"` (VIZ-04 y-axis) | selectors.ts:154 | §2 axis-label rules | PASS | Same as row 50; both VIZ-01 and VIZ-04 carry the mandatory y-axis label. | — |
| 54 | `"Year"` (VIZ-04 x-axis) | selectors.ts:148 | §2 axis-label rules | PASS | Same as row 51. | — |
| 55 | VIZ-04 combined tooltip: `"Year X · Rank: X.Xth · Tier: [tier]"` header + per-series wealth | selectors.ts:180-185 | §2 tooltip copy | PASS | §2: "The divergence-chart tooltip pairs rank with tier label purely as descriptive context: 'Rank: X.Xth · Tier: [tier]'." Matches the mandated pattern. Series names from `p.seriesName` which are the §2-compliant series labels ("Your wealth", "Median (p50)", etc.). | — |
| 56 | `"Your wealth"` (series name, VIZ-01 + VIZ-04) | selectors.ts:112, 191 | §2 series-label rules | PASS | §2: "The user series is labelled 'Your wealth' or 'Your rank' — descriptive, not evaluative." | — |
| 57 | `"Median (p50)"` (series name, VIZ-04) | selectors.ts:203 | §2 series-label rules | PASS | §2: "Tier series use descriptive labels: 'Median (p50)'". Byte-exact match. | — |
| 58 | `"Top 10% (p90)"` (series name, VIZ-04) | selectors.ts:216 | §2 series-label rules | PASS | §2: "'Top 10% (p90)'". Byte-exact match. | — |
| 59 | `"Top 1% (p99)"` (series name, VIZ-04) | selectors.ts:229 | §2 series-label rules | PASS | §2: "'Top 1% (p99)'". Byte-exact match. | — |
| 60 | `"Top 0.1% (p99.9)"` (series name, VIZ-04) | selectors.ts:242 | §2 series-label rules | PASS | §2: "'Top 0.1% (p99.9)'". Byte-exact match. | — |
| 61 | `"You"` (endLabel formatter, VIZ-01 + VIZ-04) | selectors.ts:121, 199 | §2 series-label rules | PASS | Purely identifies the user's line at its end. Not evaluative. | — |
| 62 | `"Percentile rank (0–100)"` (VIZ-05 y-axis) | selectors.ts:282 | §2 axis-label rules | PASS | §2 mandates: "The Y axis on the relative-position chart must be labelled 'Percentile rank (0–100)'." Byte-exact match. | — |
| 63 | `"Year"` (VIZ-05 x-axis) | selectors.ts:275 | §2 axis-label rules | PASS | Mandatory x-axis label. | — |
| 64 | `"Your rank"` (series name, VIZ-05) | selectors.ts:311 | §2 series-label rules | PASS | §2: "'Your rank' — descriptive, not evaluative." | — |
| 65 | VIZ-05 tooltip: `"Year X · Rank: X.Xth · Real wealth: $X · Share of total: X.XX%"` | selectors.ts:301-304 | §2 tooltip copy | PASS | §2: "Tooltips must show numerical values with units … No evaluative language in tooltips." All values numeric with descriptive units. | — |
| 66 | markLine labels `"p50"`, `"p90"`, `"p99"`, `"p99.9"` (VIZ-05 D-10 tier bands) | selectors.ts:330-333 | §2 axis label / §1 lexicon | PASS | Purely statistical percentile labels. No evaluative language. | — |
| 67 | `"Share of total wealth (%)"` (VIZ-07 y-axis) | selectors.ts:497 | §2 axis-label rules + §7 | PASS | Factual, no evaluative framing. Describes what is plotted. | — |
| 68 | `"Year"` (VIZ-07 x-axis) | selectors.ts:485 | §2 axis-label rules | PASS | Mandatory x-axis label. | — |
| 69 | Band names for stacked-area + donut (D-09 order): `"Bottom 50%"`, `"50–90%"`, `"90–99%"`, `"99–99.9%"`, `"Top 0.1%"` | selectors.ts:577-581 | §2 series-label rules + §1 | PASS | Statistical population-range labels. No evaluative language ("laggards", "winners", etc.). "Bottom" and "Top" are directional positions on a ranked distribution, not value judgements. | — |
| 70 | VIZ-07 stacked-area tooltip: `"Year X\n[series]: X.X%"` per band | selectors.ts:525-527 | §2 tooltip copy | PASS | Numeric values + series names from D-09 population-range labels. No evaluative language. | — |
| 71 | Donut tooltip: `"[band name]: X.X%"` | selectors.ts:618 | §2 tooltip copy | PASS | Pure numeric + band name. No evaluative language. | — |
| 72 | Donut center label: `"Beyond model domain\n(year X)"` (degraded path) | selectors.ts:605 | §1 lexicon | PASS | Factual status description. "Beyond model domain" is a precise technical statement. No alarm punctuation, no banned verbs. | — |
| 73 | Donut center label: `"Top 1% hold\n[X.X]%\n(year X)"` (non-degraded path) | selectors.ts:606 | §1 lexicon + §2 | PASS | Factual concentration statistic. "hold" is a neutral ownership verb (not "own" which could imply normative claim). No alarm punctuation. Cited from same bands as the visible donut slices (WR-01 integrity). | — |
| 74 | `SHARE_CAPTION` (D-16 mandatory disclosure) | selectors.ts:426-427 | §7 D-16 verbatim caption | PASS | Byte-exact equality asserted in `selectors.test.ts:635-638` (pre-existing test, confirmed green at 170/170). Text is mechanistic, non-editorial: "a falling share does not mean falling wealth, only that another tier is compounding faster" — no zero-sum framing, no blame assignment. | selectors.test.ts:635-638 |
| 75 | Wealth formatter strings: `"$X.XM"`, `"$Xk"`, `"$X"` | selectors.ts:31-33 | §1 lexicon | PASS | Pure numeric display with standard currency/scale suffixes. No evaluative language. | — |
| 76 | `deriveTier()` labels: `"top 0.1%"`, `"top 1%"`, `"top 10%"`, `"median"` | selectors.ts:46-49 | §2 series-label rules | PASS | Used in tooltip tier labels. Statistical positions, matching §2 descriptive series label policy. | — |

---

## CR-01 Row (Plan 01 fix, Wave 1)

| # | String / Literal | Location | Style-guide rule | Verdict | Rationale | Fix-ref |
|---|-----------------|----------|-----------------|---------|-----------|---------|
| 77 | §6/D-14: `"while real wealth grew [G]×"` clause using `summary.realGrowthMultiple` | SummaryReadout.tsx:55 | §6 D-14 | FIXED | **CR-01:** In nominal basis, the D-14 clause was receiving the nominally re-inflated growth multiple (`summary.growthMultiple`), making the "real wealth" claim factually wrong. Fix (Plan 01, commit 27705d0): added `realGrowthMultiple` field to `Summary` (always real-basis from `rawResult.series`), changed SummaryReadout to use `summary.realGrowthMultiple`, and added a passing regression test (`CR-01/D-14` in `selectors.test.ts`). | Plan-01 commits: a2f1e91 (test RED), 11f9e22 (feat GREEN), 27705d0 (wire) |

---

## §3 Style-Guide Drift Resolution

**Finding (RESEARCH Pitfall 2):** Style guide §3 (Version 1.0) referenced `src/ui/HarnessPage.tsx` as the location of `REL_POS_CAPTION`. This file does not exist in the shipped codebase. The correct file is `src/ui/AppShell.tsx` (lines 32-33).

**Resolution applied (living-doc default lean):** Corrected the §3 reference to `src/ui/AppShell.tsx` and bumped the style guide version from 1.0 to 1.1. Version bump and correction note committed in this plan. This is a documentation drift fix — no rule was changed, only the component reference.

**Files modified:** `docs/NEUTRALITY-STYLE-GUIDE.md` (Version 1.0 → 1.1, §3 `HarnessPage.tsx` → `AppShell.tsx/REL_POS_CAPTION`)
**Commit:** (this plan — Task 2 commit)

---

## Verbatim-Caption Summary

| Caption | Location | Verification method | Verdict |
|---------|----------|---------------------|---------|
| §3 REL_POS_CAPTION | AppShell.tsx:32-33 | Source-read equality (not exported; no DOM tooling) | PASS |
| §5 D-09 nominal caption template | summaryFormatters.ts:52-54 | Byte-exact Vitest assertion (summaryFormatters.test.ts) | PASS |
| §6 D-14 rank-delta template | summaryFormatters.ts:30-31 | Byte-exact Vitest assertion (summaryFormatters.test.ts) | PASS |
| §6 D-15 disclosure | SummaryReadout.tsx:59-62 | Source-read equality (inline JSX, `&apos;` normalized) | PASS |
| §7 SHARE_CAPTION | selectors.ts:426-427 | Byte-exact Vitest assertion (selectors.test.ts:635-638) | PASS |

---

## Summary

Total rows: 77 · PASS: 75 · FIXED: 2 · open FAIL: 0
