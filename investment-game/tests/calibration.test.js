import { describe, it, expect } from 'vitest';
import { RAIN_SCHEDULE, PRICE_SCHEDULE } from '../src/lib/schedules.js';
import { expectedRevenue, optimalDose } from '../src/lib/yieldModel.js';
import { NUM_ROUNDS, GAME } from '../src/lib/constants.js';

// These assertions pin calibration quality. If you tune the yield model or
// the schedules and one of these fails, that's a signal — not necessarily
// a bug, but something to look at before you ship: the experiment may have
// lost statistical power in a specific round or across the whole session.

describe('calibration health', () => {
  it('every round\'s optimal dose is strictly interior (not 0, not max)', () => {
    for (let i = 0; i < NUM_ROUNDS; i++) {
      const { dose } = optimalDose({
        rainProbs: RAIN_SCHEDULE[i], priceProbs: PRICE_SCHEDULE[i],
      });
      expect(dose).toBeGreaterThan(0);
      expect(dose).toBeLessThan(GAME.FERTILIZER.MAX_UNITS);
    }
  });

  it('optimal doses span at least 3 distinct values across 8 rounds', () => {
    // 3 is a soft floor — with 8 rounds we want enough heterogeneity that
    // "always pick the same dose" is a visibly worse strategy than reading
    // the briefing each round. Currently the game spans 5 values.
    const doses = new Set();
    for (let i = 0; i < NUM_ROUNDS; i++) {
      doses.add(optimalDose({
        rainProbs: RAIN_SCHEDULE[i], priceProbs: PRICE_SCHEDULE[i],
      }).dose);
    }
    expect(doses.size).toBeGreaterThanOrEqual(3);
  });

  it('total gap (optimal − zero) across all rounds ≥ 15 tokens', () => {
    // Sums per-round gaps. Too-small total means an "always pick zero" player
    // isn't meaningfully penalised relative to a player who reads the
    // briefing — which would kill the experiment's identifying variation.
    let total = 0;
    for (let i = 0; i < NUM_ROUNDS; i++) {
      const { dose } = optimalDose({
        rainProbs: RAIN_SCHEDULE[i], priceProbs: PRICE_SCHEDULE[i],
      });
      const ev = expectedRevenue({ dose, rainProbs: RAIN_SCHEDULE[i], priceProbs: PRICE_SCHEDULE[i] });
      const ev0 = expectedRevenue({ dose: 0, rainProbs: RAIN_SCHEDULE[i], priceProbs: PRICE_SCHEDULE[i] });
      total += ev - ev0;
    }
    expect(total).toBeGreaterThanOrEqual(15);
  });

  it('optimal-dose revenue is always higher-variance than zero-dose revenue', () => {
    // Sanity: if fertilizer didn't add variance, there'd be no risk-aversion
    // story. We need risk-averse participants to see a real tradeoff.
    for (let i = 0; i < NUM_ROUNDS; i++) {
      const rain = RAIN_SCHEDULE[i], price = PRICE_SCHEDULE[i];
      const { dose } = optimalDose({ rainProbs: rain, priceProbs: price });
      const varAt = (d) => {
        const mean = expectedRevenue({ dose: d, rainProbs: rain, priceProbs: price });
        let v = 0;
        for (let a = 0; a < GAME.RAIN_STATES.length; a++) {
          for (let b = 0; b < GAME.PRICE_STATES.length; b++) {
            const r = expectedRevenue({
              dose: d,
              rainProbs: indicator(a, rain.length),
              priceProbs: indicator(b, price.length),
            });
            v += rain[a] * price[b] * (r - mean) ** 2;
          }
        }
        return v;
      };
      expect(varAt(dose)).toBeGreaterThan(varAt(0));
    }
  });
});

function indicator(i, n) {
  return Array.from({ length: n }, (_, k) => (k === i ? 1 : 0));
}
