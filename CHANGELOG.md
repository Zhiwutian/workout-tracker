# Changelog

All notable changes to this template are documented in this file.

The format is inspired by Keep a Changelog and uses semantic-style version sections for template milestones.

## [Unreleased]

### Changed

- **`server/config/env.ts`** — trim OIDC-related env strings at load so pasted **`AUTH_OIDC_REDIRECT_URI`** cannot include trailing newlines (Auth0 **redirect_uri** errors).
- **`docs/deployment/auth0-setup.md`** — §0 ordered checklist for OIDC when Vercel + Render are already deployed; troubleshooting row for newline in callback URL.
- **`client/src/features/auth/AuthContext.tsx`** — ignore stale **`readMe`** results so a slow initial **401** cannot clear storage after guest (or other) login completes (fixes split-deploy / slow-network race).
- **`render.yaml`** — web service **`plan: starter`** (lighter cost than Pro for minimal traffic).
- **`docs/deployment/neon-account-setup.md`** — expanded Neon + Render **`DATABASE_URL`** / **`CORS_ORIGIN`** walkthrough.

### Added

- **Deploy (bible-support stack):** root **`render.yaml`**; Vercel + Render + Neon documented as **default** split layout; **`AUTH_FRONTEND_ORIGIN`** on the API so OIDC redirects return to the Vercel SPA (not the Render host). **`client/vercel.json`**, **`client/.env.example`**, **`api-base-url`**, **`smoke:deploy`**. Docs hub, **`vercel-render.md`**, **`auth0-setup.md`**, account setup guides, optional **`render-neon.md`** monolith path.
- **OIDC / OAuth (Path A):** `AUTH_OIDC_*` and session env validation; `openid-client`; `GET /api/auth/oidc/login` (PKCE), `GET /api/auth/oidc/callback`, `POST /api/auth/logout`, `GET /api/auth/options`; signed cookies `wt_oidc_login` / `wt_session`; `sub` → `users.authSubject`; `authMiddleware` accepts **Bearer** then session cookie; client `credentials: 'include'`, sign-in page OIDC + gated demo, `auth_error` query handling. Docs: `docs/configuration.md`, `docs/deployment/README.md`, `docs/deployment/auth0-setup.md`, `docs/data-flow.md`, `docs/assumptions.md`, `docs/architecture.md`, `docs/testing.md`, `docs/security-notes.md`, `docs/styleguide/backend-patterns.md`, `docs/README.md`, `docs/decisions/README.md`; ADR 0001 and build plan §11 updated. `server/.env.example` extended; **`AGENTS.md`** links testing, security, and deployment guides.
- **Continue as guest:** `POST /api/auth/guest` creates a server user with `authSubject` `guest:<uuid>` and returns a JWT; **`GET /api/me`** and **`PATCH /api/profile`** include **`isGuest`**. Sign-in page adds **Continue as guest**; nav and workouts/profile copy explain guest vs named accounts. Tests (MSW, API, optional Postgres IDOR, Playwright smoke).

### Fixed

- **`profiles.displayName`:** removed global unique index so **multiple OIDC users** can share the same display name (e.g. same Google “name” on different accounts). **Demo** sign-in still matches only `demo:*` accounts; demo sign-up rejects a name if another **demo** row already uses it. **Drizzle** `DrizzleQueryError` is unwrapped in **`isPgUniqueViolation`** so PG **`23505`** is detected on the `cause` chain.
- **OIDC split deploy (Vercel + Render):** after successful IdP callback, redirect to the SPA includes **`#oidc_token=`** (Bearer JWT in the fragment) when **`AUTH_FRONTEND_ORIGIN`** is set, so **`/api/me`** works even when browsers block cross-site session cookies; client bootstraps the token from the hash before render.
- **Postgres SSL:** `pg` pool no longer forces TLS. SSL is enabled only when **`DB_SSL=true`** or **`DATABASE_URL`** includes **`sslmode=require|verify-ca|verify-full`**, fixing **`db:seed`** / CI against local Postgres (e.g. GitHub Actions service) that does not support SSL.
- **Drizzle migrations / CI:** `database/migrations/0003_bouncy_gwen_stacy.sql` plus `meta/0003_snapshot.json` and journal entry align Drizzle Kit snapshot format with `server/db/schema.ts` without dropping `profiles_display_name_unique` (no DDL beyond `SELECT 1`), satisfying the PR migration policy when the schema file changes.

