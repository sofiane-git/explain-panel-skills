---
name: explore-pipeline
description: Map any project's data flow into a structured pipeline-map.json that documents groups, sections, code snippets, and annotations. Use when the user wants to analyze how their codebase works end-to-end, document a pipeline, prepare input for /explain-panel, or asks "explore the pipeline" / "analyze the data flow" / "map this project". Required first step before running /explain-panel — the JSON is the exchange format between exploration and component generation.
---

# Explore Pipeline

Produce `docs/pipeline-map.json` describing the target project's data flow as a sequence of groups → sections. This is Phase 1 of the explain-panel-skills workflow; `/explain-panel` consumes the output to generate the documentation component.

The map MUST conform to `schemas/pipeline-map.schema.json` from this kit. The component generator validates against the schema and refuses non-conforming maps.

## Core Principles

- **Never invent.** If the codebase is ambiguous (multiple entry points, unclear flow, unfamiliar framework, naming conflicts), stop and ask the user. The map is documentation — wrong content is worse than missing content.
- **Verify everything you write.** Before recording a file/line range, read the file and confirm the lines contain what you claim. Spot-check 2–3 entries before saving.
- **Snippet-relative line numbers.** Annotations use line numbers within the snippet (line 1 = first line of the snippet), NOT line numbers in the source file. This matches how the generated component renders the code block.

## Output Contract

Single file: `docs/pipeline-map.json` at the repository root. Top-level shape:

```json
{
  "schemaVersion": "1.0",
  "project": "<human-readable name>",
  "framework": "<see schema enum>",
  "roots": ["<workspace root paths>"],
  "header": { "title": "...", "icon": "..." },
  "groups": [
    {
      "id": "kebab-case",
      "label": "Display Name",
      "color": "sky | indigo | amber | emerald | rose | violet | ...",
      "sections": [
        {
          "id": "kebab-case",
          "icon": "📥",
          "title": "Action phrase",
          "file": "path/from/repo/root.py",
          "function": "FunctionOrClassName",
          "module": "path/from/repo/root.py · FunctionOrClassName()",
          "language": "python",
          "snippet_start": 22,
          "snippet_end": 57,
          "annotations": { "5": "WHY ...", "12": "WHY ..." }
        }
      ]
    }
  ]
}
```

The `schemas/pipeline-map.schema.json` file in this kit is authoritative. When unsure about a field, read the schema.

## Workflow

Run these phases in order. Use TaskCreate to track them.

### Phase 0 — Detect Workspace Layout

Before reading any code, figure out where the project's source lives. Many projects are monorepos with the backend, frontend, shared libraries, and infrastructure in separate directories — and naming conventions vary wildly (`api/`, `server/`, `backend/`, `core/`, `services/`, `apps/api/`, `packages/server/`…). Do not assume.

**Step 1 — Probe top-level structure:**

```bash
ls -la
find . -maxdepth 2 -name "package.json" -o -name "pyproject.toml" -o -name "Cargo.toml" -o -name "go.mod" -o -name "Gemfile" -o -name "composer.json" -o -name "pom.xml" 2>/dev/null | grep -v node_modules
find . -maxdepth 2 -name "nuxt.config.*" -o -name "next.config.*" -o -name "vite.config.*" -o -name "angular.json" -o -name "svelte.config.*" 2>/dev/null | grep -v node_modules
```

**Step 2 — Read workspace declarations if present:**

- `package.json` → check `workspaces` field
- `pnpm-workspace.yaml`
- `lerna.json`
- `turbo.json`
- `nx.json`
- `Cargo.toml` → `[workspace]` table
- `pyproject.toml` → check for multiple packages

**Step 3 — Classify each candidate directory:**

For every directory that contains a manifest (`package.json`, `pyproject.toml`, etc.), identify its role:

| Signal | Likely role |
|--------|-------------|
| Imports `fastapi`, `flask`, `django`, `starlette`, `tornado` | Python backend |
| Imports `express`, `fastify`, `koa`, `hono`, `@nestjs/*` | Node backend |
| `nuxt.config.*` or `next.config.*` present | Full-stack framework (frontend + API routes) |
| Imports `vue`, `react`, `svelte`, `solid-js` (no SSR config) | Frontend SPA |
| Only contains types/utilities, imported by others | Shared library |
| `*.tf`, `Dockerfile`, `docker-compose.yml`, `helm/` | Infrastructure |
| `*.test.*`, `*.spec.*`, `__tests__/` dominant | Test-only |

**Step 4 — Decide on `roots[]`:**

Present what you found to the user in a structured table and ask them to confirm or correct. Do not auto-pick.

