# Contributing

Thanks for considering a contribution. This kit is intentionally small — two skills, one schema, a few templates — but it has to stay reliable across many project shapes. Please read this first.

## Ground rules

1. **Skills must not invent.** If the codebase under analysis is ambiguous, the skill asks the user. Don't add heuristics that silently pick a winner.
2. **The schema is the contract.** Any change to `pipeline-map.json` shape requires a `schemaVersion` bump and a migration script under `migrate/`.
3. **Templates compile.** A change to any `references/*.template` must come with a regenerated example so reviewers can see the output diff.
4. **No new framework without an example.** If you add Svelte support, add `examples/sveltekit-app/` in the same PR with a working pipeline map + generated component.

## Local development

```bash
git clone https://github.com/sofiane-git/explain-panel-kit.git
cd explain-panel-kit

# Validate the schema and all example maps in one shot
npx -y ajv-cli@5 validate -s schemas/pipeline-map.schema.json -d 'examples/*/docs/pipeline-map.json'
```

## Adding a framework target

1. Drop a new template into `skills/explain-panel/references/`.
2. Update the framework decision table in `skills/explain-panel/SKILL.md` (Phase 3).
3. Add an example under `examples/<framework>-app/`.
4. Add eval entries in `evals/evals.json` so triggering accuracy is measured.

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
