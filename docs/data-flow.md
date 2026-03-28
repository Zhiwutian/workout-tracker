# Data flow

How data moves through **workout-tracker** for the common paths: OIDC, demo auth, workouts, sets, and stats. For layering rules see **`architecture.md`**; for **authorization** see **`docs/styleguide/security-and-authz.md`**.

## 0. OIDC sign-in (when `AUTH_OIDC_ENABLED=true`)

```mermaid
sequenceDiagram
  participant UI as SignInPage
  participant API as Express /api/auth/*
  participant IdP as OpenID Provider
  participant OIDC as oidc-service
  participant DB as PostgreSQL

  UI->>API: GET /api/auth/options
  API-->>UI: { oidc: true, demoEnabled: ... }
  UI->>UI: User clicks "Sign in with…"
  UI->>API: GET /api/auth/oidc/login (navigate)
  API->>API: PKCE + state → signed cookie wt_oidc_login
  API-->>UI: 302 Location IdP /authorize
  UI->>IdP: User authenticates
  IdP-->>UI: 302 redirect to AUTH_OIDC_REDIRECT_URI?code&state
  UI->>API: GET /api/auth/oidc/callback?code&state
  API->>OIDC: exchange code, validate ID token (sub, iss, …)
  OIDC->>DB: upsert users.authSubject = sub, profile
  API->>API: Clear wt_oidc_login; set wt_session (JWT-signed cookie, userId)
  API-->>UI: 302 AUTH_FRONTEND_ORIGIN + AUTH_POST_LOGIN_PATH (split) or same origin
  UI->>API: GET /api/me (credentials include, cross-origin if Vercel+Render)
  API->>API: readAppSessionCookie → req.user.userId
  API-->>UI: profile + me envelope
```

- **Logout:** **`POST /api/auth/logout`** clears **`wt_session`** (and related cookies).
- **Failures:** Callback errors redirect to **`/sign-in?auth_error=…`** on the **browser app** origin (**`AUTH_FRONTEND_ORIGIN`** when set, else redirect-URI origin).
- **Split deploy:** **`AUTH_OIDC_REDIRECT_URI`** uses the **API** host; **`AUTH_FRONTEND_ORIGIN`** is the Vercel SPA origin. **`SESSION_COOKIE_SAME_SITE=none`** so **`wt_session`** is sent on API `fetch` from the SPA.

## 1. Demo sign-up / sign-in

```mermaid
sequenceDiagram
  participant UI as SignInPage
  participant API as POST /api/auth/sign-up|sign-in
  participant Auth as auth-controller → auth-service
  participant DB as PostgreSQL

  UI->>API: JSON { displayName }
  API->>Auth: validate (Zod), signUpDemo / signInByDisplayName
  Auth->>DB: insert users + profiles / join profiles + users
  DB-->>Auth: user row
  Auth-->>API: JWT (userId in payload)
  API-->>UI: { token, userId, displayName, ... }
  UI->>UI: auth-storage saves token; AuthContext updates me
```

- **Token:** signed with **`TOKEN_SECRET`**, payload `{ userId }` (see `server/lib/authorization-middleware.ts`).
- **Conflicts:** duplicate **demo** display name (another `demo:*` account) → **409**; OIDC profiles may reuse the same display name.

### 1b. Continue as guest

```mermaid
sequenceDiagram
  participant UI as SignInPage
  participant API as POST /api/auth/guest
  participant Auth as auth-service createGuestUser
  participant DB as PostgreSQL

  UI->>API: POST (no body)
  API->>Auth: createGuestUser()
  Auth->>DB: insert users (authSubject guest:uuid) + profiles (displayName Guest uuid)
  DB-->>Auth: user row
  Auth-->>API: JWT + userId + displayName
  API-->>UI: 201 { token, ... }
  UI->>UI: same storage as demo; GET /api/me returns isGuest: true
```

## 2. Authenticated API calls

```mermaid
sequenceDiagram
  participant UI as Page / workout-api
  participant API as Express /api/*
  participant MW as authMiddleware
  participant C as controller
  participant S as service
  participant DB as PostgreSQL

  UI->>API: Bearer JWT and/or Cookie: wt_session + JSON body
  API->>MW: If Bearer valid → userId; else read session cookie → userId
  MW->>C: next()
  C->>S: pass userId + parsed params/body
  S->>DB: queries filtered by ownership (workouts.userId, etc.)
  DB-->>S: rows
  S-->>C: domain result
  C-->>UI: envelope { data, meta }
```

