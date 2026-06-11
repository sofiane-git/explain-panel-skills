# explain-panel-skills — guide for Claude Code

Two Claude Code skills (`/explore-pipeline` + `/explain-panel`) distributed as the `docpanel` plugin. No runtime code — the deliverables are skill instructions (`skills/*/SKILL.md`), templates (`skills/explain-panel/references/`), a JSON Schema, and snapshot examples.

## Commands

```bash
npm run validate:schema        # schema + all example maps (ajv-cli 5.0.0, draft 2020-12)
```

CI is `.github/workflows/validate-schemas.yml` — four jobs: schema, plugin manifests, HTML template checks, example-component type-check. Mirror the relevant job locally before committing (commands inside the workflow are copy-pasteable).

## Workflow

`main` is protected: never commit or push to it directly. Branch (`fix/…`, `feat/…`, `docs/…`, `ci/…`, `release/vX.Y.Z`), open a PR, wait for the four required CI checks, squash-merge. Tags are pushed after the release PR merges (see `docs/releasing.md`).

This rule is **enforced**, not advisory: a PreToolUse hook (`.claude/hooks/protect-main.sh`, wired in `.claude/settings.json`) denies `git commit` and `git push` issued from local `main` (tag-only pushes excepted — release runbook) and any push with a `main` refspec. GitHub branch protection rejects direct pushes server-side as the final gate.

## Invariants — check before editing

- **The schema is the single source of truth.** Header default text lives in the `default` keyword of `schemas/pipeline-map.schema.json` — never hardcode it in docs, templates, or SKILL.md. Field constraints in prose docs must match the schema; when they disagree, the schema wins.
- **Version literal lives in `.claude-plugin/plugin.json`** and is mirrored in `package.json`, `.claude-plugin/marketplace.json`, and `docs/install.md` prose. CI fails on any mismatch — bump all four together.
- **Examples are snapshots, not runnable repos.** Source files referenced by the maps don't exist. If you change a template, regenerate the affected example components in the same commit (CONTRIBUTING rule 3) — they are type-checked in CI.
- **`examples/python-cli/docs/ExplainPanel.html` must stay byte-identical to `docs/media/demo.html`** (CI-enforced). Edit both or neither.
- **XSS trust boundaries** (HTML escaping in the standalone variant, `v-html` limited to shiki output, no `dangerouslySetInnerHTML`) are documented in `CONTRIBUTING.md` — read that section before touching templates or the Phase 6/7 sections of `skills/explain-panel/SKILL.md`.
- Every user-visible change gets a `CHANGELOG.md` entry under `## [Unreleased]` in the same commit.

## Releases

Follow `docs/releasing.md` step by step — it covers SemVer policy (kit version vs `schemaVersion` are two different contracts), the four version locations, changelog restructuring, tagging, and the GitHub release. Key rule: **never re-point a published tag**; new commits always get a new version.
