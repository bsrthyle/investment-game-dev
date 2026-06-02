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

// Revenue in tokens. v2 payoff: the participant earns the tokens they DIDN'T
// spend on fertilizer, plus the value of the EXTRA harvest the fertilizer
// produced — i.e. the gain over planting with no fertilizer. The free baseline
// harvest (what you'd reap at dose 0) is netted out, so the payoff reflects the
// fertilizer decision itself rather than a large fixed harvest that dilutes it.
//
//   savings = BUDGET − dose × unit cost
//   gain    = yield(dose, rain) − yield(0, rain)   (= MULT[rain] · response(dose))
//   revenue = savings + gain × price level
//
// Because `gain` subtracts a baseline that is constant in dose, the optimal
// dose, the d* spread, and the optimal-vs-zero gap are all IDENTICAL to a
// baseline-inclusive payoff — only the level changes. `gain` is always ≥ 0
// (response is non-negative over 0..MAX), so revenue ≥ savings ≥ BUDGET − MAX,
// and dose 0 is a guaranteed payout — all rain/price risk sits in fertilizing.
export function computeRevenue({ dose, rain, price }) {
  const cost = dose * GAME.FERTILIZER.COST_PER_UNIT;          // tokens invested in fertilizer
  const savings = GAME.TOKEN_BUDGET_PER_ROUND - cost;
  const y = computeYield(dose, rain);
  const baselineYield = computeYield(0, rain);
  const gain = y - baselineYield;                             // extra yield the fertilizer produced
  const level = GAME.PRICE_LEVELS[price] ?? 1;
  const returnValue = gain * level;                           // value of that extra harvest
  const net = returnValue - cost;                            // profit (>0) or LOSS (<0) on the investment
  // revenue = savings + returnValue = endowment + net. In a drought the gain
  // is 0, so returnValue is 0 and net = -cost: the fertilizer money is lost.
  return { cost, savings, yield: y, baselineYield, gain, priceLevel: level, returnValue, net, revenue: savings + returnValue };
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
