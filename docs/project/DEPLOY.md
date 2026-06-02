# Deployment & data runbook

How to deploy the two services, provision tablets, run a session in the field,
and get the data out for analysis. For the experiment design see
[`../fork/research_plan.md`](../fork/research_plan.md); for backend internals
see [`../../investment-game-server/README.md`](../../investment-game-server/README.md).

> **Status gate (read first).** Several `dev_v1` commits are flagged
> **PENDING PI SIGN-OFF** (v2 yield model, the 0.10-grid schedules, the icon
> display). Per [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md), anything
> touching game logic, randomization, consent, or data schema needs PI/IRB
> sign-off before it is promoted to the **stable** repo that Pages production
> serves. Until then: deploy to **staging** for piloting only. Field-readiness
> also still needs narration audio and a Hausa native-speaker review (see
> [`ROADMAP.md`](ROADMAP.md), [`TRANSLATION_TODO.md`](TRANSLATION_TODO.md)).

There are **two deployable services** and **two ways data reaches you**:

```
Tablet PWA  ──(Admin → Sync, HTTPS + Bearer)──▶  Cloudflare Worker  ──▶  Neon Postgres
   │                                                                         ▲
   └──(Admin → Export, offline)──▶  CSV / JSON files on the device           └─ analyst pulls here
```

---

## 0. Prerequisites (one-time, on your laptop)

- Node 18+, and `npm install` run **inside each** of `investment-game/` and
  `investment-game-server/` (no root `package.json`).
- A Cloudflare account and a Neon account.
- `wrangler` is bundled (v4.x via `npx`). Authenticate once — **this is
  interactive (opens a browser) and only you can do it**:

  ```bash
  cd investment-game && npx wrangler login
  npx wrangler whoami            # should show your account, not "not authenticated"
  ```

All commands below are wrapped by the root `Makefile`; run them from the repo root.

---

## 1. Backend — Cloudflare Worker + Neon (one-time)

The backend is where field data lands. Detailed walkthrough in
`investment-game-server/README.md`; the short version:

```bash
# 0. Install backend deps (separate npm workspace — required before deploy/migrate):
cd investment-game-server && npm install

# 1. Neon: create a project, copy the POOLED connection string.

# 2. Apply the schema from your laptop (Workers cannot run migrations):
cp .env.example .env           # then put DATABASE_URL in .env via your editor
make server-migrate            # creates sessions + audio_chunks tables

# 3. Register a workers.dev subdomain ONCE per account (interactive — needs a
#    real TTY, so run in your own terminal or the Cloudflare dashboard, NOT a
#    piped/non-interactive shell):
npx wrangler deploy            # answer "yes" to register, pick a subdomain
#    (or dashboard → Workers & Pages → set the account subdomain)

# 4. Push secrets to Cloudflare (encrypted; never committed). `secret put`
#    reads the value from stdin, so you can pipe to avoid a TTY and avoid
#    printing the value; generate the bearer tokens in your own terminal so
#    they are not logged anywhere:
sed -n 's/^DATABASE_URL=//p' .env | npx wrangler secret put DATABASE_URL
npx wrangler secret put ENUMERATOR_TOKENS   # paste `openssl rand -hex 16` -> goes into tablets
npx wrangler secret put ADMIN_TOKEN         # paste `openssl rand -hex 32` -> keep private (read access)

# 5. Deploy + confirm:
make server-deploy             # → https://fertilizer-game-server.<subdomain>.workers.dev
make server-tail               # live logs
curl https://<...>.workers.dev/health   # → { "ok": true, ... }
```

> A **newly registered** `*.workers.dev` subdomain takes a few minutes for its
> edge TLS certificate to provision. Until it does, `/health` fails the TLS
> handshake (`curl` exit 35 / `HTTP 000` / "alert number 40"). This is normal
> propagation, **not** a network block or a deploy error — wait and retry.

**Two tokens, two roles** (see `investment-game-server/src/auth.js`):
- **Enumerator token** — paste into each tablet's Admin → Sync. Allows
  *uploading* sessions/audio (`POST /api/sessions`, `/api/audio-chunks`).
- **Admin token** — stays with you. Allows *reading* data back
  (`GET /api/sessions`, `/api/sessions/:id`). Tablets never get this.

`ENUMERATOR_TOKENS` is comma-separated — issue one token per device/enumerator
if you want to attribute uploads.

---

## 2. Tablet PWA

### Build & deploy

```bash
make build      # → investment-game/dist  (precaches ~46 assets for offline use)
make deploy     # build + wrangler pages deploy
```

`make deploy` targets Cloudflare **Pages project `fertilizer-game`, branch
`production`** (see the `deploy:` target in the `Makefile`). First-time setup —
create the project once in **your** (CIMMYT) Cloudflare account:

```bash
npx wrangler whoami                  # confirm you are in the CIMMYT account
npx wrangler pages project create fertilizer-game --production-branch=production
npx wrangler pages project list      # fertilizer-game should now appear
```

> **Independent deployment.** This is a CIMMYT fork; it runs on CIMMYT-owned
> infrastructure and shares nothing with the upstream organization. The
> `fertilizer-game` Pages project and `fertilizer-game-server` Worker live in
> CIMMYT's own Cloudflare account, with their own Neon database and secrets.
> If `pages deploy` says "project not found", you are either in the wrong
> Cloudflare account or have not yet run the `project create` above.

**Staging vs production.** For piloting, deploy to a preview branch (anything
other than `production` produces a preview URL):

