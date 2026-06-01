// Recalibration comparison (PENDING PI SIGN-OFF — not wired into the app).
//
// Compares the CURRENT schedules/price levels against a PROPOSED variant that
// (1) widens the price-level spread so price — not just rain — moves the
// optimal dose, and (2) reshapes the rounds whose payoff curve is too flat to
// carry behavioural signal.
//
// Key point: the existing "gap vs dose 0" metric is one-sided and misleads on
// low-dose (drought) rounds — there, fertilising genuinely doesn't pay, so the
// gap vs 0 is ~0 by design, but OVER-applying is penalised. We therefore report
// a two-sided picture:
//   d*        risk-neutral optimal integer dose
//   gap0      EV(d*) - EV(0)      incentive NOT to under-fertilise
//   pen10     EV(d*) - EV(10)     penalty for over-fertilising
//   spread    max EV - min EV over doses 0..10  (total payoff curvature = signal)
//   sd*       payoff std-dev at d* (risk exposure → risk-averse undershoot)
//
// Run: node scripts/recalibration-compare.mjs
import { RAIN_SCHEDULE, PRICE_SCHEDULE } from '../src/lib/schedules.js';

const RAIN_STATES = ['good', 'normal', 'drought'];
const PRICE_STATES = ['high', 'mid', 'low'];
const YIELD = { BASE: 8, ALPHA: 1.58, BETA: 0.05,
  SHOCK: { good: 4, normal: 0, drought: -6 },
  MULT:  { good: 1.4, normal: 1.0, drought: 0.15 }, FLOOR: 0 };
const BUDGET = 25, MAX = 10;

function yieldOf(dose, rain) {
  const r = YIELD.ALPHA * dose - YIELD.BETA * dose * dose;
  return Math.max(YIELD.FLOOR, YIELD.BASE + YIELD.SHOCK[rain] + YIELD.MULT[rain] * r);
}
function revStats(dose, rainP, priceP, priceLevels) {
  const savings = BUDGET - dose;
  let ev = 0, ev2 = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const w = rainP[i] * priceP[j];
    const rev = savings + yieldOf(dose, RAIN_STATES[i]) * priceLevels[PRICE_STATES[j]];
    ev += w * rev; ev2 += w * rev * rev;
  }
  return { ev, sd: Math.sqrt(Math.max(0, ev2 - ev * ev)) };
}
function metrics(rainP, priceP, priceLevels) {
  const evs = [];
  for (let d = 0; d <= MAX; d++) evs.push(revStats(d, rainP, priceP, priceLevels).ev);
  let dStar = 0; for (let d = 1; d <= MAX; d++) if (evs[d] > evs[dStar]) dStar = d;
  const sd = revStats(dStar, rainP, priceP, priceLevels).sd;
  const Emult = rainP[0]*YIELD.MULT.good + rainP[1]*YIELD.MULT.normal + rainP[2]*YIELD.MULT.drought;
  const Eprice = priceP[0]*priceLevels.high + priceP[1]*priceLevels.mid + priceP[2]*priceLevels.low;
  return {
    dStar, Emult, Eprice,
    gap0: evs[dStar] - evs[0],
    pen10: evs[dStar] - evs[MAX],
    spread: Math.max(...evs) - Math.min(...evs),
    sd,
  };
}

// ---- CURRENT (in app today) ----
const CUR_PRICE = { high: 1.6, mid: 1.0, low: 0.6 };

// ---- PROPOSED ----
// Wider price spread (1.9 / 1.0 / 0.45) → E[price] range widens from
// [0.86,1.13] to [0.79,1.30], so price meaningfully shifts d*. A few price rows
// are made more extreme to exercise that. Rain schedule reshaped only on the
// three flattest rounds (old R5/R8/R10) to lift their payoff curvature while
// keeping every value on the 0.05 grid (so the 20-icon array stays exact) and
// keeping drought-prone rounds drought-prone.
const PROP_PRICE = { high: 1.9, mid: 1.0, low: 0.45 };
const PROP_RAIN = [
  [0.70, 0.20, 0.10], // R1 favorable baseline (unchanged)
  [0.50, 0.30, 0.20], // R2 mixed (unchanged)
  [0.30, 0.30, 0.40], // R3 drought-prone (unchanged)
  [0.60, 0.30, 0.10], // R4 favorable (unchanged)
  [0.50, 0.20, 0.30], // R5 was .40/.30/.30 — sharpen good vs drought
  [0.80, 0.15, 0.05], // R6 very favorable (unchanged)
  [0.55, 0.30, 0.15], // R7 moderate (unchanged)
  [0.20, 0.30, 0.50], // R8 was .25/.35/.40 — deeper drought, clearer "save"
  [0.45, 0.35, 0.20], // R9 moderate (unchanged)
  [0.40, 0.15, 0.45], // R10 was .35/.25/.40 — bimodal good-or-drought
];
const PROP_PRICE_SCHED = [
  [0.25, 0.45, 0.30], // R1
  [0.10, 0.35, 0.55], // R2 cheaper — discourage dose
  [0.40, 0.35, 0.25], // R3 price upside in a dry round (tension)
  [0.25, 0.50, 0.25], // R4
  [0.15, 0.35, 0.50], // R5
  [0.45, 0.40, 0.15], // R6 strong price — push dose high
  [0.20, 0.40, 0.40], // R7
  [0.15, 0.45, 0.40], // R8
  [0.35, 0.45, 0.20], // R9
  [0.20, 0.45, 0.35], // R10
];

