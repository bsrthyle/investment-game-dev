# Fork Context — session handoff

Portable context document for `fork/fertilizer-risk-comms`. Drop this
into a fresh Claude Code session on any machine to pick up where the
previous session left off. Everything below is captured from the
development session that produced commits `94d24c7` and `578cd3b`.

---

## TL;DR

- Forked the GEF Investment Game (seeds + insurance bundling study) into a
  fertilizer dose decision game with two independent uncertainty sources
  (rainfall + market price).
- Target population: smallholder maize farmers in Nigeria, Hausa-speaking.
- Six-arm between-subject design: **3 display formats × 2 training
  conditions**. Assigned deterministically from `participantId`.
- 8 real rounds + 1 practice. Rain and price schedules shift between rounds
  and are *announced* before each round (the test is about interpretation,
  not inference).
- 25 Vitest specs green. Dev server runs via `npm run dev` from
  `investment-game/`. Calibration via `npm run calibrate`.
- **Not committed yet:** this `CONTEXT.md`, `docs/fork/research_plan.md`.
- **Not pushed anywhere.** Branch lives locally.

---

## Picking up on a new machine

```bash
git clone git@github.com:bsrthyle/investment-game-dev.git
cd investment-game-dev
git checkout fork/fertilizer-risk-comms   # once the branch is pushed
# (until then, work from a laptop that has the branch locally)

cd investment-game
npm install
npm run dev          # http://localhost:5173
npm test             # 25 specs
npm run calibrate    # dev-time report on yield/schedule health
```

If the branch hasn't been pushed yet, the work lives only on the machine
that produced it. First step on a new machine should be `git fetch` +
check `git branch -r` to see if `origin/fork/fertilizer-risk-comms`
exists. If not, push it from the original machine before continuing.

---

## What this fork changed

### Design pivot
| | Before (stable) | After (this fork) |
|---|---|---|
| Research question | Does bundling seeds + insurance affect demand? | Does the *format* of risk communication change fertilizer dose decisions? |
| Uncertainty sources | Rain only | Rain **and** price (independent) |
| Decision | Buy seeds / insurance / bundle (binary × binary) | Fertilizer dose 0–10 (integer stepper) |
| Treatment | Version A vs B (product-design variants) | 6 arms: `{point, range, distribution} × {notrain, train}` |
| Rounds | Practice + R1 + R2 (3 rounds, 2 counted) | Practice + 8 real rounds |
| Country / language | UG+ZM, en/lg/bem | NG, en/ha |
| Sync backend | Expected old schema | **Still expects old schema — will 400 on new-format uploads until updated** |

### New modules under `investment-game/src/`

| Path | Purpose |
|---|---|
| `lib/schedules.js` | 8-round rain + price probability vectors. Self-validates at module load. |
| `lib/yieldModel.js` | `computeYield`, `computeRevenue`, `expectedRevenue`, `optimalDose`. |
| `components/RiskDisplay.jsx` | Switches on `arm.display` to render point / range / distribution. |
| `components/IconArray.jsx` | 10-icon frequency grid with largest-remainder distribution. |
| `screens/RoundBody.jsx` | Shared 5-phase round flow: briefing → dose → confirm → reveal → summary. |
| `screens/Round.jsx` | Thin wrapper: uses `RoundBody` with current round's schedule. |
| `screens/Practice.jsx` | Thin wrapper: uses `RoundBody` with practice schedule. |
| `screens/Training.jsx` | 3-step probability-comprehension module (concept → count → check). |
| `i18n/ha.json` | Hausa placeholder translations (native-speaker review pending). |
| `scripts/calibration-report.mjs` | Dev-time report. `npm run calibrate`. |

### Rewritten modules
- `lib/constants.js` — `GAME`, `PHASES`, `FLOW`, `DISPLAY_FORMATS`, `ARM_IDS`, `NG` locale.
- `lib/randomize.js` — `assignArm`, `drawCategorical`, `newRoundSeed`.
- `lib/export.js` — new wide Sessions CSV, long Rounds CSV, Dose Trajectory CSV.
- `store/gameStore.js` — `rounds[]` array, `currentRoundPhase`, `advanceRound`.
- `screens/EnumeratorSetup.jsx` — Nigeria only, arm preview.
- `screens/FinalPayout.jsx` — per-round revenue grid, NGN total.
- `screens/Survey.jsx` — seeds/insurance comprehension questions dropped.
- `screens/Instructions.jsx` — text-only stub (original narrated videos retired).
- `admin/ExportTab.jsx`, `admin/SessionsTab.jsx` — arm column, new CSVs.

