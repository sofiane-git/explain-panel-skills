# Migrate

Schema migrators for `pipeline-map.json` live here. One file per version transition.

The current schema version is `1.0` — no migration exists yet because there is no older version. When the schema is bumped to `1.1` (additive) or `2.0` (breaking), a corresponding script lands here.

## Naming

- `v<old>-to-v<new>.ts` — TypeScript, runs under Node ≥ 18, no transpile step (`npx ts-node` or `tsx`).
- The script transforms a single file in place by default; supports `--stdout` for stream usage.

## Authoring a migrator

1. Read the input map.
2. Validate against the *old* schema (fail fast if invalid).
3. Transform the in-memory object.
4. Set `schemaVersion` to the new value.
5. Validate against the *new* schema.
6. Write back (or to stdout).

A reference template lives at `_template.ts` in this directory.

## Running

```bash
npx ts-node migrate/v1-to-v2.ts docs/pipeline-map.json
# or
npx tsx migrate/v1-to-v2.ts docs/pipeline-map.json --stdout > docs/pipeline-map.v2.json
```

See [`docs/migration.md`](../docs/migration.md) for the broader migration policy.