```
I detected this layout:

  ./api          — Python backend (FastAPI, imports detected)
  ./web          — Next.js frontend (next.config.ts found)
  ./packages/shared — TypeScript shared types (used by both)
  ./infra        — Terraform + Docker (no application code)
  ./scripts      — One-off Python scripts (utility, no entry point)

Question 1: Which directories should the pipeline map include?
  A) api + web (typical app surface)
  B) api only
  C) web only
  D) api + web + packages/shared
  E) custom (you specify)

Question 2: What is the primary framework label?
  Detected candidates: fastapi, nextjs, nuxt
  Pick one for the `framework` field (drives the generated component flavor).
```

Wait for the user's answers before proceeding. Record the confirmed roots into `roots[]` and `framework` into the top-level field.

**Special cases:**

- **Single-package repo:** still ask — confirm "I see one package at `.`, treating it as the only root. Correct?"
- **Empty repo / no manifests found:** stop. Ask: "I cannot find any application manifest. Where is the source code I should map?"
- **Unfamiliar framework:** stop. Ask: "I see imports from X but I don't recognize this framework. What should I use for the `framework` field?"

---

### Phase 1 — Find Entry Point(s) per Root

For each root in `roots[]`, locate the file that receives the first request, action, or event. Common patterns:

```bash
# Backend HTTP frameworks
grep -rE "app = (FastAPI|Flask|Quart|Sanic)\(|createServer|express\(\)|new Hono\(" \
  --include="*.py" --include="*.ts" --include="*.js" "<root>" 2>/dev/null

# Full-stack frameworks
ls "<root>"/{nuxt,next,vite,svelte}.config.* 2>/dev/null
ls "<root>"/app/page.* "<root>"/pages/index.* 2>/dev/null

# CLIs
grep -rE 'if __name__ == "__main__"|#!/usr/bin/env' --include="*.py" "<root>" 2>/dev/null
grep -rE '"bin":' "<root>/package.json" 2>/dev/null
```

If the entry point is not obvious or there are several (e.g., one HTTP server + one CLI in the same root), ask: "I see multiple entry points: [list]. Which one represents the primary user flow you want documented?"

Record `entry_point` per root (kept internally, not in JSON output).

---

### Phase 2 — Trace the Primary Flow

For each root, follow one typical user action end-to-end, walking through imports:

- **API**: pick the main POST/GET endpoint → route handler → service → data layer → response
- **RAG system**: question input → embedding → retrieval → enrichment → LLM → response
- **Web app**: page load → data fetch → render → user action → mutation
- **CLI**: argument parsing → main logic → output

Read each file along the way. Note the function names and what they do. Do not summarize from imports alone — the function body often holds the interesting behavior.

Output of this phase: an ordered list `step → file:function` per root (internal notes).

---

### Phase 3 — Identify Key Modules

Extract **8–13 meaningful modules** across all roots combined. Rules:

- One module = one file + one primary function/class.
- **Skip**: configuration files, `__init__.py`, files that are pure helpers (string utils, type-only).
- **Include**: anything that transforms data, makes a decision, or is the seam between two stages.
- Fewer than 8 modules? Look at secondary paths: error handling, caching, retry, enrichment, lifecycle hooks.
- More than 13 modules? Merge adjacent stages (e.g., "scraping + cleaning" → one section).

Record per module (internally for now):

```json
{
  "id": "kebab-case-unique",
  "title": "Short action phrase",
  "icon": "📥",
  "file": "path/from/repo/root.py",
  "function": "FunctionOrClassName",
  "language": "python"
}
```

**Language detection:** prefer the file extension mapping (`.py` → `python`, `.ts` → `typescript`, `.tsx` → `tsx`, `.vue` → `vue`, etc.). If a file uses a language not in the schema enum, ask the user what to set.

---

### Phase 4 — Define Groups

Cluster the modules into **2–6 logical pipeline stages**:

- Name groups after what **happens** (not technical layers). Prefer "Ingestion" over "Data Layer", "Synthesis" over "Service".
- Order groups **chronologically** following the data flow.
- Each group: 1–5 modules. If a group has more, consider splitting.
- Assign one preset color per group from: `sky`, `indigo`, `amber`, `emerald`, `rose`, `violet`, `cyan`, `fuchsia`, `lime`, `orange`, `teal`, `pink`. Cycle through them in display order so adjacent groups have distinct colors.

**Custom colors:** If the project has a brand palette the user wants to use, accept a color object `{ text, border, bg }` with CSS classes or hex values (see schema). Ask before assuming.

**Example groupings (illustrative — pick what fits your project):**
- RAG: `ingestion` / `indexation` / `retrieval` / `generation`
- CRUD API: `routing` / `validation` / `persistence` / `serialization`
- Web app: `data-fetching` / `state` / `rendering` / `mutations`
- CLI: `input` / `analysis` / `output`

