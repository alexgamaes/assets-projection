# Stack Research

**Domain:** Client-side numerical/financial projection web calculator with rich interactive charts (no backend, no accounts, public static deployment)
**Researched:** 2026-05-15
**Confidence:** HIGH

## Executive Recommendation

A **client-only React SPA built with Vite**, charts rendered by **Apache ECharts**, tunable parameters held in **Zustand**, math written in **plain TypeScript with `number`** (model is real-return percentages and growth multipliers — not currency cents), styled with **Tailwind CSS v4**, deployed as **static files to a CDN host (Cloudflare Pages / GitHub Pages / Netlify)**.

This is a deliberately conservative, mainstream 2026 stack. The project's priorities (correctness and clarity of the model > polish, maintainability, simplicity) reward boring, well-documented, widely-supported tools over novelty. Nothing here requires a server, build-time data, or SSR.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | 5.9.x | Language for app + numerical model | The projection model is the heart of the app (goals 1–4). Static types catch unit/parameter-curve errors (percentile -> rate mappings, horizon arrays) that would otherwise produce silently wrong charts. Non-negotiable for a correctness-first calculator. |
| React | 19.2.x | UI framework | The dominant, maintainable, best-documented frontend framework in 2026. Huge ecosystem for charts/state. Component model maps cleanly onto "inputs panel + chart + assumptions/sourcing panel." Long-term maintainability for a personal tool that must remain editable years later. |
| Vite | 8.0.x | Build tool + dev server | The 2026 standard for SPA tooling. Instant HMR (fast iteration on a math-heavy model), near-zero config, first-class TS, tiny static `dist/` output ideal for CDN hosting. Vite 8 is the current stable line (8.0.10); Vite 7 and below are EOL. |
| Apache ECharts | 6.0.x | Charting / data visualization | Best fit for the three required visualizations: exponential-growth curves (with **log-scale axis toggle** — essential to make compounding legible, goal 1), multi-series divergence between wealth tiers, and stacked/share-of-total relative-position charts. Canvas renderer handles dense multi-decade series smoothly; built-in `dataZoom`, tooltips, and log axis out of the box. Mature, neutral-looking defaults (supports goal 3). |
| Zustand | 5.0.x | State management for tunable parameters | "Many independent tunable parameters that drive a recompute" is exactly Zustand's sweet spot: a single typed store, selector-based subscriptions so the chart only re-renders when relevant params change, derived projection computed via a selector/memo. ~1KB, no providers/boilerplate — keeps the codebase simple (goal 5/6). |
| Tailwind CSS v4 | 4.3.x (`@tailwindcss/vite` 4.3.x) | Styling | Utility-first CSS keeps a single-page tool's styling local and maintainable without a design system. v4's first-party Vite plugin = one line of config, one `@import "tailwindcss"`, fast rebuilds. Neutral, restrained UI aligns with the "don't overwhelm / stay neutral" constraints. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| echarts-for-react | 3.0.x | Thin React wrapper for ECharts | Use to bind ECharts `option` objects to React lifecycle. Lightweight; pass `option` from a memoized selector. Acceptable alternative: a ~30-line hand-rolled `useEffect` wrapper around `echarts.init` if you want zero extra deps (fully reasonable for this small app). |
| Zod | 4.x | Runtime validation of user-entered numbers + URL-shared state | Validate wealth/savings/override inputs at the boundary so the model never receives `NaN`/negative/absurd values. Also validates state hydrated from a shareable URL query string. Use once you add advanced overrides or share-by-URL. |
| Vitest | 3.x | Unit testing the projection model | The model (heterogeneous return curve, asset-price-inflation drag, relative-share computation) must be tested with known fixtures and citeable expected values. Correctness is goal-critical; Vitest shares Vite config so setup is trivial. |
| nuqs *or* hand-rolled `URLSearchParams` sync | nuqs 2.x | Persist tunable state in the URL (shareability without a backend) | Replaces "no accounts/persistence" — encode parameters in the URL so a configured projection is shareable/bookmarkable. Add only if URL-sharing is desired; otherwise skip entirely. |
| Biome | 2.x | Lint + format (single fast tool) | Replaces ESLint+Prettier with one zero-config binary. Optional but reduces tooling surface for a solo-maintained project. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vite | Dev server + production build | `npm run dev` for HMR; `npm run build` emits static `dist/`. Set `base` correctly if deploying to a GitHub Pages project subpath. |
| Vitest | Run model unit tests | Keep model logic in framework-free `*.ts` modules (pure functions) so tests are fast and the math is decoupled from React. |
| TypeScript (`tsc --noEmit`) | Type-check in CI | Run as a separate CI step; Vite does not type-check during build. |
| Cloudflare Pages / GitHub Pages / Netlify | Static hosting + CDN | Any pure static host works since there is no backend. GitHub Pages is simplest if the repo is already on GitHub; Cloudflare Pages gives the best global CDN + instant rollbacks for free. |

