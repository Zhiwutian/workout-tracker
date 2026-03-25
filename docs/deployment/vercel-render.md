# Split hosting: Vercel + Render + Neon (recommended)

This is the **default production shape**, aligned with **bible-support**:

- **Vercel** — static **`client`** build; users open this URL.
- **Render** — Node API (**`pnpm run start`**); also runs **`pnpm run build`** so the service matches the repo’s standard pipeline.
- **Neon** — Postgres.

## 1) Neon

Create a project, copy the pooled **`DATABASE_URL`** with **`sslmode=require`**. See **[`neon-account-setup.md`](./neon-account-setup.md)**.

## 2) Render (API)

1. **New → Blueprint** → connect repo → Render reads **[`render.yaml`](../../render.yaml)**.
2. Set **`DATABASE_URL`** and **`CORS_ORIGIN`** to your **Vercel** origin (e.g. `https://my-app.vercel.app`). Add preview URLs if needed, comma-separated.
3. After deploy, note **`https://<name>.onrender.com`** — this is **`VITE_API_BASE_URL`** and the OIDC **callback host**.

Commands match bible-support:

```txt
Build: corepack enable && pnpm install --frozen-lockfile && pnpm run build
Pre-deploy: corepack enable && pnpm run db:migrate && pnpm run db:seed
Start: corepack enable && pnpm run start
Health: /api/health
```

## 3) Vercel (frontend)

| Setting        | Value                                                     |
| -------------- | --------------------------------------------------------- |
| Root directory | `client`                                                  |
| Framework      | Vite                                                      |
| Build          | `pnpm run build`                                          |
| Output         | `dist`                                                    |
| Env            | **`VITE_API_BASE_URL=https://<render-api>.onrender.com`** |

See **[`vercel-account-setup.md`](./vercel-account-setup.md)**.

## 4) OIDC / cookies (split)

- **`AUTH_OIDC_REDIRECT_URI`** = `https://<render-api>.onrender.com/api/auth/oidc/callback` (IdP callback hits the **API**).
- **`AUTH_FRONTEND_ORIGIN`** = `https://<your-app>.vercel.app` so after login the browser is redirected to the **SPA**, not the bare API host.
- **`SESSION_COOKIE_SAME_SITE=none`** on Render so **`wt_session`** is included on cross-origin API requests from the Vercel app.
- Auth0 **Allowed Web Origins** → Vercel URL(s). **Allowed Callback URLs** → Render callback URL exactly.

Full env block: **[`README.md`](./README.md)** (main deployment guide). Auth0 UI: **[`auth0-setup.md`](./auth0-setup.md)**.

## 5) Smoke test (API)

```sh
DEPLOY_URL=https://your-api.onrender.com pnpm run smoke:deploy
```

Then open the **Vercel** site and run through sign-in / OIDC.

## 6) Operational notes

- First API request after idle may **cold-start** on Render free tier.
- Do not put secrets in **`VITE_*`** — only the public API origin.
