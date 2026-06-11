# Releasing

The runbook for cutting a release. Written to be followed step by step — by a human or by Claude Code. If this file disagrees with what CI enforces, fix one of the two in the same PR.

## Two version contracts — don't confuse them

| Contract | Lives in | Bumps when |
|---|---|---|
| **Kit version** (`X.Y.Z`, git tag `vX.Y.Z`) | `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (plugin entry), `docs/install.md` prose | Anything in the repo changes in a way users should receive |
| **`schemaVersion`** (currently `"1.0"`) | `schemas/pipeline-map.schema.json` (`const` + `default`s), every `pipeline-map.json` | Only when the **map shape** changes — and then it ships a migrator under `migrate/` |

The kit version moves often; `schemaVersion` moves rarely. A kit release does **not** imply a schema bump.

## SemVer policy (kit version)

- **MAJOR** — breaking `schemaVersion` bump (maps need migration), a skill invocation or template placeholder contract removed/renamed, an output file path changed.
- **MINOR** — new capability: new framework target, new template variant, new *optional* schema field (relaxation), new skill phase or placeholder added.
- **PATCH** — bug fixes, documentation corrections, security hardening that tightens validation to match the *already documented* contract, CI changes, example regeneration, dependency pin bumps.

Edge case from real history: rejecting absolute paths in `file`/`roots[]` *tightened* the schema, but the containment contract was always documented — maps relying on absolute paths were exploiting a validation gap. That ships as a PATCH with a `### Security` changelog entry, not a MAJOR.

## Hard rules

1. **Never re-point a published tag.** Once `vX.Y.Z` is on `origin`, it is immutable: the marketplace updates users by comparing `plugin.json` version (same version = no update delivered), and pinned schema URLs (`…/vX.Y.Z/schemas/…`) must stay byte-stable. New commits → new version. No exceptions.
2. **One source of truth per fact.** Header default lives in the schema `default` keyword; version literal lives in `plugin.json` (the other three locations mirror it and CI enforces the sync).
3. **No release with a dirty `[Unreleased]` gap.** Every user-visible change merged since the last tag must have a changelog entry *before* you start the release.

## Release checklist

Run from a clean working tree on `main`.

1. **Audit `[Unreleased]`** in `CHANGELOG.md` — complete, accurate, sections in this order: `Security`, `Fixed`, `Changed`, `Added`, `Deprecated`, `Removed` (Keep a Changelog 1.1.0; omit empty sections).
2. **Pick the bump** using the SemVer policy above. When hesitating between two, pick the larger only if a user could be broken; otherwise the smaller.
3. **Bump the version** in all four places:
   - `package.json` → `version`
   - `.claude-plugin/plugin.json` → `version`
   - `.claude-plugin/marketplace.json` → `plugins[0].version`
   - `docs/install.md` → the ``(currently `X.Y.Z` …)`` prose
4. **Restructure the changelog**: rename `## [Unreleased]` to `## [X.Y.Z] — YYYY-MM-DD`, insert a fresh empty `## [Unreleased]` above it, update the compare links at the bottom (`[Unreleased]: …/compare/vX.Y.Z...HEAD`, `[X.Y.Z]: …/compare/v<prev>...vX.Y.Z`).
5. **MINOR/MAJOR only:** update the supported-versions matrix in `SECURITY.md`.
6. **Run the local validation suite** (mirrors CI — all must pass):
   ```bash
   npm run validate:schema
   npx -y ajv-cli@5.0.0 compile --spec=draft2020 -s schemas/pipeline-map.schema.json
   diff -q examples/python-cli/docs/ExplainPanel.html docs/media/demo.html
   python3 -c "import yaml; yaml.safe_load(open('.github/workflows/validate-schemas.yml'))"
   # version sync:
   PV=$(jq -r .version .claude-plugin/plugin.json); \
     [ "$PV" = "$(jq -r .version package.json)" ] && \
     [ "$PV" = "$(jq -r '.plugins[0].version' .claude-plugin/marketplace.json)" ] && \
     grep -q "currently \`$PV\`" docs/install.md && echo "versions OK ($PV)"
   ```
7. **Commit**: `chore(release): vX.Y.Z — <one-line theme>`.
8. **Tag** (annotated): `git tag -a vX.Y.Z -m "vX.Y.Z — <one-line theme>"`.
9. **Push**: `git push origin main --follow-tags`.
10. **GitHub release**: `gh release create vX.Y.Z --title "vX.Y.Z — <theme>" --notes "<the CHANGELOG section for X.Y.Z, verbatim>"`.
11. **Smoke-test the update path** in a Claude Code session: `/plugin marketplace update explain-panel-skills` → `/plugin install docpanel@explain-panel-skills` → `/reload-plugins` → confirm the new version is reported.

## Release-notes conventions

- The GitHub release body **is** the CHANGELOG section — write it once, in the changelog, and copy verbatim. No separate prose.
- Entry style: user impact first, mechanism second. Bold the lead sentence of entries that change behavior. Name files/phases precisely (`/explain-panel` Phase 7, `schemas/pipeline-map.schema.json`) so entries stay auditable.
- A `### Security` section is mandatory whenever a release changes validation, escaping, CI permissions, or pinning — even if the risk was theoretical.
- If a changelog entry from a previous release turns out to be false (it happened: v1.1.0 claimed a README fix that never landed), do **not** rewrite the released entry. Document the correction in the new release's `Fixed` section.

## What CI enforces (so you don't have to remember)

| Guard | Job |
|---|---|
| Schema compiles, all example maps validate, `schemaVersion` matches the schema `const` | `schema` |
| plugin/marketplace/package versions identical + SemVer-shaped | `plugin` |
| `docs/install.md` prose cites the current plugin version | `plugin` |
| HTML template parses, placeholders documented, doc/body drift | `templates` |
| `examples/python-cli` HTML ≡ `docs/media/demo.html` | `templates` |
| Example components type-check (`tsc`, `vue-tsc`) | `components` |

CI does **not** check: changelog completeness, SECURITY.md matrix, compare links, tag immutability. Those are this checklist's job.
