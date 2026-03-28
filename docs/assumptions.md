# Assumptions

## Weekly dashboard (timezone-aware)

`GET /api/stats/weekly-volume?weekStart=YYYY-MM-DD` supports an optional **`timezone`** query parameter (IANA name, e.g. `America/Los_Angeles`).

- **Without `timezone`**, or with **`UTC`** / **`Etc/UTC`**: `weekStart` is **UTC midnight** (legacy). Volume includes **non-warm-up** sets on workouts whose **`startedAt`** falls in **[weekStart UTC, weekStart UTC + 7 days)** (see **`isWarmup`** on **`workout_sets`**).
- **With another IANA zone**: `weekStart` is that **calendar date at 00:00 local** in that zone; the window is **7 days** in that zone, converted to UTC for the DB query. The JSON response may include **`timezone`** when a non-UTC zone was used.

The dashboard uses **profile `timezone`** when set (otherwise **UTC**), computes the **ISO Monday** of the current week in that zone, and passes **`weekStart`** + **`timezone`** to the API so the server window matches the user’s local week.

## Auth

The server supports **OIDC** (when **`AUTH_OIDC_ENABLED=true`**) and **demo JWT** flows.

- **OIDC:** Authorization code with **PKCE**, code exchange on the server, **`sub`** → **`users.authSubject`**, session via httpOnly **`wt_session`** cookie. The sign-in page loads **`GET /api/auth/options`** and links to **`GET /api/auth/oidc/login`**. See **`docs/configuration.md`** and **`docs/data-flow.md`**.

- **Demo JWT:** With **`AUTH_DEMO_ENABLED=true`** (default in local templates), **`POST /api/auth/sign-up`** and **`POST /api/auth/sign-in`** accept a unique **display name** and return a bearer JWT. Set **`AUTH_DEMO_ENABLED=false`** in production when OIDC is the only named-account path; **`docs/deployment/README.md`** describes cutover. Existing rows with **`authSubject`** prefix **`demo:`** are dev data—reset DB or migrate with a one-off script if needed (not automated in-repo).

Production-style **authorization rules** (ownership, no client-trusted `userId`) apply regardless—see **`docs/styleguide/security-and-authz.md`**.

**Guest:** `POST /api/auth/guest` creates a real `users` row with `authSubject` `guest:<uuid>`, a unique display name (`Guest <uuid>`), and returns a **JWT** like demo sign-up. The client can use the app without typing a name; data is tied to that guest user until the token is cleared. **Sign out and create a named account** (or OIDC account) to align identity across devices.

## Exercises (custom)

- **Global** exercises (`userId` null) are read-only from the API.
- **Custom** exercises can be renamed, archived, or restored. **Archived** rows have **`archivedAt`** set; they are omitted from **`GET /api/exercises`** and cannot be chosen for **new** sets until un-archived. Existing sets still reference the row (**`ON DELETE RESTRICT`**).
- **Recents** are derived from the user’s logged sets (see **`docs/data-flow.md`**).

## Workout type vs exercise category

Each **workout** has **`workoutType`**: **`resistance`**, **`cardio`**, or **`flexibility`** (default **`resistance`** for legacy rows). Each **exercise** has **`category`** with the same three values (default **`resistance`**). When logging a set, the exercise’s **`category`** must equal the workout’s **`workoutType`**; otherwise the API returns **400**. The client loads **`GET /api/exercises`** and **`GET /api/exercises/recents`** with an optional **`workoutType`** query so pickers only list matching exercises.

## Sets (logging)

- **`workout_sets`** supports **`notes`**, **`isWarmup`** (boolean, default false), and optional **`restSeconds`** (integer, seconds after the set — data only; no in-app timer).
- **Weekly volume** and the dashboard total **exclude** warm-up sets (`isWarmup = true`).

## Volume

Per set: **reps × weight** (multiplication). Totals sum this value across included sets (weekly stats exclude warm-ups — see above).
