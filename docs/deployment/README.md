# Deployment

Hosted deployment notes for **workout-tracker** will live here (platform env mapping, database bootstrap, smoke checks).

## Current state

- **Demo JWT** auth: ensure **`TOKEN_SECRET`** and **`DATABASE_URL`** are set on the API host.
- Database: run **`pnpm run db:migrate`** then **`pnpm run db:seed`** (or your platform’s job equivalent) for new environments.
- **PWA:** serve the client over **HTTPS** so the service worker can register; icon is currently **`vite.svg`**—replace with **192×192** and **512×512** PNGs for broader install UI support if needed.

## OIDC (planned)

When OAuth is wired, add:

- Provider setup steps (e.g. Auth0 tenant, callbacks, allowed origins)
- Parity between **`docs/configuration.md`** and production env vars
- Smoke checks for login, session/callback, and **`GET /api/me`** (or the chosen profile endpoint)

Until then, see **`docs/assumptions.md`** for auth expectations.
