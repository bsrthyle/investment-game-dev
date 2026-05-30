# CLAUDE.md — Investment Game PWA

## Project Overview

This is a **tablet-based lab-in-the-field experiment app** in which smallholder farmers make repeated fertilizer-dose decisions on maize under rainfall and market-price uncertainty. **v2:** the in-game display/training arm has been removed — game *exposure* is the treatment (assigned outside the app), and the hypothesis is that *playing* the game builds familiarity with that uncertainty.

The app is deployed on Android tablets in **Nigeria** for **Hausa-speaking** participants. It must work **fully offline** after initial load.

**Read these docs before writing any code** (at repo root, one level up from this folder):

- `../docs/fork/research_plan.md` — Hypotheses, design, outcomes, PAP sketch, limitations. The source of truth for *what the experiment tests*.
- `../docs/fork/CONTEXT.md` — Session-handoff context: design decisions, what changed from the parent study, what's not done.
- `../docs/project/ROADMAP.md` — What's next, work items, owners.
- `../docs/project/TRANSLATION_TODO.md` — Hausa native-speaker review queue.
- `../docs/archive/` — **Historical only.** Predecessor-study artifacts kept for reference. Not authoritative; see its `README.md` for what's there and why.

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **React 18** (via Vite) | Component model maps to screen-based game flow |
| Styling | **Tailwind CSS v3** | Rapid iteration, responsive by default |
| State | **Zustand** | Lightweight store; the app is a linear state machine |
| Offline storage | **Dexie.js** (IndexedDB wrapper) | Structured, transactional, survives browser crashes |
| PWA / caching | **Workbox** (vite-plugin-pwa) | Precache all assets for full offline operation |
| Audio | HTML5 `<audio>` with preload | Narration playback, no streaming |
| Recording (optional) | `MediaRecorder` API | Background conversation capture |
| Build | **Vite** | Fast builds, good PWA plugin ecosystem |
| Testing | **Vitest** + **Playwright** | Unit tests for game logic, E2E for flow |
| Sync backend | **Cloudflare Workers** + **Neon Postgres** | See `../investment-game-server/` |

**Do NOT use:** Next.js, Redux, Axios, any CSS-in-JS library, any UI component library (no MUI, Chakra, etc.). Keep dependencies minimal for offline bundle size.

---

## Project Structure