### Added

- **CI / Husky parity with template:** **`/.github/workflows/audit-scheduled.yml`** (weekly **`pnpm audit --audit-level high`**). Root script **`pnpm run ci:local`** (lint → tsc → test → build). Husky **`pre-push`** runs **`ci:local`** so pushes match core GitHub quality gates. Docs policy treats **`CONTRIBUTING.md`**, **`AGENTS.md`**, and **`CHANGELOG.md`** as documentation updates. **`docs/development-workflow.md`** and PR template document CI, local parity, and E2E expectations.

- **`CONTRIBUTING.md`** — PR checks, changelog and rules-registry discipline, optional parent-workspace scope; **`AGENTS.md`** expanded with workspace layout, copy-paste agent prompt, rule-precedence note, and link to contributing.
- **Proposal / docs index:** `docs/proposals/workout-tracker-build-plan.md` updated (MVP checkboxes, agent/workspace workflow, doc map rows); `docs/README.md` and `docs/proposals/README.md` cross-link contributor entry points; **`README.md`** links **`CONTRIBUTING.md`**.

- **Workout tracker domain (MVP):** Drizzle schema and migration for `users`, `profiles`, `exercise_types`, `workouts`, `workout_sets`; seed global exercises; JWT demo auth (sign-up / sign-in by display name); REST APIs for profile, exercises, workouts, sets, and weekly volume (`reps × weight`); React UI for sign-in, workout list, log sets, dashboard, and profile. **Removed** starter todo CRUD demo.
- `docs/assumptions.md` for UTC weekly stats and auth placeholder notes.
- `server/lib/volume.ts` plus unit tests for volume calculation.
- **409** responses for duplicate **display name** on demo sign-up and profile update (`profiles_display_name_unique`); sign-up runs in a DB transaction so a failed profile insert does not leave an orphan user.
- Server package renamed to `workout-tracker-server` (version aligned with root `0.1.0`).
- **Docs:** `docs/styleguide/*` (patterns, UI, DB, observability) ported from the bible-support template and adapted for workout-tracker; new **`docs/styleguide/security-and-authz.md`**. **`docs/rules-registry.md`**, **`docs/rules-usage-guide.md`**, **`docs/configuration.md`**, **`docs/deployment/README.md`**. **`.cursor/rules/`** aligned with registry, including **`authz-data-ownership`** for multi-tenant safety. Root **`AGENTS.md`** for command summary.
- **`docs/data-flow.md`** with auth/API/DB flow and mermaid diagrams. **Light PWA:** `manifest.webmanifest`, production-only **`sw.js`** (installability, no API caching), HTML meta + title.
- **Drizzle:** **`database/migrations/meta/0002_snapshot.json`** (introspected final schema) for kit parity with migration **`0002_workout_domain`**.
- **Security tests:** `server/routes/api-idor.test.ts` (cross-user **404** on workouts/sets) when **`TEST_DATABASE_URL`** is set; CI **quality** job adds **Postgres 16**, migrate/seed, and passes **`TEST_DATABASE_URL`** for **`pnpm run test`**.
- **E2E:** `@playwright/test`, **`playwright.config.ts`**, **`e2e/smoke.spec.ts`**, **`pnpm run dev:e2e`** (Vite **127.0.0.1:5188**). CI runs **`pnpm exec playwright install chromium --with-deps`** then **`pnpm run test:e2e`**.
- **PWA icons:** **`client/public/icon-192.png`**, **`icon-512.png`** via **`scripts/gen-pwa-icons.mjs`** (**sharp** in **`onlyBuiltDependencies`**). **`eslint-plugin-n`** added for ESLint standard config resolution.
- **Proposal:** **`docs/proposals/workout-tracker-build-plan.md`** (rebuilt master plan: R0–R9, docs map, deliverables, OIDC follow-up) and **`docs/proposals/README.md`**.

