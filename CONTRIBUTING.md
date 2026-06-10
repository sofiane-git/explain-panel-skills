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
npx -y ajv-cli@5 validate --spec=draft2020 -s schemas/pipeline-map.schema.json -d 'examples/*/docs/pipeline-map.json'
```

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

## Reporting bugs

Open an issue using the bug-report template. Attach:
- Your `pipeline-map.json` (minimal reproducer if possible).
- The exact error or behaviour observed.
- Your project layout (top-level `ls`).

## Reviewer checklist

- [ ] CHANGELOG entry under `## [Unreleased]`.
- [ ] Schema validation passes on all examples.
- [ ] If schema changed, migration script + bumped examples.
- [ ] If templates changed, example components regenerated.
- [ ] No skill file is using imperative all-caps "MUST" without an explanation of why.
