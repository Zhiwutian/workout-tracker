# Configuration

**workout-tracker** uses separate env files for server and client.

## Boundaries

- Backend: **`server/.env`** (gitignored). Template: **`server/.env.example`**.
- Frontend: **`client/.env.local`** when needed; template **`client/.env.example`** (**`VITE_API_BASE_URL`** for Vercel + Render). No IdP secrets in the browser bundle.

Do not commit real secrets.

## Local setup

1. Install deps: `pnpm install` (postinstall copies **`server/.env.example`** → **`server/.env`** if missing).
2. Edit **`server/.env`**:
   - **`DATABASE_URL`** — PostgreSQL connection string
   - **`DB_SSL`** — set **`true`** for managed Postgres that requires TLS, or add **`sslmode=require`** (or **`verify-*`**) to the URL. Default is off so local Docker/CI Postgres (no TLS) works.
   - **`DB_SSL_REJECT_UNAUTHORIZED`** — in production, whether to verify the server certificate (default **`true`** when SSL is on).
   - **`PG_POOL_MAX`** — optional pool size cap (default **10**).
   - **`TOKEN_SECRET`** — strong secret for signing demo JWTs and (when **`SESSION_SECRET`** is short) OIDC cookie signing
   - **`AUTH_DEMO_ENABLED`** — default **`true`**. Set **`false`** in production to disable **`POST /api/auth/sign-up`**, **`sign-in`**, and return **403** for those paths while keeping **`POST /api/auth/guest`** if you still want anonymous try-out (see **`docs/assumptions.md`**).
   - **`CORS_ORIGIN`** — dev client origin (e.g. `http://localhost:5173`); comma-separated list of allowed origins
   - Rate limit tunables if needed (`RATE_LIMIT_*`)

3. Optional client **`client/.env.local`** (see **`client/.env.example`**):
   - **`VITE_API_BASE_URL`** — when the API is not same-origin (e.g. Vercel + Render); must not contain secrets

Anything under **`VITE_*`** is exposed in the browser bundle—**no secrets**.

## OIDC (Auth0-class)

When **`AUTH_OIDC_ENABLED=true`**, the server validates extra vars at startup:

| Variable                                | Required    | Notes                                                                                                                                               |
| --------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`AUTH_OIDC_ISSUER`**                  | yes         | Issuer base URL (e.g. `https://YOUR_TENANT.auth0.com/`)                                                                                             |
| **`AUTH_OIDC_CLIENT_ID`**               | yes         | Application client id                                                                                                                               |
| **`AUTH_OIDC_REDIRECT_URI`**            | yes         | Absolute URL registered in the IdP; must hit this API. Local: `http://localhost:5173/...`; split prod: `https://<render>/api/auth/oidc/callback`    |
| **`AUTH_OIDC_CLIENT_SECRET`**           | no          | Use for confidential clients (code exchange on server)                                                                                              |
| **`AUTH_FRONTEND_ORIGIN`**              | no          | **Split deploy:** SPA origin (e.g. `https://myapp.vercel.app`). Post-OIDC redirects go here. Omit for same-origin (local proxy or Render monolith). |
| **`AUTH_POST_LOGIN_PATH`**              | no          | Default **`/`** — path appended after successful callback (relative to frontend origin when **`AUTH_FRONTEND_ORIGIN`** is set).                     |
| **`SESSION_SECRET`**                    | recommended | Min **16** characters for signing OIDC state + **`wt_session`** cookie. If unset or short, **`TOKEN_SECRET`** must be at least **16** characters.   |
| **`AUTH_OIDC_LOGIN_STATE_TTL_SECONDS`** | no          | Default **600** (PKCE/state cookie lifetime)                                                                                                        |
| **`SESSION_TTL_SECONDS`**               | no          | Default **604800** (7 days)                                                                                                                         |
| **`SESSION_COOKIE_SAME_SITE`**          | no          | **`lax`** same-origin; **`none`** for **Vercel + Render** (cross-site `fetch` + cookies; **`Secure`** in production)                                |

**Routes:** **`GET /api/auth/oidc/login`** (redirect to IdP), **`GET /api/auth/oidc/callback`**, **`POST /api/auth/logout`**, **`GET /api/auth/options`** (feature flags for the sign-in UI).

**Authorization:** Protected APIs accept **`Authorization: Bearer`** (demo JWT / guest) first, then **`wt_session`** httpOnly cookie (OIDC). The client uses **`credentials: 'include'`** on fetches so cookies are sent to the API origin (same-origin or cross-origin when **`SESSION_COOKIE_SAME_SITE=none`**).

**Split hosts (default prod layout):** Set **`AUTH_FRONTEND_ORIGIN`**, **`CORS_ORIGIN`** to the Vercel origin(s), **`SESSION_COOKIE_SAME_SITE=none`**, and **`VITE_API_BASE_URL`** on Vercel. See **`docs/deployment/README.md`** and **`docs/deployment/vercel-render.md`**.

## Safety

- Never put backend secrets in client env.
- Follow **`.cursor/rules/auth-secrets-safety.mdc`** and **`docs/styleguide/backend-observability-security.md`**.
