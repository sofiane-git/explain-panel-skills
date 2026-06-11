---
name: explain-panel
description: 'Generate an accordion documentation component from docs/pipeline-map.json — TSX (React/Next.js), Vue SFC (Vue/Nuxt), or self-contained HTML (backend-only auto-fallback, zero runtime deps). Includes syntax-highlighted snippets, per-line annotations, color-coded groups, ARIA/keyboard support. Use when the user wants to build, refresh, or rebuild the explain panel after running /explore-pipeline, or asks to generate the documentation panel, the explain UI, the ExplainPanel component, or standalone HTML docs for a backend project. Audits the map against live code before generating.'
---

# Explain Panel

Generate an accordion documentation component that visualizes a project's data flow, with syntax-highlighted code snippets and per-line annotations. Reads `docs/pipeline-map.json` (produced by `/explore-pipeline`) and writes a TSX or Vue SFC into the project.

## Core Principles

- **Never invent.** If the map is incomplete or the codebase has drifted from the map, stop and surface the gaps to the user. Hallucinated documentation is worse than missing documentation.
- **Audit before generating.** The map can be edited by hand or grow stale. Validate every section against the live codebase before producing the component.
- **Match the project, not a template.** The colors, language, header text, and CSS framework follow the map and the project — never hardcode French, English, or any specific stack.

## Prerequisites

1. `docs/pipeline-map.json` exists. If missing, stop and tell the user to run `/explore-pipeline` first.
2. The map's `schemaVersion` is `"1.0"`. If older or newer, point to `migrate/` and stop.

```bash
test -f docs/pipeline-map.json || { echo "Missing map — run /explore-pipeline first"; exit 0; }
jq -r '.schemaVersion // "missing"' docs/pipeline-map.json
```

## Workflow

Use TaskCreate to track these phases. They run sequentially; each gate must pass before the next begins.

### Phase 1 — Load & Validate Map

Read `docs/pipeline-map.json`. Validate against the kit's `schemas/pipeline-map.schema.json`. If you do not have a JSON Schema validator handy:

```bash
# preferred — fail fast on schema violations.
# --spec=draft2020 is required: the schema declares draft/2020-12 in $schema,
# but ajv-cli defaults to draft-07 and won't recognise that meta-schema URL.
npx -y ajv-cli@5 validate --spec=draft2020 -s <kit-path>/schemas/pipeline-map.schema.json -d docs/pipeline-map.json
```

If `ajv-cli` cannot be installed (offline, no network), perform manual checks for the required fields listed in the schema and proceed with caution.

On validation failure: print the violations, ask the user "Want me to fix these automatically, or are you going to edit the map?"

### Phase 2 — Deep Audit (mandatory — never skip)

Audit the map against the live codebase in two passes. Output a single structured report at the end and **wait for user confirmation before generating**.

#### Pass A — Cross-check map vs code

For every section:

1. **File present?** `ls <file>` — flag missing files.
2. **Line range valid?** `wc -l <file>` ≥ `snippet_end`, and `snippet_start ≤ snippet_end`.
3. **Function found?** Search the snippet range for `function`'s name. If absent, the range probably drifted — propose a corrected range.
4. **Annotation lines in range?** Every annotation key must be in `1..(snippet_end - snippet_start + 1)`. Annotations beyond that get silently dropped by the renderer — surface them as errors.
5. **Title coherent?** Read the snippet. Does `title` describe what the code does? If clearly wrong (e.g., title says "Scraping" but code is a database query), flag it.
6. **Module string matches?** `module` should embed `file` and `function`. If they desynced, flag.

#### Pass B — Codebase audit for missing content

Scan the entire workspace (using `roots[]` from the map) to find code that should probably be documented but isn't in the map. Use compatible search patterns — fall back to `grep`/`find` if `rg` isn't installed:

```bash
ROOTS=$(jq -r '.roots[]' docs/pipeline-map.json | tr '\n' ' ')

# 1. Route definitions / event handlers
( command -v rg >/dev/null && rg -l '@app\.|@router\.|app\.(get|post|put|delete|patch)|router\.(get|post)|defineEventHandler|createRouter' $ROOTS \
  || grep -rEl '@app\.|@router\.|app\.(get|post|put|delete|patch)|router\.(get|post)|defineEventHandler|createRouter' $ROOTS 2>/dev/null )

# 2. Top-level functions/classes (skip tests, init, generated)
( command -v rg >/dev/null && rg -n '^(async )?def |^class |^export (default |async )?function ' $ROOTS \
  || grep -rEn '^(async )?def |^class |^export (default |async )?function ' $ROOTS 2>/dev/null ) \
  | grep -v -E '__init__|test_|\.spec\.|\.test\.|/tests?/|node_modules' \
  | head -80

# 3. Middleware / lifecycle / scheduler
( command -v rg >/dev/null && rg -l 'middleware|lifespan|on_startup|on_shutdown|beforeEach|afterEach|app\.use\(|scheduler\.' $ROOTS \
  || grep -rEl 'middleware|lifespan|on_startup|on_shutdown|beforeEach|afterEach|app\.use\(|scheduler\.' $ROOTS 2>/dev/null )

# 4. Schemas / models / contracts
( command -v rg >/dev/null && rg -l 'BaseModel|z\.object|@validator|@model_validator|prisma\.|SQLModel|Doctrine|Eloquent' $ROOTS \
  || grep -rEl 'BaseModel|z\.object|@validator|@model_validator|prisma\.|SQLModel|Doctrine|Eloquent' $ROOTS 2>/dev/null )
```

