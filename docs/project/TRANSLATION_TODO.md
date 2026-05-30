# Translation TODO — Hausa

`investment-game/src/i18n/ha.json` contains placeholder Hausa translations produced during the fork. **None has been reviewed by a native speaker.** Reviewing it is on Track A of the ROADMAP — blocks piloting.

## Scope

- All keys present in `en.json` must have a Hausa equivalent in `ha.json`.
- The active app already renders Hausa for every wired-up `t(...)` call.
- A separate sweep (ROADMAP B1) is needed to migrate ~40–60 hardcoded English strings in `RoundBody.jsx`, `Training.jsx`, `Survey.jsx`, and `FinalPayout.jsx` through `t()` — once that happens, those keys also need Hausa translations.

## Reviewer brief

When commissioning the review:

1. The audience is **smallholder maize farmers in northern Nigeria**. Prefer the variety of Hausa most familiar to that population, not the Kano-academic variety.
2. **Plain language.** Aim for the literacy level of someone who finished primary school but may not be a fluent reader.
3. **Numeracy framing.** The game leans on "X out of 10 seasons" phrasing. Make sure the translation preserves the frequency framing — don't paraphrase to percentages.
4. **Keep token framing.** The game uses tokens (in-game), converted to Naira at the end. Translation should distinguish "tokens" (game) from "Naira" (real money), not collapse them.
5. **Game-specific vocabulary.** Maintain consistency across the file for:
   - *fertilizer*, *maize*, *good rain / normal rain / drought*, *high / mid / low price*, *plant*, *season*, *dose*, *expected*, *most likely*, *unlikely*.

## Workflow

1. Export current `ha.json` alongside `en.json` to the reviewer.
2. Reviewer returns annotated `ha.json` (or a sidecar list of suggested edits).
3. Apply edits, run `npm run dev`, click through a full session in Hausa (`?lang=ha` or set via `LanguageSelect`), verify nothing overflows the 1280×800 viewport.
4. Re-run `npm test` to confirm no test depends on a specific English string.
5. Commit. Tag in the reviewer's contribution in `CONTRIBUTORS.md` (create if missing).

## Narration audio (separate from text)

Once translated text is locked, narration audio needs to be recorded for:

- Instructions (full script, currently a stub).
- Training module (3 steps × ~30s each, plus the comprehension-check stems).
- Per-round briefing prompts (8 rounds + practice).
- Final payout + survey + completion screens.

Default voice: ElevenLabs Hausa speaker, to be selected. Native-speaker QA on the rendered audio before fielding.

Audio drops in `investment-game/public/audio/ha/...`. The audio path scheme is intentionally identical to `/en/` so the existing `narrationSrc` plumbing works without code changes.

## Out of scope

- **Other languages.** Only `en` + `ha` are supported in this fork. The original study supported Luganda + Bemba — those were retired with the fork and live in `docs/archive/`.