```bash
make build
cd investment-game && npx wrangler pages deploy dist --project-name=fertilizer-game --branch=staging
```

Run the production `make deploy` only after the PENDING-PI-SIGN-OFF gate above
is cleared.

### Provision a device (per tablet)

1. Connect to wifi **once**; open the deployed URL in Chrome.
2. The service worker precaches everything — after this the app runs **fully
   offline**. Verify in Admin → Diagnostics (service-worker active, storage OK).
3. Admin → **Sync** tab: set the Worker URL + the **enumerator token**, tap
   *Test connection* (expect 200).
4. (Optional) "Add to Home screen" to install standalone with the landscape lock.
5. (Optional) Admin → **Export/Import** → import a participant-list CSV to
   pre-load IDs.

The Admin panel opens via a **4-finger tap on the Welcome screen** (or the
hidden corner button), gated by a PIN.

---

## 3. Running a session (field workflow)

Forward-only flow; every step checkpoints to IndexedDB, so a dead/rebooted
tablet **resumes exactly where it stopped** (Admin → Sessions → resume).

1. **Welcome → Enumerator Setup** — enumerator ID, participant ID,
   `treatmentGroup` (the parent-study play/don't-play assignment, for linkage),
   currency rate.
2. **Language** (en/ha) → **Instructions** → **Training** (probability module,
   everyone) → **Practice** (mandatory, not paid).
3. **10 incentivized seasons** — read the rain + price briefing → choose a
   fertilizer dose 0–10 from a 25-token budget → confirm (irreversible) →
   outcome revealed → summary.
4. **Final Payout** (tokens → NGN) → **Survey** → **Completion**.

Rain/price are drawn at plant-confirm from per-round seeds
(`${participantId}-r${i}-rain`/`-price`); the seed **and** the raw uniform draw
are stored so every outcome is independently reproducible.

---

## 4. Getting the data for analysis

### Path A — Live sync → Postgres (primary)

Admin → **Sync → Sync now** POSTs each session to the Worker → Neon. It is
**idempotent on `sessionId`** (a re-sync returns HTTP 409, never a duplicate),
and the tablet keeps its local copy until the server confirms receipt. Then:

```bash
# full snapshot for analysis:
pg_dump "$DATABASE_URL" > export-$(date -u +%Y%m%d).sql

# the complete session is JSONB in sessions.payload; identity/treatment/time
# fields are lifted into columns for cheap filtering:
psql "$DATABASE_URL" -c \
  "select session_id, participant_id, treatment_group, received_at from sessions order by received_at;"

# or over HTTPS with the ADMIN token:
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://<...>.workers.dev/api/sessions        # latest 500
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://<...>.workers.dev/api/sessions/<id>   # one payload
```

### Path B — Offline export off the tablet (no-connectivity / backup)

Admin → **Export** downloads, on the device (filenames are timestamped):

| File | Shape | Use |
|---|---|---|
| `sessions-*.csv` | **wide**, 1 row/session | session-level analysis; per-round columns `r1_dose…r10_revenue`, seeds, survey, `treatment_group`, `sync_status` |
| `rounds-*.csv` | **long**, 1 row/round | the main dose-decision table; includes `dose_trajectory_json` |
| `dose-trajectory-*.csv` | **long**, 1 row/stepper tap | time-to-commit, revision count |
| `events-*.csv` | **long**, 1 row/event | full interaction log |
| `…-export-*.json` | nested | complete raw dump |

For most analysis: work from `rounds-*.csv` (or `sessions.payload`), keyed by
`participant_id` × `round_index`, joined to `treatment_group`.

### Backups & retention

Neon has point-in-time restore. For archival, schedule the `pg_dump` above to
secure storage and retain per IRB protocol. Session data is **never deleted**
from a tablet until the server confirms receipt.

---

## 5. Updating a deployed fleet

- **PWA:** `make build && make deploy`. Tablets pick up the new service worker
  on their next online load. (Field tablets are usually offline — they update
  only when reconnected.)
- **Schema:** add a timestamped file under `investment-game-server/migrations/`,
  run `make server-migrate` from your laptop, then `make server-deploy`.
- **Worker code only:** `make server-deploy`.

---

## 6. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `wrangler` says *not authenticated* | `npx wrangler login` (interactive). |
| `pages deploy` says *project not found* | wrong Cloudflare account, or the `fertilizer-game` project hasn't been created yet (`wrangler pages project create fertilizer-game`). Check `wrangler whoami`. |
| Sync test fails 401/403 | wrong/empty enumerator token in Admin → Sync, or token not in `ENUMERATOR_TOKENS`. |
| Sync returns 409 | already synced — not an error; the session is safely on the server. |
| `/health` 500 | `DATABASE_URL` secret missing/wrong; re-run `wrangler secret put DATABASE_URL`. |
| `/health` TLS error (curl exit 35 / HTTP 000 / "alert number 40") | brand-new `*.workers.dev` subdomain cert still provisioning — wait a few minutes and retry. Not a network block. |
| `secret put` / `deploy` prompts "register a workers.dev subdomain" but auto-answers "no" | you're in a non-interactive shell (no TTY). Register the subdomain in your own terminal or the dashboard first. |
| `deploy` fails *Could not resolve "hono"/"zod"* | run `npm install` in `investment-game-server/` first (separate workspace). |
| Migrations fail | run from your laptop with `.env` set, not inside the Worker. |
| App requests network mid-game | bug — gameplay must be 100% offline; check Diagnostics that the SW is active. |
