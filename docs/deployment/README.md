# Deployment guide (main)

**workout-tracker** matches **bible-support** hosting: split architecture on lightweight free tiers.

- **Frontend:** Vercel (static Vite build from `client`)
- **API:** Render Web Service (Express + `pnpm run start`)
- **Database:** Neon Postgres

The API still runs **`pnpm run build`** so `client/dist` is available on Render; users normally open the **Vercel** URL. **`VITE_API_BASE_URL`** points the browser at Render for `/api/*` and OIDC login.

## Account setup

- **[Neon](./neon-account-setup.md)**
- **[Render](./render-account-setup.md)**
- **[Vercel](./vercel-account-setup.md)**
- **[Auth0 / OIDC](./auth0-setup.md)**

Split-host detail and troubleshooting: **[`vercel-render.md`](./vercel-render.md)** · Monolith-only alternative: **[`render-neon.md`](./render-neon.md)**

## Recommended deployment flow

1. Create a **Neon** database and copy the connection string (`sslmode=require`).
2. Create the **Render** service (**Blueprint** from **[`render.yaml`](../../render.yaml)** at repo root) and set environment variables (below).
3. Deploy the **frontend** on **Vercel** with root directory **`client`** and **`VITE_API_BASE_URL=https://<your-render-api>.onrender.com`**.
4. Set Render **`CORS_ORIGIN`** to your Vercel origin (comma-separated if you use previews + production).
5. Run **`DEPLOY_URL=https://<render-api> pnpm run smoke:deploy`**.
6. Enable **OIDC** on Render when ready (see copy/paste block below).

## Your values (fill once)

```txt
NEON_DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
RENDER_API_URL=https://<your-render-api>.onrender.com
VERCEL_FRONTEND_URL=https://<your-frontend>.vercel.app
TOKEN_SECRET=<long-random-secret>
```

## Render service settings (copy/paste)

```txt
Build Command:
corepack enable && pnpm install --frozen-lockfile && pnpm run build

Pre-Deploy Command:
corepack enable && pnpm run db:migrate && pnpm run db:seed

Start Command:
corepack enable && pnpm run start

Health Check Path:
/api/health

Node Version:
22
```

## Render environment variables — split layout (copy/paste)

```txt
NODE_ENV=production
TOKEN_SECRET=<long-random-secret>
DATABASE_URL=<neon-connection-string>
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
CORS_ORIGIN=https://<your-frontend>.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
RATE_LIMIT_WRITE_MAX=60
```

**Multiple frontends (preview + prod):**

```txt
CORS_ORIGIN=https://<prod>.vercel.app,https://<preview>.vercel.app
```

### OIDC on Render (split — same pattern as bible-support cookies)

Set on the **API** service. Callback URL is always the **Render** host, not Vercel.

```txt
AUTH_OIDC_ENABLED=true
AUTH_OIDC_ISSUER=https://<tenant>.auth0.com/
AUTH_OIDC_CLIENT_ID=<client-id>
AUTH_OIDC_CLIENT_SECRET=<client-secret>
AUTH_OIDC_REDIRECT_URI=https://<your-render-api>.onrender.com/api/auth/oidc/callback
AUTH_FRONTEND_ORIGIN=https://<your-frontend>.vercel.app
AUTH_POST_LOGIN_PATH=/
SESSION_SECRET=<min-16-chars>
SESSION_TTL_SECONDS=604800
SESSION_COOKIE_SAME_SITE=none
AUTH_DEMO_ENABLED=false
```

**`SESSION_COOKIE_SAME_SITE=none`** is required so **`wt_session`** is sent on cross-site `fetch` from the Vercel origin to the Render API (**`credentials: 'include'`**). Production uses **HTTPS** and **`Secure`** cookies automatically.

Auth0 **Allowed Web Origins** must include your **Vercel** origin. **Allowed Callback URLs** must include the **`AUTH_OIDC_REDIRECT_URI`** value exactly.

## Vercel project settings (copy/paste)

```txt
Root Directory: client
Framework Preset: Vite
Build Command: pnpm run build
Output Directory: dist

Environment Variable:
VITE_API_BASE_URL=https://<your-render-api>.onrender.com
```

**`client/vercel.json`** provides SPA rewrites for client-side routes.

## Verify

### 1) API smoke (Render origin)

From your machine (repo root), use the **Render API** URL (same host the SPA calls for `/api/*`):

```sh
DEPLOY_URL=https://<your-render-api>.onrender.com pnpm run smoke:deploy
```

Expect: `GET /`, `GET /api/health`, `GET /api/hello`, `GET /api/auth/options`, `GET /api/me` → **401** without cookies.

### 2) Browser pass (Vercel SPA)

Open your **Vercel** frontend URL (not the Render URL for day-to-day use). DevTools → **Network**: confirm `/api/*` requests go to **Render** and return **200** (not CORS errors).

| Step | What to do                                                                                                                                                                                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A    | Load the app; you should reach **Sign in** (or home) without a blank page.                                                                                                                          |
| B    | **Continue as guest** — should land on **Workouts**; **Start workout** → **Open** should load the workout detail page.                                                                              |
| C    | On workout detail, **Save set** (defaults OK) — set should appear under **Sets**.                                                                                                                   |
| D    | (Optional) **Dashboard** — weekly volume loads or shows empty state.                                                                                                                                |
| E    | If **demo** auth is enabled: create a **display name** account and repeat B–C.                                                                                                                      |
| F    | If **OIDC** is enabled: **Sign in with OpenID Connect**, complete IdP login, confirm you return to the SPA **signed in** and **`GET /api/me`** succeeds (see **`docs/deployment/auth0-setup.md`**). |

Full narrative: **`docs/demo-script.md`**. Course QA checklist: **`docs/course-qa-evidence.md`**.

### 3) If something fails

See **`docs/troubleshooting.md`** (CORS, `401`, Auth0 callback, rate limits).

## Bootstrap (any host)

- Use **`db:migrate`** + **`db:seed`** on hosted DBs — not destructive **`db:import`**.
- **PWA:** HTTPS in production for the service worker.

## Demo JWT vs OIDC

- **`AUTH_DEMO_ENABLED`:** often **`false`** in production when OIDC is primary.
- Split layout: **`AUTH_FRONTEND_ORIGIN`** must match the Vercel origin so users return to the SPA after IdP callback.

## Parity

Keep **`server/.env.example`**, **`docs/configuration.md`**, and this file aligned when env vars change.

## Further reading

- **`docs/deployment/vercel-render.md`** — split-host checklist
- **`docs/deployment/render-neon.md`** — Render-only monolith (optional)
- **`docs/security-notes.md`**, **`docs/data-flow.md`**, **`docs/decisions/0001-oidc-oauth-path-a.md`**
