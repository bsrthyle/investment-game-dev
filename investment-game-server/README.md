# investment-game-server

Sync backend for the Investment Game PWA (fertilizer risk-communication experiment). Runs on **Cloudflare Workers** with **Neon Postgres** — fully managed, serverless, scales to zero when idle.

## Session payload shape

The Worker accepts the v2 session schema (`src/schemas.js`). The whole body is stored verbatim as JSONB; a few fields are also lifted into columns for cheap SQL filtering.

- `country: 'NG'`, `treatmentGroup: 'Control'|'T1'|'T2'|'T3'` — `treatmentGroup` is the parent-study assignment (play vs. don't-play exposure), recorded as metadata for linkage.
- `practiceRound` + `rounds[]` (10 incentivized seasons), each with `dose 0..10`, `rainOutcome ∈ {good,normal,drought}`, `priceOutcome ∈ {high,mid,low}`, seeds, raw draws, `doseTrajectory`.
- `training` — comprehension-module result (runs for every player in v2).

**No in-game arm (v2).** Display format is always the full distribution and training is universal, so there is no display × training cell to record. The schema still *accepts* an optional `arm: { display, training, id }` object purely so a pre-v2 session left on a tablet can still sync; for v2 sessions it is absent and the `arm_*` columns are written NULL. `treatmentGroup` is the only treatment label that matters now.

Lifted columns: `arm_id`, `arm_display`, `arm_training` (legacy back-compat, NULL for v2), `treatment_group`, plus the standard identity/time fields. See `migrations/1714000000000_fork_arm.cjs`. The schema validator uses `.passthrough()`, so unknown future fields are stored rather than rejected.

Legacy rows from earlier deployments (if any exist) are preserved as-is; the pre-fork `round2_version` column is kept but now allows NULL so v2 sessions can insert without it.

## Architecture

```
Tablet (PWA)
   │ HTTPS POST /api/sessions  (Bearer token)
   ▼
Cloudflare Workers  (Hono router, 300+ edge locations)
   │
   ▼
Neon Postgres  (serverless, HTTP/WebSocket driver)
```

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | — | Liveness (pings DB) |
| POST | `/api/sessions` | Enumerator | Upload a completed session. Idempotent on `sessionId`. 200 → accepted, 409 → already synced |
| POST | `/api/audio-chunks` | Enumerator | Upload one encrypted Opus chunk |
| GET | `/api/sessions` | Admin | List most-recent 500 sessions |
| GET | `/api/sessions/:id` | Admin | Return a stored session payload |

## One-time setup

### 1. Create the Neon database

1. Sign up at [neon.tech](https://neon.tech). Free tier: 0.5 GB + 300 compute-hours/month (way more than this project needs).
2. Create a project named `investment-game`. Pick the region closest to your participants (e.g., `eu-central-1` for Africa).
3. Dashboard → Connection Details → copy the **pooled connection string** (looks like `postgresql://user:pass@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`).

### 2. Run migrations from your laptop

Migrations can't run inside a Worker (no long-running processes). Run them once from your machine:

```bash
cd investment-game-server
npm install
cp .env.example .env
# edit .env: paste your Neon pooled connection string

npm run migrate
# → applies migrations/1700000000000_init.cjs   (sessions + audio_chunks tables)
# → applies migrations/1714000000000_fork_arm.cjs (treatment_group + legacy arm_* columns)
```

### 3. Configure the Worker

```bash
# authenticate (opens browser; one-time)
npx wrangler login

# generate bearer tokens
export ENUM_TOK=$(openssl rand -hex 16)
export ADMIN_TOK=$(openssl rand -hex 32)

# push secrets to Cloudflare (they live encrypted; not in any repo file)
echo "$(cat .env | grep DATABASE_URL | cut -d= -f2-)" | npx wrangler secret put DATABASE_URL
echo "$ENUM_TOK" | npx wrangler secret put ENUMERATOR_TOKENS
echo "$ADMIN_TOK" | npx wrangler secret put ADMIN_TOKEN

echo "Your enumerator token (paste into PWA Admin → Sync → Bearer token):"
echo "  $ENUM_TOK"
echo "Your admin token (keep private, used for /api/sessions read access):"
echo "  $ADMIN_TOK"
```

### 4. Deploy

```bash
npm run deploy
# → https://investment-game-server.<your-account>.workers.dev
```

### 5. Point the PWA at the Worker

In the deployed PWA, open the Admin panel → Sync tab:
- **Server URL**: `https://investment-game-server.<your-account>.workers.dev`
- **Bearer token**: the enumerator token from step 3
- Save → Test connection → should show "Connected (200)".

## Local dev

```bash
npm run dev
# → http://localhost:8787
# Secrets read from .dev.vars (gitignored). Create it:
cat > .dev.vars <<EOF
DATABASE_URL=postgresql://...neon.tech/...
ENUMERATOR_TOKENS=dev-enum-token
ADMIN_TOKEN=dev-admin-token
EOF
```

Wrangler emulates the Workers runtime. `curl http://localhost:8787/health` should return `{ ok: true }`.

## Monitoring

```bash
npm run tail      # live logs streamed from the production Worker
```

Cloudflare dashboard → Workers → `investment-game-server` → Observability has request counts, error rates, CPU time histograms.

## Updating the schema

Add a new file to `migrations/` (timestamp-prefixed), then `npm run migrate` from your laptop. The Worker code can pick up new columns immediately after its next deploy.

## Costs

| Service | Free tier | Expected use | Paid if? |
|---|---|---|---|
| Cloudflare Workers | 100k requests/day | ~20k total across 3,200 sessions | Over 100k/day |
| Neon Postgres | 0.5 GB storage, 300 compute-hours/mo | ~30 MB, ~5 hrs compute | Very unlikely to hit |

Realistically this stays free for the entire study.

## Backups

Neon runs automatic backups with point-in-time restore (24 hours on free tier, longer on paid). For analysis-grade archival:

```bash
# from your laptop, using the DATABASE_URL
pg_dump "$DATABASE_URL" > backup-$(date -u +%Y%m%d).sql
```

Schedule as a cron, push to S3-compatible storage or a secure local server. Retain per IRB protocol.
