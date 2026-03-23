# Backend patterns

## Route / controller / service split

- **Routes** (`server/routes/*`): register paths and middleware only.
- **Controllers** (`server/controllers/*`): parse params/body/query with Zod, call services, map responses.
- **Services** (`server/services/*`): business rules and DB queries.

## Request validation (Zod)

- Prefer **`schema.parse()`** inside **`try/catch`** with **`next(err)`** so `ZodError` is normalized by error middleware into a stable validation envelope.
- Avoid ad-hoc `safeParse` + manual errors unless you need a custom code; keep issue shapes consistent.

## Async handlers

- Use **`asyncHandler`** from `server/lib/async-handler.ts` so rejections reach **`next(err)`**.

## Auth context (demo JWT + optional OIDC session)

- **`authMiddleware`** (`server/lib/authorization-middleware.ts`) sets **`req.user = { userId }`** from **`Authorization: Bearer`** (demo / guest JWT) if present, else from the signed **`wt_session`** cookie when OIDC is used.
- **Public auth routes:** demo sign-up/sign-in/guest (when enabled), **`GET /api/auth/options`**, **`GET /api/auth/oidc/login`**, **`GET /api/auth/oidc/callback`**, **`POST /api/auth/logout`**. Workout, profile, exercise, and stats routes use **`authMiddleware`**.
- **Authorization (ownership)** is still required in every service for user-owned rows—see **`security-and-authz.md`**.

Resolve a stable internal **`userId`** for every authenticated request; do not branch business logic on display name or client-supplied ids.

## Database constraints and index parity

- Keep **Postgres**, **Drizzle** (`server/db/schema.ts`), **Zod** (controllers), and **`shared/`** types aligned. See **`database-constraints.md`**.

## Request/response contracts

- Use **`sendSuccess`** / **`sendError`** from `server/lib/http-response.ts`.
- Throw **`ClientError`** for expected HTTP errors (401, 404, 409, etc.).
- Let the error middleware normalize unexpected errors.

## Rate limiting

- Tunables: **`RATE_LIMIT_WINDOW_MS`**, **`RATE_LIMIT_MAX`**, **`RATE_LIMIT_WRITE_MAX`** in **`server/config/env.ts`**.
- Prefer client debouncing before raising write caps; document env changes in **`CHANGELOG.md`**. Details: **`backend-observability-security.md`**.

## Adding a new API endpoint (checklist)

1. Extend **`shared/`** if the wire shape is shared.
2. Add service functions with **ownership checks** (`security-and-authz.md`).
3. Add controller + Zod schemas.
4. Wire **`server/routes/api.ts`** with **`authMiddleware`** when appropriate.
5. Add **`server/routes/*.test.ts`** coverage (401, validation, and **cross-user** access where relevant).
6. Update MSW **`client/src/test/handlers.ts`** if needed.
7. Update **`CHANGELOG.md`** and styleguide rows in **`database-constraints.md`** when invariants change.

## Post-merge optimization (backend-heavy PRs)

Triggers: multiple controller/service files, schema/migrations, or auth changes.

- Grep for duplicate Zod fragments; confirm transactions where needed; run **`pnpm run lint`**, **`pnpm run test:server`**.
