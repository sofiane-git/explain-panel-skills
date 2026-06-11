# Security Policy

## Supported versions

Only the latest minor release receives security fixes.

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | ✅                 |
| 1.0.x   | ⚠️ critical fixes only until 2026-09-11 |
| < 1.0   | ❌                 |

## Threat model

This project ships **Claude Code skills** that:

1. Read source code from the user's repository.
2. Read and write `docs/pipeline-map.json`.
3. Generate a React / Vue / HTML file under `components/` or `docs/`.

The skills run inside the user's local Claude Code session — they have whatever filesystem and shell permissions the session has. There is no remote service, no auth, no network listener.

In-scope concerns:

- **HTML injection in generated `docs/ExplainPanel.html`** (the standalone variant). The schema validates `pipeline-map.json` against JSON Schema 2020-12 and rejects path-traversal in `file` fields, but free-form strings (`title`, `summary`, `annotations`, `label`, `module`, `icon`) are not HTML-sanitized at the schema level. `/explain-panel` must HTML-escape these before substitution — see `skills/explain-panel/SKILL.md` Phase 6 and the Phase 7 XSS scan for the contract.
- **Path-traversal via `file` field**. The schema enforces `^[A-Za-z0-9_./\-]+$` and rejects `..` to prevent maps from making `/explain-panel` read files outside the repo.
- **Snippet content injected into React/Vue templates**. Backticks and `${` are escaped before embedding into TS/JS template literals — see `SKILL.md` Phase 4.

Out of scope:

- Vulnerabilities in `react-syntax-highlighter`, `shiki`, `ajv-cli`, or other downstream dependencies — report those upstream. We track CVEs and bump pinned versions when they affect this project.
- Local code-execution risks in the user's own source code that the skills happen to read. The skills do not execute analysed code.
- Vulnerabilities in Claude Code itself — report to Anthropic.

## Reporting a vulnerability

**Please do not open a public issue for security findings.**

Email the maintainer: **sofiane.c95@gmail.com** with subject `[explain-panel-skills security]`.

Include:

- A description of the issue.
- Steps to reproduce (a minimal `pipeline-map.json` or skill invocation that triggers the behaviour, when applicable).
- The version of the kit and Claude Code you tested against.
- Any suggested fix.

Expected timeline:

- Acknowledgement within 5 business days.
- Initial assessment within 14 days.
- Fix and coordinated disclosure on a schedule proportional to severity.

If you do not receive an acknowledgement within 14 days, please open a public issue stating only that you sent a private report and have not heard back — do **not** include the vulnerability details in the public issue.
