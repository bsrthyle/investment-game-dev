import seedrandom from 'seedrandom';
import { DISPLAY_FORMATS, TRAINING_CONDITIONS, armId } from './constants.js';

// Deterministic arm assignment from participantId: one of 6 cells
// (3 display formats × 2 training conditions), uniform over cells.
export function assignArm(participantId) {
  const rng = seedrandom(`arm-${participantId}`);
  const display = DISPLAY_FORMATS[Math.floor(rng() * DISPLAY_FORMATS.length)];
  const training = TRAINING_CONDITIONS[Math.floor(rng() * TRAINING_CONDITIONS.length)];
  return { display, training, id: armId(display, training) };
}

export function newRoundSeed(participantId, roundIndex, kind) {
  return `${participantId}-r${roundIndex}-${kind}`;
}

// Generic categorical draw from a probability vector.
// probs must sum to ~1 and align with `states`. Returns { outcome, rawDraw, seed }.
export function drawCategorical(seed, states, probs) {
  const rng = seedrandom(seed);
  const u = rng();
  let cum = 0;
  for (let i = 0; i < states.length; i++) {
    cum += probs[i];
    if (u < cum) return { outcome: states[i], rawDraw: u, seed };
  }
  return { outcome: states[states.length - 1], rawDraw: u, seed };
}
