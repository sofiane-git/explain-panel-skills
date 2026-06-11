# Keyboard handler reference

The generated component must support these interactions out of the box. All template variants (React Tailwind/CSS, Vue Tailwind/CSS, HTML standalone) implement them already — this file documents the contract so future template variants stay consistent.

## Required behaviours

| Key | Effect |
|-----|--------|
| `Tab` | Moves focus through accordion buttons in document order. Native button focus order — no custom logic. |
| `Shift+Tab` | Reverse focus order. Native. |
| `Enter` or `Space` on a focused button | Toggles the section. Native button behaviour, no custom handler needed. |
| `Escape` (anywhere in the document while a section is open) | Closes the open section AND returns focus to the toggle button that opened it. |

## Why focus return matters

When the user opens a panel with the keyboard, then presses Escape, leaving focus on `<body>` would be disorienting — screen readers lose context, and the user has to Tab back to the same spot. Returning focus to the source button keeps them where they were.

## Implementation pattern

Both React (`useEffect` + `document.addEventListener`) and Vue (`onMounted` + `document.addEventListener`) use the same document-level listener. The handler reads the currently-open section id from state and uses `document.getElementById(\`explain-btn-${id}\`)?.focus()` to return focus.

The listener is cleaned up on unmount in both frameworks.

The HTML standalone variant gets Tab/Enter/Space for free from native `<details>`/`<summary>` and implements the same Escape-with-focus-return behaviour via the inline `<script>` at the bottom of `html-standalone.html.template` (closes the open `<details>`, focuses its `<summary>`).

## What we deliberately do NOT do

- **Arrow key navigation between accordion items**: ARIA Authoring Practices Guide describes both "single-tab navigation with arrows" and "tab-to-each-button" as valid. We use the simpler tab-to-each-button pattern; it composes better with the rest of the page and the spec accepts it.
- **Roving tabindex**: would require pulling each section out of the natural tab order. Adds complexity for no real benefit at this size.
- **Focus trap**: this is an inline accordion, not a modal. The user must remain free to Tab out of the panel into the rest of the page.

## Testing checklist (manual)

1. Tab into the panel → first button focused, others reachable by repeated Tab.
2. Press Enter → section opens. Press Enter again → closes.
3. Open a section, press Escape → section closes and focus is back on the source button.
4. With a screen reader, opening a section should announce the new region (the `role="region"` + `aria-labelledby` combination handles this).