```
investment-game/
├── CLAUDE.md
├── public/
│   ├── audio/ha/                  # Hausa narration MP3s (pending recording)
│   ├── audio/en/                  # English narration MP3s (pending fork-specific)
│   └── icons/game/                # Game SVG icons (Fluent Emoji + custom fertilizer)
├── src/
│   ├── main.jsx                   # App entry
│   ├── App.jsx                    # Root: renders current screen from state machine
│   ├── store/
│   │   ├── gameStore.js           # Zustand store: screens, phases, rounds, session
│   │   ├── eventLog.js            # Append-only interaction event logger → IndexedDB
│   │   └── recordingStore.js      # Audio recording lifecycle
│   ├── screens/                   # One component per game screen
│   │   ├── Welcome.jsx
│   │   ├── LanguageSelect.jsx
│   │   ├── EnumeratorSetup.jsx
│   │   ├── Instructions.jsx       # Text-only stub (narration TBD)
│   │   ├── Training.jsx           # 3-step probability-comprehension module (all players)
│   │   ├── Practice.jsx           # Practice round (wraps RoundBody)
│   │   ├── Round.jsx              # 10 incentivized seasons (wraps RoundBody)
│   │   ├── RoundBody.jsx          # Shared 5-phase round flow: briefing → dose → confirm → reveal → summary
│   │   ├── FinalPayout.jsx
│   │   ├── Survey.jsx
│   │   └── Completion.jsx
│   ├── components/                # Reusable UI components
│   │   ├── RiskDisplay.jsx        # Always renders the icon-array distribution (v2: no arm)
│   │   ├── IconArray.jsx          # 10-icon frequency grid (largest-remainder distribution)
│   │   ├── ConfirmDialog.jsx      # "Are you sure?" modal at plant-confirm
│   │   ├── InfoPopover.jsx        # Click-to-explain "i" tooltip
│   │   ├── ErrorBoundary.jsx      # Per-screen error catch
│   │   ├── StatusBar.jsx          # P# / E# / online / battery chips
│   │   └── DevResetButton.jsx     # Dev-only: wipe local session + return to Welcome
│   ├── lib/
│   │   ├── constants.js           # GAME params, PHASES, FLOW, DISPLAY_FORMAT, NG locale
│   │   ├── schedules.js           # 10-round rain + price probability vectors (self-validating)
│   │   ├── yieldModel.js          # computeYield / computeRevenue / expectedRevenue / optimalDose
│   │   ├── randomize.js           # drawCategorical + newRoundSeed (per-round seeded draws)
│   │   ├── db.js                  # Dexie schema + upsertSession + config helpers
│   │   ├── sync.js                # Post sessions + audio chunks to Worker backend
│   │   ├── export.js              # JSON + wide Sessions / long Rounds / Dose-Trajectory CSVs
│   │   └── recording.js           # MediaRecorder + AES-GCM encryption
│   ├── admin/                     # Enumerator admin panel (PIN-gated, 4 tabs)
│   │   ├── AdminPanel.jsx
│   │   ├── SessionsTab.jsx
│   │   ├── SyncTab.jsx
│   │   ├── ExportTab.jsx
│   │   └── DiagnosticsTab.jsx
│   └── i18n/
│       ├── en.json                # English strings
│       ├── ha.json                # Hausa (native-speaker review pending)
│       └── index.js               # t() helper + language store
├── tests/
│   ├── yieldModel.test.js         # Pure yield/revenue math
│   ├── schedules.test.js          # 8-round schedule validation + interior-optimum check
│   ├── randomize.test.js          # Arm assignment uniformity + draw distribution
│   ├── iconArray.test.js          # Largest-remainder allocation correctness
│   └── calibration.test.js        # Schedule + yield-model health (interior d*, non-trivial gap)
├── scripts/
│   └── calibration-report.mjs     # Dev tool: npm run calibrate
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Architecture Rules

### State Machine

The app is a **strict linear state machine**. There is no routing library. The Zustand store holds a `currentScreen` string, and `App.jsx` renders the corresponding component.

```
WELCOME → ENUMERATOR_SETUP → LANGUAGE_SELECT → INSTRUCTIONS
  → TRAINING   (v2: runs for every player)
  → PRACTICE   (1 round, not counted toward payout)
  → ROUND × 10 (incentivized seasons; gameStore.currentRoundIndex tracks which)
  → FINAL_PAYOUT → SURVEY → COMPLETION
