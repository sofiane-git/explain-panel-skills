# Evals

Trigger-accuracy evals for the two skills. The harness is `skill-creator` (bundled with Claude Code's official plugin marketplace as `claude-plugins-official`).

## File layout

- `explore-pipeline.json` — flat eval set for `/explore-pipeline`. Each entry: `{ id, should_trigger, query }`.
- `explain-panel.json`    — flat eval set for `/explain-panel`. Same shape.

The format matches what `skill-creator/scripts/run_eval.py` and `run_loop.py` expect (verbatim) — a JSON array at the top level, each entry with `query` (string) and `should_trigger` (boolean). Other keys are ignored.

## Prerequisites

1. **`skill-creator` plugin installed.** It ships with Claude Code's official marketplace. Verify with:
   ```bash
   ls ~/.claude/plugins/cache/claude-plugins-official/skill-creator/unknown/skills/skill-creator/scripts/run_loop.py
   ```
   If missing, install via `/plugin marketplace add anthropics/claude-plugins-official` then `/plugin install skill-creator@claude-plugins-official`.

2. **Python 3.10+** with `PyYAML` (used by `quick_validate.py`). One-liner:
   ```bash
   python3 -c "import yaml" || pip install pyyaml
   ```

3. **`claude` CLI on PATH** (the eval harness shells out to `claude -p "<query>"` × N for each eval). Run `claude --version` to confirm.

4. **API credit / quota.** Each iteration runs `len(evals) × runs_per_query` Claude calls. With defaults (3 runs × ~10 evals × 5 iterations) ≈ **150 calls per skill** per loop. Budget ~$0.50–$2 / skill on Sonnet 4.6.

## Running

The harness lives in the skill-creator cache. Run from the repo root, with `PYTHONPATH` pointing at the skill's directory so the `scripts.` module resolves:

```bash
SK="$HOME/.claude/plugins/cache/claude-plugins-official/skill-creator/unknown/skills/skill-creator"

# /explore-pipeline
PYTHONPATH="$SK" python3 -m scripts.run_loop \
  --eval-set evals/explore-pipeline.json \
  --skill-path skills/explore-pipeline \
  --model claude-sonnet-4-6 \
  --max-iterations 5 \
  --runs-per-query 3 \
  --holdout 0.4 \
  --verbose

# /explain-panel
PYTHONPATH="$SK" python3 -m scripts.run_loop \
  --eval-set evals/explain-panel.json \
  --skill-path skills/explain-panel \
  --model claude-sonnet-4-6 \
  --max-iterations 5 \
  --runs-per-query 3 \
  --holdout 0.4 \
  --verbose
```

`run_loop`:

1. Splits the eval set 60/40 (train/test, stratified on `should_trigger`).
2. Evaluates the current description by spawning ~`evals × runs_per_query` `claude -p` processes in parallel (default 10 workers).
3. If train accuracy < 100%, asks Claude to rewrite the description (it sees only train results — test is blinded to prevent overfitting).
4. Iterates up to `--max-iterations`. Picks the iteration with the best **test** score as the winning description.
5. Writes a live HTML report at `/tmp/skill_description_report_<skill>_<timestamp>.html` and opens it in your browser.

### Single-pass eval (no improvement)

To just measure the current description without iterating (cheaper, ~30 sec / skill):

```bash
PYTHONPATH="$SK" python3 -m scripts.run_eval \
  --eval-set evals/explore-pipeline.json \
  --skill-path skills/explore-pipeline \
  --runs-per-query 3 \
  --num-workers 10 \
  --timeout 30 \
  --verbose
```

The output JSON has `passed/total` per eval plus a per-prompt trigger rate. Useful for baselining before deciding whether to spend the full loop.

### Apply the winning description

`run_loop` prints the best description to stderr at the end (and writes it into the HTML report). It does **not** mutate `SKILL.md` automatically. Copy the winning line by hand into the `description:` field of the skill's frontmatter, commit, and re-run a single-pass eval to confirm parity.

## Re-baselining

After meaningful changes to either skill's `description` field, re-run the loop. The starting score is the current description; the loop attempts to beat it. If `best_score == original_score` and `exit_reason == "all_train_passed"`, the current description is already as good as the harness can reach with this eval set — no rewrite needed.

## Adding evals

When adding evals, balance positive (`should_trigger: true`) and negative (`should_trigger: false`) cases. The most valuable negative cases are **near-misses** — prompts that share keywords with the skill but actually need something else. Examples currently in the file:

- "Refactor my pipeline" → triggers a refactoring intent, not exploration.
- "Style the ExplainPanel with a different color" → edits the *existing* component, doesn't re-generate.
- "Generate the pipeline map" (asked of `/explain-panel`) → wrong skill — that's `/explore-pipeline`.

Avoid trivial negatives ("write a fibonacci function") — they don't measure anything that matters for the skill's boundary.

After updates, run a single-pass `run_eval` against the new file to verify the description still passes; then run the full loop if accuracy dropped below 90%.

## Why the eval set is split per skill (not a single file)

`run_loop.py` / `run_eval.py` accept a single eval set at the top level — they have no notion of "which skill is this for" (that's controlled by `--skill-path`). Keeping one file per skill matches the harness contract exactly; the earlier combined `evals.json` required an extraction step that was easy to get wrong and silently broke the harness (field-name mismatch: it used `prompt`, the harness reads `query`).
