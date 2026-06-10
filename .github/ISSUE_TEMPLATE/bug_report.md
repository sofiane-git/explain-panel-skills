---
name: Bug report
about: Something the kit produces is wrong, broken, or unexpected
labels: bug
---

## What happened

<!-- Short, factual description. What did /explore-pipeline or /explain-panel produce that you didn't expect? -->

## Reproduction

1. Repo layout (top-level `ls`):
   ```
   <paste output of `ls`>
   ```
2. Command you ran:
   ```
   /explore-pipeline   or   /explain-panel
   ```
3. Answers you gave to interactive prompts (if any):
   - …

## Expected vs actual

- **Expected:** …
- **Actual:** …

## Files

If safe to share, attach:
- `docs/pipeline-map.json` (or a minimal reproducer)
- The generated component (if `/explain-panel` ran)
- Type-check / install errors verbatim

## Environment

- Claude Code version: `claude --version` →
- Node version: `node --version` →
- Package manager: pnpm / yarn / npm / bun
- OS: macOS / Linux / Windows + WSL
- explain-panel-skills version (or commit SHA): …
