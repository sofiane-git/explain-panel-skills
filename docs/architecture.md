# Architecture

This document explains *why* the kit is split into two skills, what each one is responsible for, and how the JSON contract holds them together. If you only ever want to use the kit, the README is enough. This page is for contributors and curious users.

## High-level shape

```
┌─────────────────────┐    docs/pipeline-map.json    ┌─────────────────────┐
│  /explore-pipeline  │ ───────────────────────────▶ │   /explain-panel    │
│ (codebase analyser) │                              │ (component writer)  │
└─────────────────────┘                              └─────────────────────┘
        │                                                       │
        │ reads source code                                     │ reads source code
        ▼                                                       ▼ (for audit + snippet extraction)
   project source                                          project source
```

The contract between them is a single JSON file at `docs/pipeline-map.json`. Both skills validate it against `schemas/pipeline-map.schema.json`.

## Why two skills

A monolithic skill would conflate two distinct jobs:

1. **Discovery** — finding what's interesting in a codebase. This needs broad context and produces a small artefact.
2. **Generation** — taking a structured spec and producing a working component. This needs a focused context and zero ambiguity.

Keeping them separate gives us:

- **Cleaner prompts.** Each skill's instructions stay short and on-topic. A combined skill ends up either too long (and the model drifts) or too terse (and the model invents).
- **Human review surface.** `pipeline-map.json` is a small file you can read end-to-end in 30 seconds, edit by hand, and version-control. You can't review a 600-line auto-generated TSX with the same speed.
- **Reusability.** The same pipeline map can power other tools: a CLI walkthrough, a `docs/architecture.md` auto-generator, an IDE side-panel. The component is one consumer of the map, not the only one.
- **Auditability.** `/explain-panel`'s audit phase re-reads the source against the map. If the codebase drifted while you were editing the map, the audit catches the drift before generating misleading docs.

## What `/explore-pipeline` does

1. Detects workspace layout (monorepo vs single package) and asks the user to confirm roots.
2. Per root: locates the entry point, traces a primary flow, identifies 8–13 modules.
3. Clusters modules into 2–6 chronological groups.
4. Extracts a 15–35-line snippet per module.
5. Writes 5–10 annotations per snippet (snippet-relative line numbers).
6. Decides header text (asks user if non-English audience suspected).
7. Writes `docs/pipeline-map.json` and validates against the schema.

What it explicitly avoids: rendering anything visual, installing dependencies, touching the frontend.

## What `/explain-panel` does

1. Loads `docs/pipeline-map.json` and validates against the schema.
2. Audits every section against the live codebase (file exists, line range matches function, annotations in range, title coherent).
3. Sweeps the codebase for important code missing from the map and surfaces candidates.
4. Waits for user confirmation on every audit finding before generating.
5. Detects target framework and CSS framework. If no frontend is detected, falls back to the **HTML standalone** variant — no question asked.
6. Picks the right template, reads snippets fresh from source, escapes them safely. For HTML mode, also pre-tokenizes each snippet at generation time using the six-class scheme in `references/html-pre-highlight.md` (no runtime highlighter, no CDN).
7. Installs the syntax highlighter dependency if missing (skipped for HTML mode — zero deps).
8. Substitutes placeholders into the template and writes the component (`components/ExplainPanel.tsx`, `components/ExplainPanel.vue`, or `docs/ExplainPanel.html`).
9. Validates the generated file (type-check for TSX/Vue, HTML parser + token-class audit for HTML).

What it explicitly avoids: silently fixing drift, picking frameworks when ambiguous, overwriting existing files. The HTML auto-fallback is **not** an ambiguity — it's the default when there's nothing to pick.

## The JSON contract

The map is the only thing that crosses the boundary. Its design follows three rules:

1. **Self-describing.** `schemaVersion` is required. Future versions ship migration scripts so old maps keep working.
2. **Line numbers in two coordinate systems.** `snippet_start` / `snippet_end` are **file-absolute** (they point into the source file). Annotation keys are **snippet-relative** (line 1 is the first line of the snippet). This matches how readers experience the output: they see a self-contained code block with its own line numbering.
3. **Roots, not paths.** `roots[]` declares the workspace scope. All `file` fields are still repo-root-relative (so paths stay simple in the JSON), but `roots[]` tells consumers what part of the tree was actually examined.

See [`docs/pipeline-map-format.md`](pipeline-map-format.md) for field-by-field reference.

## Trade-offs we made

| Choice | Trade-off |
|--------|-----------|
| Two skills instead of one | One extra invocation; in exchange we get a small reviewable artefact and a reusable map. |
| JSON as the format | Less expressive than YAML; in exchange we get schema validation and IDE autocomplete out of the box. |
| Tailwind as the default | Forces a dependency; in exchange the component fits visually in 80%+ of modern projects without extra work. Plain-CSS variant handles the rest. |
| HTML standalone as the backend-only default | One more template to maintain (+ a per-language tokenization spec); in exchange, projects without any JS toolchain (FastAPI, Django, Rails, Go, Rust, CLIs) get a working panel out of the box with zero install, zero CDN, and zero runtime deps. |
| Heavy audit before generation | Adds a confirmation step; in exchange we never silently ship stale docs. |
| Snippet-relative annotations | Slightly awkward when extracting them from source; in exchange the rendered code block has stable line references regardless of where the snippet starts in the file. |

## Anti-goals

This kit deliberately does NOT:

- Generate full architecture diagrams (use a dedicated tool — Excalidraw, Mermaid, Structurizr).
- Track changes over time. `pipeline-map.json` is a snapshot. Use git to diff snapshots.
- Auto-update when the source code changes. Documentation drift is a *feature* — the audit step turns drift into a review prompt, instead of silently rewriting docs.
- Embed itself into a build system. Both skills are run by humans (or agents) when wanted, not by webpack on every save.
