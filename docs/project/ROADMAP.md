# ROADMAP — Fertilizer Risk-Communication Experiment

What's done, what's next. Sourced from `docs/fork/CONTEXT.md` and `docs/fork/research_plan.md` §10/§11.

For the experimental design, see [`docs/fork/research_plan.md`](../fork/research_plan.md).
For the codebase-level handoff, see [`docs/fork/CONTEXT.md`](../fork/CONTEXT.md).

---

## Status snapshot

- **Game logic** — 1 practice + 8 incentivized rounds, fertilizer dose 0–10 from a 25-token endowment, two independent uncertainty sources (rain `good/normal/drought`, price `high/mid/low`), per-round seeded draws at plant-confirm, 6-arm `display × training` factorial assigned deterministically from participantId.
- **Tests** — 25 Vitest specs green: yield math, schedules, randomization, calibration health, IconArray allocation.
- **Calibration** — first-pass. All 8 rounds have interior optimal doses (1 < d* < 10), spanning 5 distinct values. Total expected-revenue gap d* vs. d=0 ≈ 32 tokens across the session.
- **Content** — Instructions screen is a text-only stub; narration audio for the fork is not yet recorded. Hausa translations in `i18n/ha.json` are placeholders pending native-speaker review.
- **Infra** — PWA builds clean, runs offline. Sync backend (Cloudflare Worker + Neon) currently 400s on the new payload — Zod schemas need updating to the fork's shape.

---

## Track A — Critical before piloting

| ID | Item | Notes |
|---|---|---|
| A1 | **Hausa native-speaker review** of `investment-game/src/i18n/ha.json`. | See `docs/project/TRANSLATION_TODO.md`. |
| A2 | **Record + integrate Hausa narration audio** for instructions, training module, per-round briefings, and end-of-session prompts. | The Instructions screen is a stub today. Once scripts are written, drop MP3s in `public/audio/ha/` and wire from screen components. |
| A3 | **Update sync-backend Zod schemas** to accept the new session payload (`arm`, `training`, `rounds[8]`, `rainOutcome ∈ {good,normal,drought}`, `priceOutcome ∈ {high,mid,low}`, `doseTrajectory`). | Right now `investment-game-server/src/schemas.js` still expects the old seeds/insurance fields; uploads 400. Offline export works either way, but field sync requires this. |
| A4 | **Pre-register the PAP** on the AEA RCT Registry. | After PI sign-off on §11 open questions. |
| A5 | **IRB / ethics approval** for the fertilizer game design. | |
| A6 | **Pilot** on 30–50 participants. | Capture session length, comprehension, qualitative debrief. |
| A7 | **PI decision on the `point` arm**: include a numeric probability or not? | See `docs/fork/research_plan.md` §11 Q1. |
| A8 | **Decide currency rate + show-up fee.** | The 10 NGN/token default is a placeholder. Lock with the implementing partner and IRB. |

---

## Track B — Recommended before main fielding

| ID | Item | Notes |
|---|---|---|
| B1 | **Thread hardcoded English strings** in new screens through `t()`. | ~40–60 strings across `RoundBody.jsx`, `Training.jsx`, `Survey.jsx`, `FinalPayout.jsx`. |
| B2 | **Post-round attention check.** | One question per round, e.g. "how many of the 10 seasons shown had drought?" Separates comprehension from choice. |
| B3 | **Randomize round order** per participant. | Currently fixed 1→8. Fatigue confounds round index. |
| B4 | **Numeracy pre-test** (Lipkus 3-item or Berlin Numeracy). | Either before the game or embedded in `EnumeratorSetup`. Adds ≤ 2 minutes. |
| B5 | **Probability-comprehension items** in post-game survey. | Lets us measure dose-effect of training independently of behavior. |
| B6 | **Tighten calibration on rounds 5 and 8.** | These have the smallest per-round revenue gaps (~1.6 tokens each). Optional — only matters if per-round power is needed. |
| B7 | **Pre-session diagnostics** in admin panel. | "Is service worker active? Storage healthy? Battery > 20%? All narration files cached?" — one green Ready light. |
| B8 | **Install prompt.** | Trigger `beforeinstallprompt` so tablets install as standalone PWA with orientation lock, instead of via the browser menu. |

---

## Track C — Analysis + follow-up (longer horizon)

| ID | Item | Notes |
|---|---|---|
| C1 | **Follow the PAP.** Deviations go in a post-hoc section. | |
| C2 | **Exploratory — dose-trajectory analysis.** | Stepper trajectory log captures the full path. Measure time-to-first-commit, revision count, settlement dose. |
| C3 | **Exploratory — revealed risk preferences.** | 8 rounds × (dose × outcome) lets you estimate an individual risk-aversion parameter. Compare to arm assignment. |
| C4 | **Field-behavior follow-up at 6 months.** | Return to participants, measure real fertilizer use on next maize crop. Expensive but it's the policy outcome. |
| C5 | **Generalize beyond maize.** | Game is structurally generic; swap the yield function for cassava / rice / sorghum. |

---

## Open design questions for the PI

Decisions that need to be locked before pre-registration. Full discussion in `docs/fork/research_plan.md` §11.

1. Does the **`point` arm** include a numeric probability, or only the most-likely outcome?
2. Should **round order** be randomized or fixed 1→8?
3. Is **8 rounds** the right number, or does fatigue dominate after 6?
4. Should participants see **correlated** rain × price draws at some point to test sophistication, or keep strict independence?
5. Is the **training module in the right place** (before practice)? Alternatives: optional "learn more" button, harder check, video format.
6. **Final NGN/token rate** + show-up fee.
7. Does the sample need a **numeracy / education quota**?
8. **IRB or research-integrity review** sign-off on incentives, payout floor, consent language.
