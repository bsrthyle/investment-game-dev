// Model "Option A — investment / cost-recovery framing" (PENDING PI SIGN-OFF).
//
// Fertilizer is an INVESTMENT, not free upside:
//   cost   = dose                      (tokens spent on fertilizer)
//   gain   = MULT[rain] * response(dose)   (extra yield it produces)
//   return = gain * price              (value of that extra yield)
//   net    = return - cost             (profit if >0, LOSS if <0)
//   payout = endowment - cost + return = 25 + net
//
// In drought, MULT[drought]=0 -> gain 0 -> return 0 -> you lose the WHOLE
// fertilizer cost. With low price, even normal/good weather may not cover cost.
// So a bad outcome genuinely costs the participant (down to 25 - dose).
//
// Mathematically payout = 25 - dose + return is the same shape as the current
// game; the change is (a) MULT[drought] 0.15 -> 0 so drought is a real write-off,
// and (b) we report it as cost/return/net so losses are visible and counted.
//
// Run: node scripts/model-cost-recovery.mjs
import { RAIN_SCHEDULE, PRICE_SCHEDULE } from '../src/lib/schedules.js';

const RAIN = ['good', 'normal', 'drought'];
const PRICE = ['high', 'mid', 'low'];
const PRICE_LEVELS = { high: 1.6, mid: 1.0, low: 0.6 };
const ALPHA = 1.58, BETA = 0.05, BUDGET = 25, MAXD = 10;

// VARIANT: fertilizer does nothing in drought (gain = 0). good/normal unchanged.
const MULT = { good: 1.4, normal: 1.0, drought: 0.0 };

const response = (d) => ALPHA * d - BETA * d * d;
const gain = (d, rain) => MULT[rain] * response(d);
const ret = (d, rain, price) => gain(d, rain) * PRICE_LEVELS[price];
const net = (d, rain, price) => ret(d, rain, price) - d;          // profit/loss on fertilizer
const payout = (d, rain, price) => BUDGET - d + ret(d, rain, price);

function eNet(d, rp, pp) {
  let e = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) e += rp[i] * pp[j] * net(d, RAIN[i], PRICE[j]);
  return e;
}
function optimalDose(rp, pp) {
  let best = 0, bestE = -1e9;
  for (let d = 0; d <= MAXD; d++) { const e = eNet(d, rp, pp); if (e > bestE) { bestE = e; best = d; } }
  return best;
}
function lossStats(d, rp, pp) {
  let pLoss = 0, worst = 1e9, worstCase = '';
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const n = net(d, RAIN[i], PRICE[j]);
    if (n < -1e-9) pLoss += rp[i] * pp[j];
    if (n < worst) { worst = n; worstCase = `${RAIN[i]}/${PRICE[j]}`; }
  }
  return { pLoss, worst, worstCase };
}

console.log('payoff: payout = 25 - dose + gain*price ; gain = MULT[rain]*response(dose) ; MULT.drought = 0');
console.log('');
console.log('rnd  drought%  d*   E[net@d*]  P(loss@d*)  worst net (case)        payout@worst');
console.log('-'.repeat(86));
let totalEnet = 0;
for (let i = 0; i < 10; i++) {
  const rp = RAIN_SCHEDULE[i], pp = PRICE_SCHEDULE[i];
  const d = optimalDose(rp, pp);
  const en = eNet(d, rp, pp);
  totalEnet += en;
  const { pLoss, worst, worstCase } = lossStats(d, rp, pp);
  const payAtWorst = BUDGET - d + Math.max(0, worst + d); // = 25 - d + return_at_worst
  const f = (x, w = 6) => x.toFixed(2).padStart(w);
  console.log(
    `${String(i + 1).padStart(2)}   ${(rp[2] * 100).toFixed(0).padStart(5)}%   ${String(d).padStart(2)}   ${f(en)}     ${(pLoss * 100).toFixed(0).padStart(4)}%     ${f(worst)}  ${worstCase.padEnd(14)} ${f(payAtWorst)}`
  );
}
console.log('-'.repeat(86));

// Concrete illustrations the participant would actually see.
console.log('\nWorked examples (what the player sees), at a moderate dose of 5 bags:');
for (const [rain, price] of [['good', 'high'], ['normal', 'mid'], ['drought', 'low'], ['drought', 'high'], ['normal', 'low']]) {
  const d = 5;
  console.log(
    `  ${rain}/${price}: invested ${d}, fertilizer returned ${ret(d, rain, price).toFixed(1)} ` +
    `-> net ${net(d, rain, price) >= 0 ? '+' : ''}${net(d, rain, price).toFixed(1)} ; take-home ${payout(d, rain, price).toFixed(1)}`
  );
}

// Worst possible across everything.
let mn = 1e9, mc = '';
for (let d = 0; d <= MAXD; d++) for (const r of RAIN) for (const p of PRICE) { const v = payout(d, r, p); if (v < mn) { mn = v; mc = `dose ${d}, ${r}/${p}`; } }
console.log(`\nWorst possible take-home: ${mn.toFixed(2)} tokens (${mc})  [vs no-fertilize = 25 guaranteed]`);
console.log(`Total expected net profit at optimal play across 10 rounds: ${totalEnet.toFixed(2)} tokens`);
