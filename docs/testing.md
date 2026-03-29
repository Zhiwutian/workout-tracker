# Testing

Commands and layers for **workout-tracker**. Aligns with **`docs/proposals/workout-tracker-build-plan.md`** §9 and Report 2 auth/session expectations.

**Verification:** The full local gate (**`pnpm run ci:local`**: lint, typecheck, unit/integration tests, production client build) and **E2E** (**`pnpm run test:e2e`**, with Postgres migrated/seeded) are **passing**. Evidence table: **`docs/course-qa-evidence.md`** §0.

## Commands (from repo root)

| Goal                                 | Command                                                                                                                                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lint                                 | `pnpm run lint`                                                                                                                                                                                                |
| Typecheck                            | `pnpm run tsc`                                                                                                                                                                                                 |
| Unit + integration (client + server) | `pnpm run test`                                                                                                                                                                                                |
| Server only                          | `pnpm run test:server`                                                                                                                                                                                         |
| Client only                          | `pnpm run test:client`                                                                                                                                                                                         |
| Changed files (fast feedback)        | `pnpm run test:changed`                                                                                                                                                                                        |
| Production client build              | `pnpm run build`                                                                                                                                                                                               |
| Full local CI parity                 | `pnpm run ci:local`                                                                                                                                                                                            |
| E2E (needs DB + browser deps)        | See **`docs/development-workflow.md`** — typically `pnpm run test:e2e` with `DATABASE_URL` set                                                                                                                 |
| IDOR / Postgres-backed API tests     | `TEST_DATABASE_URL=postgres://… pnpm run test:server` — runs `server/routes/api-idor.test.ts` when URL is set (cross-tenant + **400** when exercise category ≠ workout **`workoutType`** on **`POST …/sets`**) |

## What is covered today

- **API routes:** Supertest against the Express app (e.g. health, **`GET /api/auth/options`**, demo auth when enabled).
- **Dashboard / goals auth + DB wiring:** **`server/routes/api.test.ts`** asserts **401** without a Bearer token on **`GET /api/stats/summary`**, **`GET /api/stats/volume-series`**, and **`GET /api/goals`**, and **503** (no **`DATABASE_URL`**) on those reads plus goals **POST** / **PATCH** / **DELETE**.
- **Week windows (server):** **`server/lib/week-helpers.test.ts`** covers **`mondayWeekStartYmdInZone`** and **`lastNMondayWeekStarts`** (IANA zones, ordering, empty **`n`**). Same Monday-based week family as **`GET /api/stats/weekly-volume`** and the multi-week dashboard stats endpoints (see **`docs/assumptions.md`**).
- **Client:** Vitest + Testing Library + MSW handlers for `/api/*` (including auth options and logout). **`client/src/lib/api/stats-api.test.ts`** and **`goals-api.test.ts`** lock query strings / methods for **`readVolumeSeries`**, **`readStatsSummary`**, and goals CRUD.
- **Ownership:** Optional Postgres IDOR suite when **`TEST_DATABASE_URL`** is provided (CI quality job), including workout-type mismatch on log set.

## OIDC / session

- **Automated:** With **`AUTH_OIDC_ENABLED=false`** (default in tests), OIDC redirect/callback is not exercised in CI. **`GET /api/auth/options`** asserts the **`oidc`** flag reflects env.
- **Manual / staging:** Enable **`AUTH_OIDC_ENABLED=true`** with a real tenant (see **`docs/configuration.md`**). Register **`AUTH_OIDC_REDIRECT_URI`** in the IdP (e.g. dev: `http://localhost:5173/api/auth/oidc/callback` behind Vite proxy). Walk through: options → login redirect → callback → **`GET /api/me`** → **`POST /api/auth/logout`**.
- **Future:** Integration tests with a mocked token endpoint or recorded fixtures for **`/api/auth/oidc/callback`** would strengthen regression coverage without IdP secrets in CI.

## E2E (Playwright)

