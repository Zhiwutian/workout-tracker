# Auth0 setup (workout-tracker, Path A)

Step-by-step for **Auth0** with **server-side authorization code exchange** + **PKCE** and **`/api/auth/oidc/callback`**. The **recommended** deploy is **Vercel (SPA) + Render (API)** — same split as **bible-support**.

**Env names:** **`docs/configuration.md`**. **Cookies / CORS:** **`docs/security-notes.md`**, **`vercel-render.md`**.

## 0. Ordered checklist — Vercel + Render already live

Use your real hosts (examples: API `https://workout-tracker-app-xxxx.onrender.com`, SPA `https://workout-tracker-client-xxxx.vercel.app`).

1. **Auth0 → Applications → Create** → **Regular Web Application**.
2. **Auth0 → Settings → URLs** (exact strings, no trailing slash on origins):
   - **Allowed Callback URLs:** `https://<render-api>.onrender.com/api/auth/oidc/callback`
   - **Allowed Logout URLs:** `https://<vercel-app>.vercel.app/`
   - **Allowed Web Origins:** `https://<vercel-app>.vercel.app`
3. **Render → Environment** — add or update (then **Save** + **deploy**):
   - `AUTH_OIDC_ENABLED=true`
   - `AUTH_OIDC_ISSUER=https://<tenant>.auth0.com/` (trailing slash; use Auth0 **Domain**)
   - `AUTH_OIDC_CLIENT_ID=...`
   - `AUTH_OIDC_CLIENT_SECRET=...`
   - `AUTH_OIDC_REDIRECT_URI=https://<render-api>.onrender.com/api/auth/oidc/callback` (must match Auth0 callback **exactly**)
   - `AUTH_FRONTEND_ORIGIN=https://<vercel-app>.vercel.app`
   - `AUTH_POST_LOGIN_PATH=/`
   - `SESSION_SECRET=<at least 16 random chars>` (or ensure existing `TOKEN_SECRET` is ≥ 16 chars)
   - `SESSION_COOKIE_SAME_SITE=none`
   - `CORS_ORIGIN=https://<vercel-app>.vercel.app` (same as before; add comma + preview URLs if needed)
   - Optional: `AUTH_DEMO_ENABLED=false` when OIDC is primary ( **`POST /api/auth/guest`** stays available unless you change code).
4. **Vercel** — confirm `VITE_API_BASE_URL=https://<render-api>.onrender.com` (no trailing slash); redeploy if you change it.
5. **Test:** open Vercel **/sign-in** → **Sign in with…** → Auth0 → you should land on Vercel home with session; **`GET /api/me`** should work.

**Issuer check:**

```sh
curl -sS "https://<tenant>.auth0.com/.well-known/openid-configuration" | head -c 200
```

Expect JSON, not 404.

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

**Browsers and `wt_session`:** Even with **`SameSite=None`**, many browsers **do not** attach the API host’s session cookie to **cross-origin** `fetch` calls with `credentials: 'include'` from the Vercel origin to Render. When **`AUTH_FRONTEND_ORIGIN`** is set, the API appends **`#oidc_token=<JWT>`** to the post-login redirect; the SPA reads the fragment **before** React mounts, stores it as the same **Bearer** used for demo/guest, and **`GET /api/me`** authenticates without relying on a cross-site cookie.

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

| Symptom                                 | Check                                                                                                                                                                                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **redirect_uri mismatch** / “not valid” | Callback in Auth0 = **`AUTH_OIDC_REDIRECT_URI`** exactly. **No newline** after the URL in Render or Auth0 (paste errors add `\n`; Auth0 shows it in the error message).                                                                 |
| Stuck on API host after login           | Set **`AUTH_FRONTEND_ORIGIN`** to the Vercel origin.                                                                                                                                                                                    |
| CORS errors                             | **`CORS_ORIGIN`** includes the Vercel origin.                                                                                                                                                                                           |
| Session not sticking (split)            | **`SESSION_COOKIE_SAME_SITE=none`**, HTTPS, **`credentials: 'include'`** (already in client). With **`AUTH_FRONTEND_ORIGIN`** set, the app also uses **`#oidc_token=`** so the SPA can auth when the browser blocks cross-site cookies. |

## Related

- **`docs/deployment/README.md`** — full env checklist
- **`docs/decisions/0001-oidc-oauth-path-a.md`** — ADR
