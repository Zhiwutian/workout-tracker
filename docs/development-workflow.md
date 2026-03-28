# Development Workflow

## Local Development Loop

1. Pull latest changes.
2. If not using the devcontainer, run `nvm use` (Node 22 from `.nvmrc`).
3. Run `corepack enable` once per machine/session if needed.
4. Run `pnpm install` if dependencies changed.
5. Ensure PostgreSQL is running (`sudo service postgresql start`).
6. Run `pnpm run dev` for client + server watchers.
   - If you hit stale port/process issues, run `pnpm run dev:fresh` instead.
7. Make incremental changes.
8. **Before commit:** staged files are linted/formatted via **Husky** (`pre-commit` → `lint-staged`).
9. **Before push:** Husky runs **`pre-push`** → `pnpm run ci:local` (lint, typecheck, tests, client build) so the same core gates as CI run locally. Use `git push --no-verify` only when intentional.
10. For an extra manual pass (or if hooks are skipped), run:

- `pnpm run lint`
- `pnpm run tsc`
- `pnpm run test`
- `pnpm run build`

11. Optionally run `pnpm run test:coverage` to inspect coverage trends.
12. For quick feedback during active work, run `pnpm run test:changed`.

## Database Workflow

- Modify `database/schema.sql` for schema changes.
- Define/update typed Drizzle schema in `server/db/schema.ts`.
- Generate migrations with `pnpm run db:generate`.
- Commit generated migration files under `database/migrations/` with the schema change.
- Include a short rationale in your PR for why the schema change is needed.
- If a new/changed query pattern is introduced, evaluate indexes and note index decisions in the PR.
- Apply migrations with `pnpm run db:migrate`.
- Seed starter data with `pnpm run db:seed` (idempotent: skips when table has rows).
- Optionally add/update sample data in `database/data.sql`.
- **Full wipe + migrations + seed (recommended):** from repo root, with Postgres running and `DATABASE_URL` set (or in `server/.env`):

```sh
pnpm run db:reset
```

This runs `database/reset.sh`: drops `public`, applies all Drizzle migrations, then `db:seed`. **Destructive** — every table and row is removed.

- **SQL mirror only (legacy):** `pnpm run db:import` loads `database/schema.sql` + `data.sql`. Do not run `db:migrate` immediately afterward unless you understand migration journal drift (see **`docs/styleguide/database-patterns.md`**).

## CI Workflow

Pull requests and manual runs trigger `/.github/workflows/ci.yml`:

1. Install dependencies (`pnpm install --frozen-lockfile`)
2. Policy checks:
   - docs updates for app/config changes (counts updates to `README.md`, `docs/**`, `CONTRIBUTING.md`, `AGENTS.md`, or `CHANGELOG.md`)
   - DB migration updates for schema file changes
3. **Quality** job (Postgres 16 service): lint (`pnpm run lint`), typecheck (`pnpm run tsc`), migrate + seed test DB, test (`pnpm run test`), client build (`pnpm run build`), Playwright Chromium install, **`pnpm run test:e2e`**

This catches most integration issues before merge.

### CI parity (local vs GitHub)

| CI step                    | Local command                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------- |
| Lint                       | `pnpm run lint`                                                                         |
| Typecheck                  | `pnpm run tsc`                                                                          |
| Test                       | `pnpm run test` (set **`TEST_DATABASE_URL`** locally to include IDOR integration tests) |
| Build                      | `pnpm run build`                                                                        |
| E2E                        | `pnpm run test:e2e` (needs **`DATABASE_URL`**, migrate/seed, Playwright browser deps)   |
| All core gates in one shot | `pnpm run ci:local` (also runs on **`git push`** via Husky **`pre-push`**)              |

**Advisory:** `/.github/workflows/audit-scheduled.yml` runs weekly (and on demand) with **`pnpm audit --audit-level high`**; it does not block PR merges. Run the same command locally before large dependency upgrades.

## Deployment Workflow

- **Neon + Render + Vercel (default, same as bible-support):** **`docs/deployment/README.md`**. Render Blueprint (**`render.yaml`**) for the API; Vercel project root **`client`** with **`VITE_API_BASE_URL`**; **`CORS_ORIGIN`** on Render = Vercel origin(s). Smoke: **`DEPLOY_URL=https://<render-api> pnpm run smoke:deploy`**. Monolith-only option: **`docs/deployment/render-neon.md`**.
- **EC2 / legacy:** deployment is branch-driven through pushes to **`pub`**. Root script:

```sh
pnpm run deploy
```

This pushes `main` to `pub`, triggering **`/.github/workflows/main.yml`**.

## Recommended Branching

- Create short-lived feature branches from `main`.
- Keep PRs focused on one area (UI/API/data/docs).
- Require CI to pass before merge.
- Update docs in `/docs` when behavior, scripts, or architecture change.

## PWA (install)

- **`client/public/manifest.webmanifest`** references **`icon-192.png`** and **`icon-512.png`** (regenerate with **`pnpm run pwa:icons`** after installing deps so **sharp** can build).
- Production registration of **`/sw.js`** (`client/src/main.tsx`). SW is minimal (no API cache). Use HTTPS in production.

## Integration and E2E tests

- **IDOR / cross-user API tests** (`server/routes/api-idor.test.ts`) run only when **`TEST_DATABASE_URL`** is set (same schema as **`DATABASE_URL`**; migrate + seed first). Example:

```sh
TEST_DATABASE_URL=postgres://dev:dev@localhost/workout-tracker pnpm run test:server
```

- **Playwright** (`pnpm run test:e2e`): starts **`pnpm run dev:e2e`** (Vite on **5188**, API on **8080**). Requires a running database (**`DATABASE_URL`**) and OS browser deps (`pnpm exec playwright install chromium` and, on Linux, `sudo pnpm exec playwright install-deps chromium` if the runner prompts). CI runs migrate + seed + **`playwright install chromium --with-deps`** before E2E.

## Styleguide and Cursor rules

- Implementation patterns: **`docs/styleguide/README.md`** (start there).
- **Security and ownership:** **`docs/styleguide/security-and-authz.md`** before adding user-owned APIs.
- Cursor agent rules: **`.cursor/rules/`**; index: **`docs/rules-registry.md`**, usage: **`docs/rules-usage-guide.md`**.
