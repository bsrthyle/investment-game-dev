# Risk Communication in Fertilizer Decisions — Research Plan

A lab-in-the-field experiment testing how the *presentation* of
rainfall and market-price uncertainty changes smallholder farmers'
fertilizer dose decisions on maize.

> Status: design draft, v0.1. Calibration is first-pass. Not yet
> pre-registered. Hausa translations pending native-speaker review.
> Sample size, training module content, and final yield function
> should be locked before piloting.

---

## 1. Motivation

Extension services in Nigeria and much of West Africa routinely deliver
fertilizer recommendations to smallholder farmers. Two things are almost
always true about those recommendations:

1. They are communicated as **point estimates** — a single recommended
   dose, a single expected yield, a single expected price — even though
   the underlying agronomics and markets are substantially uncertain.
2. The farmer's actual profit depends on at least two uncertain
   variables that move independently: **rainfall** (through its effect
   on yield) and **output price** (through the market at harvest time).

The research question: does it matter *how* we communicate the
uncertainty in these two variables? Specifically —

> If we present the same underlying probability distribution to two
> otherwise-identical farmers in different formats (point estimate vs.
> range vs. full distribution), do they make different fertilizer
> investment decisions? And does a short module on interpreting
> probabilities change that effect?

This matters because (a) extension systems can cheaply change *how*
they communicate risk without changing *what* they communicate, and
(b) most decision-quality losses from misunderstood risk show up as
over- or under-application of inputs — exactly the decision this game
elicits.

Related literatures to cite in any write-up: frequency framing
(Gigerenzer & Hoffrage, 1995; Galesic et al., 2009), numeracy and risk
decisions (Lipkus, Samsa & Rimer, 2001; Peters, 2012), fertilizer
under-use in African agriculture (Duflo, Kremer & Robinson, 2011;
Suri, 2011), and index-insurance take-up experiments for
comparable methodology (Cai, 2016; Karlan et al., 2014).

---

## 2. Setting

- **Country:** Nigeria.
- **Language:** Hausa (primary), with English fallback for enumerators.
- **Population:** smallholder maize farmers in a northern Nigerian
  state (to be finalized with implementing partner).
- **Device:** Android tablet, fully offline-capable after install.
- **Session length:** expected 30–45 minutes per participant including
  consent, training (if assigned), 1 practice + 8 real rounds, and
  post-game survey.
- **Payout:** performance-based, in Nigerian Naira (NGN). Default
  conversion rate 10 NGN/token; expected total payout ≈ 3,000 NGN per
  participant before any show-up fee. **This rate is an
  enumerator-editable placeholder — decide the final value jointly
  with the implementing partner and IRB before pilot.**

---

## 3. Experimental design

### 3.1 Treatments

A **3 × 2 between-subject factorial**. Every participant is assigned to
one cell and stays in that cell for the entire session.

**Factor A — Uncertainty display format** (3 levels):

| Label | What the participant sees before each round |
|---|---|
| `point` | A single headline: "Most likely: good rain." No numbers, no alternative outcomes. |
| `range` | Two endpoints: "Most likely: good rain … Unlikely: drought." The middle outcome and any numbers are omitted. |
| `distribution` | A 10-icon array showing every outcome, coloured by type, counts summing to 10. The full discrete distribution. |

All three formats describe the *same* underlying probability vector
for each round (e.g., a 70/20/10 split over good/normal/drought).
They differ only in how much of the distribution is revealed.

**Factor B — Probability-comprehension training** (2 levels):

| Label | Experience before the practice round |
|---|---|
| `notrain` | Straight to instructions → practice round. |
| `train` | 3-step module before instructions: (1) worked icon-array example explaining the "X out of 10 seasons" framing, (2) a second example with an unfamiliar distribution and a self-quiz reveal, (3) a forced 2-question comprehension check that must be answered correctly before proceeding. Each attempt is logged. ~5 minutes. |

**The six cells:** `point-notrain`, `point-train`, `range-notrain`,
`range-train`, `distribution-notrain`, `distribution-train`.

### 3.2 Why this axis?

I considered four alternative structures:

- *Format × numeric* (words vs. percentages vs. icons): tests
  representation, not level of disclosure. Rejected because the
  extension-advice setting is more often "say less or say more," not
  "say it in words or numbers."
- *Training-only* (all formats identical, half get training):
  underpowered to detect interaction between training and display.
- *Uncertainty visibility alone* (3 arms, no training): cleaner main
  effect but loses the policy-relevant interaction — does training
  substitute for, or amplify, richer displays?
