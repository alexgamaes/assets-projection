/**
 * multiTierFixture.test.ts — MODEL-03 + MODEL-04 (hand-derived coupling fixture)
 *
 * Tests the engine against a small hand-derived multi-tier fixture:
 *   - 2–3 tiers over ~5 years with drag ON
 *   - Step-by-step expected values pre-computed by hand (D-10b)
 *   - Verifies the full coupling pipeline: calibrate → dynamic top set → drag → compound → refit
 *   - Non-conservation invariant: aggregate wealth grows; no tier's gain/loss equals another's
 *
 * ALL tests are it.todo — filled by Plan 01-03 (tiers/drag/engine plans).
 * The file exists now so `npx vitest run` is runnable (MODEL-06 infra ready).
 */
import { describe, it } from 'vitest';

describe('MODEL-03 + MODEL-04: Multi-tier hand-derived fixture (drag ON)', () => {
  it.todo(
    'engine with 2 tiers over 5 years matches hand-computed year-by-year anchor wealth (within relErr < 1e-9)'
  );

  it.todo(
    'dynamic top set (D-03): topSetPercentile tightens over the horizon as concentration increases'
  );

  it.todo(
    'drag coupling is applied exactly once per tier per year (step 4 of loop — not baked into returnByTier)'
  );

  it.todo(
    'relativePosition.userShare is consistent with anchorWealth distribution shares at each year'
  );

  it.todo(
    'non-conservation: sum of anchor tier wealth grows; no tier-pair delta nets to zero (D-12, no zero-sum)'
  );
});
