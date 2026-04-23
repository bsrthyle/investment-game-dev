import { GAME } from './constants.js';

// Yield from applying `dose` units of fertilizer under rain state `rain`.
// Concave in dose; rain enters as an additive shock AND as a multiplier on
// the fertilizer response, so drought reduces both the baseline harvest and
// the marginal return to fertilizer.
export function computeYield(dose, rain) {
  const { BASE, ALPHA, BETA, SHOCK, MULT, FLOOR } = GAME.YIELD;
  const shock = SHOCK[rain] ?? 0;
  const mult = MULT[rain] ?? 1;
  const response = ALPHA * dose - BETA * dose * dose;
  const y = BASE + shock + mult * response;
  return Math.max(FLOOR, y);
}

// Revenue in tokens. Each round starts with a fixed endowment; what the
// participant doesn't spend on fertilizer is "saved" and added to the
// harvest value. This guarantees a non-negative payout floor (participants
// can't end the round paying back into the game) and matches the familiar
// "lockbox" framing from the original experiment.
//
//   savings = BUDGET − dose × unit cost
//   revenue = savings + yield × price level
export function computeRevenue({ dose, rain, price }) {
  const savings = GAME.TOKEN_BUDGET_PER_ROUND - dose * GAME.FERTILIZER.COST_PER_UNIT;
  const y = computeYield(dose, rain);
  const level = GAME.PRICE_LEVELS[price] ?? 1;
  return { savings, yield: y, priceLevel: level, revenue: savings + y * level };
}

// Expected revenue given probability vectors over rain and price states.
// Useful for the Round summary, sanity-checking calibration, and unit tests.
export function expectedRevenue({ dose, rainProbs, priceProbs }) {
  const rainStates = GAME.RAIN_STATES;
  const priceStates = GAME.PRICE_STATES;
  let ev = 0;
  for (let i = 0; i < rainStates.length; i++) {
    for (let j = 0; j < priceStates.length; j++) {
      ev += rainProbs[i] * priceProbs[j] * computeRevenue({
        dose,
        rain: rainStates[i],
        price: priceStates[j],
      }).revenue;
    }
  }
  return ev;
}

// Argmax over integer doses 0..MAX_UNITS of expected revenue. Used by tests
// and calibration scripts; not called at runtime.
export function optimalDose({ rainProbs, priceProbs }) {
  let best = { dose: 0, ev: -Infinity };
  for (let d = 0; d <= GAME.FERTILIZER.MAX_UNITS; d++) {
    const ev = expectedRevenue({ dose: d, rainProbs, priceProbs });
    if (ev > best.ev) best = { dose: d, ev };
  }
  return best;
}
