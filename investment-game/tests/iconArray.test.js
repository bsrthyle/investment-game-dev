import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { distribute10, distributeN } from '../src/components/IconArray.jsx';
import { RAIN_SCHEDULE, PRICE_SCHEDULE } from '../src/lib/schedules.js';
import { GAME } from '../src/lib/constants.js';

describe('icon array exactness at the configured SIZE', () => {
  // The whole point of the icon array is that what the participant SEES is the
  // distribution we actually SAMPLE. At GAME.ICON_ARRAY.SIZE the displayed
  // counts must equal probs*SIZE with no rounding for every scheduled row —
  // otherwise the briefing shows a different distribution than the draw uses.
  it('renders every scheduled row exactly (counts === probs*SIZE)', () => {
    const { SIZE } = GAME.ICON_ARRAY;
    for (const row of [...RAIN_SCHEDULE, ...PRICE_SCHEDULE]) {
      const counts = distributeN(row, SIZE);
      row.forEach((p, i) => {
        expect(counts[i]).toBe(Math.round(p * SIZE));
        // exact: no information lost to rounding
        expect(Math.abs(counts[i] / SIZE - p)).toBeLessThan(1e-9);
      });
      expect(counts.reduce((a, b) => a + b, 0)).toBe(SIZE);
    }
  });
});

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
