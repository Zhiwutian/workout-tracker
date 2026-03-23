# ADR 0001: OIDC / OAuth (Path A) for course-aligned login

**Status:** Implemented (application code; IdP tenant setup and optional CI OIDC E2E remain operator-owned)  
**Date:** 2026-03-22  
**Context:** CSCI 441 Report 2, Part 3 — UC-1 OAuth, §5.5 security, §3.1 auth/session tests.  
**Build plan:** [`docs/proposals/workout-tracker-build-plan.md`](../proposals/workout-tracker-build-plan.md) §11.

## Context

The app today uses **demo JWT** auth: `POST /api/auth/sign-up` and `POST /api/auth/sign-in` return a bearer token; the client stores it (e.g. `localStorage`) and sends `Authorization: Bearer`. `authMiddleware` verifies JWT and sets `req.user.userId`. `users.authSubject` exists and is populated as `demo:<uuid>` for new demo users.

The course report requires **OAuth/OIDC** and testability of **session** behavior. We need a production-idiomatic flow without trusting client-supplied identity for authorization.

## Decision

1. Adopt **OpenID Connect** with an external IdP (default assumption: **Auth0**; any OIDC-compliant host is fine).
2. Use **Authorization Code with PKCE** for the browser. Prefer a **server-mediated callback** (BFF-style) that establishes a **server-side session** and sets an **httpOnly, Secure (prod), SameSite** session cookie, instead of long-lived access tokens in `localStorage`.
3. Map IdP **`sub`** → `users.authSubject` (unique). Keep internal **`userId`** as the FK for all user-owned rows; **never** accept `userId` from the client for auth.
4. **Cutover:** When OIDC is the default login path, **remove or strictly gate** demo JWT sign-up/sign-in (e.g. env `AUTH_DEMO_ENABLED=false` in production). Document migration for existing `demo:*` rows (dev reset or one-off script).
5. **Guest sessions:** **`POST /api/auth/guest`** (JWT + `guest:<uuid>` subjects) remains a valid “no login form” path for try-before-signup. When OIDC ships, either keep guest as a parallel anonymous server user + JWT/session or replace with a product decision—document in **`docs/assumptions.md`**.

## Consequences

- **Positive:** Aligns deliverable with Report 2; reduces XSS exfiltration of bearer tokens if session cookie is httpOnly; familiar OAuth semantics for graders.
- **Negative:** More moving parts (callback URL, CORS, cookies, CSRF); CI E2E may need secrets or a documented manual staging checklist; split client/server origins need explicit cookie and CORS rules.
- **Risks:** Misconfigured `SameSite` / callback URL / trusted proxy behind HTTPS termination — mitigate with staging rehearsal and **`docs/security-notes.md`**.

## Amendments

- **Routes:** Implemented as **`GET /api/auth/oidc/login`**, **`GET /api/auth/oidc/callback`**, **`POST /api/auth/logout`**, and **`GET /api/auth/options`** (not the generic `/api/auth/login` names used in early checklist drafts).
- **Middleware:** Bearer JWT is verified first; then **`wt_session`** cookie session (**`readAppSessionCookie`**) for OIDC.

---

## Implementation checklist

### Repository (implemented)

- [x] **B.** OIDC/session variables in **`server/.env.example`**; **`docs/configuration.md`** and **`docs/deployment/README.md`** updated.
- [x] **C.** Dependencies: **`openid-client`**. **`GET /api/auth/oidc/login`** redirects with PKCE + state cookie; **`GET /api/auth/oidc/callback`** exchanges code, validates ID token, upserts user by **`sub`**; **`wt_session`** signed cookie; **`authMiddleware`** accepts Bearer then session; **`POST /api/auth/logout`** clears session.
- [x] **D.** Client: **`credentials: 'include'`**; sign-in page uses **`/api/auth/options`** and OIDC link; **`GET /api/me`** works with session only; **`auth_error`** query on failure.
- [x] **E.** **`AUTH_DEMO_ENABLED`** gates demo sign-up/sign-in (**403** when false); **`CHANGELOG`** / **`docs/assumptions.md`** cover **`demo:*`** / dev reset.
- [x] **F. (partial)** **`GET /api/auth/options`** tested; full callback flow with mocked IdP deferred (see **`docs/testing.md`**).
- [x] **G. (partial)** Manual OIDC staging documented in **`docs/testing.md`**; Playwright OIDC in CI optional when secrets exist.
- [x] **H.** **`docs/data-flow.md`**, **`docs/architecture.md`**, **`docs/security-notes.md`**, **`docs/testing.md`** updated.
- [x] **I.** ADR checkboxes synced with build plan §11.

### Operator / staging (outside this repo)

- [ ] **A.** IdP tenant and application: callback, logout, and web origins match deployment; issuer / client id / secret only in env.
- [ ] **G.** Optional: Playwright happy path against a real or test tenant in CI when secrets and callback URL are available.
