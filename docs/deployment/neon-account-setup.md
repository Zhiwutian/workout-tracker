# Neon setup walkthrough (workout-tracker)

Provision **Neon Postgres**, then paste **`DATABASE_URL`** into **Render**. This pairs with **`docs/deployment/README.md`** (Vercel + Render + Neon).

---

## Part A — Neon (step by step)

### 1. Sign up

1. Open **[neon.tech](https://neon.tech/)** → **Sign up** (GitHub is fastest).

### 2. Create a project

1. Click **Create project** (or **New project**).
2. **Name:** e.g. `workout-tracker-prod`.
3. **Region:** choose one **close to your Render region** (lower latency). If Render is in Oregon, pick a US West Neon region when available.
4. **Postgres version:** **16** or **17** — both work.
5. Create the project.

### 3. Default database

Neon creates a default database (often **`neondb`**) and a default role. You usually **do not** need to create extra databases for this app.

### 4. Get the connection string (important)

1. In the Neon console, open your project.
2. Go to **Dashboard** → **Connection details** (or **Connect**).
3. Prefer the **pooled** connection string if Neon shows **“Pooled connection”** / **Transaction** mode — better for serverless-style connections from Render.
4. Copy the full URI. It should look like:

   ```txt
   postgresql://<user>:<password>@<host>.neon.tech/<database>?sslmode=require
   ```

5. **Must include SSL** for hosted Postgres. If your string does not have `sslmode=`, add **`?sslmode=require`** (or append **`&sslmode=require`** if there is already a `?`).

6. **Never commit this string** to git — only paste it into Render (or another host) as **`DATABASE_URL`**.

### 5. Optional checks

- **Branches:** Neon can use **branches** for preview DBs. For a first deploy, use the **main** branch’s connection string only.
- **Reset password:** If you rotate the DB password, update **`DATABASE_URL`** on Render and redeploy if needed.

---

## Part B — Render: `DATABASE_URL` and `CORS_ORIGIN`

Your **`render.yaml`** marks **`DATABASE_URL`** and **`CORS_ORIGIN`** as **`sync: false`**, so Render **requires** you to set them in the dashboard (secrets / environment-specific values).

### `DATABASE_URL`

| What        | Value                                                                      |
| ----------- | -------------------------------------------------------------------------- |
| **Purpose** | Lets the Node API connect to Postgres (migrations, seed, runtime queries). |
| **Set to**  | The **full Neon URI** you copied (with **`sslmode=require`**).             |

Also keep these on the Render service (often already set by the Blueprint):

- **`DB_SSL=true`**
- **`DB_SSL_REJECT_UNAUTHORIZED=true`**

### `CORS_ORIGIN`

Browsers only allow your **frontend** to call the API if the API’s CORS policy lists that frontend’s **exact origin** (scheme + host + port, no trailing slash).

| Your setup                                                                 | Typical `CORS_ORIGIN`                                                                         |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Vercel SPA + Render API** (recommended in our docs)                      | `https://your-app.vercel.app`                                                                 |
| **More than one** (e.g. prod + preview)                                    | Comma-separated, no spaces: `https://prod.vercel.app,https://my-app-git-main-team.vercel.app` |
| **Everything on Render only** (open the app at `https://xxx.onrender.com`) | `https://xxx.onrender.com`                                                                    |

**Common mistake:** setting `CORS_ORIGIN` to the Render API URL while users open the site on Vercel — the browser origin is **Vercel**, so CORS must list **Vercel**.

---

## Part C — After you save env on Render

1. **Save** environment variables in Render.
2. Trigger a **deploy** (or let auto-deploy run).
3. **Pre-deploy** runs **`db:migrate`** and **`db:seed`** — they need a valid **`DATABASE_URL`** or the deploy will fail at that step.
4. Smoke test the **API** (Render URL):

   ```sh
   DEPLOY_URL=https://your-service.onrender.com pnpm run smoke:deploy
   ```

---

## Next

- **[`README.md`](./README.md)** — full split stack (Vercel + Render + Neon)
- **[`render-account-setup.md`](./render-account-setup.md)** — Render service details
