# Auth0 setup (workout-tracker, Path A)

Step-by-step for **Auth0** with this app’s **server-side authorization code exchange** + **PKCE** and **`/api/auth/oidc/callback`**. Auth0’s UI labels change occasionally; treat names below as approximate and match the intent.

**Env variable names:** see **`docs/configuration.md`**. **Security:** **`docs/security-notes.md`**.

## 1. Tenant and application

1. Sign in to the [Auth0 Dashboard](https://manage.auth0.com/).
2. **Applications → Create Application.**
3. Name it (e.g. `workout-tracker`).
4. Choose **Regular Web Applications** (not SPA-only SDK flow). The workout-tracker server exchanges the code with optional **Client Secret**.

## 2. Application settings (URLs)

Set these on the **Settings** tab. Values must match how the **browser** reaches your app (same origin as the address bar after redirects).

### Local development (Vite + API proxy)

Typical setup: SPA at `http://localhost:5173`, API proxied so `/api` hits Express.

| Setting                   | Example value                                                             |
| ------------------------- | ------------------------------------------------------------------------- |
| **Allowed Callback URLs** | `http://localhost:5173/api/auth/oidc/callback`                            |
| **Allowed Logout URLs**   | `http://localhost:5173/` (and `/sign-in` if you use it as a landing page) |
| **Allowed Web Origins**   | `http://localhost:5173`                                                   |

In **`server/.env`**, set:

- **`AUTH_OIDC_REDIRECT_URI=http://localhost:5173/api/auth/oidc/callback`**
- **`CORS_ORIGIN=http://localhost:5173`**

### Production (single origin: static + API on one host)

If users open `https://app.example.com` and `/api` is served by the same host:

| Setting                   | Example value                                    |
| ------------------------- | ------------------------------------------------ |
| **Allowed Callback URLs** | `https://app.example.com/api/auth/oidc/callback` |
| **Allowed Logout URLs**   | `https://app.example.com/`                       |
| **Allowed Web Origins**   | `https://app.example.com`                        |

Set **`AUTH_OIDC_REDIRECT_URI`** to that callback URL exactly. Set **`CORS_ORIGIN`** to the same origin (or a comma-separated list if you have multiple allowed front-end origins).

### Split client/API hosts

If the SPA origin differs from the API host, you must align **CORS**, **credentials**, cookie **`SameSite`**, and IdP **Allowed Web Origins** with your chosen topology. Prefer one browser origin that proxies `/api` unless you have a documented cross-site design; see **`docs/security-notes.md`**.

## 3. Credentials → environment

On the same **Settings** page:

1. **Domain** — use as issuer base with trailing slash in **`AUTH_OIDC_ISSUER`**, e.g. `https://YOUR_TENANT.auth0.com/` (or your custom domain, still as OIDC issuer URL).
2. **Client ID** → **`AUTH_OIDC_CLIENT_ID`**
3. **Client Secret** → **`AUTH_OIDC_CLIENT_SECRET`** (server-only; never in `VITE_*` or client bundle)

Enable OIDC and session-related vars (see **`server/.env.example`**):

```bash
AUTH_OIDC_ENABLED=true
AUTH_OIDC_ISSUER=https://YOUR_TENANT.auth0.com/
AUTH_OIDC_CLIENT_ID=...
AUTH_OIDC_CLIENT_SECRET=...
AUTH_OIDC_REDIRECT_URI=http://localhost:5173/api/auth/oidc/callback
SESSION_SECRET=...   # min 16 chars, or ensure TOKEN_SECRET is at least 16 chars
```

## 4. Save and test

1. **Save Changes** in Auth0.
2. Restart the API (`pnpm run dev`).
3. Open the app → sign-in → **Sign in with…** (OIDC). Complete login; you should land on **`AUTH_POST_LOGIN_PATH`** (default `/`) and **`GET /api/me`** should succeed.

## 5. Common failures

| Symptom                                  | Things to check                                                                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Callback error / “redirect_uri mismatch” | **Allowed Callback URLs** must **exactly** match **`AUTH_OIDC_REDIRECT_URI`** (scheme, host, port, path).                        |
| CORS errors in browser                   | **`CORS_ORIGIN`** must include the SPA origin; do not use `*` with credentials.                                                  |
| Cookie not sent / always logged out      | Same-site vs cross-origin; **`SESSION_COOKIE_SAME_SITE`**; HTTPS + **`Secure`** in production. See **`docs/security-notes.md`**. |
| 403 on demo sign-up                      | **`AUTH_DEMO_ENABLED=false`** — expected when demo is disabled; use OIDC or guest.                                               |

## Related

- **`docs/deployment/README.md`** — hosted bootstrap and smoke checklist
- **`docs/decisions/0001-oidc-oauth-path-a.md`** — ADR
