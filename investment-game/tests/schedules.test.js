import { describe, it, expect } from 'vitest';
import {
  RAIN_SCHEDULE,
  PRICE_SCHEDULE,
  PRACTICE_RAIN,
  PRACTICE_PRICE,
} from '../src/lib/schedules.js';
import { optimalDose } from '../src/lib/yieldModel.js';
import { NUM_ROUNDS, GAME } from '../src/lib/constants.js';

const EPS = 1e-9;

describe('schedule shape', () => {
  it('has one row per round', () => {
    expect(RAIN_SCHEDULE).toHaveLength(NUM_ROUNDS);
    expect(PRICE_SCHEDULE).toHaveLength(NUM_ROUNDS);
  });

  it('each rain row sums to 1 over the 3 rain states', () => {
    for (const row of RAIN_SCHEDULE) {
      expect(row).toHaveLength(GAME.RAIN_STATES.length);
      expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
      expect(row.every((p) => p >= 0 && p <= 1)).toBe(true);
    }
  });

  it('each price row sums to 1 over the 3 price states', () => {
    for (const row of PRICE_SCHEDULE) {
      expect(row).toHaveLength(GAME.PRICE_STATES.length);
      expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
      expect(row.every((p) => p >= 0 && p <= 1)).toBe(true);
    }
  });

  it('practice row sums check out too', () => {
    expect(Math.abs(PRACTICE_RAIN.reduce((a, b) => a + b, 0) - 1)).toBeLessThan(EPS);
    expect(Math.abs(PRACTICE_PRICE.reduce((a, b) => a + b, 0) - 1)).toBeLessThan(EPS);
  });
});

describe('schedule actually varies', () => {
  // If the optimal dose collapses to the same value in every round, the
  // treatment has nothing to pick up. This guards against accidentally
  // calibrating the schedules flat.
  it('optimal dose takes at least 2 distinct values across the 8 real rounds', () => {
    const doses = new Set();
    for (let i = 0; i < NUM_ROUNDS; i++) {
      doses.add(optimalDose({
        rainProbs: RAIN_SCHEDULE[i],
        priceProbs: PRICE_SCHEDULE[i],
      }).dose);
    }
    expect(doses.size).toBeGreaterThanOrEqual(2);
  });

  it('drought-prone rounds have a (weakly) lower optimal dose than favorable rounds', () => {
    // Round 3 is drought-prone (30/30/40), Round 6 is very favorable (80/15/5).
    const d3 = optimalDose({ rainProbs: RAIN_SCHEDULE[2], priceProbs: PRICE_SCHEDULE[2] }).dose;
    const d6 = optimalDose({ rainProbs: RAIN_SCHEDULE[5], priceProbs: PRICE_SCHEDULE[5] }).dose;
    expect(d3).toBeLessThanOrEqual(d6);
  });
});
