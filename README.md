# workout-tracker

Full-stack **workout tracker** (React, Express, PostgreSQL, Drizzle). Patterns and Cursor rules align with the **bible-support** monorepo template; see **`docs/styleguide/`**, **`AGENTS.md`**, and **`CONTRIBUTING.md`** (PR scope and optional parent workspace).

## Tech Stack

- Node.js 22 (devcontainer-managed)
- pnpm 10 (via Corepack)
- React 19 + Vite 7 + Tailwind CSS 4 (`client`)
- React Router (`client` route-level pages)
- React Hook Form + Zod (`client` forms)
- React Context + reducer (`client` global UI state)
- Express 5 + PostgreSQL (`server`)
- Helmet + CORS + rate limiting (`server` security basics)
- TypeScript, ESLint, Prettier, Husky (**`pre-commit`** → lint-staged; **`pre-push`** → **`pnpm run ci:local`**)
- Vitest + Testing Library + Supertest for testing
- Zod env validation + Pino structured logging (`server`)

## Getting Started

### 1) Create your repository

1. Click `Use this template` on GitHub and create your new repository.
2. Name it after your project (not `full-stack-project`).

### 2) Open in Cursor Dev Container (persistent)

1. Clone to your local machine:

   ```sh
   git clone <your-repo-ssh-url>
   cd <your-repo-name>
   ```

2. Open that folder in Cursor.
3. Run `Dev Containers: Rebuild and Reopen in Container`.

This template bind-mounts your local folder to `/workspace`, so files persist across rebuilds.
Outside devcontainers, this repo also includes `.nvmrc` and engine constraints in `package.json`.

### 3) Install and configure env

1. Install dependencies:

   ```sh
   corepack enable
   pnpm install
   ```

2. Configure environment:
   - Update `server/.env` with your database name in `DATABASE_URL`.
   - Set `TOKEN_SECRET` in `server/.env`.
   - Set `CORS_ORIGIN` to your allowed frontend origin(s) (comma-separated exact origins, for example `http://localhost:5173,http://localhost:4173`).
   - Tune `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` (read), and `RATE_LIMIT_WRITE_MAX` (mutations) as needed.
   - Optional **OIDC:** set `AUTH_OIDC_ENABLED=true` and fill `AUTH_OIDC_ISSUER`, `AUTH_OIDC_CLIENT_ID`, `AUTH_OIDC_REDIRECT_URI`, and `SESSION_SECRET` (or a long `TOKEN_SECRET`); see **`docs/configuration.md`**.
   - Optional **split frontend:** copy **`client/.env.example`** → **`client/.env.local`** and set **`VITE_API_BASE_URL`** when the API is not same-origin (see **`docs/deployment/vercel-render.md`**).
   - Mirror non-secret env updates in `server/.env.example`.

### 4) Create your database

```sh
sudo service postgresql start
createdb <name-of-database>
```

Then run:

```sh
pnpm run db:import
```

If you are using Drizzle migrations instead of SQL import:

```sh
pnpm run db:migrate
pnpm run db:seed
```

### 5) Start local development

Make sure PostgreSQL is running before starting the app:

```sh
sudo service postgresql start
```

```sh
pnpm run dev
```

Open the app and confirm the client can hit `/api/hello`.

## Documentation

- **`docs/README.md`** — index of all project docs
- **`docs/styleguide/`** — UI, frontend/backend patterns, **security & authz**, database parity
- **`docs/rules-registry.md`** — Cursor rules under **`.cursor/rules/`**
- **`docs/troubleshooting.md`** — common fixes (DB, OIDC, CORS, tests)
- **`docs/demo-script.md`** — presentation checklist for instructors/demo
- **`docs/course-qa-evidence.md`** — Report **Phase 4** QA checklist (fill during your QA window)

## Example API endpoints

Responses use an API envelope:

- Success: `{ "data": ..., "meta": { "requestId": "..." } }`
- Error: `{ "error": { "code": "...", "message": "..." }, "meta": { "requestId": "..." } }`

