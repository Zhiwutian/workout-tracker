# Troubleshooting (workout-tracker)

Quick fixes for common local and hosted issues. For deployment env, see **`docs/deployment/README.md`** and **`docs/configuration.md`**.

---

## Database

| Symptom                                                        | What to check                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ECONNREFUSED` / cannot connect                                | Postgres running? `DATABASE_URL` correct host/port/db name?                                                                                                                                                                                                                                               |
| Migration errors after `git pull`                              | Run `pnpm run db:migrate` from repo root; read the new migration file if it fails.                                                                                                                                                                                                                        |
| `relation "…" does not exist`                                  | Migrations not applied — `pnpm run db:migrate` then `pnpm run db:seed` if needed.                                                                                                                                                                                                                         |
| **`db:reset`:** migrate “success” but `exercise_types` missing | Drizzle’s migration log lives in schema **`drizzle`**, not **`public`**. **`database/reset.sh`** drops **`drizzle`** and **`public`** so migrations run again. If you only dropped **`public`** by hand, run **`pnpm run db:reset`** or **`DROP SCHEMA drizzle CASCADE`** then **`pnpm run db:migrate`**. |
| **`db:reset` / wrong DB**                                      | **`DATABASE_URL` must be exported** for **`drizzle-kit migrate`**. **`reset.sh`** uses **`set -a`** when sourcing **`server/.env`** and **`export DATABASE_URL`**.                                                                                                                                        |
| SSL errors to Neon/hosted DB                                   | `DB_SSL=true` or `sslmode` in URL per **`docs/configuration.md`**.                                                                                                                                                                                                                                        |

---

## API / dev server

| Symptom                                | What to check                                                                                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `401` on `/api/me` after sign-in       | **Split deploy:** token handoff and cookies — see **`docs/deployment/auth0-setup.md`**, **`docs/deployment/vercel-render.md`**. Local: same-origin Vite proxy vs `VITE_API_BASE_URL`. |
| `403` / CORS errors in browser console | `CORS_ORIGIN` must list the **exact** SPA origin (scheme + host, no trailing slash mismatch).                                                                                         |
| `429` Too Many Requests                | Rate limits in `server/config/env.ts`; wait or tune `RATE_LIMIT_*` for local dev only.                                                                                                |
| Port already in use (`5173`, `8080`)   | `pnpm run dev:clean` or **`docs/development-workflow.md`**.                                                                                                                           |

---

## OIDC / Auth0

| Symptom                                   | What to check                                                                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth0: **redirect_uri** invalid           | **`AUTH_OIDC_REDIRECT_URI`** must match Auth0 **Allowed Callback URLs** exactly (no stray newline — env is trimmed in code).                            |
| Return to API host instead of Vercel      | Set **`AUTH_FRONTEND_ORIGIN`** to the Vercel origin on Render.                                                                                          |
| Signed in at IdP but app shows logged out | Split host: **`SESSION_COOKIE_SAME_SITE=none`**, HTTPS; fragment handoff when **`AUTH_FRONTEND_ORIGIN`** is set — **`docs/deployment/auth0-setup.md`**. |
| `sign-in session expired` on callback     | PKCE state cookie expired — start login again; increase **`AUTH_OIDC_LOGIN_STATE_TTL_SECONDS`** if flows are slow.                                      |

---

## Client / Vite

| Symptom                    | What to check                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| API calls go to wrong host | **`VITE_API_BASE_URL`** in `client/.env.local` (no trailing slash); rebuild client after change. |
| Blank page after deploy    | Check browser console / network; verify API URL and CORS.                                        |

---

## Tests

| Symptom            | What to check                                                                           |
| ------------------ | --------------------------------------------------------------------------------------- |
| IDOR tests skipped | Set **`TEST_DATABASE_URL`** to a disposable Postgres URL — **`docs/testing.md`**.       |
| E2E fails          | **`DATABASE_URL`**, Playwright browsers installed — **`docs/development-workflow.md`**. |

---

## Still stuck?

1. **`pnpm run lint`**, **`pnpm run tsc`**, **`pnpm run test`** — catch broken builds early.
2. **`docs/security-notes.md`** — cookies and cross-origin behavior.
3. **`CHANGELOG.md`** — recent changes that might affect env or routes.