- **Order:** **`Authorization: Bearer`** is checked first (demo JWT / guest), then **`wt_session`** (OIDC).
- **Rule:** `userId` for authorization is **only** from `req.user`, never from the client body for tenancy (see styleguide).
- **Client:** `fetch` uses **`credentials: 'include'`** so httpOnly session cookies are sent on same-origin API calls.

## 3. Workout and sets

- **List/create workouts:** `GET/POST /api/workouts` → `workout-service` scopes by `userId`. Create/patch may set **`workoutType`** (`resistance` \| `cardio` \| `flexibility`).
- **Detail / patch / delete workout:** `workoutId` in path; service loads workout and asserts `workout.userId === req.user.userId` (or equivalent).
- **Add set:** `POST /api/workouts/:workoutId/sets` → verifies workout ownership, then `exerciseTypeId` usable (global or same user’s custom) and **`exercise.category === workout.workoutType`**, else **400**. Body may include **`notes`**, **`isWarmup`**, **`restSeconds`** (optional seconds after the set).
- **Patch/delete set:** `setId` → resolve set → workout → user. **`PATCH /api/sets/:setId`** can update reps, weight, notes, **`isWarmup`**, **`restSeconds`**, **`setIndex`**.

## 4. Weekly volume stats

- **`GET /api/stats/weekly-volume?weekStart=YYYY-MM-DD`** — optional **`timezone=IANA`**
- **Window:** If **`timezone`** is omitted or UTC, **`weekStart`** is UTC midnight and the window is **`[weekStart, weekStart + 7d)`** in UTC. If **`timezone`** is a non-UTC IANA zone, **`weekStart`** is local start-of-day in that zone and the window is seven local days, evaluated on **`workouts.startedAt`** (see **`docs/assumptions.md`**).
- **Metric:** sum over **non-warm-up** sets (`isWarmup = false`) on those workouts: **reps × weight** (`server/lib/volume.ts`).

## 5. Exercises

- **`GET /api/exercises`:** global rows (`userId` null) plus current user’s **non-archived** custom rows. Optional query **`workoutType`** filters to exercises whose **`category`** matches (picker alignment with active workout).
- **`GET /api/exercises/recents`:** optional **`limit`** and optional **`workoutType`** — only exercises whose **`category`** matches **`workoutType`**, ranked by the user’s latest **`workout_sets`** (see **`listRecentExercisesForUser`**).
- **`GET /api/exercises/archived`:** current user’s archived custom exercises only.
- **`POST /api/exercises`:** creates a user-scoped row; duplicate **active** (non-archived) name per user is rejected. Body may set **`category`** (`resistance` \| `cardio` \| `flexibility`).
- **`PATCH /api/exercises/:exerciseTypeId`:** rename / muscle group / **`category`** / archive / unarchive for **owned** custom exercises only; globals return **403**.

## 6. Client persistence

| Data                   | Where                               | Notes                                                                 |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| Access token           | `localStorage` (via `auth-storage`) | Demo / guest JWT; cleared on sign-out                                 |
| OIDC session           | httpOnly **`wt_session`** cookie    | Not readable from JS; sent with `credentials: 'include'`              |
| Current user summary   | `AuthContext`                       | From **`GET /api/me`** (works with Bearer only, cookie only, or both) |
| Workout lists / detail | Component state + refetch           | No global server-state library yet                                    |

## 7. PWA (light)

- **`/manifest.webmanifest`** — install metadata with **PNG** icons **`/icon-192.png`** and **`/icon-512.png`** (see **`pnpm run pwa:icons`**).
- **Production-only** service worker (`/sw.js`) — activation only; **no offline API cache** (avoids stale workout data). See `client/src/main.tsx` registration.
- **HTTPS** required for SW outside localhost.

## Related files

| Concern             | Location                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| Routes + middleware | `server/routes/api.ts`                                                                                       |
| JWT + session auth  | `server/lib/authorization-middleware.ts`, `server/lib/session-cookies.ts`, `server/services/auth-service.ts` |
| OIDC                | `server/services/oidc-service.ts`, `server/controllers/oidc-auth-controller.ts`                              |
| Client API          | `client/src/lib/workout-api.ts`                                                                              |
| Auth UI             | `client/src/features/auth/*`, `client/src/pages/SignInPage.tsx`                                              |
