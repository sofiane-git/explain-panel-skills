# Monorepo support

`/explore-pipeline` handles monorepos by **detecting** the layout and **asking** you to confirm which roots to include. It never picks silently.

## What counts as a monorepo

For this kit, "monorepo" means: more than one directory inside the repo contains a package manifest (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`, `composer.json`, `pom.xml`).

Single-package repos still go through the same flow — `/explore-pipeline` confirms with you that `.` is the only root.

## Detection signals

In order of priority:

1. **Explicit workspace declarations** (most authoritative):
   - `package.json` with a `workspaces` field
   - `pnpm-workspace.yaml`
   - `lerna.json`
   - `turbo.json`
   - `nx.json`
   - `Cargo.toml` `[workspace]` table
   - Multiple `pyproject.toml` files

2. **Manifest discovery** (fallback when no declarations exist):
   - `find . -maxdepth 2 -name "package.json" -o -name "pyproject.toml" -o ...`

3. **Classification of each candidate**:

| File / pattern | Inferred role |
|----------------|---------------|
| Imports `fastapi`, `flask`, `django`, `starlette`, `tornado` | Python backend |
| Imports `express`, `fastify`, `koa`, `hono`, `@nestjs/*` | Node backend |
| `nuxt.config.*`, `next.config.*` | Full-stack framework |
| Imports `vue`/`react`/`svelte` with no SSR config | Frontend SPA |
| Only types / utilities, imported by others | Shared library |
| `*.tf`, `Dockerfile`, `helm/` | Infrastructure |
| Mostly `*.test.*` / `*.spec.*` | Test-only |

## The user prompt

After classification, `/explore-pipeline` shows you a table and asks two questions:

```
I detected this layout:

  ./api               — Python backend (FastAPI, imports detected)
  ./web               — Next.js frontend (next.config.ts found)
  ./packages/shared   — TypeScript shared types (used by both)
  ./infra             — Terraform + Docker (no application code)
  ./scripts           — One-off Python scripts (utility, no entry point)

Question 1 — Which directories should the pipeline map include?
Question 2 — What is the primary framework label for the top-level `framework` field?
```

You're encouraged to pick **the directories that contain code worth documenting**, which is rarely all of them. Typical answers:

- A standard backend + frontend repo: `api + web`. Shared libs are referenced indirectly through their consumers.
- A library monorepo: just the main package; everything else is examples/tests.
- A microservices repo: one root per service, or even one map per service (see "One map per service" below).

## How `roots[]` is used

Once you confirm, `/explore-pipeline` writes the chosen list into `roots[]`. Downstream:

- `/explain-panel` Pass-B audit only scans these directories when looking for missed modules. That keeps the audit fast and on-topic.
- Section `file` paths remain repo-root-relative. `roots[]` is the scope of the scan, not a prefix.

## One map per service?

For very large monorepos (10+ services), a single map can't represent everything coherently. We recommend:

```
docs/
├── pipeline-map.json          # umbrella map — focus on the API gateway + shared lib
├── pipeline-map.payments.json # one map per service
├── pipeline-map.notifications.json
└── pipeline-map.search.json
```

`/explore-pipeline` only writes to `docs/pipeline-map.json` by default. To produce additional maps, copy the workflow:

```
/explore-pipeline
# answer questions for one service
mv docs/pipeline-map.json docs/pipeline-map.payments.json

/explore-pipeline
# repeat for next service
```

`/explain-panel` can be pointed at a different map via:

```
/explain-panel docs/pipeline-map.payments.json
```

(The skill reads the first `.json` path in the user message; absent that, defaults to `docs/pipeline-map.json`.)

## When detection fails

If `/explore-pipeline` can't classify a directory or finds an unfamiliar marker file, it **stops and asks**. You can:

- Provide the missing context ("that's our Elixir backend at `apps/server`").
- Skip the unknown directory ("ignore `legacy/`, we're rewriting it").
- Override the detected framework ("primary framework is `rails`, not `fastapi`").

The skill never proceeds on a guess. If the detection table looks wrong, fix it before answering — `/explore-pipeline` re-runs the classification step on request.

## Manual override

If you'd rather skip detection entirely and feed the skill a pre-decided list, edit `docs/pipeline-map.json` after a first run (or write it from scratch) with the `roots[]` you want. `/explain-panel` reads `roots[]` verbatim during the audit.

## Common patterns we've seen

| Repo shape | Typical roots |
|------------|---------------|
| `api/ + web/` | `["api/", "web/"]` |
| `apps/api + apps/web + packages/shared` (Turborepo / Nx) | `["apps/api/", "apps/web/", "packages/shared/"]` |
| `backend/ + frontend/ + sdk/` | `["backend/", "frontend/"]` (skip `sdk/` unless it's part of the user flow) |
| `services/auth + services/billing + services/web` | One map per service |
| Single Next.js app | `["."]` |
| Single FastAPI app + standalone admin Next.js | `["app/", "admin/"]` |