Public:

- `POST /api/auth/sign-up` — demo account by unique display name
- `POST /api/auth/sign-in` — demo sign-in by display name

Authenticated (`Authorization: Bearer`):

- `GET /api/me`, `PATCH /api/profile`
- `GET/POST /api/exercises`
- `GET/POST /api/workouts`, `GET/PATCH/DELETE /api/workouts/:workoutId`
- `POST .../workouts/:workoutId/sets`, `PATCH/DELETE /api/sets/:setId`
- `GET /api/stats/weekly-volume?weekStart=YYYY-MM-DD` — optional `timezone` (IANA) for non-UTC week windows

Health:

- `GET /api/hello`, `GET /api/health`, `GET /api/ready`

## Scripts

- `pnpm run dev` - runs both client and server watchers
- `pnpm run dev:clean` - stops stale listeners on dev ports (`5173`, `8080`)
- `pnpm run dev:fresh` - cleans stale listeners, then starts dev watchers
- `pnpm run lint` - lints client and server
- `pnpm run tsc` - type checks client and server
- `pnpm run test` - runs frontend and backend unit/integration tests
- `pnpm run test:coverage` - runs test coverage reports for client and server
- `pnpm run test:changed` - runs related tests for changed files (fast local PR feedback)
- `pnpm run build` - builds the client for production
- `pnpm run start` - starts production server
- `pnpm run db:import` - resets/imports schema and seed data
- `pnpm run db:generate` - generates Drizzle SQL migrations from schema
- `pnpm run db:migrate` - applies Drizzle migrations
- `pnpm run db:seed` - inserts starter data if tables are empty
- `pnpm run db:studio` - opens Drizzle Studio
- `pnpm run psql` - opens `psql` using `DATABASE_URL`
- `pnpm run smoke:deploy` - hits `DEPLOY_URL` health + public API checks (after hosted deploy)
- `pnpm run deploy` - pushes `main` to `pub` for deployment workflow

## CI and Deployment

- Pull requests run CI checks in `/.github/workflows/ci.yml`:
  - `docs-policy` (requires docs updates when app/config files change)
  - `db-migration-policy` (requires migration updates when DB schema files change)
  - `lint`
  - `tsc`
  - `test`
  - `build`
- **Hosted deploy (same split layout as bible-support):** **Neon** + **Render** (API, **`render.yaml`** Blueprint) + **Vercel** (`client` with **`VITE_API_BASE_URL`**). Set Render **`CORS_ORIGIN`** to your Vercel URL(s). OIDC split-host env (e.g. **`AUTH_FRONTEND_ORIGIN`**, **`SESSION_COOKIE_SAME_SITE=none`**) is documented in **`docs/deployment/README.md`** and **`docs/deployment/auth0-setup.md`**. After deploy: `DEPLOY_URL=https://your-render-api pnpm run smoke:deploy` (API URL).
- **Optional monolith:** serve SPA + API from Render only — **`docs/deployment/render-neon.md`**.
- **Alternate:** **`/.github/workflows/main.yml`** on pushes to **`pub`** (EC2/rsync) if you use that path.

## Project Docs

Long-form project documentation is in `/docs`:

- `docs/README.md` - documentation index and maintenance guidance
- `docs/architecture.md` - system architecture and request/data flow
- `docs/project-structure.md` - folder-by-folder ownership and purpose
- `docs/development-workflow.md` - local workflow, CI, and deployment process
- `docs/app-startup-walkthrough.md` - startup timeline from dev command to first render/API calls

## Documentation Quality Gates

Every pull request should meet these documentation gates:

- If behavior changed, update docs in `/docs` in the same PR.
- If scripts/workflows changed, update `README.md` and `docs/development-workflow.md`.
- If architecture boundaries changed, update `docs/architecture.md`.
- If code moved or ownership changed, update `docs/project-structure.md`.
- For major features, add a short design/behavior note using `docs/templates/feature-doc-template.md`.

PR authors should complete the documentation checklist in `/.github/pull_request_template.md`.
