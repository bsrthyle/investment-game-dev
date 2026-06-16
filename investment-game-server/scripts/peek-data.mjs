// Read-only data peek. Loads DATABASE_URL from .env, prints a summary of what's
// stored. Does NOT print the connection string. Run: node scripts/peek-data.mjs
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter(Boolean).filter((l) => !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);
const sql = neon(env.DATABASE_URL);

const counts = await sql`SELECT
  (SELECT count(*) FROM sessions)      AS sessions,
  (SELECT count(*) FROM audio_chunks)  AS audio_chunks`;
console.log('=== TABLE COUNTS ===');
console.table(counts);

if (Number(counts[0].sessions) === 0) {
  console.log('\nNo sessions stored yet — the database is empty.');
  process.exit(0);
}

const sessions = await sql`
  SELECT session_id, participant_id, enumerator_id, country, treatment_group,
         language, app_version, session_start_time, session_end_time, received_at
  FROM sessions ORDER BY received_at DESC LIMIT 500`;
console.log('\n=== SESSIONS (newest first) ===');
console.table(sessions.map((r) => ({
  participant: r.participant_id,
  enum: r.enumerator_id,
  treat: r.treatment_group,
  lang: r.language,
  ver: r.app_version,
  start: r.session_start_time && new Date(r.session_start_time).toISOString().slice(0, 16),
  end: r.session_end_time ? new Date(r.session_end_time).toISOString().slice(0, 16) : '(incomplete)',
  received: r.received_at && new Date(r.received_at).toISOString().slice(0, 16),
})));

const byTreat = await sql`
  SELECT coalesce(treatment_group, '(none)') AS treatment_group, count(*) AS n
  FROM sessions GROUP BY 1 ORDER BY 2 DESC`;
console.log('\n=== SESSIONS BY TREATMENT GROUP ===');
console.table(byTreat);

const rounds = await sql`
  SELECT count(*) AS round_rows,
         count(*) FILTER (WHERE (r->>'isPractice')::bool IS TRUE) AS practice_rows,
         count(DISTINCT s.participant_id) AS participants
  FROM sessions s, jsonb_array_elements(s.payload->'rounds') r`;
console.log('\n=== ROUND-LEVEL DATA (incentivized rounds in payload) ===');
console.table(rounds);
