import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { distribute10 } from '../src/components/IconArray.jsx';
import { RAIN_SCHEDULE, PRICE_SCHEDULE } from '../src/lib/schedules.js';

describe('distribute10', () => {
  it('always sums to exactly 10 over every scheduled rain + price row', () => {
    for (const row of [...RAIN_SCHEDULE, ...PRICE_SCHEDULE]) {
      const counts = distribute10(row);
      expect(counts.reduce((a, b) => a + b, 0)).toBe(10);
      expect(counts.every((c) => Number.isInteger(c) && c >= 0)).toBe(true);
    }
  });

  it('sums to 10 for every probability vector (property test)', () => {
    // Arbitrary 3-state probability vectors.
    const probVec = fc.tuple(fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }))
      .filter(([a, b, c]) => a + b + c > 0)
      .map(([a, b, c]) => {
        const s = a + b + c;
        return [a / s, b / s, c / s];
      });
    fc.assert(fc.property(probVec, (probs) => {
      const counts = distribute10(probs);
      return counts.reduce((a, b) => a + b, 0) === 10 && counts.every((c) => c >= 0 && Number.isInteger(c));
    }), { numRuns: 500 });
  });
});
