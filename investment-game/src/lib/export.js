import { db } from './db.js';
import { NUM_ROUNDS } from './constants.js';

// ---- helpers ------------------------------------------------------------

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    screenWidth: window.screen?.width,
    screenHeight: window.screen?.height,
    devicePixelRatio: window.devicePixelRatio,
    language: navigator.language,
    serviceWorkerActive: !!navigator.serviceWorker?.controller,
  };
}

function csvEscape(v) {
  if (v == null) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows, columns) {
  const header = columns.join(',');
  const body = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(',')).join('\n');
  return header + '\n' + body;
}

// ---- JSON (full raw) ----------------------------------------------------

export async function exportAllJson() {
  const [sessions, events, participants] = await Promise.all([
    db.sessions.toArray(),
    db.events.toArray(),
    db.participants.toArray(),
  ]);
  const exportData = {
    exportedAt: new Date().toISOString(),
    deviceInfo: getDeviceInfo(),
    sessionCount: sessions.length,
    eventCount: events.length,
    participants,
    sessions,
    events,
  };
  downloadBlob(
    new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }),
    `investment-game-export-${Date.now()}.json`
  );
  return { sessions: sessions.length, events: events.length };
}

// ---- Sessions CSV (wide, one row per session) ---------------------------

const SESSION_COLS = [
  'session_id', 'participant_id', 'enumerator_id', 'country', 'partner',
  'treatment_group', 'language', 'currency_rate',
  'session_start_time', 'session_end_time', 'session_duration_minutes',
  'training_completed', 'training_correct_on_first_try', 'training_attempts_json',
  'practice_dose', 'practice_rain', 'practice_price', 'practice_yield', 'practice_revenue',
  ...Array.from({ length: NUM_ROUNDS }, (_, i) => {
    const n = i + 1;
    return [
      `r${n}_dose`, `r${n}_fertilizer_used`, `r${n}_rain`, `r${n}_price`,
      `r${n}_yield`, `r${n}_price_level`, `r${n}_savings`, `r${n}_revenue`,
      `r${n}_decision_duration_ms`, `r${n}_rain_seed`, `r${n}_price_seed`,
    ];
  }).flat(),
  'total_revenue_tokens', 'total_payout_currency',
  'survey_gender', 'survey_age_range', 'survey_education', 'survey_household_size',
  'survey_main_crop', 'survey_uses_fertilizer',
  'sync_status',
];

function flattenSession(s) {
  const pr = s.practiceRound || {};
  const sv = s.survey || {};
  const tr = s.training || {};
  const duration = s.sessionStartTime && s.sessionEndTime
    ? (new Date(s.sessionEndTime) - new Date(s.sessionStartTime)) / 60000
    : null;

  const row = {
    session_id: s.sessionId,
    participant_id: s.participantId,
    enumerator_id: s.enumeratorId,
    country: s.country,
    partner: s.partner,
    treatment_group: s.treatmentGroup,
    language: s.language,
    currency_rate: s.currencyRate,

    session_start_time: s.sessionStartTime,
    session_end_time: s.sessionEndTime,
    session_duration_minutes: duration,

    training_completed: tr.completed ?? false,
    training_correct_on_first_try: tr.correctOnFirstTry ?? null,
    training_attempts_json: tr.attempts ?? null,

    practice_dose: pr.dose,
    practice_rain: pr.rainOutcome,
    practice_price: pr.priceOutcome,
    practice_yield: pr.yield,
    practice_revenue: pr.revenue,

    total_revenue_tokens: s.totalRevenueTokens,
    total_payout_currency: s.totalPayoutCurrency,

    survey_gender: sv.gender,
    survey_age_range: sv.ageRange,
    survey_education: sv.educationLevel,
    survey_household_size: sv.householdSize,
    survey_main_crop: sv.mainCrop,
    survey_uses_fertilizer: sv.usesFertilizer,

    sync_status: s.syncStatus,
  };

  const rounds = s.rounds || [];
  for (let i = 0; i < NUM_ROUNDS; i++) {
    const r = rounds[i] || {};
    const n = i + 1;
    row[`r${n}_dose`] = r.dose;
    row[`r${n}_fertilizer_used`] = r.fertilizerUsed;
    row[`r${n}_rain`] = r.rainOutcome;
    row[`r${n}_price`] = r.priceOutcome;
    row[`r${n}_yield`] = r.yield;
    row[`r${n}_price_level`] = r.priceLevel;
    row[`r${n}_savings`] = r.savings;
    row[`r${n}_revenue`] = r.revenue;
    row[`r${n}_decision_duration_ms`] = r.decisionDurationMs;
    row[`r${n}_rain_seed`] = r.rainSeed;
    row[`r${n}_price_seed`] = r.priceSeed;
  }
  return row;
}

