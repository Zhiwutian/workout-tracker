# Render account setup (workout-tracker)

Create a **Render** web service for the **API** (and standard `client` build). In the **recommended split layout**, users browse the **Vercel** frontend; Render serves **`/api/*`** and receives OIDC callbacks.

## 1) Account

1. Go to [Render](https://render.com/).
2. Sign in with GitHub and authorize access to the **workout-tracker** repository.

## 2) Blueprint (recommended)

1. **New → Blueprint**.
2. Select the repo; Render reads **`render.yaml`** at the root.
3. Set in the dashboard:
   - **`DATABASE_URL`** (Neon)
   - **`CORS_ORIGIN`** — your **Vercel** app origin (e.g. `https://my-app.vercel.app`), not the Render URL, when using split hosting.

Pre-deploy runs **`db:migrate`** and **`db:seed`**.

## 3) Manual Web Service (alternative)

- **Root directory:** `.` (repo root)
- **Build:** `corepack enable && pnpm install --frozen-lockfile && pnpm run build`
- **Pre-deploy:** `corepack enable && pnpm run db:migrate && pnpm run db:seed`
- **Start:** `corepack enable && pnpm run start`
- **Health check path:** `/api/health`
- **Node:** 22

## 4) Environment (split layout baseline)

```txt
NODE_ENV=production
TOKEN_SECRET=<long-random-secret>
DATABASE_URL=<neon-connection-string>
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
CORS_ORIGIN=https://<your-vercel-app>.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
RATE_LIMIT_WRITE_MAX=60
```

For **Render-only monolith**, set **`CORS_ORIGIN`** to your Render URL instead. See **[`render-neon.md`](./render-neon.md)**.

## 5) Verify

```sh
DEPLOY_URL=https://your-service.onrender.com pnpm run smoke:deploy
```

Main checklist: **[`README.md`](./README.md)**.
