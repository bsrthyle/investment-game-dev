# CLAUDE.md — Investment Game sync backend

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The PWA's own `../investment-game/CLAUDE.md` and the repo-root `../CLAUDE.md` cover the experiment design and the tablet app. This file is **only** about the sync backend. Read `README.md` in this folder for one-time setup, deployment, and cost details.

## What this service is

A single **Cloudflare Worker** (Hono router) backed by **Neon Postgres** (serverless, accessed over HTTP via `@neondatabase/serverless`). It receives completed game sessions and audio chunks uploaded from tablets via the PWA Admin panel, and exposes admin-only read endpoints. It scales to zero when idle. There is no UI here — the only client is the PWA.

It is an independent npm workspace: `npm install` and all commands run **inside this directory**, not from the repo root (though the root `Makefile` wraps the common ones as `make server-*`).

## Commands

```bash
npm run dev        # wrangler dev on :8787 (reads secrets from .dev.vars)
npm run deploy     # wrangler deploy to Cloudflare
npm run migrate    # node-pg-migrate up — run from a laptop, needs .env with DATABASE_URL
npm run migrate:down
npm run tail       # stream live production Worker logs
npm test           # node --test test/  (the test/ dir is currently empty)
```

Migrations **cannot** run inside the Worker (no long-running process) — always run `npm run migrate` from a machine with the Neon connection string in `.env`.

## Architecture & invariants

**Source layout** (`src/`):
- `index.js` — Hono app: CORS, routes, error handlers. The entire HTTP surface lives here.
- `schemas.js` — Zod schemas (`SessionSchema`, `AudioChunkSchema`) that validate every upload.
- `auth.js` — Bearer-token middleware (`requireEnumerator`, `requireAdmin`).
- `db.js` — `getDb(env)` returns a Neon tagged-template SQL client, opened per-request.

**Request flow:** tablet → `POST /api/sessions` (Bearer) → Zod validate → idempotency check → INSERT → `{ status, receipt_id }`.

**Invariants — don't break without thinking through the field/data consequences:**

- **Idempotent on `sessionId`.** `POST /api/sessions` checks for an existing row and returns **409 `duplicate`** (with `existing_receipt_id`) rather than inserting twice. The PWA relies on this to retry safely and to know data is already saved. `audio_chunks` is idempotent via `ON CONFLICT (session_id, chunk_index) DO NOTHING`. Never weaken this — tablets re-POST on flaky connections.
- **Store the full payload as JSONB.** Every session is persisted verbatim in `sessions.payload`. The lifted columns (`participant_id`, `country`, `treatment_group`, `arm_*`, times) are *denormalized copies* for cheap SQL filtering — the JSONB is the source of truth. When the PWA adds a field, it lands in `payload` automatically (schemas use `.passthrough()`); only promote it to a column if you need to query/index on it, via a new migration.
- **Validation is permissive by design.** Schemas use `.passthrough()` and make most round fields `.optional().nullable()` so a partially-completed or future-version session still uploads instead of being rejected and stranded on a tablet. Keep new fields optional unless they are truly mandatory for every client version in the field.
- **Two auth tiers.** Enumerator tokens (`ENUMERATOR_TOKENS`, comma-separated; the admin token also passes) gate the write endpoints used by tablets. The admin token (`ADMIN_TOKEN`) alone gates the read endpoints (`GET /api/sessions`, `GET /api/sessions/:id`) — tablets must never be able to read other participants' data. Tokens are read from `c.env` at request time, not module load.
- **Append-only.** There are no UPDATE or DELETE endpoints. Session data is durable once accepted; deletion/retention is handled out-of-band per IRB protocol (see README "Backups").

## v2 schema note (matches the PWA)

The in-game arm was removed in v2: every player gets the distribution display + universal training, so there is no display × training cell. `SessionSchema.arm` is still **optional** purely so a pre-v2 session left on a tablet can sync; v2 sessions omit it and the `arm_id`/`arm_display`/`arm_training` columns are written NULL. The treatment that matters is `treatmentGroup` (Control/T1/T2/T3 — play-vs-don't-play assignment from the parent study), stored in `treatment_group`. Keep this in sync with `../investment-game/src/lib/constants.js` and the root `CLAUDE.md`.

## Schema changes

Add a timestamp-prefixed file to `migrations/` (current: `1700000000000_init.cjs`, `1714000000000_fork_arm.cjs`), write `up`/`down`, then `npm run migrate`. If a new endpoint or column touches game logic, randomization, consent, or the data schema, promotion to the stable repo needs PI/IRB sign-off (see repo-root `CONTRIBUTING.md`). Deploy the Worker after migrating so the new columns exist before code references them.

## Secrets (never commit)

`DATABASE_URL`, `ENUMERATOR_TOKENS`, `ADMIN_TOKEN` are Cloudflare Worker secrets (`wrangler secret put`). Locally they live in `.dev.vars` (dev) / `.env` (migrations) — both gitignored. `wrangler.toml` must not contain any of them.
