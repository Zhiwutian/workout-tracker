# Render + Neon (optional monolith)

This path serves **both** the SPA and **`/api/*`** from a **single Render Web Service** (same origin). It is **not** the default documented layout: **bible-support** and this repo’s main guide use **Vercel + Render + Neon** (see **[`README.md`](./README.md)** and **[`vercel-render.md`](./vercel-render.md)**).

Use the monolith when you want the smallest moving parts (no **`VITE_API_BASE_URL`**, default **`SESSION_COOKIE_SAME_SITE=lax`** for OIDC).

## Steps

1. **[`neon-account-setup.md`](./neon-account-setup.md)**
2. **[`render-account-setup.md`](./render-account-setup.md)** — set **`CORS_ORIGIN`** to your Render URL (e.g. `https://workout-tracker-app.onrender.com`).
3. Do **not** set **`AUTH_FRONTEND_ORIGIN`** (omit it so redirects use the callback URI origin).
4. **`AUTH_OIDC_REDIRECT_URI`:** `https://<render-host>/api/auth/oidc/callback`

```sh
DEPLOY_URL=https://your-service.onrender.com pnpm run smoke:deploy
```

## Free-tier notes

Render free tier may sleep; Neon free tier has quotas. See main **[`README.md`](./README.md)**.
