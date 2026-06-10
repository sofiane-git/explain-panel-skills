# Install

Three ways to install the kit into your local Claude Code setup.

## Option 1 — Manual copy (simplest)

```bash
git clone https://github.com/sofiane-git/explain-panel-skills.git
cp -r explain-panel-skills/skills/explore-pipeline ~/.claude/skills/
cp -r explain-panel-skills/skills/explain-panel    ~/.claude/skills/
```

Restart your Claude Code session. Both skills appear as `/explore-pipeline` and `/explain-panel`.

To update:

```bash
cd explain-panel-skills && git pull
rm -rf ~/.claude/skills/explore-pipeline ~/.claude/skills/explain-panel
cp -r skills/explore-pipeline ~/.claude/skills/
cp -r skills/explain-panel    ~/.claude/skills/
```

## Option 2 — Symlink

If you want to pull updates without re-copying:

```bash
git clone https://github.com/sofiane-git/explain-panel-skills.git ~/dev/explain-panel-skills
ln -s ~/dev/explain-panel-skills/skills/explore-pipeline ~/.claude/skills/explore-pipeline
ln -s ~/dev/explain-panel-skills/skills/explain-panel    ~/.claude/skills/explain-panel
```

`git pull` in `~/dev/explain-panel-skills` updates both skills atomically.

## Option 3 — Claude Code plugin marketplace

The repo ships a `plugin.json` declaring the two skills. If your distribution supports plugin manifests (Claude Code, certain forks), point your plugin registry at the repo URL:

```bash
# Claude Code (example — verify against your version's docs)
claude plugin add github.com/sofiane-git/explain-panel-skills
```

The plugin loader reads `plugin.json`, copies both skills into the right location, and registers any required hooks. The manifest schema is documented in `plugin.json` inline comments.

## Verification

After install, in a fresh Claude Code session:

```
/explore-pipeline help
```

If the skill is registered, the model invokes the skill and you get its help output. If nothing happens, the skill isn't on the path — check `~/.claude/skills/` contents.

## Uninstall

```bash
rm -rf ~/.claude/skills/explore-pipeline
rm -rf ~/.claude/skills/explain-panel
```

No external state is created — uninstall is just deleting the directories.

## Publishing this kit to a marketplace (maintainer notes)

If you fork or republish:

1. Update `plugin.json`:
   - `name`, `description`, `homepage`, `author`.
   - Keep the `skills[]` array intact unless you rename directories.
2. Tag a release: `git tag v1.0.0 && git push --tags`.
3. Submit the repo to your target marketplace per its inclusion process.

The plugin manifest is intentionally minimal — it doesn't reach out to any registry on install. Auditors can read the JSON in <100 lines.
