# Changelog

All notable changes to this project will be documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [SemVer](https://semver.org/).

## [Unreleased]

(No unreleased changes.)

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

[Unreleased]: https://github.com/sofiane-git/explain-panel-skills/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/sofiane-git/explain-panel-skills/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/sofiane-git/explain-panel-skills/releases/tag/v1.0.0
