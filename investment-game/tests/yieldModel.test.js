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
  it('returns savings + gain × price level (gain = yield over no-fertilizer baseline)', () => {
    const r = computeRevenue({ dose: 10, rain: 'drought', price: 'low' });
    expect(r.savings).toBe(GAME.TOKEN_BUDGET_PER_ROUND - 10);
    expect(r.baselineYield).toBeCloseTo(computeYield(0, 'drought'), 6);
    expect(r.gain).toBeCloseTo(computeYield(10, 'drought') - computeYield(0, 'drought'), 6);
    // gain is always >= 0, so revenue can never fall below savings.
    expect(r.gain).toBeGreaterThanOrEqual(0);
    expect(r.revenue).toBeGreaterThanOrEqual(r.savings);
    expect(r.revenue).toBeGreaterThanOrEqual(GAME.TOKEN_BUDGET_PER_ROUND - GAME.FERTILIZER.MAX_UNITS);
    expect(r.revenue).toBeCloseTo(r.savings + r.gain * r.priceLevel, 6);
  });

  it('dose 0 pays exactly the saved budget with no harvest gain (guaranteed payout)', () => {
    for (const rain of GAME.RAIN_STATES) {
      for (const price of GAME.PRICE_STATES) {
        const r = computeRevenue({ dose: 0, rain, price });
        expect(r.gain).toBe(0);
        expect(r.revenue).toBe(GAME.TOKEN_BUDGET_PER_ROUND);
      }
    }
  });

  it('exposes the investment as cost / returnValue / net (net = returnValue − cost)', () => {
    const r = computeRevenue({ dose: 6, rain: 'good', price: 'high' });
    expect(r.cost).toBe(6);
    expect(r.returnValue).toBeCloseTo(r.gain * r.priceLevel, 6);
    expect(r.net).toBeCloseTo(r.returnValue - r.cost, 6);
    expect(r.revenue).toBeCloseTo(GAME.TOKEN_BUDGET_PER_ROUND + r.net, 6);
  });

  it('fertilizing into a drought loses the money spent (net < 0, returns nothing)', () => {
    for (const price of GAME.PRICE_STATES) {
      const r = computeRevenue({ dose: 6, rain: 'drought', price });
      expect(r.returnValue).toBeCloseTo(0, 6); // fertilizer does nothing in drought
      expect(r.net).toBeCloseTo(-r.cost, 6);   // the whole cost is lost
      expect(r.revenue).toBeLessThan(GAME.TOKEN_BUDGET_PER_ROUND); // a real loss vs not fertilizing
    }
  });

  it('is linear in price level at fixed dose and rain', () => {
    const d = 5, rain = 'normal';
    const rHigh = computeRevenue({ dose: d, rain, price: 'high' });
    const rMid = computeRevenue({ dose: d, rain, price: 'mid' });
    const rLow = computeRevenue({ dose: d, rain, price: 'low' });
    const gain = computeYield(d, rain) - computeYield(0, rain);
    const savings = GAME.TOKEN_BUDGET_PER_ROUND - d;
    expect(rHigh.revenue).toBeCloseTo(savings + gain * GAME.PRICE_LEVELS.high, 6);
    expect(rMid.revenue).toBeCloseTo(savings + gain * GAME.PRICE_LEVELS.mid, 6);
    expect(rLow.revenue).toBeCloseTo(savings + gain * GAME.PRICE_LEVELS.low, 6);
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
