import { describe, it, expect } from 'vitest';
import { assignArm, drawCategorical, newRoundSeed } from '../src/lib/randomize.js';
import { ARM_IDS, GAME } from '../src/lib/constants.js';

describe('assignArm', () => {
  it('is deterministic per participantId', () => {
    for (const id of ['p1', 'abc-001', 'NG-42', 'very-long-participant-id-007']) {
      const a = assignArm(id);
      const b = assignArm(id);
      expect(a.id).toBe(b.id);
      expect(a.display).toBe(b.display);
      expect(a.training).toBe(b.training);
    }
  });

  it('produces every arm id and no others', () => {
    const seen = new Set();
    for (let i = 0; i < 1000; i++) {
      seen.add(assignArm(`p-${i}`).id);
    }
    for (const arm of ARM_IDS) {
      expect(seen.has(arm)).toBe(true);
    }
    for (const s of seen) {
      expect(ARM_IDS).toContain(s);
    }
  });

  it('is approximately uniform over 6 cells across 60k ids', () => {
    const counts = Object.fromEntries(ARM_IDS.map((a) => [a, 0]));
    const n = 60_000;
    for (let i = 0; i < n; i++) counts[assignArm(`p-${i}`).id]++;
    const expected = n / ARM_IDS.length;
    for (const arm of ARM_IDS) {
      // Allow ±8% deviation per cell. Tight enough to catch broken RNG,
      // loose enough to not flake.
      expect(counts[arm]).toBeGreaterThan(expected * 0.92);
      expect(counts[arm]).toBeLessThan(expected * 1.08);
    }
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
