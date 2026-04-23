#!/usr/bin/env node
// Calibration report for the fertilizer-risk-communication game.
//
// Prints, for each of the 8 real rounds, the risk-neutral optimal dose, the
// expected revenue at that dose, the expected revenue at zero dose, and the
// gap between them. Use this when tuning GAME.YIELD / GAME.PRICE_LEVELS /
// the rain and price schedules — you want:
//   - optimal doses spanning a wide range across rounds (so the experiment
//     has something to pick up)
//   - gaps between zero-dose and optimal-dose revenue that aren't tiny (so
//     participants who get the display format "wrong" actually lose money)
//   - every round's optimum strictly between 1 and MAX_UNITS-1 (otherwise
//     the stepper is decorative)
//
// Run: node scripts/calibration-report.mjs

import { GAME, NUM_ROUNDS } from '../src/lib/constants.js';
import { RAIN_SCHEDULE, PRICE_SCHEDULE } from '../src/lib/schedules.js';
import { computeRevenue, expectedRevenue, optimalDose } from '../src/lib/yieldModel.js';

function expectedPrice(priceProbs) {
  return GAME.PRICE_STATES.reduce((s, st, i) => s + priceProbs[i] * GAME.PRICE_LEVELS[st], 0);
}

function varianceAtDose(dose, rainProbs, priceProbs) {
  const mean = expectedRevenue({ dose, rainProbs, priceProbs });
  let v = 0;
  for (let i = 0; i < GAME.RAIN_STATES.length; i++) {
    for (let j = 0; j < GAME.PRICE_STATES.length; j++) {
      const p = rainProbs[i] * priceProbs[j];
      const r = computeRevenue({ dose, rain: GAME.RAIN_STATES[i], price: GAME.PRICE_STATES[j] }).revenue;
      v += p * (r - mean) ** 2;
    }
  }
  return v;
}

function pad(s, n) { return String(s).padEnd(n); }
function padL(s, n) { return String(s).padStart(n); }
function fmt(x, n = 1) { return x == null ? '  n/a' : Number(x).toFixed(n); }

console.log(`\nfertilizer-risk calibration report — ${new Date().toISOString()}\n`);
console.log(`budget per round = ${GAME.TOKEN_BUDGET_PER_ROUND} tokens, max dose = ${GAME.FERTILIZER.MAX_UNITS} bags, cost = ${GAME.FERTILIZER.COST_PER_UNIT} tok/bag`);
console.log(`yield: base=${GAME.YIELD.BASE} α=${GAME.YIELD.ALPHA} β=${GAME.YIELD.BETA} floor=${GAME.YIELD.FLOOR}`);
console.log(`  shock: ${JSON.stringify(GAME.YIELD.SHOCK)}`);
console.log(`  mult:  ${JSON.stringify(GAME.YIELD.MULT)}`);
console.log(`prices: ${JSON.stringify(GAME.PRICE_LEVELS)}\n`);

console.log(
  pad('rnd', 4) + pad('rain p(g/n/d)', 16) + pad('price p(h/m/l)', 16) +
  padL('E[p]', 6) + padL('d*', 4) + padL('EV@d*', 8) + padL('EV@0', 8) +
  padL('gap', 7) + padL('sd@d*', 8) + padL('sd@0', 8)
);
console.log('-'.repeat(85));

for (let i = 0; i < NUM_ROUNDS; i++) {
  const rain = RAIN_SCHEDULE[i];
  const price = PRICE_SCHEDULE[i];
  const { dose } = optimalDose({ rainProbs: rain, priceProbs: price });
  const evStar = expectedRevenue({ dose, rainProbs: rain, priceProbs: price });
  const ev0 = expectedRevenue({ dose: 0, rainProbs: rain, priceProbs: price });
  const sdStar = Math.sqrt(varianceAtDose(dose, rain, price));
  const sd0 = Math.sqrt(varianceAtDose(0, rain, price));

  console.log(
    pad(i + 1, 4) +
    pad(rain.map((p) => p.toFixed(2)).join('/'), 16) +
    pad(price.map((p) => p.toFixed(2)).join('/'), 16) +
    padL(fmt(expectedPrice(price), 2), 6) +
    padL(dose, 4) +
    padL(fmt(evStar, 2), 8) +
    padL(fmt(ev0, 2), 8) +
    padL(fmt(evStar - ev0, 2), 7) +
    padL(fmt(sdStar, 2), 8) +
    padL(fmt(sd0, 2), 8)
  );
}

// Aggregate
const doses = new Set();
let totalGap = 0, totalMaxRev = 0;
for (let i = 0; i < NUM_ROUNDS; i++) {
  const { dose } = optimalDose({ rainProbs: RAIN_SCHEDULE[i], priceProbs: PRICE_SCHEDULE[i] });
  doses.add(dose);
  const ev = expectedRevenue({ dose, rainProbs: RAIN_SCHEDULE[i], priceProbs: PRICE_SCHEDULE[i] });
  const ev0 = expectedRevenue({ dose: 0, rainProbs: RAIN_SCHEDULE[i], priceProbs: PRICE_SCHEDULE[i] });
  totalGap += ev - ev0;
  totalMaxRev += ev;
}
console.log('');
console.log(`distinct optimal doses across ${NUM_ROUNDS} rounds: ${doses.size} (values: ${[...doses].sort().join(', ')})`);
console.log(`total expected revenue at optimal across all rounds: ${totalMaxRev.toFixed(2)} tokens`);
console.log(`total gap (optimal − zero) across all rounds:        ${totalGap.toFixed(2)} tokens`);
console.log(`  at currency rate 10 NGN/tok → total payout ≈ ${Math.round(totalMaxRev * 10)} NGN`);
console.log(`  at currency rate 50 NGN/tok → total payout ≈ ${Math.round(totalMaxRev * 50)} NGN`);
console.log('');
