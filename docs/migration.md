# Migration between schema versions

The `pipeline-map.json` schema is versioned via the required `schemaVersion` field. When the kit ships a breaking change, the old maps don't break — they go through a migrator.

## Current version

`1.0` — the initial public schema. There is no migrator yet because there's no older version.

## How migrators work

Every schema bump comes with a script at `migrate/v<old>-to-v<new>.ts` (TypeScript, runs under Node 18+). The script:

1. Takes a path to a `pipeline-map.json` (or reads stdin).
2. Reads it, validates against the old schema.
3. Transforms it in-memory.
4. Writes the result back (or to stdout), now matching the new schema.

A typical invocation:

```bash
npx ts-node migrate/v1-to-v2.ts docs/pipeline-map.json
# or, with --stdout:
npx ts-node migrate/v1-to-v2.ts docs/pipeline-map.json --stdout > /tmp/new.json
```

The script is idempotent — running it twice produces the same output.

## When `/explain-panel` refuses to run

If `/explain-panel` reads a map whose `schemaVersion` it doesn't recognise, it stops and prints:

```
❌ pipeline-map.json uses schemaVersion "2.0", but this kit version supports "1.0".
   Run the migrator:    npx ts-node migrate/v1-to-v2.ts docs/pipeline-map.json
   Or upgrade the kit:  git pull && cp -r skills/* ~/.claude/skills/
```

`/explain-panel` does **not** try to upgrade or downgrade the map on its own.

## When `/explore-pipeline` writes an older version

It doesn't. `/explore-pipeline` always writes the current `schemaVersion`. If you need an older format, run the appropriate downgrade script (we'll ship one if a downgrade is required for compatibility with an external tool).

## Adding a migration (contributor checklist)

If you're bumping the schema in a PR:

1. Update `schemas/pipeline-map.schema.json`:
   - Bump `schemaVersion`'s `const` to the new version.
   - Bump `$id`.
2. Write `migrate/v<old>-to-v<new>.ts`:
   - Single file, self-contained (no external deps beyond Node stdlib + `ajv`).
   - Exports a `migrate(input: OldMap): NewMap` function.
   - Includes a `main()` for CLI usage (read file, transform, write).
3. Run all `examples/*/docs/pipeline-map.json` through the migrator and commit the updated versions.
4. Update `/explain-panel`'s prerequisite check to **accept both versions during a transition window** (typically one minor release):

   ```bash
   case "$schemaVersion" in
     "1.0"|"2.0") ;; # both supported during transition
     *) echo "Unknown schemaVersion: $schemaVersion"; exit 1 ;;
   esac
   ```

5. After the transition window, remove old-version support from `/explain-panel` and bump the kit major version.
6. Update `CHANGELOG.md` with the breaking change and migration command.

## What counts as a breaking change

- Renaming a required field.
- Removing a field that downstream consumers rely on.
- Changing the type of a field (e.g. `color: string` → `color: object`).
- Changing the semantics of a field (e.g. snippet-relative → file-absolute line numbers).

What is **not** breaking:

- Adding a new optional field.
- Widening an enum (e.g. allowing a new framework value).
- Tightening a numeric range when no existing example violates the new range.

Non-breaking changes don't require a `schemaVersion` bump — just update the `description` strings in the schema and call it out in `CHANGELOG.md`.
