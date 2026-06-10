---
name: Schema violation
about: ajv rejects a pipeline-map.json that looks valid to you (or accepts one that shouldn't be)
labels: schema, bug
---

## Direction

- [ ] False positive (ajv rejects a map that should be valid)
- [ ] False negative (ajv accepts a map that should be invalid)

## Schema version

`schemaVersion` in the offending map:

```
1.0
```

## Minimal map that triggers the bug

```json
{
  "$schema": "...",
  "schemaVersion": "1.0",
  ...
}
```

## Validator output

```
<paste the ajv-cli output here, including the JSON Pointer to the failing location>
```

## Why it should be different

<!-- Quote the relevant section of docs/pipeline-map-format.md and explain how the current behaviour disagrees. -->

## Fix suggestion (optional)

<!-- If you know which schema rule needs changing, name it. -->