---

### Phase 5 — Extract Snippets

For each module, find **15–35 representative lines** of code:

1. Read the file with the `Read` tool. Identify the body of the function/class.
2. Skip top-of-file boilerplate (imports, license headers, type aliases unless they're the point).
3. The snippet must include the signature (`def name(...)` or `class Name:`) so a reader can locate it.
4. Note `snippet_start` and `snippet_end` as the **file** line numbers (1-indexed, inclusive).

If the function spans more than 35 lines, pick the most illustrative contiguous sub-range and add a `summary` field explaining what was elided. Do not stitch non-contiguous lines — the reader needs to be able to open the file and find exactly what they see.

---

### Phase 6 — Write Annotations

Write 5–10 annotations per snippet, keyed by **snippet-relative line numbers** (line `1` = the snippet's first line, regardless of where it starts in the file).

**Rules:**
- Explain **WHY**, not WHAT. The reader already sees the code.
- Target lines that would confuse a new developer or hide a non-obvious decision.
- Skip trivial lines (return statements, simple assignments).
- Stay under 200 characters per note (the UI truncates wrapping above that).

**Examples (good):**
- "lru_cache: the HTTP client is shared across requests instead of being reinstantiated per call — avoids re-handshaking TLS."
- "sha256 with deterministic input: re-ingesting the same article produces the same id, so upsert is idempotent."

**Examples (bad — what to avoid):**
- "Calls the function" (says nothing)
- "Returns a list" (visible from the type)
- "TODO: explain this later" (placeholder, ship-blocker)

---

### Phase 7 — Decide Header Text

**Always ask this question before writing the header:**

> "What language should I use for the header text? (French / English / Spanish / German / Japanese / other — or paste your own title)"

Do not skip this question even if the codebase appears to be in a single language. The header is user-facing copy and the user must confirm it.

If the user says "default" or doesn't care, fall back to the value declared in the `default` keyword of the `header.title` property in `schemas/pipeline-map.schema.json` (read the schema for the authoritative literal — do not duplicate it here).

Common headers:
- French: "Comment ça marche — flux de données complet"
- English: "How it works — full data flow"
- Spanish: "Cómo funciona — flujo de datos completo"
- German: "Wie es funktioniert — vollständiger Datenfluss"
- Japanese: "仕組み — データフロー全体"

Record into `header.title` and `header.icon`.

---

### Phase 8 — Assemble & Validate

Build the full JSON object matching the schema. Write to `docs/pipeline-map.json` (create the directory if needed).

**Validation checklist (run before reporting):**

- [ ] `schemaVersion === "1.0"` present.
- [ ] All `file` paths exist (`ls <path>` for each).
- [ ] All `snippet_start`/`snippet_end` ranges are inside the file (line count check).
- [ ] All annotation line keys are within `1..(snippet_end - snippet_start + 1)`.
- [ ] All group `id`s are unique. All section `id`s are unique across the whole map (not just within a group).
- [ ] Every `section.group` (if populated) matches a real group id.
- [ ] Every preset `color` is in the schema enum; every custom color has all three fields.
- [ ] Spot-check 2–3 annotations: do they teach the reader something WHY?

If any check fails, fix it before reporting. Never report success on a partial map.

---

### Phase 9 — Report

```
✅ pipeline-map.json written to docs/pipeline-map.json
   Project: <name>
   Framework: <framework>
   Roots: [<roots>]
   Groups: <label1> (<n> sections), <label2> (<n>), ...
   Total sections: <N>

Next: run /explain-panel to generate the documentation component.
   /explain-panel will re-validate the map and audit it against the codebase before generating.
```

---

## What This Skill WILL NOT Do

- **Will not pick monorepo roots silently** — always asks.
- **Will not invent file paths or line ranges** — verifies via Read, asks when ambiguous.
- **Will not skip the schema** — every output conforms to `pipeline-map.schema.json`.
- **Will not overwrite an existing `docs/pipeline-map.json`** without confirming first. If a map exists, propose a merge or fresh start.

## When to Ask the User

Stop and ask whenever you encounter:

1. Multiple plausible workspace roots (monorepo with unclear scope)
2. Unknown framework or non-standard project layout
3. Multiple entry points within a root
4. Functions spanning >35 lines (which sub-range to show?)
5. Unfamiliar language not in the schema enum
6. Header text language — always ask (Phase 7)
7. Brand color requirement (custom color object)
8. Existing `docs/pipeline-map.json` (overwrite vs merge)

Asking is cheap. Wrong documentation is expensive.
