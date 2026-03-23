# ADR 0001: OIDC / OAuth (Path A) for course-aligned login

**Status:** Accepted (implementation in progress)  
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
- **Risks:** Misconfigured `SameSite` / callback URL / trusted proxy behind HTTPS termination — mitigate with staging rehearsal and `docs/security-notes.md`.

---

## Implementation checklist

Work in order where steps depend on prior steps; parallelize IdP console work with env/doc prep.

### A. Identity provider (Auth0-class)

- [ ] Create tenant (or use course org tenant with least privilege).
- [ ] Register application: type consistent with PKCE (often **Single Page Application** if using Auth0 SPA SDK only on client — **or** **Regular Web Application** if the **authorization code is exchanged only on the server**; prefer **server-side exchange** + session cookie per Decision §2).
- [ ] Configure **Allowed Callback URLs** (e.g. `https://<api-host>/api/auth/callback`, `http://localhost:8080/api/auth/callback` for dev).
- [ ] Configure **Allowed Logout URLs** and **Allowed Web Origins** / CORS as required by chosen topology.
- [ ] Note **Issuer base URL**, **Client ID**, and (if confidential) **Client Secret** for env templates only — never commit secrets.

### B. Configuration and secrets

- [ ] Add OIDC/session variables to **`server/.env.example`** (placeholders): issuer, client id, client secret if used, callback URL base, session secret, cookie name flags.
- [ ] Add any **public** client-only vars to **`client/.env.example`** only if the SPA must know domain/client id for redirect (no secrets).
- [ ] Update **`docs/configuration.md`** with variable descriptions and split-host notes.
- [ ] Update **`docs/deployment/README.md`** (and Auth0 appendix if present) with production callback/logout URLs and env mapping.

### C. Server: OAuth routes and session

- [ ] Add dependencies (e.g. **`openid-client`** or maintained OAuth2/OIDC helper) scoped to the Node version in use.
- [ ] Implement **`GET /api/auth/login`** (or `/oauth/authorize` alias): redirect to IdP authorize endpoint with PKCE verifier stored server-side (session or encrypted cookie).
- [ ] Implement **`GET /api/auth/callback`**: validate state, exchange code for tokens, validate ID token claims (`sub`, `iss`, `aud` as applicable).
- [ ] **Upsert user** by `authSubject` = `sub`; ensure profile row exists; use existing **`userId`** for all subsequent requests.
- [ ] Establish **session** (e.g. **`express-session`** with Redis or signed cookie store — for course scale, signed cookie server session may suffice); store minimal data (e.g. `userId` only).
- [ ] Implement **`POST /api/auth/logout`** or **`GET`** logout: destroy session and optionally IdP logout redirect.
- [ ] Extend **`authMiddleware`** (or add parallel middleware): accept **session** as primary; optionally keep **Bearer JWT** behind **`AUTH_DEMO_ENABLED`** for local dev during migration.

### D. Client

- [ ] Replace or branch **`AuthProvider`**: “Sign in” navigates to **`/api/auth/login`** (full redirect) or opens IdP in flow required by SDK; remove reliance on demo `signUp`/`signIn` when OIDC is default.
- [ ] Ensure API client sends **credentials** (`fetch(..., { credentials: 'include' })`) for cookie session where applicable.
- [ ] Update **`SignInPage`** / routing for post-login return and error query params from callback.
- [ ] Keep **`GET /api/me`** behavior; ensure it reads session-backed identity.

### E. Demo JWT cutover

- [ ] Gate **`POST /api/auth/sign-up`** / **`POST /api/auth/sign-in`** with env (e.g. `AUTH_DEMO_ENABLED`); default **false** in production examples.
- [ ] Document **`demo:*` user migration** in **`CHANGELOG.md`** (dev DB reset vs script).

### F. Tests

- [ ] Integration tests for **callback** handler with **mocked IdP** token exchange (or recorded fixtures), asserting user creation and session cookie.
- [ ] Tests for **401** when session missing; **IDOR** tests updated to authenticate via session or test-only helper.
- [ ] Document **`docs/testing.md`**: commands, env, and any **manual OIDC** staging steps if CI cannot hold IdP secrets.

### G. E2E (Playwright)

- [ ] If CI secrets available: one **happy path** login through real or test IdP tenant.
- [ ] Else: document **manual E2E checklist** and keep existing smoke tests for post-login API using a test bypass **only in test env** (avoid weakening production).

### H. Documentation and diagrams

- [ ] Update **`docs/data-flow.md`** sequences for OIDC login, callback, session, logout.
- [ ] Update **`docs/architecture.md`** auth bullet (Bearer → session + optional demo).
- [ ] Add or fill **`docs/security-notes.md`**: cookies, CSRF, CORS, callback URL allowlist.
- [ ] Mark **`docs/proposals/workout-tracker-build-plan.md`** §3 OIDC row **Done** when primary login is OIDC; check off §5 OAuth checkbox.

### I. Proposal / ADR hygiene

- [ ] Check off items in this ADR as PRs merge.
- [ ] When finished, set ADR **Status** to **Implemented** and add a short **Amendments** note with merge dates if behavior diverged.
