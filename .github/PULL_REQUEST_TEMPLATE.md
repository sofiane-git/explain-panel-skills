## Summary

<!-- 1–3 sentences. What does this PR change? -->

## Type

- [ ] Bug fix
- [ ] New feature
- [ ] Schema change (breaking — includes migrator)
- [ ] Template change (React / Vue / both)
- [ ] New framework target (includes example)
- [ ] Docs only

## Reviewer checklist

- [ ] CHANGELOG entry under `## [Unreleased]`.
- [ ] Schema validation passes on all examples (`pnpm run validate:schema`).
- [ ] If schema changed, `migrate/v<old>-to-v<new>.ts` added and examples bumped through it.
- [ ] If templates changed, example components regenerated.
- [ ] If a new framework was added, an `examples/<framework>-app/` came with this PR.
- [ ] Trigger evals (`evals/evals.json`) still pass — no regression in either skill's description.

## Notes for the reviewer

<!-- Anything tricky? Design choices that deserve scrutiny? -->
