import seedrandom from 'seedrandom';

// v2: assignArm() has been removed — the game no longer randomizes a
// display/training arm. Whether a farmer plays the game at all is the
// treatment, and that is assigned outside the app. Per-round rain/price draws
// are still seeded deterministically from participantId so every outcome stays
// independently reproducible.

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
