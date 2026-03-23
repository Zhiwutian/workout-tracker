# Assumptions

## Weekly dashboard (UTC)

`GET /api/stats/weekly-volume?weekStart=YYYY-MM-DD` treats `weekStart` as **UTC midnight** and aggregates volume for sets on workouts whose `startedAt` falls in **[weekStart, weekStart + 7 days)**.

The client dashboard defaults to the **UTC Monday** of the current week. User profile `timezone` is stored for future use but does not yet shift this window.

## Auth

The server supports **OIDC** (when **`AUTH_OIDC_ENABLED=true`**) and **demo JWT** flows.

- **OIDC:** Authorization code with **PKCE**, code exchange on the server, **`sub`** → **`users.authSubject`**, session via httpOnly **`wt_session`** cookie. The sign-in page loads **`GET /api/auth/options`** and links to **`GET /api/auth/oidc/login`**. See **`docs/configuration.md`** and **`docs/data-flow.md`**.

- **Demo JWT:** With **`AUTH_DEMO_ENABLED=true`** (default in local templates), **`POST /api/auth/sign-up`** and **`POST /api/auth/sign-in`** accept a unique **display name** and return a bearer JWT. Set **`AUTH_DEMO_ENABLED=false`** in production when OIDC is the only named-account path; **`docs/deployment/README.md`** describes cutover. Existing rows with **`authSubject`** prefix **`demo:`** are dev data—reset DB or migrate with a one-off script if needed (not automated in-repo).

Production-style **authorization rules** (ownership, no client-trusted `userId`) apply regardless—see **`docs/styleguide/security-and-authz.md`**.

**Guest:** `POST /api/auth/guest` creates a real `users` row with `authSubject` `guest:<uuid>`, a unique display name (`Guest <uuid>`), and returns a **JWT** like demo sign-up. The client can use the app without typing a name; data is tied to that guest user until the token is cleared. **Sign out and create a named account** (or OIDC account) to align identity across devices.

## Volume

Per set: **reps × weight** (multiplication). Totals sum this value across included sets.
