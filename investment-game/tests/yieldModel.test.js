import { describe, it, expect } from 'vitest';
import { computeYield, computeRevenue, expectedRevenue, optimalDose } from '../src/lib/yieldModel.js';
import { GAME } from '../src/lib/constants.js';

describe('computeYield', () => {
  it('is non-negative at every (dose, rain)', () => {
    for (let d = 0; d <= GAME.FERTILIZER.MAX_UNITS; d++) {
      for (const rain of GAME.RAIN_STATES) {
        expect(computeYield(d, rain)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('is monotonically non-decreasing in dose for each rain state, up to the turning point', () => {
    // The concave response peaks at dose = ALPHA/(2*BETA); up to that point
    // adding dose should weakly increase yield.
    const peak = Math.floor(GAME.YIELD.ALPHA / (2 * GAME.YIELD.BETA));
    const cap = Math.min(peak, GAME.FERTILIZER.MAX_UNITS);
    for (const rain of GAME.RAIN_STATES) {
      for (let d = 1; d <= cap; d++) {
        expect(computeYield(d, rain)).toBeGreaterThanOrEqual(computeYield(d - 1, rain));
      }
    }
  });

  it('respects ordering good > normal > drought at every dose', () => {
    for (let d = 0; d <= GAME.FERTILIZER.MAX_UNITS; d++) {
      const g = computeYield(d, 'good');
      const n = computeYield(d, 'normal');
      const b = computeYield(d, 'drought');
      expect(g).toBeGreaterThanOrEqual(n);
      expect(n).toBeGreaterThanOrEqual(b);
    }
  });

  it('marginal dose return is larger in good rain than in drought (interaction)', () => {
    const gDelta = computeYield(5, 'good') - computeYield(0, 'good');
    const dDelta = computeYield(5, 'drought') - computeYield(0, 'drought');
    expect(gDelta).toBeGreaterThan(dDelta);
  });
});

describe('computeRevenue', () => {
  it('returns savings + yield × price level with a non-negative floor', () => {
    const r = computeRevenue({ dose: 10, rain: 'drought', price: 'low' });
    expect(r.savings).toBe(GAME.TOKEN_BUDGET_PER_ROUND - 10);
    expect(r.revenue).toBeGreaterThanOrEqual(GAME.TOKEN_BUDGET_PER_ROUND - GAME.FERTILIZER.MAX_UNITS);
    expect(r.revenue).toBeCloseTo(r.savings + r.yield * r.priceLevel, 6);
  });

  it('is linear in price level at fixed dose and rain', () => {
    const d = 5, rain = 'normal';
    const rHigh = computeRevenue({ dose: d, rain, price: 'high' });
    const rMid = computeRevenue({ dose: d, rain, price: 'mid' });
    const rLow = computeRevenue({ dose: d, rain, price: 'low' });
    const y = computeYield(d, rain);
    const savings = GAME.TOKEN_BUDGET_PER_ROUND - d;
    expect(rHigh.revenue).toBeCloseTo(savings + y * GAME.PRICE_LEVELS.high, 6);
    expect(rMid.revenue).toBeCloseTo(savings + y * GAME.PRICE_LEVELS.mid, 6);
    expect(rLow.revenue).toBeCloseTo(savings + y * GAME.PRICE_LEVELS.low, 6);
  });
});

describe('expectedRevenue + optimalDose', () => {
  it('optimal dose sits strictly between 0 and max for a favorable round', () => {
    const favorable = { rainProbs: [0.8, 0.15, 0.05], priceProbs: [0.3, 0.5, 0.2] };
    const { dose } = optimalDose(favorable);
    expect(dose).toBeGreaterThan(0);
    expect(dose).toBeLessThan(GAME.FERTILIZER.MAX_UNITS);
  });

  it('expected revenue is concave enough that the argmax is unique', () => {
    const probs = { rainProbs: [0.5, 0.3, 0.2], priceProbs: [0.25, 0.5, 0.25] };
    let prev = -Infinity, peaked = false;
    for (let d = 0; d <= GAME.FERTILIZER.MAX_UNITS; d++) {
      const ev = expectedRevenue({ dose: d, ...probs });
      if (ev < prev) peaked = true;
      // Once we've peaked, ev should keep declining (concavity).
      if (peaked) expect(ev).toBeLessThanOrEqual(prev);
      prev = ev;
    }
    expect(peaked).toBe(true);
  });
});
