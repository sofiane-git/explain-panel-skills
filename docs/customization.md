# Customization

The generated `ExplainPanel` is meant to drop in as-is for 80% of projects. The remaining 20% — brand colors, translated headers, custom CSS — is what this page covers.

## Defining your own groups

There are no built-in group names. The examples ship with `routing / data / mutations` (Next.js), `pages / api / state` (Nuxt), and `ingestion / indexation / retrieval / generation` (FastAPI RAG) — those are author choices, not framework presets.

Constraints from the schema:

- **1–8 groups** per map.
- **1–8 sections** per group.
- Each group needs a unique `id` (kebab-case, used as JS identifier internally), a display `label`, a `color`, and a `sections[]` array.

Pick group names that match how you'd actually explain the project to a new contributor — verbs of what the code does in chronological order. Examples that have worked well:

- Backend services: `ingest / index / search / rank`
- CRUD apps: `read-path / write-path / background-jobs`
- E-commerce: `catalog / cart / checkout / webhooks`
- Auth-heavy apps: `auth / session / authz / billing`

`/explore-pipeline` proposes a starter set during the interview based on what it finds in the code. You can override every name before the map is written, and you can re-edit `docs/pipeline-map.json` at any time before running `/explain-panel`.

Full field reference: [`pipeline-map-format.md`](pipeline-map-format.md#groups-array-required-18-items).

## Header text & icon

Both are driven by `header.title` and `header.icon` in the map. Set them once during `/explore-pipeline` (the skill asks for them) or edit `pipeline-map.json` directly and re-run `/explain-panel`.

```json
"header": {
  "title": "Cómo funciona — flujo de datos completo",
  "icon": "🧭"
}
```

The kit ships defaults for English, French, Spanish, German, and Japanese in `/explore-pipeline`. For other languages, type your own when prompted.

## Group colors

### Preset colors

12 Tailwind palettes are available out of the box:

`sky | indigo | amber | emerald | rose | violet | cyan | fuchsia | lime | orange | teal | pink`

Each expands to three classes (`text-{c}-500`, `border-{c}-500/30`, `bg-{c}-500/5`).

```json
"color": "violet"
```

### Custom colors (brand palette)

Use the object form. All three fields are required:

```json
"color": {
  "text":   "text-[#FF6B35]",
  "border": "border-[#FF6B35]/30",
  "bg":     "bg-[#FF6B35]/5"
}
```

Tailwind's arbitrary-value syntax works for hex codes. If you're not on Tailwind, drop in your own CSS classes:

```json
"color": {
  "text":   "explain-color-brand-text",
  "border": "explain-color-brand-border",
  "bg":     "explain-color-brand-bg"
}
```

then define those classes in your stylesheet.

## Backend-only projects — the HTML standalone variant

If your project has no frontend (pure FastAPI, Django, Rails, Go service, Rust CLI, library, etc.), `/explain-panel` skips the React/Vue templates and writes `docs/ExplainPanel.html` instead — a single self-contained file with inline CSS, native `<details>` accordions, and pre-highlighted code blocks. No `package.json`, no `npm install`, no CDN.

How to use the generated file:

| Context | What to do |
|---|---|
| Local preview | `open docs/ExplainPanel.html` (macOS) / `xdg-open` (Linux) — opens in the default browser via `file://`. |
| FastAPI | `app.mount("/docs/panel", StaticFiles(directory="docs"), name="panel")` then visit `/docs/panel/ExplainPanel.html`. |
| Django | Drop `docs/ExplainPanel.html` into a staticfiles directory or render via a thin view. |
| Rails | Move to `public/explain-panel.html` and link from your docs nav. |
| MkDocs / Docusaurus / Sphinx | Embed as a raw HTML block, or link directly. |
| Forced regeneration as React/Vue even when no frontend exists | Re-run `/explain-panel` with `--framework=react` or `--framework=vue`. |

The HTML uses the same six syntax-highlighting token classes (`hl-kw`, `hl-str`, `hl-num`, `hl-com`, `hl-fn`, `hl-attr`) as documented in `skills/explain-panel/references/html-pre-highlight.md`. To retheme: override the CSS variables declared at the top of the generated file (`--ep-bg`, `--ep-fg`, `--ep-hl-*`) in your own stylesheet, or edit them inline — the file is yours to touch.

Built-in dark/light mode follows `prefers-color-scheme` — no toggle needed.

## CSS framework — Tailwind vs plain CSS

`/explain-panel` detects Tailwind by scanning `package.json` for `tailwindcss`. Output:

- **Tailwind detected** → inline `className="..."` strings, no extra CSS file.
- **Tailwind not detected** → BEM class names + a companion `ExplainPanel.css` file generated alongside the component.

The CSS variant exposes theming via CSS custom properties:

```css
:root {
  --explain-surface: #fff;
  --explain-text: #525252;
  --explain-text-strong: #1f2937;
  --explain-accent: #6366f1;
  --explain-accent-bg: rgba(99, 102, 241, 0.1);
  --explain-annotation-bg: rgba(99, 102, 241, 0.15);
  /* Per-group sets generated from your map's groups: */
  --explain-color-ingestion-text: ...;
  --explain-color-ingestion-border: ...;
  --explain-color-ingestion-bg: ...;
}
```

Override any of these in your own stylesheet to retheme the panel without touching the generated component.

## Switching from Tailwind to plain CSS (or back)

Re-run `/explain-panel`. It picks the right template based on what it detects. If you want to force a mode:

```
/explain-panel --css     # force plain-CSS variant
/explain-panel --tailwind # force Tailwind variant
```

The flag is read from the user message — `/explain-panel` looks for `--css` or `--tailwind` in the conversation prompt and skips detection.

## Snippet length

The schema accepts any `snippet_end - snippet_start` ≥ 0, but the UI is designed for 15–35 lines. Outside that range:

- **Too short (<15 lines)**: the code block looks empty next to the annotation panel. Consider extending to include the function's surroundings.
- **Too long (>35 lines)**: vertical scroll inside the accordion item kicks in. Consider splitting into two sections (e.g. "Setup" and "Main loop") or using the `summary` field to elide.

## Annotation length

Each annotation: ~240 character soft cap (enforced by the schema). The UI doesn't truncate, but anything longer wraps into more lines than the layout was designed for. Keep notes punchy — they're not the place for full prose; that's what `summary` is for.

## Extending the generated component

The component is a single file with no internal abstractions to learn. To add your own content blocks (images, diagrams, links):

1. Don't fight the template. Generate the panel, then edit the produced file directly.
2. Locate the section content area — in React it's inside the `<div className="px-4 pb-4 pt-2 space-y-3">` block; in Vue it's the same structure in the `<template>`.
3. Add JSX/template above or below the `<CodeBlock />` call.

Or, fork the templates in `skills/explain-panel/references/` and adjust to your needs. If your extension is widely useful, open a PR — see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Keyboard & accessibility tweaks

The default behaviour:

- Tab through buttons.
- Enter / Space to toggle.
- Escape to close + return focus to the opening button.

To add arrow-key navigation, focus traps, or other ARIA patterns, edit the generated component directly. The `references/keyboard-handler.md` reference inside the skill documents the contract — keep that file's invariants intact if you redistribute the change.

## i18n beyond the header

The map itself can hold localized strings — `title`, `summary`, `label`, and annotation values all accept any UTF-8 string. The renderer doesn't transform them. For multi-locale support, generate one map per locale (`docs/pipeline-map.fr.json`, `docs/pipeline-map.en.json`) and produce two components (`ExplainPanel.fr.tsx`, `ExplainPanel.en.tsx`), then switch based on your app's locale.

A more advanced approach: extract the strings into a separate translation file and reference keys from the map. That's outside the current scope — open an issue if you'd like it built in.