For each result that is **not already in the map**, judge:
- Is it load-bearing for the project's behavior? (yes → propose as a missing section)
- Is it a helper, decorator, or trivial wrapper? (no → ignore)

#### Audit Report

```
## 🔍 Pipeline Map Audit

### ❌ Errors (must resolve before generation)
- section `scraper`: snippet_start=5, snippet_end=20 → contains imports, not `Scraper._fetch()`. Suggested range: 22–55.
- section `llm`: annotation on line `12` is outside the snippet (length 8). Drop or fix.
- section `chroma`: file `app/rag/chroma_client.py` no longer exists (likely moved to `app/storage/chroma.py`).

### ⚠️ Possibly Missing (consider adding)
- `app/runtime/scheduler.py · _apply_schedule()` — load-bearing, runs cron ingestion. Suggested group: `ingestion`.
- `app/rag/enrich.py · enrich_retrieval()` — extends retrieval with full articles. Suggested group: `retrieval`.

### ✅ OK
- 7/10 sections validated against live code with accurate annotations.

### Decision required
1. Auto-fix the errors above? (yes / no / show me first)
2. Add the missing sections? (yes / no / pick which ones)

Reply with your choices. I will not generate the component until errors are resolved.
```

**Wait for the user's reply.** If they approve fixes, edit `docs/pipeline-map.json` accordingly. Re-run validation after editing. Only proceed to Phase 3 when the map is clean.

### Phase 3 — Resolve Output Target

Detect the project's frontend framework. Prefer the map's `framework` field; otherwise probe:

| Signal | Output |
|--------|--------|
| `framework === "nextjs" \|\| "react"` or `next.config.*` or `vite.config.* + App.tsx` | TSX (React variant) |
| `framework === "nuxt" \|\| "vue"` or `nuxt.config.*` or `vite.config.* + App.vue` | Vue SFC |
| **Backend-only project** (no frontend manifest detected: no `package.json` with `react`/`vue`/`@nuxt/*` deps, no `web/` or `client/` subdir with a JS framework) | **HTML standalone** — auto-fallback. Inform the user: "No frontend framework detected — generating a self-contained `docs/ExplainPanel.html` that opens in any browser or can be served from your backend's static directory. Pre-highlighted code, no runtime deps. Override by re-running with `--framework=react` or `--framework=vue` if you actually want a component file." Do NOT ask "where should it live" — the HTML variant has a sensible default. |
| Other / ambiguous | Ask user |

Detect CSS framework (skip this step for HTML standalone):
- `tailwindcss` in any `package.json` dep → use Tailwind classes
- Otherwise → CSS-fallback mode (BEM classes + companion `.css` file)

Detect target directory:
- React/Vue: prefer `components/` (Next.js, Nuxt, generic). Monorepo with multiple frontend roots → ask which one.
- HTML standalone: write to `docs/ExplainPanel.html` at the repo root (alongside `docs/pipeline-map.json`). No directory ambiguity — backend-only projects always get a `docs/` dir from `/explore-pipeline`.

### Phase 4 — Read Snippets

For each section, read `<file>` lines `snippet_start..snippet_end` using the `Read` tool with `offset` and `limit`. Store the raw text as a string. Apply this escape transform before embedding into the generated source:

