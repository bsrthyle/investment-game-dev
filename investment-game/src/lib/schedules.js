import { GAME, NUM_ROUNDS } from './constants.js';

// Scheduled (known, announced) probability distributions for each of the 10
// real rounds. Distributions shift between rounds so participants must
// re-read the briefing rather than rely on a memorised answer. Rainfall and
// price draws are independent.
//
// Each row aligns with GAME.RAIN_STATES / GAME.PRICE_STATES respectively and
// must sum to 1 (asserted at module load).
//
// EVERY probability is a multiple of 0.10. This is a hard invariant: the
// briefing renders the distribution as a 10-icon array (each icon = 0.10), so
// any 0.05-step value would be ROUNDED for display and the participant would
// see a distribution different from the one actually sampled. The 0.10 grid is
// guarded by tests/iconArray.test.js ("renders every scheduled row exactly").
// Calibration (8 distinct interior optimal doses, d* sequence
// 7,5,4,8,3,9,6,2,7,3) is verified by scripts/recalibration-compare.mjs and
// tests/calibration.test.js. PENDING PI SIGN-OFF.

// P(good, normal, drought)
export const RAIN_SCHEDULE = [
  [0.70, 0.20, 0.10],  // Round 1 — favorable baseline
  [0.50, 0.30, 0.20],  // Round 2 — mixed
  [0.30, 0.30, 0.40],  // Round 3 — drought-prone
  [0.60, 0.30, 0.10],  // Round 4 — favorable
  [0.40, 0.30, 0.30],  // Round 5 — risky
  [0.80, 0.10, 0.10],  // Round 6 — very favorable
  [0.60, 0.20, 0.20],  // Round 7 — moderate
  [0.20, 0.40, 0.40],  // Round 8 — drought-prone
  [0.40, 0.40, 0.20],  // Round 9 — moderate
  [0.40, 0.20, 0.40],  // Round 10 — drought-prone (different split from R3/R8)
];

// P(high, mid, low). Independent of rain by design.
export const PRICE_SCHEDULE = [
  [0.20, 0.50, 0.30],  // Round 1
  [0.10, 0.50, 0.40],  // Round 2
  [0.30, 0.40, 0.30],  // Round 3
  [0.30, 0.40, 0.30],  // Round 4
  [0.10, 0.40, 0.50],  // Round 5
  [0.40, 0.40, 0.20],  // Round 6
  [0.20, 0.40, 0.40],  // Round 7
  [0.20, 0.50, 0.30],  // Round 8
  [0.30, 0.50, 0.20],  // Round 9
  [0.20, 0.40, 0.40],  // Round 10
];

// Practice round uses its own (not counted toward payout). Also on the 0.10 grid.
export const PRACTICE_RAIN = [0.70, 0.20, 0.10];
export const PRACTICE_PRICE = [0.20, 0.50, 0.30];

export function rainProbsFor(roundIndex) {
  return RAIN_SCHEDULE[roundIndex];
}
export function priceProbsFor(roundIndex) {
  return PRICE_SCHEDULE[roundIndex];
}

function assertValid() {
  const eps = 1e-9;
  if (RAIN_SCHEDULE.length !== NUM_ROUNDS) {
    throw new Error(`RAIN_SCHEDULE length ${RAIN_SCHEDULE.length} !== NUM_ROUNDS ${NUM_ROUNDS}`);
  }
  if (PRICE_SCHEDULE.length !== NUM_ROUNDS) {
    throw new Error(`PRICE_SCHEDULE length ${PRICE_SCHEDULE.length} !== NUM_ROUNDS ${NUM_ROUNDS}`);
  }
  const check = (row, states, label, i) => {
    if (row.length !== states.length) {
      throw new Error(`${label}[${i}] length ${row.length} !== ${states.length}`);
    }
    const s = row.reduce((a, b) => a + b, 0);
    if (Math.abs(s - 1) > eps) {
      throw new Error(`${label}[${i}] sums to ${s}, expected 1`);
    }
  };
  RAIN_SCHEDULE.forEach((r, i) => check(r, GAME.RAIN_STATES, 'RAIN_SCHEDULE', i));
  PRICE_SCHEDULE.forEach((r, i) => check(r, GAME.PRICE_STATES, 'PRICE_SCHEDULE', i));
  check(PRACTICE_RAIN, GAME.RAIN_STATES, 'PRACTICE_RAIN', 0);
  check(PRACTICE_PRICE, GAME.PRICE_STATES, 'PRACTICE_PRICE', 0);
}
assertValid();
