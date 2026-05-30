# investment-game (PWA)

React 18 + Vite + Tailwind PWA for the fertilizer risk-communication experiment. Fully offline-capable after first load.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 25 Vitest specs
npm run calibrate    # dev-time yield + schedule health report
npm run build        # production bundle → dist/
npm run preview      # serve dist/ locally for a PWA-install test
npm run e2e          # Playwright, needs `npx playwright install` once
```

## Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 18 (Vite) | Component model maps to screen-based game flow |
| Styling | Tailwind CSS v3 | Rapid iteration, responsive by default |
| State | Zustand | Lightweight store; the app is a linear state machine |
| Offline storage | Dexie.js (IndexedDB) | Structured, transactional, survives browser crashes |
| PWA / caching | Workbox (vite-plugin-pwa) | Precache all assets for full offline operation |
| Audio | HTML5 `<audio>` with preload | Narration playback |
| Testing | Vitest + Playwright | Unit tests for logic, E2E for flow |

**Do NOT add:** Next.js, Redux, Axios, any CSS-in-JS library, any UI component library. Keep bundle small for offline install.

## Project structure

```
investment-game/
├── src/
│   ├── App.jsx                 Root; renders current screen from state machine
│   ├── main.jsx                Entry + font preload
│   ├── store/
│   │   ├── gameStore.js        Zustand store — state machine, session, checkpointing
│   │   ├── eventLog.js         Interaction event logger → IndexedDB
│   │   └── recordingStore.js   Audio-recording lifecycle (start/stop)
│   ├── screens/                One component per game screen
│   │   ├── Welcome / LanguageSelect / EnumeratorSetup / Instructions
│   │   ├── Training            3-step probability-comprehension module
│   │   ├── Practice            1 mandatory practice round (wraps RoundBody)
│   │   ├── Round + RoundBody   8 incentivized rounds; 5 phases per round
│   │   ├── FinalPayout / Survey / Completion
│   ├── components/
│   │   ├── RiskDisplay         The experimental manipulation (point/range/distribution)
│   │   ├── IconArray           10-icon largest-remainder frequency grid
│   │   ├── ConfirmDialog       Plant-confirm modal
│   │   ├── InfoPopover         Click-to-explain "i" tooltip
│   │   ├── ErrorBoundary / StatusBar / DevResetButton
│   ├── lib/
│   │   ├── constants.js        Game parameters, flow, arms, NG locale
│   │   ├── schedules.js        8-round rain + price probability vectors
│   │   ├── yieldModel.js       computeYield / computeRevenue / optimalDose
│   │   ├── randomize.js        assignArm + drawCategorical + newRoundSeed
│   │   ├── db.js               Dexie schema + helpers
│   │   ├── sync.js             Post sessions + audio chunks to backend Worker
│   │   ├── export.js           JSON + wide/long/dose-trajectory CSVs
│   │   └── recording.js        MediaRecorder + AES-GCM encryption
│   ├── admin/                  4-tab admin panel (Sessions / Sync / Export / Diagnostics)
│   └── i18n/                   en.json, ha.json (Hausa), index.js
├── public/
│   ├── audio/ha/               Hausa narration (pending recording)
│   ├── audio/en/               English narration (pending fork-specific scripts)
│   └── icons/game/             Game SVGs (Fluent Emoji + custom fertilizer)
├── scripts/
│   └── calibration-report.mjs  npm run calibrate
├── tests/                      25 Vitest specs
├── e2e/                        Playwright full-session smoke tests
└── CLAUDE.md                   Spec bundle for Claude Code agents
```

## State machine

Forward-only. Every transition and per-round phase change checkpoints to IndexedDB. Crash mid-session → resume at the last screen + phase on next load.

```
WELCOME → ENUMERATOR_SETUP → LANGUAGE_SELECT → INSTRUCTIONS
  → [TRAINING]               (only if arm.training === true)
  → PRACTICE                 (1 round, not counted)
  → ROUND × 8                (8 incentivized rounds)
  → FINAL_PAYOUT → SURVEY → COMPLETION
```

Per-round phases: `BRIEFING → DOSE → CONFIRM → REVEAL → SUMMARY`.

## Calibration

`npm run calibrate` runs `scripts/calibration-report.mjs` against the current `lib/schedules.js` + `lib/constants.js → GAME.YIELD/PRICE_LEVELS` and prints:

- Optimal dose per round, expected revenue at d* vs. dose 0, gap, share of revenue gap captured at d*.
- A summary line: how many distinct optimal doses across the 8 rounds (must be ≥ 2; ≥ 5 is the current target).

`tests/calibration.test.js` pins these health properties. Run after any change to schedules or yield parameters.

## Admin panel

4-finger long-press on Welcome (or tap the top-right corner). Default PIN: `1234` (configurable via the Dexie `config` table).

Tabs: **Sessions**, **Sync** (server URL + Test + Sync now), **Export / Import** (JSON + Sessions / Rounds / Dose-Trajectory CSVs + participant CSV import), **Diagnostics** (battery, storage, SW status).

## Testing before PR

- `npm test` — 25 green
- `npm run calibrate` — calibration still healthy
- `npm run build` — clean, no warnings
- If you touched yield/schedule math: confirm `tests/schedules.test.js` ("optimal dose takes at least 2 distinct values") still passes
- Manual: click through a full session in DevTools 1280×800 landscape, ideally on both a `train` and `notrain` arm

## Known landmines

- **Don't rename** any `SCREENS.*` or `PHASES.*` constant — these are state-machine keys, database columns, and event-log payload fields. Grep-replace breaks the sync server's schema validation.
- **Don't change yield parameters** in `lib/constants.js` without re-running `npm run calibrate` and re-pinning `tests/calibration.test.js`. Research runs on these values.
- **Don't add back buttons.** Forward-only state machine is a design invariant.
- **Don't remove the rain × dose interaction** in the yield model — `MULT[rain]` is what makes the optimal dose move across rain distributions. Without it the experiment has no identifying variation.
