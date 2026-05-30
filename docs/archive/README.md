# Archive — original GEF bundling study

Everything in this directory describes the **original** investment game
that this codebase was forked from: a tablet-based experiment on
**seeds + insurance bundling** for smallholder farmers in Uganda and
Zambia, run with the Alliance of Bioversity & CIAT and IFPRI via OAF
and Solidaridad.

That study is **not the current project.** The active project is a
fertilizer risk-communication experiment for Hausa-speaking maize
farmers in Nigeria. See:

- [`docs/fork/CONTEXT.md`](../fork/CONTEXT.md) — session handoff / what changed.
- [`docs/fork/research_plan.md`](../fork/research_plan.md) — current research design.
- [`CLAUDE.md`](../../CLAUDE.md) at the repo root — developer guide.

The documents in this archive are preserved as a historical record of
the original design (concept note, screen specs, game logic, narration
scripts, original ROADMAP/SPEC_DISCREPANCIES/TRANSLATION_TODO). They
are kept because:

1. The original concept note was authored by the parent-study PIs and
   is a research artifact in its own right.
2. Parts of the data schema, design system, and gameplay framing were
   carried into the fork and remain useful as background.

**Do not treat anything here as authoritative for the current project.**
Where the archive disagrees with `docs/fork/` or the code, the code and
`docs/fork/` win.

## Contents

```
research/
  concept_note.md          — Original PI-authored concept note
  claude_design_brief.md   — Original Claude Code design brief
  strategy.md              — Original development strategy
  screen_specs.md          — Original per-screen specs (3 rounds, A/B versions)
  game_logic.md            — Original payout / weather / version math
  gameplay_script.md       — Original narrated script
  data_schema.md           — Original session + event schema
  design_system.md         — Colors / typography / patterns (still informative)
video_scripts/             — Narration scripts for the retired instructional videos
  A1–A6_*.md               — General game / weather / budget / fertilizer
  B1_insurance_unbundled.md, B2_insurance_bundled.md — Insurance explainers
ROADMAP.md                 — Original deployment roadmap
ROADMAP_DEV.md             — Original dev-fork roadmap (Waxal / Acholi / template repo)
SPEC_DISCREPANCIES.md      — Original PI-sign-off blockers (resolved by the fork pivot)
TRANSLATION_TODO.md        — Original Luganda + Bemba translation queue
```