- Replace every `` ` `` (backtick) with `` \` ``.
- Replace every `${` with `\${`.

If a file is missing despite passing audit (race with user edits), warn and skip the section — do not fail the whole generation.

### Phase 5 — Install Dependencies

**Skip this entire phase for HTML standalone mode** — the HTML variant has zero runtime deps and zero install step.

For React/Vue variants, detect the package manager from lockfiles in the target frontend directory:

```bash
if   test -f pnpm-lock.yaml ; then PM="pnpm add"
elif test -f yarn.lock      ; then PM="yarn add"
elif test -f bun.lockb      ; then PM="bun add"
else                              PM="npm install"
fi
```

**React/Next.js:** ensure `react-syntax-highlighter` and `@types/react-syntax-highlighter` are present.

**Vue/Nuxt:** ensure `shiki` is present.

Run the install. If it fails (network down, registry timeout):
1. Retry once.
2. On second failure, ask the user: "Install of <pkg> failed: <stderr>. Want me to (A) try a different registry, (B) point you at an offline tarball, (C) skip and let you install manually before re-running?"

### Phase 6 — Generate the Component

Pick the right template variant. Templates live in this skill's `references/` directory (alongside this SKILL.md):

| Project | Template file |
|---------|---------------|
| React/Next.js + Tailwind | `references/react-tailwind.tsx.template` |
| React/Next.js + plain CSS | `references/react-css.tsx.template` (companion `references/explain-panel.css.template`) |
| Vue/Nuxt + Tailwind | `references/vue-tailwind.vue.template` |
| Vue/Nuxt + plain CSS | `references/vue-css.vue.template` (companion `references/explain-panel.css.template`) |
| Backend-only / HTML standalone | `references/html-standalone.html.template` (pair with `references/html-pre-highlight.md` for the per-language tokenization contract) |

Read the template, then substitute the placeholders listed inside it. Placeholders use `{{ NAME }}` syntax; the template file documents every placeholder and what to fill it with.

**HTML standalone — pre-highlighting:** For the HTML variant, the snippet inside each `<pre><code>` block is pre-tokenized at generation time (no runtime highlighter, no CDN). Follow `references/html-pre-highlight.md` for the exact rules: six token classes (`hl-kw`, `hl-str`, `hl-num`, `hl-com`, `hl-fn`, `hl-attr`), per-language matchers, HTML-escaping order, and the sanity checklist. **Never** invent classes outside the six listed there; the template only styles those. When in doubt, leave the token plain — under-coloring is acceptable, mis-coloring is not.

**Color expansion (React/Vue only):** Preset color names in the map expand as follows. Pre-compute the expansion for every group before writing the file.

```ts
const PRESET = (c: string) =>
  `text-${c}-500 border-${c}-500/30 bg-${c}-500/5`;
// "sky"     → "text-sky-500 border-sky-500/30 bg-sky-500/5"
// "indigo"  → "text-indigo-500 ..."
```

For custom color objects, concatenate `${color.text} ${color.border} ${color.bg}` into a single class string.

For the **HTML standalone** variant, expand preset colors to actual hex values directly (`sky` → `#0ea5e9`, `indigo` → `#6366f1`, `amber` → `#f59e0b`, `emerald` → `#10b981`, `rose` → `#f43f5e`, `violet` → `#8b5cf6`, `cyan` → `#06b6d4`, `fuchsia` → `#d946ef`, `lime` → `#84cc16`, `orange` → `#f97316`, `teal` → `#14b8a6`, `pink` → `#ec4899`). Inject the hex on the chip element via `style="color: <hex>"`. For custom color objects in the map, use the `text` field's hex (or extract from any Tailwind-style arbitrary-value string `text-[#...]`).

**Header text:** read `header.title` and `header.icon` from the map. Fall back to defaults (French: `"Comment ça marche — flux de données complet"`, icon `📚`) only if both are missing.

**Output path:**
- React: `<frontend-root>/components/ExplainPanel.tsx`
- Vue: `<frontend-root>/components/ExplainPanel.vue`
- CSS fallback: also write `<frontend-root>/components/ExplainPanel.css` from the companion template.
- **HTML standalone:** `docs/ExplainPanel.html` at the repo root (alongside the existing `docs/pipeline-map.json`).

If the file exists, ask before overwriting.

### Phase 7 — Validation

Run before reporting.

**React/Vue variants:**

- [ ] Generated file parses (type-check):
  - React: `npx tsc --noEmit <generated file>` (or full project `tsc --noEmit` if isolation isn't easy)
  - Vue/Nuxt: `npx vue-tsc --noEmit` or `npx nuxi typecheck`
- [ ] Every section's `CODE_*` string is non-empty.
- [ ] Every `SectionId` referenced in `SECTIONS[]` is in the `SectionId` union.
- [ ] `GROUP_ORDER[]` covers every group in `GROUP_LABELS`.
- [ ] ARIA: every accordion button has `aria-expanded` and `aria-controls`; every panel has `role="region"` and `aria-labelledby`.
- [ ] Keyboard: `Escape` closes the active panel; the button is focusable; `Enter`/`Space` toggles it. (Native `<button>` covers Enter/Space; Escape needs the handler in the template.)
- [ ] No raw backticks or unescaped `${` inside `CODE_*` constants.

If type-check fails, attempt to fix obvious issues (missing comma, stray `;`, wrong template literal escape). If still failing after one repair attempt, surface the errors to the user.

**HTML standalone variant:**

- [ ] File opens without errors when validated with a quick parse: `python3 -c "import html.parser, pathlib; html.parser.HTMLParser().feed(pathlib.Path('docs/ExplainPanel.html').read_text())"` (the parser doesn't enforce strict HTML, but it surfaces unclosed tags and bad escapes).
- [ ] Every snippet line became exactly one `<span class="ep-line">…</span>` (count lines in source ≡ count of `ep-line` spans).
- [ ] No `hl-…` class other than the six declared in `references/html-pre-highlight.md` is present (`grep -oE 'class="hl-[a-z-]+"' docs/ExplainPanel.html | sort -u` should only contain `hl-kw`, `hl-str`, `hl-num`, `hl-com`, `hl-fn`, `hl-attr`).
- [ ] All `<`, `>`, `&` in code content are HTML-escaped (`&lt;`, `&gt;`, `&amp;`) — except inside `<span class="…">` tags themselves.
- [ ] Every annotation line number has a matching `is-annotated` line in the corresponding section's snippet.
- [ ] Native `<details>`/`<summary>` keyboard (Tab + Enter) works, and the inline `<script>` adds Escape-to-close. No CDN, no other `<script>` tags.
- [ ] **Output XSS scan**: `grep -cE '<script|javascript:|[[:space:]\"'\'']on[a-z]+[[:space:]]*=' docs/ExplainPanel.html` returns at most `1` (the single inline Escape-key handler `<script>` at the bottom of the template). Any other match means an unescaped payload from `title`/`summary`/`annotations`/`module` slipped through — re-escape the offending field and regenerate. The schema rejects path-traversal and bounds string lengths, but it cannot enforce HTML-escape of the contents themselves, so this scan is the last line of defense. The `[[:space:]"']on[a-z]+[[:space:]]*=` clause requires an event-handler attribute to actually begin at an attribute boundary (after whitespace or a quote), which avoids false positives on words containing `on` like `content=` or `connection=`.

### Phase 8 — Report

**React/Vue variants:**

```
✅ ExplainPanel generated
   File: <path>
   CSS:  <path or n/a>
   Framework: <framework>
   Sections: <N> (groups: <list>)
   Type check: passed
   ARIA: verified
   Keyboard: Escape closes, Tab navigates, Enter/Space toggles

Usage:
   <import line>
   <JSX/template usage line>

Next: import the component into a page and view it locally.
```

**HTML standalone variant:**

```
✅ ExplainPanel generated (HTML standalone — zero runtime deps)
   File: docs/ExplainPanel.html
   Framework: <detected source framework> → HTML (no frontend detected)
   Sections: <N> (groups: <list>)
   Highlighted: <N> snippets, <M> token spans (classes: hl-kw, hl-str, hl-num, hl-com, hl-fn, hl-attr)
   ARIA: native <details>/<summary>
   Keyboard: Escape closes (inline script), Tab + Enter native

Usage:
   - Local preview: open docs/ExplainPanel.html
   - FastAPI:       app.mount("/docs/panel", StaticFiles(directory="docs"), name="panel")
   - Django:        place in any staticfiles directory
   - Rails:         move to public/explain-panel.html
   - MkDocs/Sphinx: embed as a raw HTML block, or link directly

Next: open the file in your browser to verify the layout, then wire it into your project's docs flow.
```

---

## What This Skill WILL NOT Do

- **Will not generate without a passing audit** — the audit is the safety net against stale documentation.
- **Will not invent fixes** for audit errors — proposes corrections, waits for user confirmation.
- **Will not overwrite the existing file** silently.
- **Will not hardcode language** — header text comes from the map.
- **Will not assume Tailwind** — detects CSS framework and falls back to BEM + companion CSS.
- **Will not assume a frontend** — if none is detected, generates a self-contained `docs/ExplainPanel.html` (zero runtime deps, pre-highlighted, opens in any browser). Does not ask the user to pick a framework when there's nothing to pick.

## When to Ask the User

- Audit reports any ❌ error → stop, ask which to fix.
- Audit reports ⚠️ candidates → ask which to add.
- Framework cannot be determined.
- Multiple frontend roots in a monorepo (which one gets the component?).
- Existing `ExplainPanel.*` file at the target path (overwrite vs different name?).
- Package install fails twice in a row.
- Snippet contains characters that the chosen template can't escape safely.

---

## Bundled Resources

The `references/` directory next to this SKILL.md contains:

- `react-tailwind.tsx.template` — full TSX template, Tailwind variant.
- `react-css.tsx.template` — full TSX template, plain CSS variant.
- `vue-tailwind.vue.template` — full Vue SFC template, Tailwind variant.
- `vue-css.vue.template` — full Vue SFC template, plain CSS variant.
- `explain-panel.css.template` — CSS companion for the `-css` variants.
- `keyboard-handler.md` — escape/keyboard logic shared by both frameworks.

Read templates with the `Read` tool when you reach Phase 6.
