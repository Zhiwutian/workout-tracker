# Vercel account setup (workout-tracker)

Deploy the **SPA** from **`client`** while the **API** runs on **Render** — the default layout for this app (same as bible-support).

## 1) Account

1. Go to [Vercel](https://vercel.com/).
2. Sign in with GitHub.
3. **Add New Project** → import **workout-tracker**.

## 2) Project settings

- **Root Directory:** `client`
- **Framework Preset:** Vite
- **Build Command:** `pnpm run build`
- **Output Directory:** `dist`

## 3) Required environment variable

| Name                    | Value                                        |
| ----------------------- | -------------------------------------------- |
| **`VITE_API_BASE_URL`** | `https://<your-render-service>.onrender.com` |

No trailing slash. Redeploy after changing env vars.

## 4) Align Render

On the API service, set **`CORS_ORIGIN`** to this Vercel URL (and any preview URLs you use).

## 5) Verify

1. Open the Vercel deployment URL.
2. Confirm the app loads and API calls succeed.
3. Run **`pnpm run smoke:deploy`** against the **Render** URL.

Full flow: **[`README.md`](./README.md)** · OIDC split notes: **[`vercel-render.md`](./vercel-render.md)**.
