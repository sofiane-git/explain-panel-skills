# `pipeline-map.json` format reference

This is the field-by-field reference for `docs/pipeline-map.json`. The authoritative source is [`schemas/pipeline-map.schema.json`](../schemas/pipeline-map.schema.json) — this page is human-readable prose, but if it disagrees with the schema, the schema wins.

## Top-level shape

```json
{
  "$schema": "https://raw.githubusercontent.com/sofiane-git/explain-panel-skills/main/schemas/pipeline-map.schema.json",
  "schemaVersion": "1.0",
  "project": "Nauda Palisse — Veille Tech",
  "framework": "fastapi",
  "roots": ["app/", "web/"],
  "header": {
    "title": "Comment ça marche — flux de données complet",
    "icon": "📚"
  },
  "groups": [ ... ]
}
```

## Fields

### `schemaVersion` (string, required)

Currently `"1.0"`. `/explain-panel` refuses maps with an unknown version and tells you to run a migration from [`migrate/`](../migrate). When the schema changes, the kit ships a migrator — see [migration.md](migration.md).

### `project` (string, required)

Human-readable project name. Used as the default if `header.title` is missing — and as the value some renderers may show in tooltips. Not used for path resolution.

### `framework` (string, required)

Primary framework of the project. Drives two decisions in `/explain-panel`:

1. **Output type** — `nextjs`, `react` → TSX (`components/ExplainPanel.tsx`); `nuxt`, `vue` → Vue SFC (`components/ExplainPanel.vue`); backend-only frameworks (`fastapi`, `django`, `express`, `rails`) or `other` with no detected frontend → **HTML standalone** (`docs/ExplainPanel.html`, single self-contained file, zero runtime deps, pre-highlighted). Override the auto-fallback by re-running `/explain-panel --framework=react` or `--framework=vue` if you actually want a component file regardless of detection.
2. **Default language** for snippets if a section omits its `language` field (rare — sections normally set it).

Allowed values: `nextjs | nuxt | react | vue | fastapi | django | express | rails | other`.

### `roots[]` (array of strings, required)

Workspace roots that were analysed. Single entry for non-monorepo projects, multiple for monorepos. Paths are relative to the repository root (the directory containing this JSON file's parent — i.e. relative to `docs/pipeline-map.json`'s `../`).

`/explain-panel`'s Pass-B audit re-scans these roots looking for code missing from the map. Don't leave it empty — `/explain-panel` will treat that as a misconfiguration.

```json
"roots": ["."]                                    // single-package repo
"roots": ["app/", "web/"]                         // simple backend + frontend
"roots": ["packages/api/", "packages/web/",       // monorepo with shared lib
          "packages/shared/"]
```

### `header.title` (string, optional)

Title shown at the top of the rendered component. Defaults to `"How it works — full data flow"` (English). Use this for i18n.

### `header.icon` (string, optional)

Single emoji prefixed to the title. Defaults to `📚`.

### `groups[]` (array, required, 1–8 items)

Pipeline stages, ordered chronologically. Each group:

```json
{
  "id": "ingestion",
  "label": "Ingestion",
  "color": "sky",
  "sections": [ ... ]
}
```

#### `groups[].id` (string, required, kebab-case)

Unique within the map. Used as the React/Vue group type literal — keep it valid as a JS identifier (kebab-case is converted to PascalCase internally for type names).

#### `groups[].label` (string, required)

Display name shown on the chip at the top of the component and on the divider between sections of different groups.

#### `groups[].color`

Either a preset color name (string) or a custom color object. Presets:

`sky | indigo | amber | emerald | rose | violet | cyan | fuchsia | lime | orange | teal | pink`

A preset expands to three Tailwind classes (`text-{c}-500`, `border-{c}-500/30`, `bg-{c}-500/5`).

Custom color object:

```json
"color": {
  "text": "text-[#ff6f00]",
  "border": "border-[#ff6f00]/30",
  "bg": "bg-[#ff6f00]/5"
}
```

