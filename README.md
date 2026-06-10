# explain-panel-kit

> Two Claude Code skills that turn any codebase into a beautiful, accordion-based "How it works" documentation panel — with syntax-highlighted code snippets, per-line annotations, and color-coded pipeline stages.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Schema: 1.0](https://img.shields.io/badge/schema-1.0-blue)](schemas/pipeline-map.schema.json)

## What it does

`explain-panel-kit` ships two skills that work together:

1. **`/explore-pipeline`** — walks your codebase, identifies the data flow, and produces a structured `docs/pipeline-map.json` documenting groups → sections → code snippets.
2. **`/explain-panel`** — reads the map, audits it against the live code, and generates a fully working `ExplainPanel.tsx` (React/Next.js) or `ExplainPanel.vue` (Nuxt/Vue) component.

The generated component is an accordion sidebar with:
- syntax-highlighted code snippets (15–35 lines each)
- per-line annotations explaining the **why** behind the code
- color-coded pipeline stages (groups)
- full ARIA support and keyboard navigation (Tab / Enter / Escape)
- Tailwind or plain CSS variants

## Why two skills?

Splitting exploration from generation has three benefits:

- **Cleaner context** — exploration reads a lot of files; component generation works from a compact JSON. Keeping them separate keeps each prompt focused.
- **Review-friendly** — `pipeline-map.json` is a small artefact you can hand-edit, version-control, and review before the component is generated.
- **Reusable** — the map can feed other documentation tools (READMEs, architecture diagrams, IDE plugins) — not just the panel.

## Installation

### Manual install

Copy the two skill directories into your local Claude skills folder:

```bash
git clone https://github.com/sofiane-git/explain-panel-kit.git
cp -r explain-panel-kit/skills/explore-pipeline ~/.claude/skills/
cp -r explain-panel-kit/skills/explain-panel    ~/.claude/skills/
```

Restart your Claude Code session — both skills become available as `/explore-pipeline` and `/explain-panel`.

### Plugin install (Claude Code marketplace)

If your distribution supports plugin manifests, `plugin.json` at the repo root declares the two skills. See [docs/install.md](docs/install.md) for marketplace publishing notes.

## Usage

```bash
# 1. From your project root — analyse the codebase
/explore-pipeline
# Answers a few questions about monorepo layout, primary framework, header language,
# then writes docs/pipeline-map.json

# 2. Optionally hand-edit docs/pipeline-map.json to tighten titles, annotations, ordering.

# 3. Generate the component
/explain-panel
# Audits the map against the live code, asks you to confirm any drift,
# then writes components/ExplainPanel.tsx (or .vue).
```

Then import the component into a page:

```tsx
import ExplainPanel from "@/components/ExplainPanel";
export default function Page() {
  return <ExplainPanel />;
}
```

## Demo

(GIF / screenshot here — coming with v1.0 release.)

Live demo: <https://stackblitz.com/explain-panel-demo> (placeholder — to be added).

## Supported targets

| Framework | Output | Status |
|-----------|--------|--------|
| Next.js (App Router) | `ExplainPanel.tsx` | ✅ |
| Next.js (Pages Router) | `ExplainPanel.tsx` | ✅ |
| React + Vite | `ExplainPanel.tsx` | ✅ |
| Nuxt 3+ | `ExplainPanel.vue` | ✅ |
| Vue 3 + Vite | `ExplainPanel.vue` | ✅ |
| Tailwind CSS | Inline classes | ✅ |
| Plain CSS | BEM + companion `.css` | ✅ |
| Other CSS frameworks (UnoCSS, CSS Modules) | Fallback to plain CSS | ✅ via `--mode=css` |
| Svelte / Solid / Angular | — | not yet, contributions welcome |

## Supported source languages

For the **source code** being documented (not the generated component), the kit recognises and syntax-highlights: Python, TypeScript/TSX, JavaScript/JSX, Vue, Go, Rust, Ruby, PHP, Java, Kotlin, Swift, C#, SQL, Bash, YAML, JSON, HTML, CSS, Markdown.

Other languages are accepted via the `"other"` enum value with manual highlighting fallback.

## Monorepo support

`/explore-pipeline` detects monorepos automatically via `package.json` workspaces, `pnpm-workspace.yaml`, `lerna.json`, `turbo.json`, `nx.json`, `Cargo.toml [workspace]`, and `pyproject.toml`. It then **asks you** which roots to include — never assumes. See [docs/monorepo.md](docs/monorepo.md) for the full detection logic.

## Examples

Three reference projects with full `pipeline-map.json` + generated component:

- [`examples/fastapi-rag/`](examples/fastapi-rag/) — Python RAG pipeline (FastAPI + ChromaDB + Azure AI). Source for this kit's authoring story.
- [`examples/nextjs-app/`](examples/nextjs-app/) — Next.js full-stack app with server actions.
- [`examples/nuxt-app/`](examples/nuxt-app/) — Nuxt 3 site with Nitro API routes.

## Documentation

| Doc | Content |
|-----|---------|
| [`docs/architecture.md`](docs/architecture.md) | Why two skills, what they share, how the JSON is the contract |
| [`docs/pipeline-map-format.md`](docs/pipeline-map-format.md) | Full reference for every field in `pipeline-map.json` |
| [`docs/customization.md`](docs/customization.md) | Colors (preset + custom), header text, CSS overrides, extending the schema |
| [`docs/monorepo.md`](docs/monorepo.md) | How `roots[]` works, how detection runs, when to override |
| [`docs/migration.md`](docs/migration.md) | Upgrading between schema versions |
| [`docs/install.md`](docs/install.md) | Marketplace publishing notes (advanced) |

## Schema

`pipeline-map.json` conforms to [`schemas/pipeline-map.schema.json`](schemas/pipeline-map.schema.json) (JSON Schema 2020-12). The schema is the source of truth — both skills validate against it.

Add this line at the top of your `pipeline-map.json` to get IDE autocomplete and inline validation:

```json
{
  "$schema": "https://raw.githubusercontent.com/sofiane-git/explain-panel-kit/main/schemas/pipeline-map.schema.json",
  "schemaVersion": "1.0",
  ...
}
```

## Contributing

PRs welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening one. Key conventions:

- Skill files live in `skills/<name>/SKILL.md`.
- Templates live in `skills/explain-panel/references/`.
- Schema changes bump `schemaVersion` and ship a migration in `migrate/`.

## License

MIT — see [LICENSE](LICENSE).
