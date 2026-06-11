# Example: backend-only Python CLI (HTML standalone output)

This is the example that demonstrates `/explain-panel`'s HTML auto-fallback path: a pure-backend project with no React, Vue, or any other JS framework. The skill detects the absence of a frontend manifest and generates a single self-contained `docs/ExplainPanel.html` instead of a TSX or SFC component.

Use this example to see the input → output mapping for backend-only projects without running the skills yourself.

## Files

- [`docs/pipeline-map.json`](docs/pipeline-map.json) — the structured map that `/explore-pipeline` would produce for a small RAG indexer CLI.
- [`docs/ExplainPanel.html`](docs/ExplainPanel.html) — the rendered HTML output that `/explain-panel` would generate from that map. Open it in any browser (`file://` works) — no build step, no `npm install`, no CDN. The same file is also linked from the root README as the live demo.

## Highlights

- `framework: "other"` — explicit signal that this project has no recognised frontend.
- 3 groups (`ingestion / indexation / retrieval`), one section each. Lighter than `fastapi-rag` so the resulting HTML stays small for casual inspection.
- French header text — proves the i18n optionality with a non-English locale.
- All four token-class families (`hl-kw`, `hl-str`, `hl-num`, `hl-com`, `hl-fn`, `hl-attr`) appear at least once across the snippets.

## Notes on this example's choices

- **Why a CLI rather than a daemon, a notebook, or a worker?** The HTML standalone variant is framework-agnostic on purpose. CLI just happens to be a clear archetype where "no frontend" isn't a missing piece — it's the design. The same output applies to a Django app, a Rails service, a Spring Boot API, a Go binary, or a Rust crate.
- **`framework: "other"`** is the schema's safety hatch for projects that don't match the preset enum (`nextjs | nuxt | react | vue | fastapi | django | express | rails | other`). The skill treats it as "no frontend" and goes to the HTML path unless overridden by `--framework=react|vue`.
- **Snippets are the same three that appear in `examples/fastapi-rag/`** — deliberate. This keeps the demo HTML small and lets readers compare the React TSX output (in `examples/fastapi-rag/components/ExplainPanel.tsx`) and the HTML standalone output side by side, on identical content.

## This is a snapshot, not a runnable repo

Like the other examples, the source files referenced from the map (`src/ingest/news_api.py`, `src/rag/chroma_client.py`, `src/rag/retrieval.py`) **do not exist** in this directory. The example exists to document what the input + output of the HTML auto-fallback look like, not to be regenerated. If you run `/explain-panel` from inside this directory, the audit phase will report "file not found" — that is expected.
