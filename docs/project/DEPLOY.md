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
# 1. Neon: create a project, copy the POOLED connection string.

# 2. Apply the schema from your laptop (Workers cannot run migrations):
cd investment-game-server && cp .env.example .env   # paste DATABASE_URL
make server-migrate            # creates sessions + audio_chunks tables

# 3. Push secrets to Cloudflare (encrypted; never committed):
echo "<neon-pooled-url>"        | npx wrangler secret put DATABASE_URL
echo "$(openssl rand -hex 16)"  | npx wrangler secret put ENUMERATOR_TOKENS   # -> goes into tablets
echo "$(openssl rand -hex 32)"  | npx wrangler secret put ADMIN_TOKEN         # -> keep private (read access)

# 4. Deploy + confirm:
make server-deploy             # → https://investment-game-server.<account>.workers.dev
make server-tail               # live logs
curl https://<...>.workers.dev/health   # → { "ok": true, ... }
```

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

`make deploy` targets Cloudflare **Pages project `investment-game`, branch
`app-game-gef-production`** (this is production — see the `deploy:` target in
the `Makefile`). Confirm the project/branch exist **in the account you are
logged into** before first use:

```bash
npx wrangler whoami            # which account am I in?
npx wrangler pages project list
```

> ⚠️ **Account boundary.** The production `investment-game` Pages project lives
> in the **`sfissa-gef` org** Cloudflare account (it serves the stable,
> field-deployed repo). A personal/dev account (e.g. `bismignot@gmail.com`) has
> **no** Pages project — `pages project list` is empty there. Running
> `make deploy` from a personal account therefore does **not** reach
> production: it errors "project not found" or would create an unrelated new
> project. To deploy production you must be authenticated to the org account.

**Staging vs production.** Push `dev_v1`; the dev pipeline (Pages git
integration on `sfissa-gef/investment-game-dev`) deploys staging automatically
(see `CONTRIBUTING.md`). Use staging for piloting. For an ad-hoc staging deploy
from a personal account, create your own throwaway project first:

```bash
npx wrangler pages project create investment-game-staging --production-branch=main
npx wrangler pages deploy dist --project-name=investment-game-staging
```

Only run the production `make deploy` after the PENDING-PI-SIGN-OFF gate above
is cleared **and** you are in the org account.

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
| `pages deploy` says *project not found* | you're in the wrong account — production lives in the `sfissa-gef` org, not a personal account. Check `wrangler whoami`. |
| Sync test fails 401/403 | wrong/empty enumerator token in Admin → Sync, or token not in `ENUMERATOR_TOKENS`. |
| Sync returns 409 | already synced — not an error; the session is safely on the server. |
| `/health` 500 | `DATABASE_URL` secret missing/wrong; re-run `wrangler secret put DATABASE_URL`. |
| Migrations fail | run from your laptop with `.env` set, not inside the Worker. |
| App requests network mid-game | bug — gameplay must be 100% offline; check Diagnostics that the SW is active. |
