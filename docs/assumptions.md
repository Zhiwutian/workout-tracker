# Assumptions

## Weekly dashboard (UTC)

`GET /api/stats/weekly-volume?weekStart=YYYY-MM-DD` treats `weekStart` as **UTC midnight** and aggregates volume for sets on workouts whose `startedAt` falls in **[weekStart, weekStart + 7 days)**.

The client dashboard defaults to the **UTC Monday** of the current week. User profile `timezone` is stored for future use but does not yet shift this window.

## Auth

Current builds use **demo JWT** sign-up / sign-in by unique **display name**. This is a teaching placeholder for **OIDC (e.g. Auth0)**. Production-style **authorization rules** (ownership, no client-trusted `userId`) apply regardless—see **`docs/styleguide/security-and-authz.md`**.

**Guest:** `POST /api/auth/guest` creates a real `users` row with `authSubject` `guest:<uuid>`, a unique display name (`Guest <uuid>`), and returns the same style of **JWT** as demo sign-up. The client can use the app without typing a name; data is tied to that guest user until the token is cleared. **Sign out and create a named account** to recover sessions on another device.

## Volume

Per set: **reps × weight** (multiplication). Totals sum this value across included sets.
