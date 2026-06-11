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

## Preview

The repo's [root README](../../README.md#demo) embeds a screenshot of the HTML standalone variant rendered from the `fastapi-rag` map. For a live interactive preview, open [`docs/media/demo.html`](../../docs/media/demo.html). For this Nuxt example's SFC output, read [`components/ExplainPanel.vue`](components/ExplainPanel.vue) directly.

## Notes on this example's choices

- **Backend is included.** Nuxt is full-stack via Nitro: the `api` group documents `server/api/*` handlers (`defineEventHandler`). No separate backend service — Nitro is the backend.
- **Groups are user-defined.** `pages / api / state` are this project's primary concerns. Your app could use `pages / api / middleware / plugins` or anything else. The schema allows any 1–8 group ids — see [`docs/pipeline-map-format.md`](../../docs/pipeline-map-format.md#groups).
- **Output framework matches the source here** (Vue SFC panel for a Nuxt app), but it doesn't have to. `/explain-panel` can also generate a React panel from a Nuxt codebase — the panel renderer is decoupled from the source framework.
