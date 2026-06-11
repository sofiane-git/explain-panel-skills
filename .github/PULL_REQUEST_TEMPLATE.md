## Summary

<!-- 1–3 sentences. What does this PR change? -->

## Type

- [ ] Bug fix
- [ ] New feature
- [ ] Schema change (breaking — includes migrator)
- [ ] Template change (React / Vue / HTML standalone)
- [ ] New framework target (includes example)
- [ ] Docs only

## Reviewer checklist

- [ ] CHANGELOG entry under `## [Unreleased]`.
- [ ] Schema validation passes on all examples (`npm run validate:schema`, or `npx -y ajv-cli@5.0.0 validate --spec=draft2020 -s schemas/pipeline-map.schema.json -d 'examples/*/docs/pipeline-map.json'`).
- [ ] If schema changed, `migrate/v<old>-to-v<new>.ts` added and examples bumped through it.
- [ ] If templates changed, example components regenerated.
- [ ] If a new framework was added, an `examples/<framework>-app/` came with this PR.
- [ ] Trigger evals (`evals/explore-pipeline.json` + `evals/explain-panel.json`) still pass — no regression in either skill's description. See `evals/README.md` for the harness invocation.

## Notes for the reviewer

<!-- Anything tricky? Design choices that deserve scrutiny? -->
