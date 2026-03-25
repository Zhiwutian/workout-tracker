# Neon account setup (workout-tracker)

Short guide for provisioning **Neon Postgres** used with **Render** (same stack as the bible-support template).

## 1) Create account

1. Go to [Neon](https://neon.tech/).
2. Sign up with GitHub (recommended) or email.
3. Start on the free plan for development.

## 2) Create project and database

1. Click **Create project**.
2. Pick a region close to your Render region.
3. Postgres **16** or **17** is fine.

## 3) Connection string

1. In the Neon dashboard, copy the **pooled** connection string when offered.
2. Ensure it includes SSL, e.g. **`sslmode=require`**.

```txt
postgresql://<user>:<password>@<host>/<database>?sslmode=require
```

## 4) Use on Render

Set on the API service:

- **`DATABASE_URL`** — paste the Neon URL
- **`DB_SSL=true`**
- **`DB_SSL_REJECT_UNAUTHORIZED=true`**

Do not commit **`DATABASE_URL`** to git.

## Next

- **[`README.md`](./README.md)** (deployment hub) — Vercel + Render + Neon
- **[`render-account-setup.md`](./render-account-setup.md)** — Render API service
