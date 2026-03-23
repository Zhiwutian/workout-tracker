# Deployment

Hosted deployment notes for **workout-tracker**: platform env mapping, database bootstrap, smoke checks, and OIDC.

## Bootstrap (any host)

- Set **`TOKEN_SECRET`** (and **`DATABASE_URL`**) on the API process.
- Database: run **`pnpm run db:migrate`** then **`pnpm run db:seed`** (or your platform’s job equivalent) for new environments.
- **PWA:** serve the client over **HTTPS** so the service worker can register. Icons live under **`client/public/`** (**`pnpm run pwa:icons`**).

## Demo JWT vs OIDC

- **Demo / guest:** With **`AUTH_DEMO_ENABLED=true`** (default in templates), users can sign up by display name or continue as guest; the client stores a JWT and sends **`Authorization: Bearer`**. For production, set **`AUTH_DEMO_ENABLED=false`** and enable OIDC (or accept only guest if product allows).
- **OIDC:** Set **`AUTH_OIDC_ENABLED=true`** and supply issuer, client id, and **`AUTH_OIDC_REDIRECT_URI`** exactly as registered with the IdP. See **`docs/configuration.md`**.

## OIDC / Auth0-style checklist

For Auth0-specific dashboard fields and URL examples, see **[`auth0-setup.md`](./auth0-setup.md)**.

1. **Application type:** **Regular Web Application** (or equivalent) so the **authorization code is exchanged on the server** with optional **client secret**. PKCE is used on the authorize request; the callback is server-side.
2. **Allowed Callback URLs:** Must include the value of **`AUTH_OIDC_REDIRECT_URI`** (e.g. `https://your-app.onrender.com/api/auth/oidc/callback` if the API and SPA share one origin, or the CDN origin if the browser hits `/api` via reverse proxy).
3. **Allowed Logout URLs** / **Allowed Web Origins:** Match your deployed SPA origin(s) and any post-logout landing URLs.
4. **Secrets:** Store **`AUTH_OIDC_CLIENT_SECRET`**, **`SESSION_SECRET`**, and **`TOKEN_SECRET`** only in the host’s secret store—never in git.
5. **TLS:** Production should use **HTTPS**; session cookies use **`Secure`** in production (**`NODE_ENV=production`**).
6. **Smoke:** After deploy, verify **`GET /api/auth/options`**, sign-in redirect, callback, **`GET /api/me`**, and **`POST /api/auth/logout`**. If CI cannot hold IdP secrets, use a manual checklist ( **`docs/testing.md`** ).

## Parity

Keep **`server/.env.example`**, **`docs/configuration.md`**, and this file aligned when adding or renaming env vars.

## Further reading

- **`docs/deployment/auth0-setup.md`** — Auth0 application type, callback URLs, and env mapping
- **`docs/assumptions.md`** — auth modes and guest behavior
- **`docs/data-flow.md`** — OIDC and session sequences
- **`docs/security-notes.md`** — cookies, CORS, CSRF surface
- **`docs/decisions/0001-oidc-oauth-path-a.md`** — ADR and implementation checklist
