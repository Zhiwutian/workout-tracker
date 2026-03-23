# Agent and contributor quick reference

**workout-tracker** — commands and doc entry points for humans and coding agents.

For PR expectations and parent-workspace conventions, see **[`CONTRIBUTING.md`](CONTRIBUTING.md)**.

## Workspace layout (optional parent repo)

You may run Cursor with a **parent** workspace open (e.g. devcontainer **`/workspace`** = bible-support) so **`workout-tracker/`** appears as a **nested** folder. That gives agents **read** access to both trees for patterns and comparison.

**Where artifacts go (workout app):**

| Artifact                    | Location (always under this repo)                       |
| --------------------------- | ------------------------------------------------------- |
| Documentation               | `docs/**`                                               |
| Changelog                   | `CHANGELOG.md`                                          |
| New or updated Cursor rules | `.cursor/rules/*.mdc` + row in `docs/rules-registry.md` |
| App code                    | `client/`, `server/`, `shared/`, `database/`            |

**Exceptions — editing the parent repo is OK when the task is explicitly:**

- **Shared devcontainer / compose** (e.g. `.devcontainer/`, mount paths for `workout-tracker`)
- **Course or org infra** that is not workout-app-specific
- A **deliberate template sync** from bible-support (document in the appropriate repo’s `CHANGELOG`)

**CI:** `workout-tracker` pipelines run from **this** repo clone only; keep docs and rules complete here.

**Rule precedence:** Parent folders may load their own always-on Cursor rules. For workout features, follow **`docs/rules-registry.md`** and this repo’s **`.cursor/rules/`** when paths conflict.

## Copy-paste prompt (spawn agent from parent workspace)

Use this at the start of a task when the workspace root is the parent and nested `workout-tracker` exists:

```text
Workspace may include bible-support (parent) and workout-tracker (nested). For this task:
- Implement workout-tracker under the path workout-tracker/ only.
- All new or updated documentation, CHANGELOG.md entries, and .cursor/rules files for the app must live under workout-tracker/ (not the parent repo root).
- Use the parent repo only as read-only reference unless the task is devcontainer/shared infra.
- Follow workout-tracker/docs/rules-registry.md for Cursor rules.
```

## Commands (repo root)

| Command                                    | Purpose                                                                            |
| ------------------------------------------ | ---------------------------------------------------------------------------------- |
| `pnpm install`                             | Install dependencies (`postinstall` ensures `server/.env` from example if missing) |
| `pnpm run dev`                             | Client + server dev watchers                                                       |
| `pnpm run dev:fresh`                       | Clean stale dev processes, then dev                                                |
| `pnpm run lint`                            | Client + server lint                                                               |
| `pnpm run tsc`                             | Typecheck client and server                                                        |
| `pnpm run test`                            | Full test suite                                                                    |
| `TEST_DATABASE_URL=… pnpm run test:server` | Includes **IDOR** integration tests (`api-idor.test.ts`)                           |
| `pnpm run test:e2e`                        | Playwright smoke (needs **`DATABASE_URL`**, browser deps; uses Vite **5188**)      |
| `pnpm run pwa:icons`                       | Regenerate **`icon-192.png`** / **`icon-512.png`** (requires **sharp**)            |
| `pnpm run test:changed`                    | Tests related to git diff                                                          |
| `pnpm run build`                           | Production client build                                                            |
| `pnpm run db:migrate`                      | Apply Drizzle migrations                                                           |
| `pnpm run db:seed`                         | Seed global exercises (idempotent)                                                 |
| `pnpm psql`                                | `psql` using `DATABASE_URL` from `server/.env`                                     |

## Before commit / PR

Run: **`pnpm run lint`**, **`pnpm run tsc`**, **`pnpm run test`**, and **`pnpm run build`** when behavior changed.

## Documentation

- **Patterns & security:** `docs/styleguide/README.md` → especially **`docs/styleguide/security-and-authz.md`**
- **Cursor rules index:** `docs/rules-registry.md`
- **Env:** `docs/configuration.md`

## Cursor rules

Project rules live in **`.cursor/rules/`**. Always-on gates include pre-commit quality and secret-commit approval; backend edits should respect **`authz-data-ownership`**.

When you **add** a rule file, register it in **`docs/rules-registry.md`** in the same change.
