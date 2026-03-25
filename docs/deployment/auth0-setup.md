# Auth0 setup (workout-tracker, Path A)

Step-by-step for **Auth0** with **server-side authorization code exchange** + **PKCE** and **`/api/auth/oidc/callback`**. The **recommended** deploy is **Vercel (SPA) + Render (API)** — same split as **bible-support**.

**Env names:** **`docs/configuration.md`**. **Cookies / CORS:** **`docs/security-notes.md`**, **`vercel-render.md`**.

## 1. Tenant and application

1. [Auth0 Dashboard](https://manage.auth0.com/).
2. **Applications → Create Application** → name (e.g. `workout-tracker`).
3. Type: **Regular Web Application** (code exchange on the server + optional Client Secret).

## 2. Application URLs by topology

### Production — Vercel + Render (default)

| Auth0 field               | Example                                                  |
| ------------------------- | -------------------------------------------------------- |
| **Allowed Callback URLs** | `https://<your-api>.onrender.com/api/auth/oidc/callback` |
| **Allowed Logout URLs**   | `https://<your-app>.vercel.app/`                         |
| **Allowed Web Origins**   | `https://<your-app>.vercel.app`                          |

**Render (API)** env:

- **`AUTH_OIDC_REDIRECT_URI`** = same as callback URL above (API host).
- **`AUTH_FRONTEND_ORIGIN`** = `https://<your-app>.vercel.app` (so users return to the SPA after login).
- **`CORS_ORIGIN`** = `https://<your-app>.vercel.app` (comma-separate preview URLs if needed).
- **`SESSION_COOKIE_SAME_SITE=none`** for cross-site session cookies.

**Vercel:** **`VITE_API_BASE_URL=https://<your-api>.onrender.com`**

### Local — Vite + API proxy

SPA at `http://localhost:5173`, `/api` proxied to Express.

| Setting                   | Example                                        |
| ------------------------- | ---------------------------------------------- |
| **Allowed Callback URLs** | `http://localhost:5173/api/auth/oidc/callback` |
| **Allowed Logout URLs**   | `http://localhost:5173/`                       |
| **Allowed Web Origins**   | `http://localhost:5173`                        |

**`server/.env`:** **`AUTH_OIDC_REDIRECT_URI`**, **`CORS_ORIGIN`**. Omit **`AUTH_FRONTEND_ORIGIN`**. **`SESSION_COOKIE_SAME_SITE=lax`** is fine.

### Production — Render monolith only (optional)

App opened at `https://<name>.onrender.com` only:

| Setting                   | Example                                              |
| ------------------------- | ---------------------------------------------------- |
| **Allowed Callback URLs** | `https://<name>.onrender.com/api/auth/oidc/callback` |
| **Allowed Logout URLs**   | `https://<name>.onrender.com/`                       |
| **Allowed Web Origins**   | `https://<name>.onrender.com`                        |

Omit **`AUTH_FRONTEND_ORIGIN`**. **`CORS_ORIGIN`** = same Render origin. See **`render-neon.md`**.

## 3. Credentials → environment

1. **Domain** → **`AUTH_OIDC_ISSUER`** with trailing slash (e.g. `https://YOUR_TENANT.auth0.com/`).
2. **Client ID** → **`AUTH_OIDC_CLIENT_ID`**
3. **Client Secret** → **`AUTH_OIDC_CLIENT_SECRET`** (server only)

```bash
AUTH_OIDC_ENABLED=true
AUTH_OIDC_ISSUER=https://YOUR_TENANT.auth0.com/
AUTH_OIDC_CLIENT_ID=...
AUTH_OIDC_CLIENT_SECRET=...
AUTH_OIDC_REDIRECT_URI=<callback-on-api-host>
# Split only:
# AUTH_FRONTEND_ORIGIN=https://your-app.vercel.app
# SESSION_COOKIE_SAME_SITE=none
SESSION_SECRET=...   # min 16 chars, or TOKEN_SECRET >= 16
```

## 4. Save and test

1. **Save Changes** in Auth0.
2. Restart the API (Render redeploy or local server).
3. From the **Vercel** (or local) URL → **Sign in with…** → after IdP, you should land on **`AUTH_POST_LOGIN_PATH`** on the **frontend** origin and **`GET /api/me`** should succeed.

## 5. Common failures

| Symptom                       | Check                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| **redirect_uri mismatch**     | Callback URL in Auth0 = **`AUTH_OIDC_REDIRECT_URI`** exactly (API host for split).            |
| Stuck on API host after login | Set **`AUTH_FRONTEND_ORIGIN`** to the Vercel origin.                                          |
| CORS errors                   | **`CORS_ORIGIN`** includes the Vercel origin.                                                 |
| Session not sticking (split)  | **`SESSION_COOKIE_SAME_SITE=none`**, HTTPS, **`credentials: 'include'`** (already in client). |

## Related

- **`docs/deployment/README.md`** — full env checklist
- **`docs/decisions/0001-oidc-oauth-path-a.md`** — ADR
