# HTML pre-highlighting contract

This document is the per-language tokenization spec that the `/explain-panel` skill
follows when generating the HTML standalone variant (`html-standalone.html.template`).

The skill is run by an LLM, so the tokenization is implemented **at generation time**
by emitting `<span class="hl-…">` wrappers directly into the output HTML. There is no
runtime syntax highlighter, no CDN, no npm install — the resulting file is fully
self-contained.

## Why pre-highlight

- **Zero runtime deps** — works in `file://`, MkDocs, Docusaurus, Sphinx, FastAPI `static/`, etc.
- **Offline-friendly** — no CDN fetch.
- **Stable output** — the colors do not depend on which highlighter version the user has installed.
- **Trade-off**: the skill must produce correct, escaped spans. Mistakes are visible (raw HTML in the page).
  Keep the rules simple — 6 token classes, conservative matching, never over-color.

## Token classes

Only six classes are used. CSS variables live in `html-standalone.html.template`.

| Class       | Meaning                                                                    | Example tokens                                  |
| :---------- | :------------------------------------------------------------------------- | :---------------------------------------------- |
| `hl-kw`     | Reserved keywords of the language                                          | `def`, `class`, `return`, `if`, `import`, `const` |
| `hl-str`    | String literals (single, double, triple, template, raw)                    | `"hello"`, `'world'`, `"""docstring"""`           |
| `hl-num`    | Numeric literals (int, float, hex, scientific)                             | `42`, `3.14`, `0xff`, `1e9`                       |
| `hl-com`    | Comments (line and block)                                                  | `# todo`, `// fixme`, `/* note */`                |
| `hl-fn`     | Names defined by a definition keyword (function name, class name, method)  | `parse` in `def parse(...)`, `Foo` in `class Foo` |
| `hl-attr`   | Decorators, annotations, attribute selectors                               | `@cache`, `@app.get`, `#[derive(Debug)]`          |

Anything that doesn't fit one of these stays as plain text. **Do not** invent new classes;
the template only defines styles for these six.

## Per-language matchers

Apply matchers in the order listed below. Once a span is captured for a class, do not
re-tokenize inside it (strings and comments are opaque).

### Python (`language: python`)

Keywords (case-sensitive): `def class return if elif else for while try except finally raise import from as with async await lambda yield pass continue break global nonlocal in is not and or True False None`.

Strings: `'…'`, `"…"`, `'''…'''`, `"""…"""`, `f"…"`, `r"…"`, `b"…"` (and their multiline forms).

Comments: `#` to end of line.

Numbers: `\b[0-9][0-9_]*(\.[0-9_]+)?([eE][+-]?[0-9]+)?\b`, `\b0x[0-9a-fA-F_]+\b`, `\b0b[01_]+\b`.

Function names: identifier immediately after `def ` or `class `. Highlight only the identifier (skip parens/colon).

Decorators: `@identifier` or `@identifier.attr.attr(...)` — wrap the entire `@…` up to the first whitespace or open-paren-balanced-end.

### TypeScript / TSX (`language: typescript` or `language: tsx`)

Keywords: `const let var function class extends implements interface type enum namespace return if else for while do switch case default break continue throw try catch finally async await yield import from export default new delete typeof instanceof in of as is keyof readonly public private protected static abstract void any unknown never true false null undefined`.

Strings: `'…'`, `"…"`, `` `…` `` (template literals — do **not** drill into `${…}` interpolations; leave them as part of the string for simplicity).

Comments: `//` line, `/* … */` block.

Numbers: same as Python plus `\d+n` BigInt.

Function names: identifier after `function `, `class `, or after `const|let|var <name> = (…) =>` (when easily detectable — if ambiguous, skip rather than miscolor).

Decorators: `@identifier` (TS decorators).

JSX/TSX tag names: do **not** specially color HTML/JSX tags — leave them as plain text. Attribute names: plain text. JSX expressions inside `{}`: tokenize normally inside the braces.

### JavaScript / JSX (`language: javascript` or `language: jsx`)

Same as TypeScript, minus `interface`, `type`, `enum`, `namespace`, `implements`, `abstract`, type-only keywords (`is`, `keyof`, `readonly`, `any`, `unknown`, `never`).

### Vue SFC (`language: vue`)

Mix of HTML, JavaScript/TypeScript, and CSS. Tokenize the contents of `<script>` blocks as TS/JS,
`<style>` blocks as plain text (or CSS if you have time), and `<template>` as plain text. For per-line
annotations the script block is the focus 99% of the time — apply TS/JS rules there and leave the
template/style sections uncolored.

### Go (`language: go`)

Keywords: `package import func var const type struct interface map chan return if else for switch case default break continue go defer select range fallthrough goto`.

Built-in types (treat as keywords): `int int8 int16 int32 int64 uint uint8 uint16 uint32 uint64 byte rune string bool float32 float64 complex64 complex128 error any`.

Strings: `"…"`, `` `…` `` (raw multiline).

Comments: `//`, `/* … */`.

Function names: identifier after `func ` (handle receiver form: `func (r *T) name(…)` — color `name`).

### Rust (`language: rust`)

Keywords: `fn let mut const static struct enum impl trait pub use mod return if else match for while loop break continue ref move as in where dyn async await self Self crate super extern unsafe true false`.

Strings: `"…"`, `r"…"`, `r#"…"#`, `b"…"`, raw multiline.

Comments: `//`, `///` (doc), `/* … */`.

Function names: identifier after `fn `.

Attributes: `#[…]` and `#![…]` — wrap as `hl-attr` (multi-line attrs OK, balance brackets).

