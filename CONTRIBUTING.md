# Contributing

This project has **two repos** with different purposes. Please read this before pushing anything.

## Repos

| Repo | URL | Purpose | Who deploys from it |
|---|---|---|---|
| `investment-game` (stable) | https://github.com/sfissa-gef/investment-game | Field-deployed code. Tablets pull from here. | Cloudflare Pages production |
| `investment-game-dev` (dev) | https://github.com/sfissa-gef/investment-game-dev | Active development, new languages, framework work | Cloudflare Pages staging |

**Never push directly to stable `main`.** Branch protection blocks it. All changes land via a PR from dev.

## Local remotes

A clone of this codebase has both remotes wired:

```bash
git remote -v
# origin  git@github.com:sfissa-gef/investment-game.git       (stable — protected)
# dev     git@github.com:sfissa-gef/investment-game-dev.git   (development — default push)
```

Local `main` tracks `dev/main`, so `git push` by default goes to dev. Pushing to stable requires `git push origin main` and will fail unless it's a PR merge.

## Everyday workflow

1. `git checkout -b feature/<short-name>` off local `main` (which is dev's main).
2. Commit as normal.
3. `git push -u dev feature/<short-name>` — pushes to the dev repo.
4. `gh pr create --repo sfissa-gef/investment-game-dev` — open PR against dev `main`.
5. CI runs the full test suite + deploys the feature branch to a Cloudflare Pages preview URL.
6. Merge into dev `main` when green. Staging deploys automatically.

## Promoting a dev feature to stable (field deployment)

Only after:
- [ ] Full test suite green on dev (`npm test` — 25 specs)
- [ ] `npm run calibrate` health checks still pass
- [ ] Manual tablet smoke test completed (full session start → completion)
- [ ] PI / IRB sign-off on any change that affects game logic, randomization, consent, or data schema
- [ ] Any new i18n keys covered in both `en.json` and `ha.json`

Then:

```bash
# from a clean dev main
gh pr create \
  --repo sfissa-gef/investment-game \
  --base main \
  --head sfissa-gef:dev-main-<YYYY-MM-DD> \
  --title "Promote dev → stable (<YYYY-MM-DD>)" \
  --body "Changes since v0.1.0-field:\n\n- ..."
```

(Cross-repo PRs require pushing a branch to stable first — see `scripts/promote-dev-to-stable.sh` once it exists.)

After merge, tag the new stable release:

```bash
git fetch origin
git tag -a v0.X.Y-field -m "..." origin/main
git push origin v0.X.Y-field
```

Field tablets will pick up the new build on next connectivity.

## What *must not* go in git (either repo)

- `participants.csv` or any file with participant IDs / PII
- `.env`, `.dev.vars`, or anything containing `DATABASE_URL`, `ENUMERATOR_TOKENS`, `ADMIN_TOKEN`, `ELEVENLABS_API_KEY`, etc.
- Raw session exports (`data/raw/*.json`, `data/raw/*.csv`)
- Audio chunks (`audioChunks/`) — even encrypted
- Anything from an actual field deployment

`.gitignore` covers the common cases. When in doubt, don't commit it.

## Environments

| Env | Frontend | Backend Worker | Database |
|---|---|---|---|
| Production | `investment-game.pages.dev` | `investment-game-server.investment-app.workers.dev` | Neon `main` branch |
| Staging | `investment-game-staging.pages.dev` *(TBD)* | `investment-game-server-staging.*.workers.dev` *(TBD)* | Neon `staging` branch *(TBD)* |
| Local | `localhost:5173` | `localhost:8787` (`wrangler dev`) | Neon `main` via `.dev.vars` OR local Postgres |

**Never point local dev at the production Neon main branch.** Use the staging branch or a local Postgres instance.
