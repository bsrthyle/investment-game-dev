import { describe, it, expect } from 'vitest';
import { drawCategorical, newRoundSeed } from '../src/lib/randomize.js';
import { GAME } from '../src/lib/constants.js';

// v2: assignArm() was removed (no in-game arm). The remaining randomization
// invariant is the per-round seed → outcome pipeline, covered below.

describe('newRoundSeed', () => {
  it('is stable and unique per (participant, round, kind)', () => {
    expect(newRoundSeed('P001', 3, 'rain')).toBe('P001-r3-rain');
    expect(newRoundSeed('P001', 3, 'rain')).toBe(newRoundSeed('P001', 3, 'rain'));
    expect(newRoundSeed('P001', 3, 'rain')).not.toBe(newRoundSeed('P001', 3, 'price'));
    expect(newRoundSeed('P001', 3, 'rain')).not.toBe(newRoundSeed('P001', 4, 'rain'));
    expect(newRoundSeed('P001', 'practice', 'rain')).toBe('P001-rpractice-rain');
  });
});

describe('drawCategorical', () => {
  it('returns the same outcome when called twice with the same seed', () => {
    const seed = newRoundSeed('P001', 3, 'rain');
    const a = drawCategorical(seed, GAME.RAIN_STATES, [0.5, 0.3, 0.2]);
    const b = drawCategorical(seed, GAME.RAIN_STATES, [0.5, 0.3, 0.2]);
    expect(a.outcome).toBe(b.outcome);
    expect(a.rawDraw).toBe(b.rawDraw);
  });

  it('reproduces the supplied probability vector (±1.5%) across 20k draws', () => {
    const probs = [0.5, 0.3, 0.2];
    const states = GAME.RAIN_STATES;
    const counts = Object.fromEntries(states.map((s) => [s, 0]));
    const n = 20_000;
    for (let i = 0; i < n; i++) {
      const { outcome } = drawCategorical(`seed-${i}`, states, probs);
      counts[outcome]++;
    }
    states.forEach((s, i) => {
      const ratio = counts[s] / n;
      expect(ratio).toBeGreaterThan(probs[i] - 0.015);
      expect(ratio).toBeLessThan(probs[i] + 0.015);
    });
  });
});
