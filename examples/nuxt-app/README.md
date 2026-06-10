# Example: Nuxt 3 + Nitro

A Nuxt 3 site with Nitro API routes — demonstrates the Vue/Nuxt SFC output and the plain-CSS variant.

## Files

- [`docs/pipeline-map.json`](docs/pipeline-map.json)
- [`components/ExplainPanel.vue`](components/ExplainPanel.vue) — generated Vue SFC.
- [`components/ExplainPanel.css`](components/ExplainPanel.css) — companion stylesheet because this project does not use Tailwind.

## Highlights

- Single-package repo (`roots: ["."]`).
- TypeScript on both frontend and Nitro side.
- 3 groups: pages / api / state.
- Plain-CSS variant — no Tailwind dependency.
