# Investment Game — Roadmap

**Last updated:** 2026-04-20
**Repo state:** PWA deployed to Cloudflare Pages at [investment-game.pages.dev](https://investment-game.pages.dev). Backend Dockerized, not yet deployed. 47 tests green.

---

## What's done

- **Game logic:** 3 rounds (practice + R1 + R2), A/B version assignment, insurance-requires-seeds gating, bundle variant, video-cost deduction, weather 80/20 with seeded PRNG, idempotent per participant. 35 truth-table + 4 randomization + 8 state-machine tests.
- **Content:** 10 narrated video scenes (A1–A6 instructions, A7A/A7B Round 2 intros, B1/B2 insurance explainers). English narration recorded via ElevenLabs Mapendo.
- **Data:** Every stepper change, screen transition, video scene enter, survey answer logged to IndexedDB. CSV + JSON exports from admin panel. Session recorder (opt-in, AES-GCM encrypted, 60s Opus chunks).
- **Infra:** Zustand state machine with IndexedDB checkpointing + resume. Workbox PWA with aggressive precache. Node + Express + Postgres sync backend with Zod validation + Docker compose.
- **Localization scaffolding:** English + Luganda + Bemba bundles, country-driven language picker (UG → en/lg, ZM → en/bem), per-language narration paths with EN fallback on 404.
- **Deployment:** Cloudflare Pages live, `_headers` file with cache-control, `skipWaiting + clientsClaim` for clean update propagation.

---

## Track A — Luganda + Bemba audio (blocking real field use)

### The problem

When a participant selects Luganda or Bemba, they currently hear English (via our automatic fallback). The fallback works *as designed*, but participants expect their chosen language.

### What's missing

1. **Translated narration text** — we don't have Luganda or Bemba versions of the 10 scripts.
2. **Recorded audio** — either via Mapendo multilingual TTS (`eleven_multilingual_v2` supports both languages on the same voice ID) or real voice actors.
3. **Translated captions** — lg.json and bem.json have ~14 UI strings in draft; ~40 video-caption keys still fall back to English.

### Plan

| Step | Who | Owner action |
|---|---|---|
| 1 | PI / field team | Commission native-speaker translations of the 10 narration scripts. Deliver as `scripts/narration-texts/lg.json` and `bem.json`, keyed by video ID (A1, A2, …, B2). |
| 2 | PI / field team | Review the ~40 video-caption keys in `src/i18n/en.json` and produce `lg.json` / `bem.json` equivalents with `video.*.caption.*` keys. |
| 3 | Engineering | Extend `scripts/generate-narration.sh` to read from `narration-texts/{lang}.json` when present. One-line change once files exist. |
| 4 | Engineering | Generate Luganda + Bemba MP3s via Mapendo voice. ~3,400 chars × 2 languages = 6,800 chars, well under ElevenLabs Starter quota. |
| 5 | Field pilot | Native speakers play through the full flow in their language and flag mispronunciations, pacing, or awkward translations. Iterate. |

### Secondary UX improvement

Consider flagging in the UI when narration has fallen back to English so the enumerator knows ("Audio: English fallback — Luganda not yet recorded"). Low-value once step 4 is done, but useful during rollout.

### Not blocking

The PWA infrastructure already handles missing audio gracefully — videos play with captions and visuals, marking `video_narration_fallback` in the event log so missing-audio coverage is measurable.

---

## Track B — Low-connectivity field deployment (enumerator app)

### The goal

Tablets in Zambia and Uganda villages often have no connectivity. The app must work fully offline after first load. Enumerators should be able to complete a full session and sync later when connectivity returns.

### What's already in place

- PWA with Workbox precache — everything cached on first load (~2 MB including all audio + fonts)
- IndexedDB for all session data
- Sync queue: completed sessions batch and post to `/api/sessions` when online
- "Offline" badge on status bar
- Session resume on crash

### What's still missing

| # | Item | Notes |
|---|---|---|
| B1 | **First-load provisioning procedure** | Enumerators need a documented step-by-step: connect tablet to Wi-Fi at partner office → open URL → wait for "install complete" indicator → disconnect. One page. |
| B2 | **"Add to Home Screen" UX** | Currently a manual browser action. Add an install prompt inside the app that triggers `beforeinstallprompt` so the tablet clearly installs as a standalone app with correct icon + orientation lock. |
| B3 | **Device diagnostics on launch** | Admin panel has basic diagnostics. Add a pre-session check: "Is service worker active? Is storage healthy? Battery > 20%? All 10 narration files cached?" — enumerator sees one green "Ready" light or a list of warnings. |
| B4 | **Offline test suite** | Automated test: boot the PWA in headless Chrome, disable network, run full V-A + V-B flows, verify all data lands in IndexedDB. Currently Playwright smoke tests run online. |
| B5 | **Sync strategy** | Decide: background sync on connectivity change? Explicit end-of-day enumerator action? Both? Currently only manual "Sync now" in admin panel. Add background-sync API + visible queue count. |
| B6 | **Backup / recovery** | What if a tablet is lost/damaged mid-day with 8 unsynced sessions? Add admin-panel export-to-USB / export-to-adjacent-tablet-via-QR. |
| B7 | **Backend deployment** | `investment-game-server` is Dockerized but not running anywhere. Decide host (CIAT infra? AWS? Scaleway?) and deploy. Until then, client-side JSON export is the only way to get data off tablets. |
| B8 | **Tablet selection + purchase spec** | Minimum: Android 10+, ≥2 GB RAM, ≥16 GB storage, ≥8 h battery, 10-inch screen, 4G optional. Document exact recommended models + bulk purchase path. |
| B9 | **Enumerator training materials** | Short video or printed card: power on, launch app, setup, handoff-to-participant, end-of-day sync, troubleshoot stuck screens. |
| B10 | **Production backend hardening** | Helmet, rate-limiting, structured logging, `/metrics` endpoint, nightly Postgres backup to S3, documented runbook. |

### Sequencing

**Must-do before pilot:** B1, B2, B3, B7 (or B6 if no backend yet).
**Should-do before full rollout:** B4, B5, B8, B9.
**Ongoing:** B10.

---

## Track C — Data + interaction for analysis

### What's already captured

Per session:
- Demographics + 3 comprehension-check answers (auto-scored)
- Per-round: fertilizer, seeds, insurance, bundle purchases; savings; weather outcome + seed for reproducibility; fertilizer/seed/insurance/bundle harvests; total tokens; stepper trajectory with timestamps and lockbox state after each tap; decision start/end timestamps.
- Per video: scene-level enter/exit events, play/pause, replay count, completion, watch time, narration-language fallback markers.
- Session metadata: participant ID, enumerator ID, country, partner, treatment group (Control/B1/B2/B3), R2 version (A/B), language chosen, currency rate, device info.

Exported as:
- One-row-per-session CSV (primary analysis dataset) — 37 columns
- Long-format event log CSV
- Long-format stepper-trajectory CSV
- Full JSON snapshot (for archival / replay / audit)

### What's still missing

| # | Item | Notes |
|---|---|---|
| C1 | **Codebook / data dictionary** | One-page markdown per CSV column: variable name, type, valid values, what it means, missingness rules. Critical for collaborators not close to the code. |
| C2 | **Pre-registered analysis plan** | Per the research design summary: primary questions (demand, info-seeking, fertilizer investment), secondary (learning spillover, demographic heterogeneity). Specify identification strategy and tests before field starts. AEA registry recommended. |
| C3 | **Power calculations** | Given n = 3,200 (800 × 2 partners × 2 countries), what effect sizes are detectable on primary outcomes? Done once, needed for reviewers. |
| C4 | **Cleaning / reshape scripts** | Stata or R scripts that take the raw CSV export → analysis-ready panels. Merge session + event + trajectory CSVs by `session_id`, derive behavioral metrics (stepper-change count, confirm-cancellation count, time to first action, etc). |
| C5 | **Link to main impact evaluation** | The research design summary's question #4 requires linking this game's participant IDs to the main IE's outcome data. Define participant-ID format up front so the join works: `{country}-{partner}-{treatment}-{seq}` or similar. |
| C6 | **Fieldwork monitoring dashboard** | During data collection, PI/field coordinator needs a live view: how many sessions completed per day per partner, comprehension-check pass rates, video-replay patterns, version A/B balance check (should run ~50/50). Simple read-only admin dashboard backed by the sync server. |
| C7 | **Quality checks** | Automated per-session validation: weather seeds reproduce, payouts reconcile, no impossible states (insurance without seeds). Run on the sync server on ingest; flag anomalous sessions for review. |
| C8 | **Archival format** | End-of-study data package: raw JSON per session + frozen code version + game_logic.md + docs/SPEC_DISCREPANCIES.md resolution + readme. Enables replication in 5 years. |
| C9 | **Audio recording governance** | If audio recording is turned on per IRB, document the retention, transcription, and access policy. Currently the encryption key is stored on the session record which means anyone with the session can decrypt — consider separating the key storage. |

### Sequencing

**Must-do before pilot:** C1, C2, C5, C7.
**Should-do before full rollout:** C3, C4, C6.
**Post-fieldwork:** C8.
**If recording enabled:** C9 before any recording happens.

---

## Open research-integrity items

Carried forward from earlier sessions:

- [**SPEC_DISCREPANCIES.md**](SPEC_DISCREPANCIES.md) — six rows of `game_logic.md` §4 truth tables contradict the explicit payout formulas by −10 or −4 tokens. Implementation follows the formulas; PI sign-off still pending. **Blocks field deployment.**
- [**TRANSLATION_TODO.md**](TRANSLATION_TODO.md) — 14-key UI translation drafts I wrote for lg.json / bem.json need native-speaker review before pilot.

---

## How to pick up from here

Recommended sequence for the next few days:

1. **Email the PI** with the SPEC_DISCREPANCIES.md link and ask for decision. Nothing more useful to do until that's resolved.
2. **While waiting:** commission Luganda + Bemba translations of narration scripts + UI strings (Track A steps 1–2). Translators typically take a week; start now.
3. **In parallel:** deploy the sync backend (Track B, item B7) so data can actually flow off tablets. Container is ready; just needs a host + DNS.
4. **Next code sprint:** install prompt + pre-session diagnostics (B2, B3), codebook + analysis plan (C1, C2).