- The chosen **3 × 2 factorial** gives us main effects on both axes
  *and* the interaction — e.g., does training matter more under the
  `point` format (where numeracy has less to grip) or under the
  `distribution` format (where there's more to parse)?

### 3.3 Sample and power

At the design target of ~3,200 participants, each of the six cells
gets ≈ 530 observations. With 8 rounds per participant, that is
≈ 4,240 participant-round observations per cell.

Ballpark power (for a continuous outcome like `dose`, within-round
OLS with arm fixed effects and participant random effects):

- Detectable main effect on display format: **≈ 0.7 of a dose unit**
  shift in mean dose between the most and least informative format.
- Detectable training main effect: **≈ 0.5 of a dose unit**.
- Detectable display × training interaction: **≈ 0.8 of a dose unit.**

For context: the current calibration has optimal doses spanning 5
values (5–9) across rounds, and the per-round standard deviation of
revenue at the optimum is ~10 tokens. A one-unit shift in mean dose
is behaviorally meaningful.

**Recommendations before finalizing N:**

- Run a formal power analysis using `pwr` or `Optimal Design`.
- Decide whether you care more about the overall main effect or the
  per-round × arm interaction — the latter needs substantially more N
  because each round's rain distribution is different.
- If total N must be smaller (<2,000), consider **collapsing to 4
  arms** (training off for `point`, training on for `point` and
  `distribution`, etc.) — but do this before fielding, not after.

---

## 4. The game

### 4.1 Structure

```
consent + enumerator setup
  → language pick (en / ha)
  → instructions (text-only for now; narrated video pending)
  → [training module, training arms only]
  → 1 practice round (not counted toward payout)
  → 8 real rounds (counted)
  → final payout screen (total tokens → NGN)
  → post-game survey
  → completion
```

### 4.2 Per-round decision

Each round represents one farming season. The participant sees:

1. **Briefing.** Rainfall outlook and price outlook for this season,
   displayed in the format dictated by their arm.
2. **Decision.** How many "bags" of fertilizer to apply, 0–10, on a
   stepper. Budget is 25 tokens per round; each bag costs 1 token;
   any tokens not spent stay in the lockbox.
3. **Confirm.** A "Are you sure?" modal gate, designed to prevent
   accidental commits.
4. **Rain reveal.** The rainfall outcome is drawn (seeded, logged)
   and animated. Three possible states: good / normal / drought.
5. **Price reveal.** The market price is drawn *independently* of
   rainfall, seeded, logged. Three states: high / mid / low.
6. **Summary.** Tokens saved + harvest value in tokens = round
   revenue. Shown alongside the dose decision for post-hoc review.

### 4.3 The underlying mechanics (research-visible)

- **Rainfall and price are independent.** This is a simplification;
  reality has some negative correlation (glut years suppress price).
  Keeping them independent gives us two *orthogonal* sources of
  uncertainty to communicate, which is the cleanest test of the
  research question. Add correlation later if you want to test
  whether farmers track it.
- **Distributions shift between rounds.** Rainfall P(good) ranges
  from 25% to 80% across the 8 rounds; price P(high) from 10% to 35%.
  Distributions are *announced* each round (not random draws the
  farmer must infer), so the game tests interpretation, not
  inference-from-history.
- **Yield = max(0, BASE + shock[rain] + mult[rain] × (α·dose −
  β·dose²)).** The multiplicative rain-dose interaction is the
  load-bearing feature. Without it, the optimal dose barely moves
  with the rainfall distribution and there is no story to tell.
- **Revenue = (25 − dose) + yield × price_level.** The endowment
  term (25 − dose) guarantees a non-negative floor.

### 4.4 Payoff

Total tokens across all 8 counted rounds → NGN at the enumerator-set
rate. The practice round does not count. Whether there is also a
fixed show-up fee is a field-logistics decision; the analysis should
treat the variable payout as the incentive-compatible piece.

---

## 5. Randomization

All randomization is **deterministic from `participantId`** and
**logged with seeds** so outcomes are reproducible and auditable.

- **Arm assignment.** `assignArm(participantId)` maps to one of 6
  cells uniformly. 60,000-id simulation gives every cell ±8% of
  expected count. Tested.
- **Per-round rainfall and price draws.** Each uses a seed of the
  form `${participantId}-r${roundIndex}-rain|price`, hashed to a
  uniform-[0,1] then bucketed against the announced probability
  vector. Seeds are persisted; any analyst can rerun
  `drawCategorical(seed, states, probs)` and reproduce the outcome
  exactly.
- **Rainfall schedule (announced each round):** 70/20/10, 50/30/20,
  30/30/40, 60/30/10, 40/30/30, 80/15/5, 55/30/15, 25/35/40.
- **Price schedule:** 20/50/30, 15/40/45, 30/40/30, 25/50/25,
  10/40/50, 35/45/20, 20/40/40, 15/50/35.
- **Round order.** Currently fixed (1→8) for all participants.
  Consider randomizing the order per participant (or per batch of
  participants) to break any round-index × fatigue confound —
  currently if participants fatigue over the session, the last few
  rounds' behavior mixes treatment with fatigue.

---

## 6. Hypotheses

Stated as directional predictions; convert to null / alternative pairs
at pre-registration time.

**H1 (main effect of display).** Participants in the `distribution`
arm will pick doses closer to the risk-neutral optimum than
participants in the `point` arm, with `range` in between. Expected
mechanism: icon arrays give clearer access to the distribution's
second moment.

**H2 (main effect of training).** Training participants will pick
doses closer to the risk-neutral optimum than no-training
participants.

**H3 (interaction).** Training has a larger effect in the `point`
arm than in the `distribution` arm, because in the `distribution` arm
the second moment is already visible. I.e., training *substitutes*
for richer displays.

**H4 (risk-aversion shift).** Across all arms, participants will
under-dose relative to the risk-neutral optimum in drought-prone
rounds (rounds 3 and 8). The gap between chosen and optimum dose
should be largest in the `distribution` arm, because the
distribution makes the downside visible. If this is *not* true it is
an interesting null — it would suggest the icon-array treatment does
not sufficiently salience the drought tail.

**H5 (heterogeneity by numeracy).** The benefit of the
`distribution` arm should be larger for more-numerate participants;
conversely, the benefit of *training* should be larger for
less-numerate participants. Collect a numeracy score in the survey
to test this.

---

## 7. Outcomes

### Primary outcome

- **Chosen fertilizer dose** (per participant × per round). 9-level
  integer 0–10. Analysis: panel regression with participant random
  effects and round fixed effects, clustered SEs.

### Secondary outcomes

- **Earnings.** Per-round revenue in tokens. Sum across 8 rounds =
  total participant earnings (and incentive payout).
- **Dose variability across rounds.** Does the participant *adjust*
  dose when the briefing changes, or anchor on a fixed strategy? Use
  SD of dose within participant.
- **Decision time.** Milliseconds from briefing → plant confirmation.
  Fatigue / comprehension signal.
- **Dose trajectory.** Every + / − stepper tap is logged. Captures
  revision count per round (how many times they changed their mind)
  and time-at-first-dose (where they landed first).
- **Training-stage measures** (training arm only): comprehension-
  check first-try accuracy, number of attempts.
- **Comprehension at survey:** add 3–4 probability-comprehension
  items at the end of the survey to estimate both (a) differential
  comprehension by arm and (b) moderator analyses.

### Mechanism / manipulation checks

- Does arm assignment actually shift attention to the distribution?
  Pilot: add a post-round recall question ("what was the chance of
  drought this season?") in a subset. Current plan doesn't include
  this — add if pilot data are ambiguous.

---

## 8. Pre-analysis plan (sketch)

A full PAP should be written and registered on the AEA RCT Registry
before fielding. The key decisions to lock:

1. **Main specification.** Fixed/random effects model for `dose` on
   `arm_display`, `arm_training`, their interaction, round fixed
   effects, controls (demographics, numeracy if measured).
2. **Multiple-comparison policy.** Which subgroup analyses are
   confirmatory and which are exploratory? Rule-of-thumb: pre-register
   ≤ 3 subgroup dimensions (numeracy, education, prior-fertilizer-
   use); everything else is exploratory.
3. **Attrition handling.** Participants who drop mid-session should
   be analyzed ITT where possible; define a completion threshold.
4. **Robustness checks.** Drop the practice round; drop round 8;
   restrict to participants who passed the final survey comprehension
   items; cluster SEs by enumerator.
5. **Effect size we will call meaningful.** Pre-register the minimum
   dose shift (in bags) we would describe as "practically
   significant." Suggested: 0.5 bag = ~10 kg of urea-equivalent at a
   reasonable conversion.

---

## 9. Implementation status

What exists in code today (on branch `fork/fertilizer-risk-comms`):

| Component | Status |
|---|---|
| State machine, offline caching, checkpointing | Inherited, working |
| 6-arm randomization | Working + tested (uniform over 60k ids) |
| 8-round loop, shifting schedules | Working + tested (self-validating schedules) |
| Yield + revenue functions with rain-dose interaction | Working + tested |
| Three display formats (point / range / distribution) | Working |
| Training module (3 steps + comprehension check) | Working; content is placeholder text |
| Hausa language files | Placeholder, **needs native-speaker review** |
| Admin panel exports (Sessions wide, Rounds long, Events, Dose trajectory) | Working |
| Calibration report (`npm run calibrate`) | Working |
| Narrated audio / video for new screens | Not present |
| Survey probability-comprehension items | Not present (dropped with the seed/insurance versions; need to add) |
| Numeracy scale (Schwartz / Lipkus) | Not present |
| Sync backend | Still on the old schema — will reject new-format uploads until updated |

---

## 10. What to do to make this better

Opinionated list, organized by when each action matters. Items marked
**[critical]** should be done before piloting; **[recommended]** are
nice-to-haves; **[optional]** are exploration.

### Before piloting

- **[critical] Native-speaker review of Hausa.** The current
  `ha.json` strings are my best guess and contain words (probability,
  endowment, yield) that native speakers would phrase more naturally.
  Engage a bilingual enumerator for a 2-hour translation review
  session and test on 2–3 participants from the target population
  before committing to the wording.
- **[critical] Narrated audio.** Low-literacy participants will skim
  text-only briefings. Plan: record Hausa narration for (a) the
  instructions screen, (b) the two training example screens, and
  (c) a 10-second intro per round briefing that walks the farmer
  through the format. Budget ~$500 and a week of studio time.
- **[critical] Write and pre-register the PAP.** See §8. Register on
  the AEA RCT Registry.
- **[critical] IRB / ethics review.** Both a local Nigerian IRB and
  (typically) the PI's home-institution IRB. Likely 6–10 weeks.
- **[critical] Pilot on 30–50 participants.** Goals: catch any
  comprehension failures of the icon arrays, measure session length,
  verify the participant-endowment floor actually feels like "they
  always take something home," and gather qualitative notes from
  enumerators.
- **[recommended] Add a pre-round attention check.** A single
  comprehension question after the briefing, before the dose
  decision, e.g. "how many of the 10 seasons shown had drought?".
  Critical for analyzing whether the *intent* of the treatment
  landed. For arms where the participant can't answer, we can
  separate "failed to understand the format" from "understood and
  chose low dose anyway."
- **[recommended] Randomize round order across participants.**
  Breaks the round-index × fatigue confound. Straightforward: shuffle
  the 8 schedules into a per-participant permutation seeded by
  `participantId`.
- **[recommended] Tighten calibration on rounds 5 and 8.** Current
  gap between optimal and zero dose in those rounds is ≈ 1.6 tokens.
  If per-round identification matters for your analysis, bump the
  yield `α` or adjust those rounds' price schedules. Rerun
  `npm run calibrate` and verify all 4 calibration tests still pass.
- **[recommended] Decide on the "point" treatment's exact form.**
  Current code shows the mode-outcome with no probability attached
  ("Most likely: good rain"). A stronger variant shows the mode with
  its probability ("70% chance of good rain"). Pick one explicitly
  — both are defensible, but they test different things.

### At pilot time

- **[critical] Measure session length by arm.** If the `distribution`
  arm takes substantially longer than `point`, build that into your
  analysis plan (decision time is no longer a neutral covariate).
- **[critical] Debrief enumerators.** Which instructions confused
  participants? Which icon-array element was misread? This is the
  one-shot input that's hard to get back later.
- **[recommended] Log service-worker / offline failures.** Tablets
  in field settings have flaky connections; verify the app actually
  survives loss of connectivity after install.

### Before main fielding

- **[critical] Add the comprehension-item battery to the post-game
  survey.** At minimum 3–4 probability items (best: the 3-item
  Schwartz scale) so you can run moderator analysis later.
- **[critical] Lock the `currencyRate`.** Set in the enumerator
  panel per-session; decide the final value with the PI and partner.
  Consider whether to pay a flat show-up fee separately.
- **[critical] Sync backend schema update.** The Cloudflare Worker
  still expects the old session payload (seeds/insurance fields).
  Either update its Zod validators or export locally and upload in
  batch. The PWA exports work fine without the backend.
- **[recommended] Add a numeracy pre-test.** Before the game (or
  embedded in the enumerator-setup screen, so it's completed before
  arm assignment is used). Lipkus 3-item or Berlin Numeracy are both
  well-validated and take ≤ 2 minutes.
- **[recommended] Add real-world fertilizer-use question at survey.**
  Retrospective: "how many bags did you apply to your last maize
  crop?" Allows linking game behavior to real behavior.

### Analysis stage

- **[critical] Follow the PAP.** Deviations go in a post-hoc section.
- **[recommended] Exploratory: dose trajectory analysis.** The
  trajectory log captures stepper-by-stepper dose changes. Measure
  (a) time to first dose commit, (b) revision count, (c) settlement
  dose. Format may matter more through the *process* than the final
  choice.
- **[recommended] Exploratory: risk-preferences revealed.**
  With 8 rounds of (dose × outcome), you can estimate an individual
  risk-aversion parameter per participant via a structural model.
  Compare to arm assignment — does display format shift *inferred
  preferences* or just choices under the same preferences?

### Longer-term / follow-up

- **[optional] Field-behavior follow-up at 6 months.** Return to
  participants, measure actual fertilizer use on their next maize
  crop. Expensive but this is the real policy outcome.
- **[optional] Scale the intervention.** If `distribution` + `train`
  beats `point` + no-train by a meaningful margin, pitch an
  extension-service partnership to change how recommendations are
  delivered.
- **[optional] Generalize beyond maize.** The game is structurally
  generic; swap the yield function and you can test cassava, rice,
  sorghum. Most interesting in a crop where fertilizer use is known
  to be sub-optimal.

---

## 11. Open design questions for the PI

These are decisions I can't make for you — flag them, discuss, lock
before piloting.

1. Should the **"point" treatment** include a numeric probability, or
   just the most-likely outcome? (§10, before piloting.)
2. Should **round order be randomized** or fixed 1→8? (§10, before
   piloting.)
3. Is **8 rounds** the right number, or does session fatigue
   dominate after 6? Measure at pilot.
4. Should participants see **correlated** rain and price draws at
   some point in the game to test sophistication, or keep strict
   independence? Affects external validity.
5. Is the **training module in the right place** (before practice),
   or should it be woven into the instruction sequence? Alternatives:
   training as an optional "learn more" button, training with a
   harder comprehension check, training via video rather than text.
6. What is the **final Naira/token conversion rate**, and is there a
   separate show-up fee?
7. Does the sample need an **education / numeracy quota**? If
   expecting many non-numerate participants, the
   `distribution`-arm effect may be dominated by comprehension
   failures rather than decision-quality.
8. Is there **an IRB or research-integrity review** that needs to
   sign off on the incentive structure (non-negative floor, max
   payout, consent language)?

---

## 12. Expected limitations

Transparent list for the eventual write-up.

- **Lab-in-the-field, not real-world.** Decisions on the tablet are
  about hypothetical seasons. External validity should be confirmed
  via a follow-up behavioral measure.
- **Announced, stationary distributions.** Real rainfall forecasts are
  noisier and change over time. The experiment tests comprehension of
  given uncertainty, not forecasting skill.
- **Between-subject design cannot identify within-person comprehension
  learning.** If format X helps some participants and hurts others,
  we see the mean; we don't see individual trajectories across
  formats.
- **Six cells is already borderline for power.** If total N is
  substantially below 3,000, consider collapsing pre-registration.
- **Non-sampled farmers.** Drawing participants through a partner
  organization (an extension co-op, say) means the sample skews
  toward already-engaged farmers. Document this clearly.
- **Tablet familiarity varies.** Pilot will tell you whether this
  creates a floor effect for older / lower-literacy participants.

---

## 13. Timeline (suggested)

| Phase | Duration | Key deliverables |
|---|---|---|
| 1. Finalize design | 2–4 weeks | Locked treatments, PAP drafted, IRB submitted |
| 2. Translation + narration | 3–4 weeks | Hausa review complete; narrated audio recorded and integrated |
| 3. Pilot | 2 weeks | 30–50 participants, qualitative debrief, session-length & comprehension data |
| 4. Revisions | 2–3 weeks | Schedule calibration, UI fixes, any abandoned-treatment decisions |
| 5. Main fielding | 4–8 weeks | Target N, data uploaded to sync backend |
| 6. Analysis + write-up | 3–6 months | PAP-aligned analysis, working paper draft |
| 7. Follow-up (optional) | +6 months | Revisit participants, measure real fertilizer use |

---

## 14. Contact / ownership

This document is a design draft produced during the fork of the GEF
Investment Game codebase. Any changes to treatment definitions,
randomization rules, or incentive structure after pre-registration
require a PAP amendment. The implementation tracks the branch
`fork/fertilizer-risk-comms`. Calibration can be regenerated any time
with `npm run calibrate` from the `investment-game/` directory.
