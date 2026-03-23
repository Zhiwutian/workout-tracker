# Security notes (student-project bar)

Cross-cutting auth, transport, and browser surface for **workout-tracker**. Detailed authorization rules live in **`docs/styleguide/security-and-authz.md`**.

## Identity and sessions

- **Server-derived `userId`:** Handlers must use **`req.user.userId`** from middleware only—never trust client-supplied user ids for tenancy.
- **OIDC:** **`sub`** maps to **`users.authSubject`**. Session payload in **`wt_session`** carries **`userId`**; cookie is **httpOnly** and **signed** (JWT using **`SESSION_SECRET`** or **`TOKEN_SECRET`** when long enough).
- **Demo / guest JWT:** Bearer tokens are stored in **`localStorage`** on the client—more exposed to XSS than httpOnly cookies. Prefer OIDC session cookies for production narrative; keep demo off in production (**`AUTH_DEMO_ENABLED=false`**).

## Cookies, CSRF, and CORS

- **Same-origin dev:** Vite proxies **`/api`** to the Express server; **`credentials: 'include'`** sends cookies to the same browser origin as the SPA.
- **`SameSite`:** Default **`lax`** (**`SESSION_COOKIE_SAME_SITE`**). Use **`none`** only with **`Secure`** and a deliberate cross-site requirement.
- **CSRF:** OIDC uses the **state** parameter and a short-lived signed cookie for login state; mutations use **`Content-Type: application/json`** (not form posts), which reduces classic CSRF risk for API JSON. If you add cookie-auth to form posts or third-party embeds, revisit CSRF tokens.
- **CORS:** **`CORS_ORIGIN`** must list exact allowed origins when credentials are used. Wildcard **`*`** is incompatible with credentialed responses.

## Callback URLs

- **`AUTH_OIDC_REDIRECT_URI`** must exactly match an **Allowed Callback URL** in the IdP. A typo fails the entire flow.
- Behind reverse proxies, ensure the app sees correct **HTTPS** and host headers so redirects and cookie **`Secure`** flags match deployment reality.

## Helmet, CSP, and PWA

- **Helmet** is applied on the API/static host. The service worker (**`/sw.js`**) is activation-only with **no API caching** to avoid stale workout data; see **`docs/data-flow.md`**. If you tighten **CSP**, verify Vite build scripts and SW registration still work.

## Logging

- Do not log **tokens**, **`Authorization`** headers, or raw OIDC callback query strings. Follow **`docs/styleguide/backend-observability-security.md`**.

## Secrets

- Never commit **`.env`** or real **client secrets**. Use **`server/.env.example`** and host secret stores in production.
