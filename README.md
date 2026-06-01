# Investment Game — Fertilizer Risk-Communication Experiment

Tablet-based lab-in-the-field experiment in which smallholder farmers make repeated fertilizer-dose decisions on maize under **rainfall and market-price uncertainty**. Deployed on Android tablets in **Nigeria**, Hausa + English, fully offline-capable after first load.

**v2 design.** There is no in-game arm: game *exposure* (play vs. don't-play) is the treatment, assigned outside the app, and the hypothesis is that *playing* the game builds familiarity with rainfall + price uncertainty. Everyone who plays sees the same game — uncertainty shown as a full icon-array **distribution**, with a probability-comprehension **training for all**. Each session is 1 practice season + **10** incentivized seasons with a fertilizer-dose decision (0–10 units of a 25-token endowment) under independent rainfall + price uncertainty.

---

## Repository layout

```
.
├── investment-game/            React + Vite PWA (the tablet app)
├── investment-game-server/     Cloudflare Workers + Neon Postgres sync backend
└── docs/
    ├── fork/                   Active research design
    │   ├── research_plan.md        Hypotheses, outcomes, PAP sketch, limitations
    │   └── CONTEXT.md              Session-handoff / what changed from the parent study
    ├── project/                Running project operations
    │   ├── ROADMAP.md              Track A/B/C work items
    │   ├── ROADMAP_DEV.md          Dev-fork roadmap
    │   ├── SPEC_DISCREPANCIES.md   Open PI sign-off items
    │   └── TRANSLATION_TODO.md     Hausa native-speaker review checklist
    └── archive/                Original GEF bundling study record (historical only)
```

## Quick start

A top-level [Makefile](Makefile) wraps the common tasks:

```bash
make help           # list all targets
make dev            # PWA dev server on :5173
make test           # 25 Vitest specs
make build          # production PWA build
make deploy         # build + push to Cloudflare Pages production
make server-dev     # local sync backend via wrangler dev
make wiki-push      # sync docs/ → GitHub Wiki and push
```

### Run the PWA locally (raw)

```bash
cd investment-game
npm install
npm run dev          # http://localhost:5173
npm test             # 25 tests
npm run calibrate    # dev-time report on yield + schedule health
npm run build        # production bundle → dist/
```

See [investment-game/README.md](investment-game/README.md) for the full developer guide.

### Run the sync backend locally

```bash
cd investment-game-server
cp .dev.vars.example .dev.vars   # fill in DATABASE_URL, ENUMERATOR_TOKENS, ADMIN_TOKEN
npm install
npm run dev                       # wrangler dev on :8787
curl http://localhost:8787/health
```

See [investment-game-server/README.md](investment-game-server/README.md).

### Deploy the PWA to Cloudflare Pages

```bash
cd investment-game
npm run build
npx wrangler pages deploy dist --project-name=investment-game
```

---

## Status

- **Game logic** — 1 practice + 10 incentivized seasons, fertilizer dose 0–10 from a 25-token endowment, two independent uncertainty sources (rain in `good/normal/drought`, price in `high/mid/low`), per-round seeded draws at plant-confirm. No in-game arm (v2): everyone gets the distribution display + training. 23 Vitest specs covering yield math, schedules, the seed→outcome pipeline, and calibration health.
- **Content** — text-only instructions stub; narration videos and audio for the fertilizer game are not yet produced. Hausa translations in place (`i18n/ha.json`) — native-speaker review pending.
- **Data** — every dose change, screen transition, training answer, and survey answer logged to IndexedDB. JSON + wide-Sessions / long-Rounds / Dose-Trajectory CSV exports from the admin panel. Per-round seeds + raw-uniform draws persisted for reproducibility.
- **Infra** — Zustand state machine with IndexedDB checkpointing + resume. Workbox PWA with full offline precache. Cloudflare Workers + Neon Postgres sync backend.
- **Deployment** — Cloudflare Pages live for the client. Backend Worker live on Cloudflare.

Full status + work items: [docs/project/ROADMAP.md](docs/project/ROADMAP.md) and the "What's NOT done" section of [docs/fork/CONTEXT.md](docs/fork/CONTEXT.md).

---

## Contributing

### Before a pull request

- `npm test` inside `investment-game/` — 23 specs green.
- `npm run calibrate` — calibration report still healthy (interior optimal doses, non-trivial revenue gap).
- `npm run build` — clean build, no warnings.

### Key design constraints (don't violate without discussion)

- **No back button in game flow.** Forward-only state machine, checkpointed every transition to IndexedDB.
- **Per-round draws are deterministic from participantId.** Same ID → same rain/price outcomes, always (independently verifiable). (v2 removed the in-game arm.)
- **Rain and price are drawn at plant-confirm, not pre-computed.** Log the seed value.
- **The practice round is mandatory.**
- **No scrolling in game screens.** Everything fits 1280×800 landscape.
- **Dose stepper must prevent overspend in real-time, not just warn.**
- **The yield model's rain × dose interaction is load-bearing** — without it the optimal dose stops moving across rain distributions and the experiment loses identifying variation. Guarded by `tests/schedules.test.js`.

### Open research-integrity items

- Native-speaker review of `investment-game/src/i18n/ha.json` — see [docs/project/TRANSLATION_TODO.md](docs/project/TRANSLATION_TODO.md).
- Pre-registration + IRB approval prior to pilot — see [docs/fork/research_plan.md](docs/fork/research_plan.md) §11.
- Confirm the v2 design (no in-game arm, exposure-as-treatment, 10 seasons, distribution-only display, universal training) with PI/IRB before pilot — see [docs/fork/CONTEXT.md](docs/fork/CONTEXT.md) "Design decisions".

---

## Acknowledgments

This is a CIMMYT adaptation built on the MIT-licensed **Investment Game** by the
Alliance of Bioversity International & CIAT and IFPRI (the original GEF maize
bundling experiment). We gratefully acknowledge that prior work; the v2
fertilizer risk-communication design and this deployment are CIMMYT's. See
[NOTICE](NOTICE) for the derivation and [LICENSE](LICENSE) for both copyright
holders. This project runs on CIMMYT-owned infrastructure and shares no
deployment or data with the upstream organization.

## License

MIT — see [LICENSE](LICENSE) and [NOTICE](NOTICE).