```

Per-round sub-phases (tracked in `currentRoundPhase`):

```
BRIEFING → DOSE → CONFIRM → REVEAL → SUMMARY
```

**Rules:**
- Transitions are **forward-only**. No back button in the game flow.
- Every transition calls `logEvent(screen, 'screen_transition', { from, to })` with a timestamp.
- State is **checkpointed to IndexedDB** after every screen and phase transition. If the app crashes and reloads, it resumes from the last checkpoint.
- The practice round is **mandatory** and cannot be skipped.

### Experimental design (v2)

**No in-game arm.** Game *exposure* (play vs. don't-play) is the treatment and is assigned outside the app. `treatmentGroup` (Control/T1/T2/T3) records the parent-study assignment for linkage. Everyone who plays gets the identical experience, fixed in `constants.js`:

| Setting | Value |
|---|---|
| `DISPLAY_FORMAT` | `distribution` (full icon array) |
| `TRAINING_ENABLED` | `true` (training for all) |

### Offline-First

- **All assets** (HTML, JS, CSS, images, audio) are precached by the Service Worker on first load.
- **No network requests** during gameplay. The app is 100% self-contained after install.
- Game session data is written to IndexedDB immediately, never held only in memory.
- Data sync happens **only** from the admin panel or automatically when connectivity is detected post-session.

### Data Integrity

- Every user action produces an event written to an append-only log in IndexedDB.
- Session data is **never deleted** from the device until the server confirms receipt.
- Per-round rain/price seeds are persisted alongside the raw uniform draws so outcomes can be independently verified.
- All timestamps use `performance.now()` for sub-millisecond precision within a session, anchored to a `Date.now()` session start time.

---

## Key Implementation Notes

### Token Budget Enforcement

- Each round starts with a **25-token endowment**.
- Fertilizer dose: 0–10 units × 1 token each (`GAME.FERTILIZER.COST_PER_UNIT`).
- Tokens remaining = 25 − dose. Must be ≥ 0; the stepper UI **prevents** overshoot.
- Savings (= 25 − dose) flow into the round's revenue floor, guaranteeing a non-negative payout even in drought + low-price + max-dose worst case.

### Yield model

```
yield(dose, rain) = max(FLOOR, BASE + SHOCK[rain] + MULT[rain] * (ALPHA*dose - BETA*dose²))
revenue           = savings + yield × PRICE_LEVELS[price]
```

`MULT` (multiplicative rain × dose interaction) is **load-bearing.** Without it, the optimal dose barely moves across rainfall distributions and the experiment loses identifying variation. `tests/schedules.test.js` ("optimal dose takes at least 2 distinct values") guards this.

Parameters live in `lib/constants.js → GAME.YIELD` and `GAME.PRICE_LEVELS`. After any change, run `npm run calibrate`.

### Risk-display behavior

`components/RiskDisplay.jsx` always renders the **distribution** format: a 10-icon array via `IconArray` showing the full discrete probability (largest-remainder allocation summing to 10). v2 removed the `point` and `range` formats and the display arm — showing the whole distribution is the point, since the game is meant to build familiarity with the uncertainty.

### Probability-comprehension training (all players)

`screens/Training.jsx` runs a 3-step module before the practice round:

1. Worked icon-array example explaining the "X out of 10 seasons" framing.
2. Second example with a different distribution + self-quiz reveal.
3. Forced 2-question comprehension check that must be answered correctly before proceeding. Each attempt is logged.

### Confirmation Before Planting

When the participant taps **Plant**, a `ConfirmDialog` appears: "Are you sure? You cannot change your decision after planting." The confirm button is offset from the plant button to prevent accidental double-tap.

### Outcome Determination

Rain and price are drawn **at plant-confirm**, not pre-determined. Seeds: `${participantId}-r${i}-rain` and `${participantId}-r${i}-price` (and `…-practice-…` for the practice round). The seed and the raw uniform draw are persisted alongside the outcome.

### Audio Narration

Narration audio for the fork is **not yet recorded.** `Instructions.jsx` is currently a text-only stub. When narration is recorded, the standing pattern is:

- Auto-play on mount.
- "Next" button disabled until audio finishes (or enumerator long-press to override).
- Replay button always visible.
- Screen text is the fallback if audio fails.

### Payout Calculation

`FinalPayout.jsx` shows the per-season revenue grid (10 seasons), the practice-round revenue (informational only, not added to the payout), the total revenue in tokens, and the conversion to NGN using the per-session `currencyRate`.

### Enumerator Admin Panel

Accessed via **4-finger tap** on the Welcome screen (or a hidden corner button). Protected by a simple PIN (default: 1234, configurable). Four tabs:

- **Sessions** — list, status, resume, delete.
- **Sync** — backend URL, test connectivity, sync now.
- **Export / Import** — JSON + wide Sessions CSV + long Rounds CSV + Dose-Trajectory CSV. Participant-list CSV import.
- **Diagnostics** — battery, storage, service-worker status.

---

## Coding Standards

- **Components:** Functional only. No class components.
- **State:** Game state in Zustand stores. No prop drilling beyond 1 level. Use the store directly.
- **Side effects:** `useEffect` for audio playback and IndexedDB writes. Keep effects minimal.
- **Event logging:** Every user-facing interaction (tap, stepper change, screen view) must call `logEvent()`. Non-negotiable for research data quality.
- **Accessibility:** All interactive elements have `aria-label`. Touch targets ≥ 56px. High contrast text (4.5:1 minimum).
- **No scrolling** in game screens. Everything fits a single viewport (landscape tablet, 1280×800).
- **Landscape orientation only.** Lock via `manifest.json` and CSS.
- **No external network requests** during gameplay. Ever.
- **Error boundaries:** Each screen wrapped at the App level; on error, logs + offers Resume or Contact-enumerator.

---

## Testing Requirements

Before any PR is considered complete:

1. **Yield + schedules:** `npm test` runs the full Vitest suite. All 23 specs must pass.
2. **Calibration health:** `npm run calibrate` reports interior optimal doses (1 < d* < 10) in all rounds, ≥ 2 distinct optimal doses across the session, and a non-trivial expected-revenue gap between d* and dose 0.
3. **State persistence:** Manual — kill the app at every screen transition and verify it resumes correctly.
4. **Offline test:** Disable network after initial load. Complete a full session. Verify all data is in IndexedDB.

---

## Deployment

1. Build: `npm run build` → produces `dist/` folder
2. Deploy: `npx wrangler pages deploy dist --project-name=investment-game`
3. Field tablets navigate to the URL once (with connectivity), Service Worker caches everything
4. All subsequent use is offline
5. To update: push new build, tablets pick up the update on next connectivity