// CONSERVATIVE: keep the (well-calibrated) current schedules, widen price only
// modestly (1.8 / 1.0 / 0.5) so price nudges d* without corners or a variance blow-up.
const CONS_PRICE = { high: 1.8, mid: 1.0, low: 0.5 };

function table(label, rainSched, priceSched, priceLevels) {
  console.log(`\n=== ${label} ===`);
  console.log('rnd  rain(g/n/d)     price(h/m/l)    Em    Ep    d*  gap0  pen10  spread  sd*  flag');
  console.log('-'.repeat(90));
  const ds = []; let minSpread = Infinity, corners = 0;
  for (let i = 0; i < 10; i++) {
    const m = metrics(rainSched[i], priceSched[i], priceLevels);
    ds.push(m.dStar);
    minSpread = Math.min(minSpread, m.spread);
    const corner = m.dStar === 0 || m.dStar === MAX;
    if (corner) corners++;
    const f = (x, w = 5) => x.toFixed(2).padStart(w);
    console.log(
      `${String(i + 1).padStart(2)}  ` +
      `${rainSched[i].map((x) => x.toFixed(2)).join('/')}  ` +
      `${priceSched[i].map((x) => x.toFixed(2)).join('/')}  ` +
      `${f(m.Emult)} ${f(m.Eprice)}  ${String(m.dStar).padStart(2)}  ${f(m.gap0)} ${f(m.pen10)}  ${f(m.spread, 6)} ${f(m.sd)}  ${corner ? 'CORNER' : ''}`
    );
  }
  const distinct = [...new Set(ds)].sort((a, b) => a - b);
  console.log(`distinct d*: ${distinct.length} (${distinct.join(', ')})  |  min spread: ${minSpread.toFixed(2)}  |  corner optima: ${corners} ${corners ? '<-- FAILS interior-optimum test' : '(all interior OK)'}`);
  return ds;
}

// SNAP10: every probability re-snapped to a 0.10 grid (so a 10-icon array
// renders exactly), price levels UNCHANGED (1.6/1.0/0.6). Aim: reproduce the
// current d* sequence as closely as possible while keeping all rows on 0.10.
const SNAP10_RAIN = [
  [0.70, 0.20, 0.10], // R1
  [0.50, 0.30, 0.20], // R2
  [0.30, 0.30, 0.40], // R3
  [0.60, 0.30, 0.10], // R4
  [0.40, 0.30, 0.30], // R5
  [0.80, 0.10, 0.10], // R6 (was .80/.15/.05)
  [0.60, 0.20, 0.20], // R7 (was .55/.30/.15)
  [0.20, 0.40, 0.40], // R8 (was .25/.35/.40)
  [0.40, 0.40, 0.20], // R9 (was .45/.35/.20)
  [0.40, 0.20, 0.40], // R10 (was .35/.25/.40)
];
const SNAP10_PRICE = [
  [0.20, 0.50, 0.30], // R1
  [0.10, 0.50, 0.40], // R2 (was .15/.40/.45)
  [0.30, 0.40, 0.30], // R3
  [0.30, 0.40, 0.30], // R4 (was .25/.50/.25)
  [0.10, 0.40, 0.50], // R5
  [0.40, 0.40, 0.20], // R6 (was .35/.45/.20)
  [0.20, 0.40, 0.40], // R7
  [0.20, 0.50, 0.30], // R8 (was .15/.50/.35) — Ep 1.00 keeps d*=2 (not 1)
  [0.30, 0.50, 0.20], // R9 (was .30/.45/.25)
  [0.20, 0.40, 0.40], // R10 (was .20/.45/.35)
];

table('CURRENT (in app)', RAIN_SCHEDULE, PRICE_SCHEDULE, CUR_PRICE);
table('SNAP10 (0.10 grid, price unchanged 1.6/1.0/0.6)', SNAP10_RAIN, SNAP10_PRICE, CUR_PRICE);
const gridOk = [...SNAP10_RAIN, ...SNAP10_PRICE].every((r) => r.every((p) => Math.abs(p * 10 - Math.round(p * 10)) < 1e-9));
console.log(`\nSNAP10 all rows on 0.10 grid: ${gridOk}`);