## Installation

```bash
# Scaffold (React + TS)
npm create vite@latest assets-projection -- --template react-ts

# Core
npm install react react-dom zustand echarts echarts-for-react

# Supporting (add as needed)
npm install zod nuqs

# Styling
npm install tailwindcss @tailwindcss/vite

# Dev dependencies
npm install -D typescript vite @vitejs/plugin-react vitest @biomejs/biome
```

`vite.config.ts` plugins: `@vitejs/plugin-react` + `@tailwindcss/vite`. CSS entry: `@import "tailwindcss";`.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| React 19 | Svelte 5 / SvelteKit (static adapter) | If the maintainer strongly prefers Svelte's smaller runtime and simpler reactivity. Valid for a small solo tool, but smaller charting/ecosystem support; React's documentation depth wins for long-term maintainability here. |
| React 19 | Solid / Vue 3 | Fine technically; chosen against only because React has the deepest charting + state ecosystem and the maintainer most likely already knows it. |
| Apache ECharts | Recharts | Use if you prefer a declarative React-component chart API and datasets stay small. Rejected as primary because SVG-per-point degrades with dense multi-decade multi-tier series and log-scale + share-stacking are less ergonomic. |
| Apache ECharts | visx / D3 directly | Use if you need fully bespoke, pixel-perfect custom visuals. Rejected: far more code to achieve standard log/divergence/share charts — conflicts with simplicity + maintainability priorities. |
| Apache ECharts | uPlot | Use if rendering performance for very large series becomes the dominant constraint. Overkill here (a few hundred yearly points) and weaker tooltip/interaction story. |
| Zustand | Jotai | Use if parameter state becomes a large web of interdependent derived atoms. For a flat set of sliders feeding one pure model function, Zustand is simpler. |
| Zustand | React Context + useReducer | Viable with zero deps, but causes broad re-renders on every parameter tweak (bad for a chart-heavy app) and more boilerplate. |
| Plain `number` math | decimal.js / big.js | Use ONLY if you model actual currency to-the-cent ledgers. This app projects real-return *rates* and growth *multipliers* over decades — IEEE-754 `number` is correct and far faster; arbitrary-precision decimals add bundle weight and complexity for zero accuracy benefit at this scale. Round only at display time. |
| Plain `number` math | Web Worker offload | Add a Worker only if a recompute visibly blocks the UI. A closed-form/iterative annual projection over ~100 years × a few tiers is sub-millisecond — premature here. |
| Tailwind v4 | CSS Modules / vanilla CSS | Perfectly fine for a single-page app; chosen against only for iteration speed and to avoid naming/architecture decisions. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Next.js / Remix / any SSR meta-framework | No backend, no SEO need, no server rendering benefit for a single interactive calculator. Adds server runtime, routing, and deployment complexity that contradicts "static, no accounts, simple." | Vite SPA |
| Create React App | Deprecated/unmaintained; slow, no longer recommended by React team. | Vite |
| Vite 7 or older | End-of-life; no longer supported in 2026. | Vite 8.0.x |
| Redux / Redux Toolkit | Heavy boilerplate and action/reducer ceremony for what is a flat parameter bag feeding a pure function. Hurts simplicity/maintainability goals. | Zustand |
| decimal.js / big.js / currency.js | Arbitrary-precision decimal is for cent-accurate money ledgers. The model is rates and multipliers; these libs add bundle size and slow the recompute with no correctness gain. | Plain `number`, round at display |
| Chart.js | Weaker at log-scale exponential clarity, multi-series divergence styling, and share-stacking interactions vs ECharts; less ergonomic for the exact three visualizations required. | Apache ECharts |
| A backend / database / auth (Firebase, Supabase, etc.) | Explicitly out of scope (no accounts, no per-user persistence). Introduces ops, privacy, and cost burden for zero requirement. | URL-encoded state (nuqs / URLSearchParams) for shareability |
| Tailwind v3 + PostCSS pipeline | Superseded by v4's first-party Vite plugin (faster, less config). | Tailwind v4 + `@tailwindcss/vite` |

