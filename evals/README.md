# Evals

Trigger-accuracy evals for the two skills. The harness is `skill-creator` (bundled with Claude Code's official plugin marketplace).

## File layout

- `evals.json` — both skills' eval sets in one file. Each entry has a `prompt` and a `should_trigger` flag.

## Running

```bash
# Install skill-creator if not present, then:
python -m scripts.run_loop \
  --eval-set evals/evals.json \
  --skill-path skills/explore-pipeline \
  --model claude-sonnet-4-6 \
  --max-iterations 5 --verbose

python -m scripts.run_loop \
  --eval-set evals/evals.json \
  --skill-path skills/explain-panel \
  --model claude-sonnet-4-6 \
  --max-iterations 5 --verbose
```

`run_loop` evaluates each prompt three times, splits 60/40 train/test, and iterates the skill's description until trigger accuracy stops improving. The HTML report it opens at the end has the per-iteration scores.

## Re-baselining

After meaningful changes to either skill's `description` field, re-run the loop. The starting score is the current description; the loop attempts to beat it.

## Adding evals

When adding evals, balance positive (`should_trigger: true`) and negative (`should_trigger: false`) cases. The most valuable negative cases are **near-misses** — prompts that share keywords with the skill but actually need something else. Examples in this file:

- "Refactor my pipeline" → triggers a refactoring intent, not exploration.
- "Style the ExplainPanel with a different color" → edits the *existing* component, doesn't re-generate.
- "Generate the pipeline map" (when asked of explain-panel) → wrong skill — that's explore-pipeline.

Avoid trivial negatives ("write a fibonacci function") — they don't measure anything.