### Ruby (`language: ruby`)

Keywords: `def class module if elsif else unless end while until for in do return yield begin rescue ensure raise next break retry self nil true false and or not when case then`.

Strings: `'…'`, `"…"` (with `#{…}` interpolations — leave interpolation as part of string), `%w(…)`, `%i(…)`, heredocs.

Comments: `#`.

Function names: identifier after `def ` (handle `def self.name` — color `name`, leave `self.` plain).

### PHP (`language: php`)

Keywords: `function class abstract final public protected private static return if else elseif for foreach while do switch case default break continue throw try catch finally new use namespace const var echo print array null true false instanceof extends implements interface trait`.

Strings: `'…'`, `"…"`, heredoc `<<<EOT … EOT;`, nowdoc `<<<'EOT' … EOT;`.

Comments: `//`, `#`, `/* … */`.

Function names: identifier after `function `.

Attributes: `#[Attribute(…)]` (PHP 8 attributes).

### Java (`language: java`)

Keywords: `class interface enum extends implements public protected private static final abstract synchronized volatile transient native return if else for while do switch case default break continue throw throws try catch finally new this super void instanceof package import true false null`.

Built-ins (keywords): `int long short byte float double boolean char String`.

Strings: `"…"`, `"""…"""` (text blocks).

Comments: `//`, `/* … */`.

Function names: identifier after a return-type token in a method declaration (when easy to detect — `static void foo(…)`). If ambiguous (declarations look like other syntax), skip.

Annotations: `@Identifier(…)` — wrap as `hl-attr`.

### Kotlin / Swift / C# / Other curly-brace languages

Apply a Java-like ruleset: keywords + strings + comments + numbers. Skip function names if extraction is ambiguous. **Better to under-color than miscolor.**

### SQL (`language: sql`)

Keywords (case-insensitive — match either case): `SELECT FROM WHERE JOIN INNER LEFT RIGHT OUTER ON GROUP BY HAVING ORDER ASC DESC LIMIT OFFSET INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE INDEX VIEW DROP ALTER ADD COLUMN PRIMARY KEY FOREIGN REFERENCES NOT NULL DEFAULT UNIQUE WITH AS UNION ALL DISTINCT CASE WHEN THEN ELSE END BEGIN COMMIT ROLLBACK TRANSACTION`.

Strings: `'…'`. Identifiers in `"…"` quotes: plain text.

Comments: `--`, `/* … */`.

Numbers: as Python.

### Bash / Shell (`language: bash`)

Keywords: `if then elif else fi for in do done while until case esac function return break continue export local readonly declare typeset set unset trap source eval exec`.

Strings: `'…'`, `"…"`, `<<EOF … EOF` heredoc.

Comments: `#`.

Variables: do **not** colour `$VAR` references — keep them plain to avoid clashing with `hl-attr`.

### YAML / JSON (`language: yaml` or `language: json`)

Strings: `"…"`, `'…'`. Numbers: standard. Comments (YAML only): `#`. Keys before `:` stay plain text. No keyword class.

### Markdown / HTML / CSS / "other"

Leave the snippet as plain text wrapped in `<pre><code>…</code></pre>`. The visual value of colouring
prose or markup is low; the layout already differentiates these.

## Output format

For each section, the skill writes a `<pre><code data-lang="<language>">…</code></pre>` block.
Each source line becomes a single `<span class="ep-line"...>` containing a `<span class="ep-line-num">`
and the highlighted code. Lines that have an annotation (line number ∈ `section.annotations` keys)
get an additional `is-annotated` class so the CSS can subtly highlight them.

```html
<pre><code data-lang="python">
<span class="ep-line"><span class="ep-line-num">5</span><span class="hl-kw">def</span> <span class="hl-fn">parse</span>(text):</span>
<span class="ep-line is-annotated"><span class="ep-line-num">6</span>    <span class="hl-com"># …</span></span>
…
</code></pre>
```

Line numbers shown are the **section-relative** line numbers (1-indexed), matching what the
annotations key off — same convention as the React/Vue variants.

## Escaping rules

Inside the highlighted output:

1. Replace `&` → `&amp;` first.
2. Replace `<` → `&lt;`.
3. Replace `>` → `&gt;`.
4. Do **not** escape inside `<span class="…">` tags — only the textual content.
5. Strings/templates that contain `<` (e.g. JSX) MUST be escaped, even though they live inside `hl-str`.

In annotation text and titles/summaries:

1. Same `& < >` escaping.
2. `"` → `&quot;` only if the annotation text is embedded into an attribute (rare — we always
   put it inside element text, so this is usually a no-op).

## When to skip highlighting entirely

If a snippet is in a language not listed above, or the tokenization confidence is low (heavy
embedded DSLs, unfamiliar dialects, generated code), emit the snippet as plain `<pre><code>…</code></pre>`
with no `hl-…` spans. The layout still works — only the colors are missing. The user can always
re-run with a more specific `language` value in the map.

## Sanity checklist (before writing the file)

Before writing `ExplainPanel.html`:

- [ ] Every line of every snippet became exactly one `<span class="ep-line">`.
- [ ] Every annotation key (e.g. `"5"`) maps to a `is-annotated` line in the snippet.
- [ ] All `<`, `>`, `&` in code are HTML-escaped.
- [ ] No `hl-…` class other than the six listed above appears.
- [ ] The `<details>` blocks are emitted in `groups[].sections[]` order, grouped by `ep-chip` dividers.
- [ ] The file opens correctly in a browser via `file://…/docs/ExplainPanel.html`.