Use the object form for brand palettes outside the Tailwind preset list. The three fields can also be arbitrary CSS classes if you're not on Tailwind — they get joined with spaces and dropped on the chip / divider.

#### `groups[].sections[]` (array, required, 1–8 items)

The actual documentation items. See **Section** below.

## Section

```json
{
  "id": "scraper",
  "icon": "🕷️",
  "title": "HTML Scraping & Cleaning",
  "summary": "Optional one-sentence prose intro rendered above the snippet.",
  "file": "app/ingest/scraper.py",
  "function": "Scraper",
  "module": "app/ingest/scraper.py · Scraper.fetch()",
  "language": "python",
  "snippet_start": 22,
  "snippet_end": 55,
  "annotations": {
    "1": "Why the User-Agent matters here.",
    "8": "lxml is C-backed; ~4× faster than html.parser."
  },
  "group": "ingestion"
}
```

### `id` (string, required, kebab-case, unique across the map)

Used as the React/Vue section type literal. Globally unique — not just within a group — because the type union is flat.

### `icon` (string, required)

Single emoji prefixed to the section title.

### `title` (string, required)

Action phrase. Use verbs: "HTML Scraping & Cleaning" rather than "Scraper class".

### `summary` (string, optional)

One-sentence prose rendered above the code block. Use it when the snippet alone needs a primer.

### `file` (string, required)

Path to the source file. Repo-root-relative.

### `function` (string, required)

Name of the primary symbol. Used in `/explain-panel`'s audit (Pass A step 3 — "function found in range?") and in the human-readable `module` string.

### `module` (string, required)

Display string shown in the section header beneath the title. Conventionally `<file> · <function>()`. Free-form — you can use a different separator or omit the parentheses if your language doesn't use them.

### `language` (string, required)

Source language. Drives syntax highlighting. Allowed values:

`python | typescript | tsx | javascript | jsx | vue | go | rust | ruby | php | java | kotlin | swift | csharp | sql | bash | yaml | json | html | css | markdown | other`

### `snippet_start` / `snippet_end` (integer, required, 1-indexed inclusive)

The line range within `file` that the snippet should display. The range must satisfy `1 <= snippet_start <= snippet_end <= line_count(file)`.

For readability, keep `(snippet_end - snippet_start)` between 14 and 34. Longer snippets get truncated by the UI; shorter ones lose context.

### `annotations` (object, optional)

Map from **snippet-relative** line numbers to explanatory notes. Line `1` is the first line of the snippet — NOT `snippet_start`. The renderer:
1. Highlights the annotated line's background.
2. Lists `Lk → note` entries below the code block.

Each note: explain **why**, under 240 characters.

### `group` (string, optional)

The group id this section belongs to. Optional in storage because it's already implicit in the JSON nesting (`groups[i].sections[j]`), but `/explore-pipeline` populates it for audit convenience. Tools that read the map flat (e.g. by collecting all sections into one array) can rely on this field.

## Worked example

A minimal valid map with one group and one section:

```json
{
  "$schema": "https://raw.githubusercontent.com/sofiane-git/explain-panel-skills/main/schemas/pipeline-map.schema.json",
  "schemaVersion": "1.0",
  "project": "Tiny CLI",
  "framework": "other",
  "roots": ["."],
  "groups": [
    {
      "id": "main",
      "label": "Main flow",
      "color": "sky",
      "sections": [
        {
          "id": "entry",
          "icon": "🚪",
          "title": "Argument parsing",
          "file": "main.py",
          "function": "main",
          "module": "main.py · main()",
          "language": "python",
          "snippet_start": 12,
          "snippet_end": 28,
          "annotations": {
            "3": "argparse over click here because we want zero dependencies."
          },
          "group": "main"
        }
      ]
    }
  ]
}
```

`/explain-panel` will:
1. Validate this against the schema.
2. Audit `main.py` lines 12–28 to make sure `main` is defined there.
3. Sweep `.` for other entry points and ask whether you want them added.
4. On approval, write `components/ExplainPanel.tsx` (or `.vue`).
