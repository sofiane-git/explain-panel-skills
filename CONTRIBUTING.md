# Contributing

Thanks for considering a contribution. This kit is intentionally small — two skills, one schema, a few templates — but it has to stay reliable across many project shapes. Please read this first.

## Ground rules

1. **Skills must not invent.** If the codebase under analysis is ambiguous, the skill asks the user. Don't add heuristics that silently pick a winner.
2. **The schema is the contract.** Any change to `pipeline-map.json` shape requires a `schemaVersion` bump and a migration script under `migrate/`.
3. **Templates compile.** A change to any `references/*.template` must come with a regenerated example so reviewers can see the output diff.
4. **No new framework without an example.** If you add Svelte support, add `examples/sveltekit-app/` in the same PR with a working pipeline map + generated component.

## Local development

```bash
git clone https://github.com/sofiane-git/explain-panel-skills.git
cd explain-panel-skills

# Validate the schema and all example maps in one shot.
# The --spec=draft2020 flag is required: our schema declares
# $schema: …/draft/2020-12/schema, and ajv-cli defaults to draft-07,
# which doesn't know that meta-schema URL. Without the flag you'll see
# "no schema with key or ref 'https://json-schema.org/draft/2020-12/schema'".
npx -y ajv-cli@5.0.0 validate --spec=draft2020 -s schemas/pipeline-map.schema.json -d 'examples/*/docs/pipeline-map.json'
```

## Branch & PR workflow

`main` is protected — no direct pushes, not even for maintainers. Every change lands through a pull request:

1. Branch from `main`. Naming: `fix/<topic>`, `feat/<topic>`, `docs/<topic>`, `ci/<topic>`, or `release/vX.Y.Z`.
2. Commit with a [Conventional Commits](https://www.conventionalcommits.org/) message, including a `CHANGELOG.md` entry under `## [Unreleased]` for any user-visible change.
3. Open the PR. All four CI checks (`Pipeline-map schema`, `Plugin + marketplace manifests`, `HTML template + demo syntax`, `Example components compile`) are **required** — they run on every PR regardless of which files changed, and the branch must be up to date with `main` before merging.
4. Merge via **squash** once green (and approved, when reviews apply). Force-pushes and deletions of `main` are blocked.

## Adding a framework target

1. Drop a new template into `skills/explain-panel/references/`.
2. Update the framework decision table in `skills/explain-panel/SKILL.md` (Phase 3).
3. Add an example under `examples/<framework>-app/`.
4. Add eval entries in `evals/explore-pipeline.json` or `evals/explain-panel.json` (whichever applies) so triggering accuracy is measured. The eval harness lives in the `skill-creator` plugin; see `evals/README.md` for the full workflow and field schema (`{ id, should_trigger, query }`).

## Regenerating the README demo screenshot

The `docs/media/demo.png` referenced from the README is rendered from `docs/media/demo.html` — a compact hand-built HTML snapshot of three sections from the `examples/fastapi-rag` pipeline-map. When you change the HTML standalone template, the inline CSS, or the tokenization rules, the demo asset needs to be refreshed.

```bash
# 1. Serve the file (the html-standalone CSS uses color-mix() which needs a real HTTP origin
#    in some browsers; file:// also works in Chrome/Safari but http is the safer default).
cd docs/media && python3 -m http.server 8765 &
SERVER_PID=$!

# 2. Open the demo in your browser.
open http://localhost:8765/demo.html

# 3. Expand the three accordion sections (click each summary), then take a full-page screenshot.
#    macOS: Cmd+Shift+5 → "Capture Entire Page" → Save as docs/media/demo.png
#    Linux: scrot / spectacle / flameshot — whichever you have, full-page mode.
#    Width target: 1280px viewport. Keep light mode (the README image displays best on GitHub light).

# 4. Stop the server.
kill $SERVER_PID
```

When the html-standalone template's structure changes (new placeholder, new section block layout), edit `docs/media/demo.html` by hand to mirror it — the file is intentionally hand-crafted (not generated) so it stays stable across template revisions without re-running the skill on a real project.

## Schema changes

1. Bump `schemaVersion` in `schemas/pipeline-map.schema.json` (consts and `$id`).
2. Add `migrate/v<old>-to-v<new>.ts` with a self-contained transform.
3. Update `skills/explore-pipeline/SKILL.md` to write the new version.
4. Update `skills/explain-panel/SKILL.md` Prerequisites check to accept both versions during a transition window.
5. Bump existing examples through the migration so they don't break.

## Style

- One responsibility per file. SKILL.md files target <500 lines; if you outgrow that, push detail into `references/`.
- Markdown links inside skills must be relative (`./references/foo.md`), not absolute.
- Generated code in templates uses Tailwind class strings verbatim — no `@apply`, no class abstractions, so the component is portable without a `tailwind.config.js` import.

## XSS / sanitization invariants

Three trust boundaries in the generated output, do not erode them:

1. **HTML standalone variant** (`html-standalone.html.template`). The skill itself escapes `header`, `title`, `summary`, `module`, `label`, and `annotations` before substitution — see `skills/explain-panel/SKILL.md` Phase 6. The Phase 7 grep is a defense-in-depth scan, not the primary defense. If you add a new placeholder to the template, add the escape step in the SKILL and the new tag/attribute to the Phase 7 scan in the same PR.
2. **Vue variants** (`vue-tailwind.vue.template`, `vue-css.vue.template`). The templates use `v-html` to render shiki's pre-rendered highlighted HTML. Trust boundary = shiki's own escaping of source code. If you bump shiki, pin a known-good version in the install instructions and check shiki's changelog for sanitizer regressions. Do not expand `v-html` usage to render any string that did not come straight out of shiki.
3. **React variants**. JSX auto-escapes text content. Never reach for `dangerouslySetInnerHTML` — if you think you need it, pre-escape and use plain text, or push the formatting into the schema as structured data.

## Releases

Maintainer-only. The full runbook — SemVer policy, the four version locations, changelog restructuring, tagging, GitHub release — lives in [`docs/releasing.md`](docs/releasing.md). Contributors only need to know one thing: put your changelog entry under `## [Unreleased]` and never edit a released section.

## Reporting bugs

Open an issue using the bug-report template. Attach:
- Your `pipeline-map.json` (minimal reproducer if possible).
- The exact error or behaviour observed.
- Your project layout (top-level `ls`).

**Security issues** — do not open a public issue. Follow [`SECURITY.md`](SECURITY.md) for the private reporting channel.

## Reviewer checklist

- [ ] CHANGELOG entry under `## [Unreleased]`.
- [ ] Schema validation passes on all examples.
- [ ] If schema changed, migration script + bumped examples.
- [ ] If templates changed, example components regenerated.
- [ ] No skill file is using imperative all-caps "MUST" without an explanation of why.
