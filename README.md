# ExplainPanel Skills

> Two Claude Code skills that turn any codebase into a beautiful, accordion-based "How it works" documentation panel — with syntax-highlighted code snippets, per-line annotations, and color-coded pipeline stages.

> Package: `explain-panel-skills` · Repo: [`sofiane-git/explain-panel-skills`](https://github.com/sofiane-git/explain-panel-skills)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Schema: 1.0](https://img.shields.io/badge/schema-1.0-blue)](schemas/pipeline-map.schema.json)

## What it does

`explain-panel-skills` ships two skills that work together:

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

### Recommended — Claude Code marketplace (no clone)

Inside any Claude Code session:

```text
/plugin marketplace add sofiane-git/explain-panel-skills
/plugin install docpanel@explain-panel-skills
/reload-plugins
```

Both skills are then available as:

```text
/docpanel:explore-pipeline
/docpanel:explain-panel
```

Plugin-distributed skills are namespaced (`<plugin>:<skill>`) to prevent collisions. The marketplace is named after the repo (`explain-panel-skills`) for discovery; the plugin itself uses the shorter `docpanel` namespace to keep invocations readable. You can also invoke skills by description ("explore the pipeline", "generate the explain panel") without typing the full namespaced name.

### Alternative — manual copy / symlink

For offline installs, forks, or active development on the skills themselves, copy the skill directories directly into `~/.claude/skills/`. Skills then appear without the namespace prefix (`/explore-pipeline`, `/explain-panel`).

Full instructions, troubleshooting, and contributor workflow: [docs/install.md](docs/install.md).

## Usage

```bash
# 1. From your project root — analyse the codebase
/explore-pipeline
# Answers a few questions about monorepo layout, primary framework,
# and header language (optional — defaults to English if you skip).
# Writes docs/pipeline-map.json.

# 2. Optionally hand-edit docs/pipeline-map.json to tighten titles, annotations, ordering.

# 3. Generate the component
/explain-panel
# Audits the map against the live code, asks you to confirm any drift,
# then writes components/ExplainPanel.tsx (or .vue).
```

Then import the component into a page (React/Vue case):

```tsx
import ExplainPanel from "@/components/ExplainPanel";
export default function Page() {
  return <ExplainPanel />;
}
```

If no frontend is detected (FastAPI / Django / Rails / Go / Rust / library), step 3 writes `docs/ExplainPanel.html` instead — a single self-contained file. Open it directly via `file://`, serve it from your backend's static directory, or embed it into MkDocs/Docusaurus/Sphinx. No `import`, no `npm install`. See [Supported targets](#supported-targets) for the per-stack integration recipe.

### Generating the panel in another language (French, Spanish, etc.)

Every text string in the panel comes from `docs/pipeline-map.json` — the renderer never translates anything. Two paths depending on what you need:

**Single-language panel (most common)** — write the map in your language.

1. During `/explore-pipeline`, answer the "header language" question with your locale (the skill ships defaults for English, French, Spanish, German, Japanese — type anything else as free text).
2. Write `header.title`, every `section.title` / `summary`, every `group.label`, and all `annotations` values in that language. UTF-8 free-form — no escaping.
3. Run `/explain-panel`. The generated component embeds those strings literally — no extra config.

Example (French — see [`examples/fastapi-rag/docs/pipeline-map.json`](examples/fastapi-rag/docs/pipeline-map.json) for a real one):

```json
{
  "header": { "title": "Comment ça marche — flux de données complet", "icon": "📚" },
  "groups": [
    {
      "id": "ingestion",
      "label": "Ingestion",
      "color": "sky",
      "sections": [
        { "title": "Récupération des articles", "summary": "Appelle NewsAPI…", "annotations": { "5": "Clé API lue depuis l'env" } }
      ]
    }
  ]
}
```

**Multi-language panel (rare)** — see [`docs/customization.md#i18n-beyond-the-header`](docs/customization.md#i18n-beyond-the-header). Short version: generate one map per locale (`pipeline-map.fr.json`, `pipeline-map.en.json`), produce one component per locale, switch on your app's current locale.

## Demo

![ExplainPanel — three groups of an example FastAPI RAG pipeline, all sections expanded, with pre-highlighted Python and side-by-side per-line annotations](docs/media/demo.png)

The screenshot above is the HTML standalone variant rendered from [`examples/fastapi-rag/docs/pipeline-map.json`](examples/fastapi-rag/docs/pipeline-map.json) (header in French, three groups: *Ingestion*, *Indexation*, *Récupération*, all sections expanded).

Want to interact with it locally? The pre-rendered file is checked in — open it in any browser:

```bash
open docs/media/demo.html        # macOS
xdg-open docs/media/demo.html    # Linux
```

No build step, no `npm install` — it's the exact output `/explain-panel` produces for a backend-only project. Tab through the sections, press Enter/Space to toggle, Escape to close.

## Supported targets

| Framework | Output | Status |
|-----------|--------|--------|
| Next.js (App Router) | `components/ExplainPanel.tsx` | ✅ |
| Next.js (Pages Router) | `components/ExplainPanel.tsx` | ✅ |
| React + Vite | `components/ExplainPanel.tsx` | ✅ |
| Nuxt 3+ | `components/ExplainPanel.vue` | ✅ |
| Vue 3 + Vite | `components/ExplainPanel.vue` | ✅ |
| **No frontend detected** (FastAPI, Django, Rails, Go, Rust, CLI, library) | **`docs/ExplainPanel.html`** — single self-contained file, zero runtime deps, pre-highlighted | ✅ |
| Tailwind CSS | Inline classes | ✅ |
| Plain CSS | BEM + companion `.css` | ✅ |
| Other CSS frameworks (UnoCSS, CSS Modules) | Fallback to plain CSS | ✅ via `--mode=css` |
| Svelte / Solid / Angular | — | not yet, contributions welcome |

### The HTML standalone variant

When no frontend framework is detected, `/explain-panel` automatically generates `docs/ExplainPanel.html`: a single ~50KB file containing inline CSS, native `<details>` accordions, and pre-highlighted code (no `highlight.js`, no CDN, no `npm install`). Open it directly via `file://`, serve it from FastAPI's `StaticFiles`, Django's `staticfiles`, Rails' `public/`, or paste it into MkDocs/Docusaurus/Sphinx as a raw HTML block. The visual matches the React/Vue variants (same accordion, same group colors, same line-annotation layout). Override with `--framework=react` or `--framework=vue` if you actually want a component file even though no frontend is detected.

## Supported source languages

For the **source code** being documented (not the generated component), the kit recognises and syntax-highlights: Python, TypeScript/TSX, JavaScript/JSX, Vue, Go, Rust, Ruby, PHP, Java, Kotlin, Swift, C#, SQL, Bash, YAML, JSON, HTML, CSS, Markdown.

Other languages are accepted via the `"other"` enum value with manual highlighting fallback.

## Monorepo support

`/explore-pipeline` detects monorepos automatically via `package.json` workspaces, `pnpm-workspace.yaml`, `lerna.json`, `turbo.json`, `nx.json`, `Cargo.toml [workspace]`, and `pyproject.toml`. It then **asks you** which roots to include — never assumes. See [docs/monorepo.md](docs/monorepo.md) for the full detection logic.

## Pipeline groups: you define them

The examples use groups like `routing / data / mutations` (Next.js) or `ingestion / indexation / retrieval / generation` (FastAPI RAG). **These are not built-in categories.** They're the project author's choice of how to slice their own code into stages.

The schema enforces only:

- **1–8 groups** per map (`groups[]`), ordered chronologically.
- **1–8 sections** per group (`groups[].sections[]`).
- A unique `id` and a `color` (preset name or custom hex object) per group.

Pick whatever group names match how *you* explain your project. `auth / billing / webhooks`, `read-path / write-path / background-jobs`, `parse / validate / store / serve` — all valid. `/explore-pipeline` proposes a starting set during the interview; you can override anything before the map is written.

See [`docs/pipeline-map-format.md`](docs/pipeline-map-format.md#groups-array-required-18-items) for the full field reference.

## Source framework ≠ output framework

The panel renderer (React TSX or Vue SFC) is **decoupled** from the language of the code being documented. The FastAPI example documents Python and outputs React because the original project shipped a React frontend — it could just as well output Vue. Pick the panel variant that matches the UI stack of the app where you'll embed it, not the backend language of the code you're documenting.

## Examples

Three reference projects with full `pipeline-map.json` + generated component. They cover the matrix (back-only / full-stack-React / full-stack-Vue) rather than the full list of supported source frameworks — `/explore-pipeline` reads any codebase, so Django / Express / Rails / Spring etc. work without a dedicated example.

- [`examples/fastapi-rag/`](examples/fastapi-rag/) — Python RAG pipeline (FastAPI + ChromaDB + Azure AI). Backend-only source, React output. Source for this kit's authoring story.
- [`examples/nextjs-app/`](examples/nextjs-app/) — Next.js full-stack app. Backend = Server Actions + Route Handlers (no separate service). React output.
- [`examples/nuxt-app/`](examples/nuxt-app/) — Nuxt 3 site. Backend = Nitro `server/api/*` handlers (no separate service). Vue SFC output + plain-CSS variant.

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
  "$schema": "https://raw.githubusercontent.com/sofiane-git/explain-panel-skills/main/schemas/pipeline-map.schema.json",
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