- **`GET /api/workouts`** — optional query: **`from`**, **`to`** (ISO 8601), **`status`** (`all` \| `active` \| `completed`), **`sort`** (`startedAt_desc` \| `startedAt_asc`). Used by the workouts list filters.
- **`GET /api/stats/weekly-volume`** — optional **`timezone`** (IANA); server unit tests cover **`resolveWeeklyVolumeWindow`** (UTC vs zone).
- **`GET /api/stats/volume-series`**, **`GET /api/stats/summary`**, **`/api/goals`** — covered by Supertest **401/503** wiring tests and client **`stats-api`** / **`goals-api`** unit tests; week alignment documented in **`docs/assumptions.md`**.
- **`GET/PATCH /api/exercises`** — custom exercise archive, recents, **`category`**, and **`ExercisesPage`**; migrations **`0005`**+.
- **Set logging / CSV** — migration **`0006`** (`isWarmup`, `restSeconds`); **`0007`** (`workoutType`, exercise **`category`**); **`WorkoutDetailPage`** edit/delete; CSV **`is_warmup`**, **`rest_seconds`**, **`workout_type`**, **`exercise_category`**.
- **`GET /api/export/workout-sets.csv`** — authenticated CSV download of sets joined with workout + exercise; optional **`from`** / **`to`** filter on **workout `startedAt`** (same idea as list). **`Content-Disposition: attachment`**.
- **`e2e/smoke.spec.ts`** — happy path with demo or guest auth; cardio workout row asserts **Cardio** badge and filtered picker has no **Bench press** (skipped when the DB has no global cardio exercises — run **`database/seed-global-exercises-append.sql`** or reset + **`db:seed`**). CI uses a fresh Postgres service so the test runs there.
- **`e2e/a11y.spec.ts`** — axe scan (critical/serious) on sign-in + guest workouts; keyboard focus check on **Continue as guest**; guest **Dashboard** load after **`/dashboard`** navigation.
- **`e2e/display-preferences.spec.ts`** — sets display keys in **`localStorage`** on **`/about`**, reloads, asserts **`html`** shell classes (no guest auth / DB required).
- **Shell:** primary nav is in a **Menu** drawer (`Open menu` / **`overlay-main-menu`**); sign-in flows still use on-page **Sign in** / **Continue as guest** buttons (no menu required for smoke).
- **Projects:** Default **Chromium** + **Mobile Chrome** (viewport). Set **`PW_FULL_BROWSERS=1`** to add Firefox + WebKit (install host deps first: `pnpm exec playwright install-deps` on Linux).
- **OIDC in CI:** Only practical if the pipeline can inject IdP secrets and a stable callback URL; otherwise keep OIDC verification manual and document results for the course report.

## Optional: OIDC regression (build plan §11.F / §11.G)

These are **optional** polish items for the rubric, not required for a green **`pnpm run test`**.

| Item                                                                        | Plan ref | Status / approach                                                                                                                                                                                                      |
| --------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F** — Integration tests for **`/api/auth/oidc/callback`** with mocked IdP | §11.F    | **Not automated in-repo** by default. Feasible follow-up: isolate `exchangeOidcAuthorizationCode` / `openid-client` behind a test double and assert upsert + redirect behavior.                                        |
| **G** — Playwright happy path with **real** IdP in CI                       | §11.G    | **Requires** CI secrets (issuer, client id/secret, callback URL aligned to preview host). Until then: manual staging per **`docs/deployment/auth0-setup.md`** and record outcomes in **`docs/course-qa-evidence.md`**. |

**Report defense:** State that **F/G** are optional automation; **Path A** is satisfied by production OIDC + manual evidence + **`e2e/smoke.spec.ts`** for non-OIDC paths.

## Related docs

- **`docs/course-qa-evidence.md`** — Report **Phase 4** checklist (accessibility, UAT, browsers, hosted security) for Part 3 defense
- **`docs/demo-script.md`** — Presentation happy path (sign-in → workout → set → dashboard)
- **`docs/troubleshooting.md`** — Common local/hosted issues
- **`docs/development-workflow.md`** — dev servers, E2E port **5188**, DB migrate/seed
- **`docs/deployment/README.md`** — production smoke expectations
- **`pnpm run smoke:deploy`** — set **`DEPLOY_URL`** to your **Render API** origin after deploy (split or monolith)
- **`docs/deployment/auth0-setup.md`** — Auth0 callbacks and env for local OIDC runs
