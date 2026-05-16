---
status: partial
phase: 02-empirical-data-parameter-calibration
source: [02-VERIFICATION.md]
started: 2026-05-16T10:13:31Z
updated: 2026-05-16T10:13:31Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. DATA-02 primary-source faithfulness cross-check
expected: Each anchor's `figureUsed` and `note` in `src/data/sources.ts` / `src/data/defaults.ts` is a correct reading of the actual primary-source tables — Fagereng et al. 2020 (~500bp raw / ~10pp net-of-tax return association), Jordà-Schularick-Taylor 2019 (rate of return on everything), Bach 2020 (rich pickings / heterogeneous returns), Saez-Zucman 2016/2019 (capitalized wealth shares), McKinsey 2021 (~80% asset-price-inflation share of net-worth growth). Automated checks confirm only non-emptiness and substring presence; a human must open the cited PDFs/tables and confirm the numeric values and their basis/definition are faithful, not misread.
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
