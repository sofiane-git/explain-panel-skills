# Install

Three ways to install `explain-panel-skills` into your Claude Code setup. **Option 1 (marketplace) is the recommended path** — no clone, no `cp`, no symlinks.

## Option 1 — Claude Code marketplace (recommended)

This repo ships a Claude Code plugin manifest and marketplace catalog at `.claude-plugin/`. Inside any Claude Code session, register the marketplace and install the plugin:

```text
/plugin marketplace add sofiane-git/explain-panel-skills
/plugin install docpanel@explain-panel-skills
```

Then reload:

```text
/reload-plugins
```

Both skills are now available under the plugin namespace:

```text
/docpanel:explore-pipeline
/docpanel:explain-panel
```

### Why namespaced?

Claude Code prefixes plugin-distributed skills with the plugin name (`<plugin>:<skill>`) to prevent collisions with other plugins or your local `~/.claude/skills/` entries. You can still trigger them by description ("explore the pipeline", "build the explain panel") without typing the full namespaced name.

### Updating

```text
/plugin marketplace update explain-panel-skills
/plugin install docpanel@explain-panel-skills
```

The plugin pins to the version declared in `.claude-plugin/plugin.json` (currently `1.0.0`). Bumping that field signals a new release to all installed users; until then, `update` is a no-op even if the repo has new commits. See [`CHANGELOG.md`](../CHANGELOG.md) for what each version ships.

### Uninstall

```text
/plugin uninstall docpanel@explain-panel-skills
/plugin marketplace remove explain-panel-skills
```

No local state survives — Claude Code clears the cached plugin from `~/.claude/plugins/cache/`.

## Option 2 — Manual copy (offline / forks / hacking)

For users without network access during install, or for contributors hacking on the skills themselves, copy the skill directories directly:

```bash
git clone https://github.com/sofiane-git/explain-panel-skills.git
cp -r explain-panel-skills/skills/explore-pipeline ~/.claude/skills/
cp -r explain-panel-skills/skills/explain-panel    ~/.claude/skills/
```

Restart your Claude Code session. With this path the skills are **not namespaced** — they appear as plain `/explore-pipeline` and `/explain-panel`.

To update:

```bash
cd explain-panel-skills && git pull
rm -rf ~/.claude/skills/explore-pipeline ~/.claude/skills/explain-panel
cp -r skills/explore-pipeline ~/.claude/skills/
cp -r skills/explain-panel    ~/.claude/skills/
```

## Option 3 — Symlink (active development)

If you're iterating on the skill prompts and want every edit to land immediately in your Claude Code session:

```bash
git clone https://github.com/sofiane-git/explain-panel-skills.git ~/dev/explain-panel-skills
ln -s ~/dev/explain-panel-skills/skills/explore-pipeline ~/.claude/skills/explore-pipeline
ln -s ~/dev/explain-panel-skills/skills/explain-panel    ~/.claude/skills/explain-panel
```

`git pull` in `~/dev/explain-panel-skills` updates both skills atomically.

## Option 4 — Local plugin testing (contributors)

When working on changes to `.claude-plugin/` itself, test the plugin without publishing:

```bash
git clone https://github.com/sofiane-git/explain-panel-skills.git
cd explain-panel-skills
claude --plugin-dir .
```

The `--plugin-dir` flag loads the current directory as a plugin for that session only. Useful for verifying manifest changes before tagging a release.

## Verification

After install, in a fresh Claude Code session:

```text
/help
```

You should see the two skills listed. For Option 1 (marketplace install) they appear under the `docpanel` plugin namespace; for Options 2–3 they appear at the top level.

Quick smoke test:

```text
/docpanel:explore-pipeline
```

(or `/explore-pipeline` if you used Option 2 or 3.) The skill should ask its standard interview questions about monorepo layout and framework.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/plugin marketplace add` is not recognised | Old Claude Code version | Update to the latest CLI release |
| Marketplace added but plugin not listed | Wrong `name` in install command | Use `/plugin install docpanel@explain-panel-skills` — plugin name is `docpanel` (short namespace), marketplace name is `explain-panel-skills` (matches the repo). They're deliberately different. |
| Skills don't appear after install | Forgot to reload | Run `/reload-plugins` or restart the session |
| `Plugin already installed` error | Conflict with a manually copied skill in `~/.claude/skills/` | Remove the manual copy before installing via marketplace |

## Publishing this kit to a different marketplace (maintainer notes)

The repo ships its own single-plugin marketplace at `.claude-plugin/marketplace.json`. To also list it in another marketplace catalogue:

1. Bump the plugin version in `.claude-plugin/plugin.json` and `CHANGELOG.md`.
2. Tag a release: `git tag v1.x.y && git push --tags`.
3. Reference this plugin from the other marketplace's `marketplace.json` with one of:
   - `"source": { "source": "github", "repo": "sofiane-git/explain-panel-skills" }` (latest)
   - Same with `"ref": "v1.x.y"` (pinned tag) or `"sha": "<commit-sha>"` (pinned commit).

The plugin manifest is intentionally minimal — it doesn't reach out to any registry on install. Auditors can read the JSON in <50 lines.

## Submitting to the Anthropic community marketplace

`anthropics/claude-plugins-community` is the public catalogue. Submission flow:

1. Run `claude plugin validate` from the repo root to catch manifest errors.
2. Submit via Claude.ai → Settings → Plugins → Submit, or via the Console form.
3. Approved plugins are pinned to a commit SHA in the catalogue; CI bumps the pin as you push.

The official `claude-plugins-official` marketplace is curated separately by Anthropic; there is no application process for it.
