# Dev-fork Roadmap

**Scope:** this file lives only on `investment-game-dev`. It tracks work that expands the app beyond the current Zambia/Uganda field deployment. The stable-repo [ROADMAP.md](ROADMAP.md) tracks field-critical work (Luganda/Bemba audio, pilot hardening, analysis prep).

**Hard rule:** nothing here lands in the stable repo except via a PR that meets the gates in [CONTRIBUTING.md](../../CONTRIBUTING.md).

---

## Priority order (agreed 2026-04-21)

Revised after learning Waxal covers Luganda + Acholi:

1. **D2 — ElevenLabs voice/accent picker** (small; unblocks language work)
2. **D1 — Waxal integration for multilingual support** (Luganda first, then Acholi + broader set)
3. **D4 — Data QA + economics analysis workflow** (parallel; protects existing data pipeline)
4. **D3 — Git-based game template** (biggest; do last, in a separate repo, so this one stays intact)

---

## D1 — Waxal-backed multilingual support

### Goal

Use the [Waxal dataset](https://blog.google/intl/en-africa/company-news/outreach-and-initiatives/introducing-waxal-a-new-open-dataset-for-african-speech-technology/) (21 African languages) to bootstrap translation + reference audio for any language we want to support. Immediate payoff: **Luganda working for the current Uganda study** (Waxal covers it). Downstream: Acholi (also Uganda), Swahili, and a longer list for future studies.

### Languages in Waxal

Acholi, Akan, Dagaare, Dagbani, Dholuo, Ewe, Fante, Fulani (Fula), Hausa, Igbo, Ikposo, Kikuyu, Lingala, Luganda, Malagasy, Masaaba, Nyankole, Rukiga, Shona, Soga (Lusoga), Swahili, Yoruba.

**Not in Waxal:** Bemba (Zambia). Bemba still needs commissioned translation — tracked in stable [TRANSLATION_TODO.md](TRANSLATION_TODO.md).

### Plan

| Step | Task | Notes |
|---|---|---|
| 1 | Pull Waxal Luganda split from HuggingFace | `huggingface-cli download google/WaxalNLP --include "luganda/*"`; store outside git under `data/waxal-cache/` |
| 2 | Build a text-alignment helper | For each English narration string in `scripts/narration-texts/en.json`, find closest-meaning Waxal utterances as reference. Semi-automated — human reviews final mapping |
| 3 | Draft `lg.json` narration scripts | Hybrid: LLM-translate EN → Luganda using Waxal as style reference, then native-speaker review |
| 4 | Reference audio QA | Play Waxal Luganda samples next to ElevenLabs Luganda output; flag accent/pronunciation issues to guide voice selection in D2 |
| 5 | Extend `scripts/generate-narration.sh` | Make `LANG_CODE` flag functional for Luganda (it currently aborts); use voice selected in D2 |
| 6 | Repeat for Acholi, Swahili | Same pipeline, different language code |

### Acceptance criteria

- Selecting Luganda at `LanguageSelect` plays Luganda narration (no EN fallback) across all 10 videos
- `video_narration_fallback` events drop to zero for Luganda sessions in the event log
- Native Luganda speaker flags ≤ 2 pronunciation issues per script on first pass

### Privacy

- Waxal is an open dataset; no participant data touches HuggingFace
- LLM translation sends narration scripts (no PII) — fine
- Native-speaker reviewer sees only the narration scripts (no participant data)

### Blocked on

- D2 complete (need a voice before generating Luganda audio at scale)
- Access to a native Luganda speaker for review (partner coordination)

---

## D2 — ElevenLabs voice/accent picker

### Goal

Make voice selection a configuration rather than a hardcoded constant. Let a researcher setting up a new language or study pick the voice that matches their target population's dialect expectations.

### Current state

`scripts/generate-narration.sh` hardcodes the Mapendo voice ID (`dOqxOZEisn8SiUH1dPCC`) for all narration. Fine for English + East African TTS, wrong for West African or non-East-African languages.

### Plan

| Step | Task |
|---|---|
| 1 | Move voice config out of the shell script into `scripts/voices.yml` (per-language preferred voice + backup list) |
| 2 | Build a `scripts/preview-voice.sh` that takes a short sample script + voice ID, renders a 10-sec preview, and plays it locally. Lets a reviewer A/B voices fast |
| 3 | Per-language vetting checklist: gender, accent region, pace, naturalness on a 10-utterance test script. Document results in `docs/voice-vetting/<lang>.md` |
| 4 | Extend `generate-narration.sh` to read voice from `voices.yml` keyed by `LANG_CODE` |
| 5 | Optional: add a tiny web UI (single HTML file) that previews all library voices for a language side-by-side — speeds up vetting |

### Acceptance criteria

- `voices.yml` exists and lists at least one vetted voice for English + Luganda
- Switching the production Luganda voice is a one-line YAML change + rerun of `generate-narration.sh`
- A native speaker can complete the 10-utterance vetting in < 30 minutes

### Privacy

- ElevenLabs sees narration scripts (no PII) — unchanged from current
- Vetting recordings stay local (not pushed to git)

### Blocked on

- Nothing — can start immediately

---

## D3 — Git-based template for new research teams

### Goal

Let another team (same program, different study) configure a variant of this game — different decisions, different payoffs, different languages — via a template repo and a config file, without touching React code.

### Why this is hard

The current app hardcodes:
- Round structure (practice → R1 → R2 with A/B versions)
- Decision shape (fertilizer stepper + seeds/insurance/bundle)
- Payout formulas (fertilizer × rain × 2, seeds → 30|0, etc.)
- Screen sequence (WELCOME → … → COMPLETION)

Making it template-driven means moving all of that into a declarative spec (YAML/JSON) that the runtime interprets. That's a real refactor — 4–6 weeks, high regression risk.

### Architecture sketch

```
game-spec.yml
├── metadata: { studyId, countries, languages }
├── rounds:
│   - id: practice
│     decisions: [{ type: stepper, resource: fertilizer, ... }]
│     payouts: "fertilizer_units * (rain == 'good' ? 2 : 0)"
│   - id: round1
│     ...
├── screens: [welcome, setup, instructions, practice, ..., completion]
├── narration-scripts: scripts/narration-texts/
├── survey-questions: survey.yml
└── branding: { colors, logo, ... }
```

Runtime reads the spec at build time → generates the state machine, screen sequence, and payout functions. Everything else (Dexie schema, sync backend, admin panel) is generic.

### Plan

| Step | Task |
|---|---|
| 1 | Spin up a **separate repo** `investment-game-framework` — do not refactor in place |
| 2 | Design the spec schema with at least two distinct game variants as targets (the current game + one hypothetical) to avoid accidentally encoding assumptions |
| 3 | Build a schema validator + example games in `examples/` |
| 4 | Port the runtime piece by piece; current game becomes `examples/zm-ug-investment` |
| 5 | Write a "new-study" template with GitHub template-repo button: fork → edit `game-spec.yml` + narration scripts → push → CI deploys a Cloudflare Pages preview |
| 6 | Lock down what researchers *cannot* change (the audit trail, event schema, sync contract) so data is comparable across studies |

### Acceptance criteria

- New study team can set up a running PWA in < 1 day without writing code
- The current Zambia/Uganda game renders identically from a spec file
- Event-log schema is identical across all template instances (critical for cross-study analysis)

### Privacy

- Templates must enforce the existing gitignore rules (participants.csv, .env, data/raw/)
- CI must run a secret-scan step on every push (fail build on any matched pattern)
- Per-study encryption keys never live in the template; each fork generates its own

### Blocked on

- D1 + D2 proven end-to-end first (so we know the localization pipeline works before abstracting it)
- Decision to commit to framework-ization (heavy investment — needs second study lined up to justify)

---

## D4 — Data QA + economics analysis workflow

### Goal

Automated quality checks on every synced session + reproducible economic analysis from the same pipeline. Catches data-integrity issues during collection (not months later) and produces canonical outputs the PI can ship to collaborators.

### Plan

| Step | Task |
|---|---|
| 1 | Per-session QA checks, run on sync-server ingest (extend `investment-game-server`): payout reconciliation (recompute from events, compare to stored final), seed reproduction (regenerate weather from recorded seed, compare to stored outcome), version balance χ² check (weekly rolling), missing-event detection (screen_transition should equal screens visited), stepper-trajectory sanity (never negative, never > budget) |
| 2 | Flag anomalous sessions with a `qa_flag` column in `sessions`; admin dashboard surfaces them |
| 3 | R analysis template at `analysis/` (separate folder, possibly separate repo): loads CSV exports, produces canonical outputs — demand curves by treatment, WTP for insurance, information-seeking (video replay counts), heterogeneity by demographic |
| 4 | De-identification script — strips participant IDs → pseudonymous IDs for collaborator sharing, per IRB |
| 5 | CI pipeline: on a nightly cron, pull latest sync-server exports, run QA, run analysis, publish HTML report to a private Pages project |
| 6 | Pre-registered analysis plan doc at `analysis/PREREGISTRATION.md` (links to AEA registry) |

### Acceptance criteria

- Every synced session has a `qa_flag` within 5 sec of arrival
- PI can run `make analysis` locally and get a PDF/HTML report of all primary outcomes
- De-identified dataset is shareable without additional cleaning

### Privacy

- **Analysis always runs on de-identified data.** Raw CSVs with participant IDs stay in Neon + a locked researcher laptop
- Nightly HTML reports are on a private Pages project (Cloudflare Access, restricted to study team emails)
- Audio-recording analysis (if turned on) is completely separate pipeline, separate access list

### Blocked on

- Nothing — can start immediately on the QA piece; analysis piece waits until first pilot data exists

---

## Cross-cutting infrastructure (lower priority)

### Staging environment

Set up once the first feature needs tablet testing against a real server:

- Neon staging branch (instant copy of prod DB)
- Staging Worker: `investment-game-server-staging.*.workers.dev`, points at Neon staging branch
- Staging Pages project: `investment-game-staging.pages.dev`, built from `dev/main` on push

Skipped initially because local dev (`wrangler dev` + `npm run dev`) is sufficient for everything pre-tablet-test.

### Privacy safeguards

- **Pre-commit hook** (git-secrets or similar) that refuses commits matching `DATABASE_URL=`, `sk_*` (ElevenLabs), `participantId:` etc. Easy to add; prevents a class of incidents
- **CI secret scan** on every PR (GitHub has a built-in one; enable it)
- **Dependabot** for the PWA + Worker — security patches on a weekly cron

### Documentation that still needs writing

- Data retention policy (how long raw sessions stay in Neon; when de-id copy replaces them)
- Incident-response runbook (sync outage, tablet lost, suspected data tampering)
- Voice vetting checklist (part of D2)

---

## How to work on these

1. Branch off `dev/main` — e.g. `feature/d2-voice-picker`
2. Push to dev remote: `git push -u dev feature/d2-voice-picker`
3. Open PR against dev `main`
4. When merged, update this doc's priority list if done
5. When all of D1–D4 reach "field-ready" state, open a single promotion PR from `dev/main` → `origin/main` (stable)

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for the full flow.
