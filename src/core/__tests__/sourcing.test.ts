/**
 * sourcing.test.ts — DATA-04 / D-11 / D-12
 *
 * Sourcing-completeness enforcement gate (DATA-04):
 *   - Every SourcedParam in the production DEFAULTS tree must carry a complete
 *     SourceRecord with all six required non-empty fields.
 *   - A deliberately blanked field must fail this gate (D-11 / Pitfall 6).
 *
 * D-11: The build/test pipeline fails if any shipped DEFAULTS parameter lacks
 *       a complete (non-empty) SourceRecord field.
 * D-12: This gate targets only the production DEFAULTS module (src/data/defaults.ts),
 *       NOT Phase 1 synthetic fixtures (which use SYNTH_SOURCE_RECORD per testUtils).
 * Pitfall 6: Empty string ('') and whitespace-only ('  ') must fail the gate,
 *             not just null/undefined.
 *
 * Enumeration analog: invariants.test.ts:54-79 (accumulate violations, assert empty
 *   with joined diagnostic).
 * Negative-test analog: basis.test.ts:27-31.
 *
 * @decision DATA-04 / D-11 / D-12
 */
import { describe, it, expect } from 'vitest';
import type { SourceRecord, SourcedParam } from '../types.js';
import { DEFAULTS } from '../../data/defaults.js';

// ---------------------------------------------------------------------------
// Required fields for a complete SourceRecord (DATA-04 / D-11)
// ---------------------------------------------------------------------------

/** All six required fields that must be present and non-empty in every shipped SourceRecord. */
const REQUIRED: (keyof SourceRecord)[] = [
  'sourceName',
  'figureUsed',
  'basis',
  'definition',
  'yearVintage',
  'retrievedDate',
];

// ---------------------------------------------------------------------------
// Completeness assertion
// ---------------------------------------------------------------------------

/**
 * Assert that a single SourcedParam has a complete SourceRecord.
 *
 * For each required field:
 *   - If 'basis': must be 'real' or 'nominal'.
 *   - Otherwise: must be a non-empty, non-whitespace string.
 *
 * Throws a descriptive error on the first violation found (Pitfall 6: empty string
 * and whitespace must fail, not just null/undefined).
 *
 * @param path - Human-readable path string (e.g. 'DEFAULTS.anchors.median')
 * @param p - The SourcedParam to inspect
 * @throws Error if any required field is missing, empty, or whitespace-only
 */
function assertComplete(path: string, p: SourcedParam): void {
  const violations: string[] = [];

  for (const field of REQUIRED) {
    const v = p.source[field as keyof SourceRecord];
    if (field === 'basis') {
      if (v !== 'real' && v !== 'nominal') {
        violations.push(`${path}.source.basis must be 'real' or 'nominal'; got: ${JSON.stringify(v)}`);
      }
    } else {
      if (typeof v !== 'string' || v.trim().length === 0) {
        violations.push(
          `${path}.source.${field} missing or empty/whitespace; got: ${JSON.stringify(v)}`,
        );
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `SourceRecord incomplete at ${path}:\n  ${violations.join('\n  ')}`,
    );
  }
}

// ---------------------------------------------------------------------------
// DEFAULTS walker: enumerate all SourcedParams (D-12: targets DEFAULTS only)
// ---------------------------------------------------------------------------

/**
 * Walk the DEFAULTS tree and yield [path, SourcedParam] pairs for every
 * SourcedParam found.
 *
 * Covers:
 *   - DEFAULTS.anchors.{median,top10,top1,top01}
 *   - DEFAULTS.returnByTier.{median,top10,top1,top01}
 *   - DEFAULTS.dragStrength
 *   - DEFAULTS.savings
 *
 * Plain-number fields (horizon) are skipped (they have no SourceRecord).
 * D-12 compliance: this function enumerates only the production DEFAULTS tree;
 * it does NOT reference makeSyntheticParams or any Phase 1 synthetic fixture.
 */
function* enumerateSourcedParams(
  defaults: typeof DEFAULTS,
): Generator<[string, SourcedParam]> {
  // anchors
  for (const tier of ['median', 'top10', 'top1', 'top01'] as const) {
    yield [`DEFAULTS.anchors.${tier}`, defaults.anchors[tier]];
  }
  // returnByTier
  for (const tier of ['median', 'top10', 'top1', 'top01'] as const) {
    yield [`DEFAULTS.returnByTier.${tier}`, defaults.returnByTier[tier]];
  }
  // dragStrength
  yield ['DEFAULTS.dragStrength', defaults.dragStrength];
  // savings
  yield ['DEFAULTS.savings', defaults.savings];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('D-11 sourcing-completeness gate (DATA-04)', () => {
  it('every SourcedParam in DEFAULTS has a complete six-field SourceRecord (all required fields present, non-empty, basis valid)', () => {
    const violations: string[] = [];

    for (const [path, param] of enumerateSourcedParams(DEFAULTS)) {
      try {
        assertComplete(path, param);
      } catch (err) {
        violations.push(String(err));
      }
    }

    expect(
      violations,
      `One or more DEFAULTS SourcedParams have incomplete SourceRecords.\n\n` +
        violations.join('\n\n'),
    ).toHaveLength(0);
  });

  // Negative test (test-the-test discipline, analog: basis.test.ts:27-31):
  // A deliberately blanked required field must make assertComplete throw.
  // This proves the gate rejects empty/whitespace (Pitfall 6) — not just null/undefined.
  it('NEGATIVE: a param with a whitespace-only required field fails assertComplete (Pitfall 6: empty/whitespace must fail)', () => {
    // Shallow-clone DEFAULTS.dragStrength with figureUsed blanked to whitespace
    const badParam: SourcedParam = {
      ...DEFAULTS.dragStrength,
      source: {
        ...DEFAULTS.dragStrength.source,
        figureUsed: '  ', // intentionally whitespace-only — must trigger the gate
      },
    };

    // The gate must throw (empty/whitespace string must be rejected)
    expect(() => assertComplete('bad.param', badParam)).toThrow(
      /SourceRecord incomplete/,
    );
  });

  it('NEGATIVE: a param with an empty-string required field fails assertComplete (Pitfall 6)', () => {
    const badParam: SourcedParam = {
      ...DEFAULTS.dragStrength,
      source: {
        ...DEFAULTS.dragStrength.source,
        yearVintage: '', // intentionally empty string — must trigger the gate
      },
    };

    expect(() => assertComplete('bad.param', badParam)).toThrow(
      /SourceRecord incomplete/,
    );
  });
});