### Deleted
- `lib/payout.js` (old seed/insurance math).
- `i18n/lg.json`, `i18n/bem.json` (Uganda/Zambia languages).
- All `Round1*`, `Round2*`, `Practice*`, `VideoOffer`, `InsuranceVideo`, `RoundSummary`, `ScreenStub`, `WeatherShared`, `FertilizerOnlyDecision` screens.
- Old tests: `payout.test.js`, `gameflow.test.js`, original `randomize.test.js`.

---

## Design decisions — the stuff not obvious from the code

These are the judgment calls made during the session. Flag with the PI
if any feels wrong.

### Yield function has a multiplicative rain-dose interaction
```
yield(dose, rain) = max(0, BASE + SHOCK[rain] + MULT[rain] * (α·dose − β·dose²))
```
Without `MULT` the optimal dose barely moves with the rainfall
distribution — the whole experiment loses identifying variation.
`MULT = {good: 1.2, normal: 1.0, drought: 0.3}` makes drought
*substantially* reduce the marginal return to fertilizer. This is a
design feature. A test in `tests/schedules.test.js` ("optimal dose
takes at least 2 distinct values") guards against accidentally
flattening this out.

### Revenue includes a 25-token endowment floor
```
savings = 25 − dose * 1
revenue = savings + yield × price_level
```
This guarantees a non-negative payout floor even in the drought + low
price + max dose worst case. Matches the lockbox framing from the
original study. Without it, revenue could go as low as −10 tokens.

### Randomization is deterministic from `participantId`
- Arm assignment: `assignArm(participantId)` → uniform over 6 cells.
- Per-round draws: seed = `${participantId}-r${i}-{rain|price}`. Seeds
  and raw-uniform draws are persisted so outcomes are reproducible.

### Rain and price are drawn *at plant confirmation*, not before
Matches the research-integrity pattern from the original study. The
participant's dose decision cannot leak information from the eventual
outcome.

### Round order is currently fixed 1→8
This is a limitation. Fatigue confounds round index. `docs/fork/research_plan.md` §10 recommends randomizing order before
main fielding.

### None of the three display formats shows numeric probabilities
- `point`: "Most likely: good rain" (word only)
- `range`: "Most likely … Unlikely" (two words)
- `distribution`: icon array (visual)

This makes the three arms a "how much of the distribution do we
reveal" ladder, not a "numbers vs. words vs. pictures" comparison.
Different experimental axis; confirm this is what the PI wants. See
research plan §10.

### Current calibration
First-pass. All 8 rounds have interior optimal doses (1 < d* < 10),
span 5 values (5, 6, 7, 8, 9). Total optimal-vs-zero revenue gap
≈ 32 tokens across the session (~16% of baseline). Rounds 5 and 8
have the smallest per-round gaps (~1.6 tokens) and are candidates for
tuning. Run `npm run calibrate` to see current numbers. Four tests
in `tests/calibration.test.js` pin the health properties.

---

## Persisted session data shape

Anything in the participant's session object is exportable via the
admin panel (JSON + several CSVs). Key fields, for reference:

```
session = {
  sessionId, participantId, enumeratorId, country: 'NG',
  partner, treatmentGroup, language, currencyRate,
  arm: { display, training, id },    // e.g. { 'distribution', true, 'distribution-train' }
  sessionStartTime, sessionEndTime,
  currentScreen, currentRoundIndex, currentRoundPhase,   // checkpoint state
  training: {
    completed, correctOnFirstTry,
    attempts: { drought_count: N, price_mode: N },
    finalAnswers,
  },
  practiceRound: { dose, rainOutcome, priceOutcome, yield, revenue, ... },
  rounds: [ /* 8 × */ {
    roundIndex, dose, fertilizerUsed,
    rainSeed, rainDraw, rainOutcome,
    priceSeed, priceDraw, priceOutcome,
    yield, priceLevel, savings, revenue,
    decisionDurationMs, doseTrajectory: [{t, value}, ...],
  }],
  survey: { gender, ageRange, educationLevel, householdSize, mainCrop, usesFertilizer, ... },
  totalRevenueTokens, totalPayoutCurrency,
  syncStatus,
}
```

Event log (separate Dexie table `events`):
- `screen_enter`, `screen_exit`, `screen_transition`, `phase_transition`
- `round_enter`, `round_exit`, `round_advance`, `rounds_complete`
- `dose_change`, `plant_confirmed`
- `training_answer`, `training_complete`
- `survey_answer`, `survey_answer_change`
- `session_start`, `session_complete`

---

## What's NOT done

In rough priority order. Fuller treatment in `docs/fork/research_plan.md`
§9 and §10.

### Critical before piloting
- [ ] Native-speaker review of `src/i18n/ha.json`.
- [ ] Record and integrate Hausa narration audio (instructions,
      training module, per-round briefings).
- [ ] Write and pre-register the PAP on AEA RCT Registry.
- [ ] IRB / ethics approval.
- [ ] Pilot on 30–50 participants.
- [ ] Decide whether `point` treatment includes a numeric probability
      (currently does not).

### Recommended before main fielding
- [ ] Thread the ~40–60 hardcoded English strings in new screens
      (`RoundBody.jsx`, `Training.jsx`, `Survey.jsx`, `FinalPayout.jsx`
      body text) through `t()`.
- [ ] Post-round attention check: 1 question per round, "how many of
      the 10 seasons shown had drought?" to separate comprehension
      from choice.
- [ ] Randomize round order per participant.
- [ ] Add numeracy pre-test (Lipkus 3-item or Berlin Numeracy).
- [ ] Add probability-comprehension items to post-game survey.
- [ ] Update the sync backend (Cloudflare Worker) Zod schemas to
      accept the new session payload shape.
- [ ] Tighten calibration on rounds 5 and 8 if per-round power matters.

### Not pre-committed decisions
See `docs/fork/research_plan.md` §11 for 8 open questions for the PI.

---

## Key file pointers

- `docs/fork/research_plan.md` — full research design, hypotheses,
  outcomes, PAP sketch, timeline, limitations. The source of truth
  for *what the experiment is and what it tests*.
- `docs/fork/CONTEXT.md` — this file. Session handoff / portable
  context.
- `investment-game/src/lib/schedules.js` — the 8-round rain + price
  schedules. Edit here if you want to tune distributions.
- `investment-game/src/lib/constants.js` — `GAME.YIELD` and
  `GAME.PRICE_LEVELS` live here. Edit here to retune yield math.
- `investment-game/scripts/calibration-report.mjs` — run after any
  calibration edit. `npm run calibrate`.
- `investment-game/tests/` — 25 specs. `npm test`.
- `CLAUDE.md` at repo root — general repo guide for Claude Code
  sessions (not fork-specific).
- `investment-game/CLAUDE.md` — PWA-specific guide. Note: has some
  stale text describing the sync backend as Node+Express+Docker; the
  actual backend is Cloudflare Workers + Neon. Flagged in root
  `CLAUDE.md`.

---

## Git state at time of handoff

- **Branch:** `fork/fertilizer-risk-comms` (branched from `main`).
- **Committed:** `Add CLAUDE.md repo guide` (`94d24c7`), `Fork PWA
  to fertilizer risk-communication experiment` (`578cd3b`).
- **Uncommitted:** `docs/fork/research_plan.md`, `docs/fork/CONTEXT.md`.
- **Not pushed to any remote.** The branch lives only on the original
  development machine.

---

## One-line prompt for a fresh Claude session

> I'm picking up a fork of the GEF Investment Game on branch
> `fork/fertilizer-risk-comms` that turns it into a fertilizer
> risk-communication experiment for Hausa-speaking maize farmers in
> Nigeria. Full context is in `docs/fork/CONTEXT.md` — start there,
> then `docs/fork/research_plan.md` for the research design. The
> working app is in `investment-game/` with 25 tests, run
> `npm run dev` to serve it, `npm run calibrate` to check the
> experimental parameters.