export async function exportSessionsCsv() {
  const sessions = await db.sessions.toArray();
  const rows = sessions.map(flattenSession);
  const csv = toCsv(rows, SESSION_COLS);
  downloadBlob(new Blob([csv], { type: 'text/csv' }), `sessions-${Date.now()}.csv`);
  return rows.length;
}

// ---- Rounds CSV (long, one row per round) -------------------------------
// This is the primary analytic dataset: one observation per participant-round.

const ROUND_COLS = [
  'session_id', 'participant_id',
  'round_index', 'is_practice',
  'dose', 'fertilizer_used', 'savings',
  'rain_outcome', 'rain_seed', 'rain_draw',
  'price_outcome', 'price_seed', 'price_draw',
  'yield', 'baseline_yield', 'gain', 'cost', 'return_value', 'net', 'price_level', 'revenue',
  'decision_start_time', 'decision_end_time', 'decision_duration_ms',
  'dose_trajectory_json',
];

function flattenRound(s, r, idx, isPractice) {
  return {
    session_id: s.sessionId,
    participant_id: s.participantId,
    round_index: isPractice ? 'practice' : idx,
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
    baseline_yield: r.baselineYield,
    gain: r.gain,
    cost: r.cost,
    return_value: r.returnValue,
    net: r.net,
    price_level: r.priceLevel,
    revenue: r.revenue,
    decision_start_time: r.decisionStartTime,
    decision_end_time: r.decisionEndTime,
    decision_duration_ms: r.decisionDurationMs,
    dose_trajectory_json: r.doseTrajectory,
  };
}

export async function exportRoundsCsv() {
  const sessions = await db.sessions.toArray();
  const rows = [];
  for (const s of sessions) {
    if (s.practiceRound && s.practiceRound.dose != null) {
      rows.push(flattenRound(s, s.practiceRound, 'practice', true));
    }
    const rounds = s.rounds || [];
    rounds.forEach((r, i) => {
      if (r && r.dose != null) rows.push(flattenRound(s, r, i, false));
    });
  }
  const csv = toCsv(rows, ROUND_COLS);
  downloadBlob(new Blob([csv], { type: 'text/csv' }), `rounds-${Date.now()}.csv`);
  return rows.length;
}

// ---- Events CSV (unchanged) ---------------------------------------------

const EVENT_COLS = [
  'session_id', 'timestamp', 'performance_now', 'screen_name', 'event_type', 'payload_json',
];

export async function exportEventsCsv() {
  const events = await db.events.toArray();
  const rows = events.map((e) => ({
    session_id: e.sessionId,
    timestamp: e.timestamp,
    performance_now: e.performanceNow,
    screen_name: e.screenName,
    event_type: e.eventType,
    payload_json: e.payload,
  }));
  const csv = toCsv(rows, EVENT_COLS);
  downloadBlob(new Blob([csv], { type: 'text/csv' }), `events-${Date.now()}.csv`);
  return rows.length;
}

// ---- Dose trajectory CSV (long, one row per stepper change) -------------

const TRAJ_COLS = [
  'session_id', 'participant_id', 'round_index', 'is_practice',
  'step_t_perf_now', 'dose_value',
];

export async function exportDoseTrajectoryCsv() {
  const sessions = await db.sessions.toArray();
  const rows = [];
  const push = (s, r, idx, isPractice) => {
    if (!r?.doseTrajectory) return;
    for (const entry of r.doseTrajectory) {
      rows.push({
        session_id: s.sessionId,
        participant_id: s.participantId,
        round_index: isPractice ? 'practice' : idx,
        is_practice: isPractice,
        step_t_perf_now: entry.t,
        dose_value: entry.value,
      });
    }
  };
  for (const s of sessions) {
    push(s, s.practiceRound, 'practice', true);
    (s.rounds || []).forEach((r, i) => push(s, r, i, false));
  }
  const csv = toCsv(rows, TRAJ_COLS);
  downloadBlob(new Blob([csv], { type: 'text/csv' }), `dose-trajectory-${Date.now()}.csv`);
  return rows.length;
}

// ---- Participants import (unchanged) ------------------------------------

export async function importParticipantsCsv(text) {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(',').map((h) => h.trim());
  const req = ['participantId'];
  for (const k of req) {
    if (!headers.includes(k)) throw new Error(`Missing required column: ${k}`);
  }
  const rows = lines.map((line) => {
    const cells = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (cells[i] ?? '').trim(); });
    return obj;
  });
  await db.participants.bulkPut(rows);
  return rows.length;
}
