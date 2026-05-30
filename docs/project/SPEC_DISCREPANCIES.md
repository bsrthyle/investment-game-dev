# Open spec discrepancies — items needing PI sign-off before pilot

Things where the **implementation** and the **design intent** are not yet aligned, or where a research-design call hasn't been locked. None of these block local development; **all of them block piloting** until resolved.

## 1. The `point` arm currently shows no numeric probability

**Current behavior.** `components/RiskDisplay.jsx` with `arm.display === 'point'` renders only the most-likely outcome as a word ("Most likely: good rain"). No "70%", no "7 out of 10 seasons".

**Open question.** This makes the three display arms a *how much of the distribution we reveal* ladder (one outcome → two outcomes → full distribution) rather than a *numbers vs. words vs. pictures* contrast.

Both are defensible experiments, but they answer different questions. The PI should pick.

**Locked when:** decision recorded here and `RiskDisplay.jsx`'s `point` branch updated to match.

---

## 2. Round order is fixed 1 → 8

**Current behavior.** Schedules in `lib/schedules.js` are consumed in array order. The same participant sees the same rounds in the same sequence as every other participant.

**Risk.** Fatigue confounds round index. Round-8 effects mix design + tiredness.

**Open question.** Randomize the order per participant before piloting? `assignArm()` already uses `participantId` as a deterministic seed; a similar deterministic permutation would preserve reproducibility.

**Locked when:** decision recorded; `lib/schedules.js` either permuted deterministically or kept fixed with an explicit "fatigue is acknowledged" comment in `docs/fork/research_plan.md`.

---

## 3. Currency rate is a placeholder

**Current behavior.** `lib/constants.js → DEFAULT_CURRENCY_RATES.NG = 10` (10 NGN per token). Enumerator can override per-session.

**Open question.** What is the actual NGN/token rate? Separate show-up fee?

**Locked when:** rate + show-up policy agreed with implementing partner and IRB; default updated in code; survey screen mentions the show-up fee.

---

## 4. Sync backend rejects the new payload

**Current behavior.** `investment-game-server/src/schemas.js` Zod validators still expect the old seeds/insurance fields from the parent study. Posting a new fork session 400s.

**Open question.** None — this is engineering, not research. But it blocks field-deployment because tablets can't sync.

**Locked when:** schemas updated to the new payload shape (see ROADMAP A3), `server-dev` accepts a sample session, end-to-end test from PWA admin panel green.

---

## 5. Practice round mandatory, not skippable

**Status:** **enforced in code** — no skip path on `Practice.jsx`. Recorded here for completeness; matches research intent.

---

## 6. Sample size + power

**Current target.** ~3,200 participants per the original study target. With 6 cells that's ~530/cell.

**Open question.** Is this still the target for the fork? If total N is substantially below ~3,000, the 3 × 2 design may need to collapse to a simpler comparison pre-registration.

**Locked when:** sample-size decision recorded in `docs/fork/research_plan.md` §3.3 and PAP.

---

## Note on the historical SPEC_DISCREPANCIES

The original study's `SPEC_DISCREPANCIES.md` (truth-table typos in the seeds/insurance payout table) is in `docs/archive/SPEC_DISCREPANCIES.md`. Those discrepancies are no longer relevant — the seeds/insurance design was retired by the fork.
