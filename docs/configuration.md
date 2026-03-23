# Configuration

**workout-tracker** uses separate env files for server and client.

## Boundaries

- Backend: **`server/.env`** (gitignored). Template: **`server/.env.example`**.
- Frontend: **`client/.env.local`** when needed. Template: **`client/.env.example`** if present.

Do not commit real secrets.

## Local setup

1. Install deps: `pnpm install` (postinstall copies **`server/.env.example`** → **`server/.env`** if missing).
2. Edit **`server/.env`**:
   - **`DATABASE_URL`** — PostgreSQL connection string
   - **`DB_SSL`** — set **`true`** for managed Postgres that requires TLS, or add **`sslmode=require`** (or **`verify-*`**) to the URL. Default is off so local Docker/CI Postgres (no TLS) works.
   - **`DB_SSL_REJECT_UNAUTHORIZED`** — in production, whether to verify the server certificate (default **`true`** when SSL is on).
   - **`PG_POOL_MAX`** — optional pool size cap (default **10**).
   - **`TOKEN_SECRET`** — strong secret for signing JWTs (demo auth)
   - **`CORS_ORIGIN`** — dev client origin (e.g. `http://localhost:5173`)
   - Rate limit tunables if needed (`RATE_LIMIT_*`)

3. Optional client **`client/.env.local`**:
   - **`VITE_API_BASE_URL`** — when the API is not same-origin

Anything under **`VITE_*`** is exposed in the browser bundle—**no secrets**.

## OIDC (future)

When Auth0 or another provider is added, document:

- Callback URLs, client id/secret handling (server-only)
- Session vs bearer-token strategy
- Required env vars in **`server/.env.example`** and **`docs/deployment/README.md`**

## Safety

- Never put backend secrets in client env.
- Follow **`.cursor/rules/auth-secrets-safety.mdc`** and **`docs/styleguide/backend-observability-security.md`**.
