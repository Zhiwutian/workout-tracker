# Security and authorization (data ownership)

This app is **multi-user**: workouts, sets, and profile rows are scoped by `userId`. Even with **demo JWT** today, every new endpoint must assume a **hostile client** until **OIDC** replaces token issuance.

## Server: non-negotiables

1. **Identity comes only from verified auth**  
   Use `req.user.userId` set by `authMiddleware` (`server/lib/authorization-middleware.ts`) after JWT verification. **Never** accept `userId` (or “acting user”) from the request body, query, or headers as the source of truth.

2. **Every mutation and sensitive read must enforce ownership**
   - Load the parent row (e.g. workout) and assert `row.userId === req.user.userId`, or
   - Use queries that **always** include `where(eq(table.userId, req.user.userId))` (or an equivalent join constraint).  
     Do not return **404** vs **403** inconsistently without a product decision; prefer **404** for cross-tenant IDs to avoid leaking existence.

3. **Do not trust the client for tenancy**  
   Path params such as `workoutId` identify a resource; **authorization** is always “does this ID belong to this `userId`?”.

4. **Secrets and tokens**  
   Follow `.cursor/rules/auth-secrets-safety.mdc` and `backend-observability-security.md`: no logging of `Authorization`, JWTs, or raw auth bodies.

5. **OIDC later**  
   `users.authSubject` is reserved for IdP `sub`. Replacing demo sign-up does not change the rule: **resolved `userId` from session/token** drives all DB access.

## Client: practical rules

- Treat the API as the authority; store the access token with the existing client helper (`client/src/lib/auth-storage.ts` pattern).
- Do not send `userId` to the server except where the API explicitly requires it for a documented reason (prefer server-derived identity).

## Tests

- For new user-owned resources, add route tests that prove a **second user cannot** read or mutate another user’s rows (401 without token, and **wrong-owner** with a valid token).

## Related docs

- `backend-patterns.md` — layering and error handling
- `database-constraints.md` — uniqueness and integrity tied to auth
- `docs/assumptions.md` — demo auth and future OIDC note
