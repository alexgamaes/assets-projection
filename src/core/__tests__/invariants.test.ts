/**
 * invariants.test.ts — MODEL-01 + MODEL-04
 *
 * MODEL-01: core/ source files (non-test) must import ZERO framework/DOM/fetch/Date.now/
 *   Math.random/document/window APIs. Implemented as a filesystem read + regex scan over
 *   the source text (the test file itself may use node APIs; the scan targets non-test sources).
 *
 * MODEL-04 invariant placeholders (todo — filled by downstream plans 03/04):
 *   drag=0 ⇒ independent per-tier baseline; non-conservation; infinite-growth preserved.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect all .ts files under a directory recursively, excluding __tests__ subdirs. */
function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const st = statSync(fullPath);
    if (st.isDirectory()) {
      if (entry === '__tests__') continue; // skip test dirs
      files.push(...collectSourceFiles(fullPath));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Pattern that must NOT appear in core/ source files (non-test).
const FORBIDDEN_PATTERN =
  /\breact\b|\breact-dom\b|from ['"]fs|from ['"]node:|fetch\s*\(|Date\.now\b|Math\.random\b|document\.|window\./;

// ---------------------------------------------------------------------------
// MODEL-01: Import boundary (framework-free core)
// ---------------------------------------------------------------------------
describe('MODEL-01: core/ is framework-free and deterministic', () => {
  it('core source files contain zero framework/DOM/fetch/Date.now/Math.random imports', () => {
    // Resolve path relative to this test file's location
    const coreDir = new URL('../..', import.meta.url).pathname;
    // coreDir points to src/core; ensure only files directly under core/ (not __tests__)
    const sources = collectSourceFiles(coreDir);

    const violations: { file: string; line: number; text: string }[] = [];

    for (const file of sources) {
      const lines = readFileSync(file, 'utf-8').split('\n');
      lines.forEach((text, idx) => {
        if (FORBIDDEN_PATTERN.test(text)) {
          violations.push({ file, line: idx + 1, text: text.trim() });
        }
      });
    }

    expect(
      violations,
      `core/ source files must not import framework/DOM/fetch/Date.now/Math.random.\nViolations:\n${violations
        .map(v => `  ${v.file}:${v.line}: ${v.text}`)
        .join('\n')}`
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// MODEL-04 placeholders — filled by downstream plans
// ---------------------------------------------------------------------------
describe('MODEL-04 invariants (drag coupling)', () => {
  it.todo(
    'dragStrength=0 collapses each tier to the independent analytic ordinary-annuity baseline (<1e-9 relErr)'
  );
  it.todo(
    'aggregate real wealth is NOT conserved and grows with drag>0; no transfer between tiers'
  );
  it.todo(
    'no tier is forced to negative real wealth by drag alone (infinite-growth preserved)'
  );
});
