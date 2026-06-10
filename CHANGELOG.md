# Changelog

All notable changes to this project will be documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Initial release of `explain-panel-kit`.
- `/explore-pipeline` skill: walks any codebase and produces `docs/pipeline-map.json`.
  - Monorepo detection via workspace manifests (npm/pnpm/yarn, Cargo, Pyproject, Lerna, Turbo, Nx).
  - Per-root entry-point probing for HTTP, full-stack, and CLI projects.
  - Mandatory user confirmation for ambiguous root selection.
- `/explain-panel` skill: reads `pipeline-map.json` and generates `ExplainPanel.tsx` or `.vue`.
  - Two-pass deep audit (JSON↔code cross-check + missing-module sweep).
  - Tailwind and plain-CSS variants.
  - React/Next.js (`react-syntax-highlighter`) and Vue/Nuxt (`shiki`) backends.
  - Full ARIA support (`aria-expanded`, `aria-controls`, `role="region"`) and keyboard handling (Tab, Enter/Space, Escape with focus return).
  - Backtick / template-literal escape during snippet embedding.
  - Header text driven by the map (i18n-friendly).
  - Custom color objects (`{ text, border, bg }`) supported alongside 12 preset Tailwind colors.
- JSON Schema 2020-12 at `schemas/pipeline-map.schema.json` (schema version `1.0`).
- Three example projects: `examples/fastapi-rag`, `examples/nextjs-app`, `examples/nuxt-app`.
- Documentation: architecture, format reference, customization, monorepo detection, migration guide.
- CI workflows: schema validation on PRs.
- Issue templates: bug report, feature request, schema-violation report.
- Migration scaffold for future schema versions.

[Unreleased]: https://github.com/sofiane-git/explain-panel-kit/compare/main...HEAD
