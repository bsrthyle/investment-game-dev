# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository context

Tablet-based lab-in-the-field experiment app for a GEF-funded smallholder-finance study (Alliance of Bioversity & CIAT, with IFPRI). Deployed on Android tablets to ~3,200 participants in rural Zambia and Uganda. Must operate **fully offline** after first load.

This is a two-service monorepo:

- `investment-game/` — React + Vite PWA (the tablet app). Has its own, more detailed `CLAUDE.md` — **read it before touching PWA code**.
- `investment-game-server/` — Cloudflare Workers + Neon Postgres sync backend (Hono + Zod).

Authoritative specs live under `docs/research/` (game rules, screen specs, data schema, design system). Open research-integrity items live under `docs/project/` — in particular `SPEC_DISCREPANCIES.md` blocks field deployment until PI sign-off.

> Note: `investment-game/CLAUDE.md` describes the backend as "Node + Express + Postgres via docker compose." The actual backend is Cloudflare Workers + Neon (see `investment-game-server/README.md` and `wrangler.toml`). Trust the code and top-level README, not the subfolder CLAUDE.md on this point.

## Common commands

All wrapped by the top-level `Makefile`. Run from repo root.

```bash
make dev             # PWA dev server on :5173
make test            # Vitest suite in investment-game/ (47 tests)
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
cd investment-game && npx vitest run tests/payout.test.js      # single test file
cd investment-game && npx vitest run -t "weather draw"         # single test by name
cd investment-game-server && npm run dev | npm run deploy | npm run migrate | npm run tail
cd investment-game-server && node --test test/                 # backend tests
```

The PWA and the Worker are independent npm workspaces; there is no root `package.json`. `npm install` must be run inside each subdirectory.

## Architecture big picture

**The PWA is a strict forward-only state machine, not a router-driven SPA.** `App.jsx` reads `currentScreen` from a Zustand store and renders the corresponding screen. No back button in game flow. Every transition is logged and checkpointed to IndexedDB (Dexie) so a crashed tablet resumes exactly where it left off. All audio/video/images are Workbox-precached on first load — **no network requests during gameplay**, ever.

**Data flows one way:** user interaction → Zustand store → append-only event log in IndexedDB → (eventually, from the Admin panel when online) → HTTPS POST to the Cloudflare Worker → Neon Postgres. The Worker is idempotent on `sessionId` (409 if already synced). Session data is never deleted from the tablet until the server confirms receipt.

**Research-critical invariants** (enforced in code, don't break without PI sign-off):
- Practice round is mandatory; no skip path.
- Weather is drawn at plant-confirm using a seeded PRNG (80/20 good-rain split). The seed value is logged so outcomes are independently verifiable.
- Budget stepper **prevents** overspend in real time (not a warn-then-allow pattern).
- Insurance in Version A is gated on seed purchase; removing seeds auto-removes insurance.
- Game screens never scroll — everything fits 1280×800 landscape.
- A/B version assignment is seeded and logged per session.

Pure game math lives in `investment-game/src/lib/payout.js` and `randomize.js` and is covered by the Vitest suite (payout truth tables + fast-check property tests for randomization distribution). If you touch game logic, run `npx vitest run tests/payout.test.js` and confirm the truth tables still pass.

## Two-repo deployment model (from CONTRIBUTING.md)

There are two GitHub repos that share this tree:
- `sfissa-gef/investment-game` — **stable**, field-deployed. Pages production pulls from here. Protected `main`.
- `sfissa-gef/investment-game-dev` — **dev**, where all work happens. This clone.

Feature branches push to `dev`, PR into `dev/main`, staging deploys automatically. Promotion to stable requires PI/IRB sign-off for anything touching game logic, payouts, randomization, consent, or data schema. Never push directly to stable `main`.

## Things that must not be committed

`participants.csv`, `.env`, `.dev.vars`, any file containing `DATABASE_URL` / `ENUMERATOR_TOKENS` / `ADMIN_TOKEN` / `ELEVENLABS_API_KEY`, raw session exports under `data/raw/`, audio chunks under `audioChunks/`, or anything produced by a real field deployment. `.gitignore` covers the common cases — when in doubt, don't commit.
