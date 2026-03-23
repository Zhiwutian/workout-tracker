# Testing

Commands and layers for **workout-tracker**. Aligns with **`docs/proposals/workout-tracker-build-plan.md`** §9 and Report 2 auth/session expectations.

## Commands (from repo root)

| Goal                                 | Command                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Lint                                 | `pnpm run lint`                                                                                               |
| Typecheck                            | `pnpm run tsc`                                                                                                |
| Unit + integration (client + server) | `pnpm run test`                                                                                               |
| Server only                          | `pnpm run test:server`                                                                                        |
| Client only                          | `pnpm run test:client`                                                                                        |
| Changed files (fast feedback)        | `pnpm run test:changed`                                                                                       |
| Production client build              | `pnpm run build`                                                                                              |
| Full local CI parity                 | `pnpm run ci:local`                                                                                           |
| E2E (needs DB + browser deps)        | See **`docs/development-workflow.md`** — typically `pnpm run test:e2e` with `DATABASE_URL` set                |
| IDOR / Postgres-backed API tests     | `TEST_DATABASE_URL=postgres://… pnpm run test:server` — runs `server/routes/api-idor.test.ts` when URL is set |

## What is covered today

- **API routes:** Supertest against the Express app (e.g. health, **`GET /api/auth/options`**, demo auth when enabled).
- **Client:** Vitest + Testing Library + MSW handlers for `/api/*` (including auth options and logout).
- **Ownership:** Optional Postgres IDOR suite when **`TEST_DATABASE_URL`** is provided (CI quality job).

## OIDC / session

- **Automated:** With **`AUTH_OIDC_ENABLED=false`** (default in tests), OIDC redirect/callback is not exercised in CI. **`GET /api/auth/options`** asserts the **`oidc`** flag reflects env.
- **Manual / staging:** Enable **`AUTH_OIDC_ENABLED=true`** with a real tenant (see **`docs/configuration.md`**). Register **`AUTH_OIDC_REDIRECT_URI`** in the IdP (e.g. dev: `http://localhost:5173/api/auth/oidc/callback` behind Vite proxy). Walk through: options → login redirect → callback → **`GET /api/me`** → **`POST /api/auth/logout`**.
- **Future:** Integration tests with a mocked token endpoint or recorded fixtures for **`/api/auth/oidc/callback`** would strengthen regression coverage without IdP secrets in CI.

## E2E (Playwright)

- **`e2e/smoke.spec.ts`** — happy path with demo or guest auth as configured for **`pnpm run dev:e2e`**.
- **OIDC in CI:** Only practical if the pipeline can inject IdP secrets and a stable callback URL; otherwise keep OIDC verification manual and document results for the course report.

## Related docs

- **`docs/development-workflow.md`** — dev servers, E2E port **5188**, DB migrate/seed
- **`docs/deployment/README.md`** — production smoke expectations
- **`docs/deployment/auth0-setup.md`** — Auth0 callbacks and env for local OIDC runs
