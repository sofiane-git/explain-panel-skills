# Changelog

All notable changes to this project will be documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [SemVer](https://semver.org/).

## [Unreleased]

### Added
- **README: beginner walkthrough section.** New "Walkthrough — what the skills ask you" section documents every question posed by `/explore-pipeline` (7 questions: monorepo detection, framework, groups, files per group, titles/icons/summaries, annotations, header language) and `/explain-panel` (2 confirmation passes: drift audit + missing-module sweep), with plain-language explanations of why each question exists and what to answer.

### Changed
- **Annotation panel: full UX overhaul across all variants.** Font size increased from 10 px to 12–14 px. Line-reference badges are now square colored boxes instead of plain monospace text. A "Notes" label heads each annotation list. Spacing widened for legibility.
- **Dark/light mode: annotation panel now theme-aware.** The hardcoded `bg-neutral-900` strip (visible in light mode) is replaced with `bg-neutral-50 dark:bg-neutral-950` (Tailwind) / `var(--explain-surface)` (CSS) so the annotation area adapts to the host app's color scheme. `SKILL.md` Phase 3 now detects dark mode strategy (`tailwind.config` `darkMode` field, shadcn/radix-ui presence) and instructs the generator accordingly.
- **Line numbers: file-relative throughout.** Code gutters now start at `snippet_start` instead of 1. Annotation badges show the actual file line number (`snippet_start + key − 1`). `html-pre-highlight.md` and all four template variants updated. `snippetStart` added to the `Section` type and documented in `SKILL.md` Phase 6.
- **`explore-pipeline` Phase 7** now always asks for header language (was conditional on detecting a non-French codebase, which silently skipped the question).

## [1.1.2] — 2026-06-12

### Changed
- **`main` is now protected — all changes land through pull requests** with the four CI checks required and the branch up to date with `main`. Force-pushes and deletions blocked. Workflow documented in `CONTRIBUTING.md` (Branch & PR workflow), `CLAUDE.md`, and `docs/releasing.md` (release commits go through a `release/vX.Y.Z` PR; only tags are pushed directly).
- CI runs on **every** PR: `pull_request` path filters removed — a path-filtered job that doesn't run never reports its required status check, deadlocking the PR on "Expected — waiting for status". Added workflow-level `concurrency` (cancels superseded runs) and `timeout-minutes: 10` per job.

### Added
- Claude Code guardrail: committed PreToolUse hook (`.claude/hooks/protect-main.sh` + `.claude/settings.json`) that denies `git commit` / `git push` from local `main` (tag-only pushes excepted, per the release runbook) and any push targeting a `main` refspec. Applies to every Claude Code session in this repo; GitHub branch protection remains the server-side gate. The hook runs on every Bash call (no `if` prefix filter — a compound command like `npm test && git push origin main` doesn't start with `git`; the script fast-exits on non-git commands instead).

## [1.1.1] — 2026-06-11

### Security
- **Schema: absolute paths now rejected in `file` and `roots[]`.** The v1.0/v1.1 schema only rejected `..` traversal sequences; a map declaring `"file": "/etc/passwd"` validated successfully, contradicting the documented containment contract ("prevents maps from making /explain-panel read files outside the repo"). `file` and every `roots[]` entry now also reject a leading `/`, and `roots[]` entries gained the same character whitelist as `file`. This tightens validation to match the contract that was always documented — maps that relied on absolute paths were exploiting a validation gap, not a feature, so `schemaVersion` stays `1.0`.
- CI workflow hardened: explicit `permissions: contents: read`, all GitHub Actions pinned to commit SHAs, `ajv-cli` pinned to exact `5.0.0` everywhere it is invoked (CI, `package.json`, docs, skill instructions).
- `SECURITY.md` dependency wording corrected: the kit ships no pinned runtime deps to track — `react-syntax-highlighter`/`shiki` are resolved in the user's project; only `ajv-cli` is pinned by the kit.

### Fixed
- **`/explain-panel` Phase 7 XSS scan no longer fails every valid HTML output.** Pass 2 required zero `<meta|link|base|…>` tags, but the HTML standalone template itself legitimately emits two `<meta>` tags (`charset`, `viewport`) — so every conforming generation failed its own validation gate. `meta` moved out of the forbidden-tag pass into a dedicated third pass asserting exactly 2 occurrences.
- **`README.md` usage block claimed an English header default** — contradicting the French schema default shipped in v1.1.0. The v1.1.0 changelog listed this line as fixed, but the fix had not actually landed; it lands now.
- `react-tailwind.tsx.template` doc block hardcoded the English header default ("How it works — full data flow"); it now defers to the `default` keyword in `schemas/pipeline-map.schema.json`, per the single-source-of-truth rule in SKILL.md Phase 6.
- `html-standalone.html.template` doc block referenced wrong class names (`line`, `annotations`); the real classes are `ep-line` / `ep-annotations` (matching the CSS, `html-pre-highlight.md`, and shipped demo).
- Schema self-consistency: `groups` description said "1–5 sections" while `maxItems` is 8 (now "1–8"); `annotations` keys now require `^[1-9][0-9]*$` (key `"0"` and leading zeros were accepted but snippet-relative lines start at 1).
- `docs/install.md` cited plugin version `1.0.0`; now `1.1.0`, with a CI step keeping the prose in sync with `.claude-plugin/plugin.json`.
- `keyboard-handler.md` said "both templates" (stale since the HTML variant shipped); now describes all five template variants including the HTML standalone Escape handler.
- `/explain-panel` Pass B audit script: `roots[]` is optional in the schema but the script assumed it — empty/missing roots made BSD `grep -r` read stdin (hang). Now defaults to `"."`.

### Changed
- **React templates and examples switched from `Prism` to `PrismLight`** with per-language `registerLanguage` calls (new `{{ PRISM_LANGUAGE_IMPORTS }}` / `{{ PRISM_LANGUAGE_REGISTRATIONS }}` placeholders). The root `Prism` export bundles every grammar (~500 KB min); the light build ships only the languages the map uses. `docs/customization.md` bundle-size table updated to match, including accurate shiki guidance (`codeToHtml` lazy-loads grammars via dynamic `import()`; `createHighlighterCore` + `@shikijs/engine-javascript` for the smallest bundle).
- README examples disclaimer now states why the examples sit below the 8–13-module guidance (intentionally trimmed snapshots).

### Added
- CI: example components are now type-checked (`tsc` for the React TSX examples, `vue-tsc` for the Vue example) — enforces CONTRIBUTING's "templates compile" rule.
- CI: `docs/install.md` version-prose sync check.
- `docs/releasing.md` — versioning policy (kit version vs `schemaVersion` as two distinct contracts), step-by-step release checklist, release-notes conventions, and the list of CI guards. Linked from README and CONTRIBUTING.
- `CLAUDE.md` — repo-level guide for Claude Code sessions: validation commands, cross-file invariants, pointer to the release runbook.

## [1.1.0] — 2026-06-11

### Changed
- **Default panel header language switched from English to French.** `/explore-pipeline` and `/explain-panel` now fall back to `"Comment ça marche — flux de données complet"` (icon `📚`) when `header.title` and `header.icon` are missing. Maps that explicitly set `header.title` are unaffected. Users relying on the English fallback should add an explicit `header.title` to their `pipeline-map.json`.
- Documentation consistency pass: HTML standalone variant now mentioned in `README.md`, `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`; demo file size corrected (~17 KB); eval harness path documented in PR template.

### Fixed
- `README.md`: usage block no longer claims English default for the header language prompt.
- `skills/explain-panel/references/html-standalone.html.template`: docstring placeholder name aligned with template body (`{{ FOOTER_NOTE_BLOCK }}`).
- `skills/explain-panel/SKILL.md`: HTML standalone template + pre-highlight reference now listed under Bundled Resources; HTML-escape reminder for `title` / `summary` / `annotations` added to Phase 6; XSS scan in Phase 7 extended to detect `<iframe>`, `<object>`, `<embed>`, `<svg>` injection in addition to `<script>` and event-handler attributes.
- `.github/PULL_REQUEST_TEMPLATE.md`: schema-validation command no longer assumes `pnpm`.

### Added
- `SECURITY.md` — supported-versions matrix and private vulnerability reporting channel.
- CI: HTML standalone template placeholder doc/body drift check.

## [1.0.0] — 2026-06-11

### Added
- Initial release of `explain-panel-skills`.
- `/explore-pipeline` skill: walks any codebase and produces `docs/pipeline-map.json`.
  - Monorepo detection via workspace manifests (npm/pnpm/yarn, Cargo, Pyproject, Lerna, Turbo, Nx).
  - Per-root entry-point probing for HTTP, full-stack, and CLI projects.
  - Mandatory user confirmation for ambiguous root selection.
- `/explain-panel` skill: reads `pipeline-map.json` and generates `ExplainPanel.tsx`, `.vue`, or `.html`.
  - Two-pass deep audit (JSON↔code cross-check + missing-module sweep).
  - Tailwind and plain-CSS variants.
  - React/Next.js (`react-syntax-highlighter`) and Vue/Nuxt (`shiki`) backends.
  - **HTML standalone variant** (auto-fallback when no frontend framework is detected): single self-contained `docs/ExplainPanel.html` file with inline CSS, native `<details>` accordions, pre-highlighted code (six token classes, 11 languages tokenized at generation time — no runtime highlighter, no CDN, no `npm install`). Targets backend-only projects (FastAPI, Django, Rails, Go, Rust, CLI, library) and zero-build static-doc use cases (MkDocs, Sphinx, Docusaurus).
  - Full ARIA support (`aria-expanded`, `aria-controls`, `role="region"`) and keyboard handling (Tab, Enter/Space, Escape with focus return). HTML variant inherits the same contract via native `<details>` + a 30-line inline Escape handler.
  - Backtick / template-literal escape during snippet embedding.
  - Header text driven by the map (i18n-friendly).
  - Custom color objects (`{ text, border, bg }`) supported alongside 12 preset Tailwind colors.
- Plugin distribution via `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json`. Install with `/plugin marketplace add sofiane-git/explain-panel-skills` then `/plugin install docpanel@explain-panel-skills` — no git clone required. Skills become `/docpanel:explore-pipeline` and `/docpanel:explain-panel` under the short `docpanel` namespace.
- JSON Schema 2020-12 at `schemas/pipeline-map.schema.json` (schema version `1.0`).
- Four example projects: `examples/fastapi-rag`, `examples/nextjs-app`, `examples/nuxt-app`, `examples/python-cli` (HTML standalone auto-fallback demo).
- Documentation: architecture, format reference, customization, monorepo detection, migration guide.
- CI workflows: schema validation on PRs.
- Issue templates: bug report, feature request, schema-violation report.
- Migration scaffold for future schema versions.

[Unreleased]: https://github.com/sofiane-git/explain-panel-skills/compare/v1.1.2...HEAD
[1.1.2]: https://github.com/sofiane-git/explain-panel-skills/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/sofiane-git/explain-panel-skills/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/sofiane-git/explain-panel-skills/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/sofiane-git/explain-panel-skills/releases/tag/v1.0.0
