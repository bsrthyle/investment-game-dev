# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository context

Tablet-based lab-in-the-field experiment in which smallholder farmers make repeated fertilizer-dose decisions on maize under **rainfall and market-price uncertainty**. Deployed on Android tablets in **Nigeria** for **Hausa-speaking** participants. Must operate **fully offline** after first load.

**v2 design (this branch).** The in-game 3×2 arm (display format × probability training) has been **removed**. Whether a farmer plays the game at all is now the treatment, assigned **outside** the app (the parent impact evaluation — recorded as `treatmentGroup`). Everyone who plays sees the same game: uncertainty is always shown as the full icon-array **distribution**, probability-comprehension **training runs for everyone**, and there are **10** incentivized seasons (plus 1 practice). The hypothesis is that *playing* the game builds familiarity with the rainfall- and price-driven uncertainty farmers face. These design changes need PI/IRB sign-off before fielding.

Two-service monorepo:

- `investment-game/` — React + Vite PWA (the tablet app). Has its own, more detailed `CLAUDE.md` — **read it before touching PWA code**.
- `investment-game-server/` — Cloudflare Workers + Neon Postgres sync backend (Hono + Zod).

The active research design is in `docs/fork/research_plan.md`; the session-handoff context is in `docs/fork/CONTEXT.md`. The active project ROADMAP is `docs/project/ROADMAP.md`. Historical-only artifacts (kept for reference; **not authoritative**) live under `docs/archive/` — see its `README.md` for what's there and why.

## Common commands

All wrapped by the top-level `Makefile`. Run from repo root.

```bash
make dev             # PWA dev server on :5173
make test            # Vitest suite in investment-game/ (23 tests)
make build           # PWA production build → investment-game/dist
make deploy          # build + wrangler pages deploy to production
make server-dev      # wrangler dev for the Worker backend on :8787
make server-deploy   # deploy Worker to Cloudflare
make server-migrate  # run node-pg-migrate against Neon (needs .env)
make server-tail     # stream live Worker logs
make wiki-push       # sync docs/ → GitHub Wiki
```

Direct equivalents (when you need flags the Makefile doesn't expose):

```bash
cd investment-game && npm run dev | npm test | npm run build | npm run e2e
cd investment-game && npm run calibrate                          # dev-time yield/schedule report
cd investment-game && npx vitest run tests/yieldModel.test.js    # single test file
cd investment-game && npx vitest run -t "optimal dose"           # single test by name
cd investment-game-server && npm run dev | npm run deploy | npm run migrate | npm run tail
cd investment-game-server && node --test test/                   # backend tests
```

The PWA and the Worker are independent npm workspaces; there is no root `package.json`. `npm install` must be run inside each subdirectory.

## Architecture big picture

**The PWA is a strict forward-only state machine, not a router-driven SPA.** `App.jsx` reads `currentScreen` from a Zustand store and renders the corresponding screen. No back button in the game flow. Every transition is logged and checkpointed to IndexedDB (Dexie) so a crashed tablet resumes exactly where it left off. All audio/video/images are Workbox-precached on first load — **no network requests during gameplay**, ever.

**Data flows one way:** user interaction → Zustand store → append-only event log in IndexedDB → (eventually, from the Admin panel when online) → HTTPS POST to the Cloudflare Worker → Neon Postgres. The Worker is idempotent on `sessionId` (409 if already synced). Session data is never deleted from the tablet until the server confirms receipt.

**Experimental design (v2).** There is **no in-game arm.** Game exposure (play vs. don't-play) is the treatment, assigned outside the app; `treatmentGroup` (Control/T1/T2/T3) records the parent-study assignment for linkage. Every participant who plays gets the identical experience:

- **Display format:** always `distribution` (full icon array). `DISPLAY_FORMAT` in `constants.js`. (`point`/`range` removed.)
- **Probability training:** runs for **everyone** before the practice round. `TRAINING_ENABLED` in `constants.js`.

**Round structure.** 1 mandatory practice round + 10 incentivized seasons. Each round has 5 phases — `BRIEFING → DOSE → CONFIRM → REVEAL → SUMMARY`. Per round the participant chooses a fertilizer dose 0–10 (1 token per unit) from a 25-token endowment. Yield depends on dose and a discrete rainfall outcome (`good`/`normal`/`drought`); revenue is yield × discrete price outcome (`high`/`mid`/`low`) + saved tokens.

**Research-critical invariants** (enforced in code, don't break without PI sign-off):
- Practice round is mandatory; no skip path.
- No in-game arm: every player gets the same game (distribution display + universal training). Game exposure is the treatment and is assigned outside the app.
- Rain and price are drawn at **plant-confirm** using a per-round seed (`${participantId}-r${i}-rain`, `…-price`). Seeds and raw-uniform draws are persisted so outcomes are independently verifiable.
- Dose stepper **prevents** overspend in real time — the participant cannot spend more than 25 tokens.
- Yield model has a multiplicative rain × dose interaction so the optimal dose actually varies across rain distributions (without it the experiment has no identifying variation). Guarded by `tests/schedules.test.js`.
- Game screens never scroll — everything fits 1280×800 landscape.
- Country is locked to Nigeria; languages are `en` + `ha` only.

Pure game math lives in `investment-game/src/lib/yieldModel.js`, `schedules.js`, and `randomize.js`, covered by the Vitest suite (`yieldModel.test.js`, `schedules.test.js`, `randomize.test.js`, `calibration.test.js`). If you touch game logic, run `npm test` and `npm run calibrate` and confirm the calibration health checks still pass.

## Two-repo deployment model (from CONTRIBUTING.md)

There are two GitHub repos that share this tree:
- `sfissa-gef/investment-game` — **stable**, field-deployed. Pages production pulls from here. Protected `main`.
- `sfissa-gef/investment-game-dev` — **dev**, where all work happens. This clone.

Feature branches push to `dev`, PR into `dev/main`, staging deploys automatically. Promotion to stable requires PI/IRB sign-off for anything touching game logic, randomization, consent, or data schema. Never push directly to stable `main`.

## Things that must not be committed

`participants.csv`, `.env`, `.dev.vars`, any file containing `DATABASE_URL` / `ENUMERATOR_TOKENS` / `ADMIN_TOKEN` / `ELEVENLABS_API_KEY`, raw session exports under `data/raw/`, audio chunks under `audioChunks/`, or anything produced by a real field deployment. `.gitignore` covers the common cases — when in doubt, don't commit.