## Stack Patterns by Variant

**If the projection model is pure and deterministic (it is):**
- Keep all model code in framework-free `src/model/*.ts` pure functions returning typed result series.
- Drive ECharts from a memoized selector that maps Zustand params -> model output -> ECharts `option`.
- Because this isolates correctness-critical math, makes it unit-testable in Vitest, and keeps the UI a thin shell — directly serving goals 1–4.

**If you want shareable configurations without a backend:**
- Serialize the Zustand parameter slice into the URL query string (nuqs or manual), validate on hydrate with Zod.
- Because it satisfies "share publicly" without violating the no-accounts/no-persistence constraint.

**If recompute ever blocks the UI (unlikely at this scale):**
- Move the model into a Web Worker with a `Comlink`-style message API.
- Because it keeps slider dragging smooth; only adopt on measured evidence, not preemptively.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Vite 8.0.x | Node.js 22.12+ / 20.19+ | Vite 8 follows the Node EOL schedule; ensure CI/local Node is current LTS. |
| Vite 8.0.x | @vitejs/plugin-react (current) | Use the plugin-react version aligned with the Vite 8 line. |
| React 19.2.x | react-dom 19.2.x | Keep react and react-dom on the same minor. |
| echarts-for-react 3.0.x | echarts 6.0.x | Wrapper expects ECharts 6; pass `option` objects, not legacy 4.x APIs. |
| Tailwind 4.3.x | @tailwindcss/vite 4.3.x | Use the Vite plugin (not the legacy PostCSS plugin) with Vite 8. |
| Vitest 3.x | Vite 8.0.x | Vitest reuses Vite's transform pipeline; keep major lines aligned. |

## Sources

- https://vite.dev/releases — Vite current stable verified as 8.0.10; Vite 7 EOL (HIGH)
- https://react.dev/versions — React stable verified as 19.2.x (19.2.1, Dec 2025) (HIGH)
- https://github.com/apache/echarts/releases + npmjs.com/package/echarts-for-react — ECharts 6.0.0, echarts-for-react 3.0.6 (HIGH)
- https://www.npmjs.com/package/@tailwindcss/vite — Tailwind/Vite plugin 4.3.x; v4 first-party Vite plugin (HIGH)
- pkgpulse.com / dev.to state-management 2026 surveys — Zustand the pragmatic default; ~1KB; most-downloaded (MEDIUM, multi-source agreement)
- github.com/MikeMcl/decimal.js + money-handling comparison articles — decimal libs are for cent-accurate currency, not rate/multiplier modeling (MEDIUM, reasoned from domain fit)
- querio.ai / embeddable.com / fusioncharts 2026 chart-library comparisons — ECharts strongest for dense multi-series + advanced interactivity vs Recharts/visx (MEDIUM, multi-source)

---
*Stack research for: client-side numerical/financial projection calculator with interactive charts*
*Researched: 2026-05-15*
