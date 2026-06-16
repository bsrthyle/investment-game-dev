// Export the full per-round analytic table to CSV: one row per participant-round
// (practice + 10 incentivized). Reads DATABASE_URL from .env; never prints it.
// Run: node scripts/export-rounds.mjs   →   exports/rounds-<UTCdate>.csv
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter(Boolean).filter((l) => !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);
const sql = neon(env.DATABASE_URL);

// Pull session-level identity + the full payload; unnest rounds in JS so we can
// also emit the separate practiceRound object with the same columns.
const rows = await sql`
  SELECT session_id, participant_id, enumerator_id, treatment_group,
         language, currency_rate, app_version, received_at, payload
  FROM sessions ORDER BY received_at`;

const COLS = [
  'session_id', 'participant_id', 'enumerator_id', 'treatment_group',
  'language', 'currency_rate', 'app_version',
  'round_index', 'is_practice',
  'dose', 'fertilizer_used', 'savings',
  'rain_outcome', 'rain_seed', 'rain_draw',
  'price_outcome', 'price_seed', 'price_draw',
  'yield', 'price_level', 'revenue',
  'decision_start_time', 'decision_end_time', 'decision_duration_ms',
  'dose_trajectory_json',
];

function roundToRow(s, r, roundIndex, isPractice) {
  return {
    session_id: s.session_id,
    participant_id: s.participant_id,
    enumerator_id: s.enumerator_id,
    treatment_group: s.treatment_group,
    language: s.language,
    currency_rate: s.currency_rate,
    app_version: s.app_version,
    round_index: roundIndex,
    is_practice: isPractice,
    dose: r.dose,
    fertilizer_used: r.fertilizerUsed,
    savings: r.savings,
    rain_outcome: r.rainOutcome,
    rain_seed: r.rainSeed,
    rain_draw: r.rainDraw,
    price_outcome: r.priceOutcome,
    price_seed: r.priceSeed,
    price_draw: r.priceDraw,
    yield: r.yield,
    price_level: r.priceLevel,
    revenue: r.revenue,
    decision_start_time: r.decisionStartTime,
    decision_end_time: r.decisionEndTime,
    decision_duration_ms: r.decisionDurationMs,
    dose_trajectory_json: r.doseTrajectory ? JSON.stringify(r.doseTrajectory) : null,
  };
}

const out = [];
for (const s of rows) {
  const p = s.payload || {};
  if (p.practiceRound && p.practiceRound.dose != null) {
    out.push(roundToRow(s, p.practiceRound, 'practice', true));
  }
  (p.rounds || []).forEach((r, i) => {
    if (r && r.dose != null) out.push(roundToRow(s, r, i, false));
  });
}

function csvEscape(v) {
  if (v == null) return '';
  const str = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}
const csv = COLS.join(',') + '\n'
  + out.map((row) => COLS.map((c) => csvEscape(row[c])).join(',')).join('\n');

// UTC date stamp passed in (Date.now is fine here — plain Node, not a workflow).
const stamp = new Date().toISOString().slice(0, 10);
mkdirSync(new URL('../exports/', import.meta.url), { recursive: true });
const path = new URL(`../exports/rounds-${stamp}.csv`, import.meta.url);
writeFileSync(path, csv);

console.log(`Wrote ${out.length} round rows from ${rows.length} sessions`);
console.log(`→ ${path.pathname}`);