- Established backend layering with concrete examples:
  - `server/app.ts` for app composition
  - `server/routes/api.ts` for route modules
  - `server/controllers/hello-controller.ts`
  - `server/controllers/health-controller.ts`
  - `server/services/health-service.ts`
  - `server/db/pool.ts`
- Added `GET /api/health` endpoint demonstrating route -> controller -> service -> db flow.
- Added project documentation set under `docs/`:
  - `docs/README.md`
  - `docs/architecture.md`
  - `docs/project-structure.md`
  - `docs/development-workflow.md`
  - `docs/templates/feature-doc-template.md`
- Added CI workflow `/.github/workflows/ci.yml` for pull requests and manual runs.
- Added PR template `/.github/pull_request_template.md` with testing + documentation checklists.
- Added docs-policy CI gate requiring docs updates when application/config files change.
- Added pnpm workspace file: `pnpm-workspace.yaml`.
- Added pnpm lockfile: `pnpm-lock.yaml`.
- Added full test scaffolding with Vitest across frontend and backend.
- Added frontend unit test setup (`client/src/test/setup.ts`) and sample component test (`client/src/App.test.tsx`).
- Added MSW-based frontend API mock pattern (`client/src/test/handlers.ts`, `client/src/test/server.ts`).
- Added backend sample tests:
  - `server/services/health-service.test.ts` (service unit tests with mocked db layer)
  - `server/routes/api.test.ts` (API route tests via Supertest)
- Added `pnpm run test:changed` for fast local feedback by running only tests related to changed files.
- Added runtime pinning with `.nvmrc` and `engines` in root `package.json`.
- Added server environment validation module (`server/config/env.ts`) using `zod`.
- Added structured logging via `pino` and request logging via `pino-http`.
- Added Drizzle ORM + Drizzle Kit integration with schema/migration scaffolding.
- Added example Drizzle-backed CRUD endpoints for todos (`/api/todos`).
- Added idempotent database seed flow (`pnpm run db:seed`) and starter todo data.

### Changed

- Upgraded development environment:
  - Devcontainer uses Node 22 via feature (`ghcr.io/devcontainers/features/node:1`).
  - Devcontainer uses persistent bind mount to `/workspace` from local folder.
- Migrated package management from npm to pnpm:
  - Added `packageManager` in root `package.json`.
  - Converted root scripts to `pnpm` commands.
  - Updated Husky pre-commit to `pnpm exec lint-staged`.
  - Updated CI and deploy workflows to use pnpm setup/install/run.
  - Updated docs and README commands from npm to pnpm.
- Hardened CI/CD and project workflow:
  - Deploy workflow updated to `actions/checkout@v4`.
  - Deploy script changed from force push to normal push (`git push origin main:pub`).
  - Added docs-policy + quality checks in CI pipeline.
- Upgraded major runtime/tooling stacks:
  - React 19 + Vite 7 (`client`)
  - Express 5 (`server`)
  - Node 22 (devcontainer/CI)
  - TypeScript/ESLint ecosystem refresh across root + client
  - Husky v9-compatible prepare/hook behavior
- Refactored server startup into bootstrap/app composition split:
  - `server.ts` now focuses on process startup.
  - `app.ts` handles middleware/routes/static/error wiring.
- Updated Express fallback route for Express 5 compatibility:
  - from `*` to `/{*path}`.
- Updated README to match current stack, setup, CI, docs-policy, and pnpm workflows.
- Updated CI to run tests (`pnpm run test`) alongside lint, typecheck, and build.
- Added minimum coverage thresholds in Vitest configs for frontend and backend.

### Fixed

- Resolved empty workspace issue in devcontainer by introducing explicit workspace bind mount.
- Fixed GitHub Actions failure (`Unable to locate executable file: pnpm`) by adding `pnpm/action-setup` before `actions/setup-node`.
- Removed Husky deprecation warning source by deleting deprecated `/.husky/_/husky.sh` and modernizing hook usage.

### Removed

- Removed npm lockfiles:
  - `package-lock.json`
  - `client/package-lock.json`
  - `server/package-lock.json`

## [2.0.0] - Template Baseline

### Added

- Initial full-stack TypeScript template structure with:
  - React client (`client`)
  - Express server (`server`)
  - PostgreSQL scripts (`database`)
  - deployment workflow scaffold
