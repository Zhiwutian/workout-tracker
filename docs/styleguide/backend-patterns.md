# Backend patterns

Express + TypeScript: **routes** wire URLs to **controllers**; controllers validate and call **services**; services talk to Postgres via **Drizzle**. See **`docs/architecture.md`** for the full lifecycle.

## Route / controller / service split

- **Routes** (`server/routes/*`): register paths and middleware only. **`server/routes/api.ts`** is the main API table of contents.
- **Controllers** (`server/controllers/*`): parse params/body/query with **Zod**, call services, map responses.
- **Services** (`server/services/*`): business rules and DB queries (no `req`/`res`).

## Request validation (Zod)

- Prefer **`schema.parse()`** in async controllers; let failures propagate so **`asyncHandler`** forwards them to **`next(err)`** and the error middleware turns **`ZodError`** into the stable validation envelope.
- Avoid ad-hoc **`safeParse`** + manual errors unless you need a custom code; keep issue shapes consistent.

## Domain-aligned Zod (`server/lib/domain-zod.ts`)

- **Workout type** and common param schemas (e.g. `workoutId`, `setId`, `exerciseTypeId`) live in **`domain-zod.ts`**, derived from **`shared/workout-types.ts`**.
- **Why:** one source of truth with the DB and client; no duplicate `z.enum(['resistance', …])` strings in multiple controllers.
- **`shared/`** stays free of the `zod` dependency; Zod lives on the server (and could be used on the client separately for forms).

## Async handlers

- Wrap async route handlers with **`asyncHandler`** from **`server/lib/async-handler.ts`** so promise rejections reach **`next(err)`**. Handlers use **`(req, res, next) => Promise<void>`** so they match Express expectations and can call **`next`** if needed.
- **`GET /api/auth/oidc/callback`** stays **unwrapped**: it handles errors with **redirects** to the SPA (not the JSON error middleware).

## Authenticated `userId` (`server/lib/request-user.ts`)

- After **`authMiddleware`**, use **`requireUserId(req)`** to get **`userId: number`**. It throws if `req.user` is missing (a wiring bug if the route forgot the middleware).
- **Do not** trust a `userId` from the request body or query for authorization—always use the id from auth, then enforce **ownership** in the service layer (**`security-and-authz.md`**).

## Auth context (demo JWT + optional OIDC session)

- **`authMiddleware`** (`server/lib/authorization-middleware.ts`) sets **`req.user = { userId }`** from **`Authorization: Bearer`** (demo / guest JWT) if present, else from the signed **`wt_session`** cookie when OIDC is used.
- **Public auth routes:** demo sign-up/sign-in/guest (when enabled), **`GET /api/auth/options`**, **`GET /api/auth/oidc/login`**, **`GET /api/auth/oidc/callback`**, **`POST /api/auth/logout`**. Workout, profile, exercise, and stats routes use **`authMiddleware`**.
- **Authorization (ownership)** is still required in every service for user-owned rows—see **`security-and-authz.md`**.

Resolve a stable internal **`userId`** for every authenticated request; do not branch business logic on display name or client-supplied ids.

## Database constraints and index parity

Keep **Postgres**, **Drizzle** (`server/db/schema.ts`), **Zod** (controllers), and **`shared/`** types aligned. See **`database-constraints.md`**.

## Request/response contracts

- Use **`sendSuccess`** / **`sendError`** from `server/lib/http-response.ts`.
- Throw **`ClientError`** for expected HTTP errors (401, 404, 409, etc.).
- Let the **error middleware** (`server/lib/error-middleware.ts`) normalize unexpected errors.

## Rate limiting

Tunables: **`RATE_LIMIT_WINDOW_MS`**, **`RATE_LIMIT_MAX`**, **`RATE_LIMIT_WRITE_MAX`** in **`server/config/env.ts`**. Prefer client debouncing before raising write caps; document env changes in **`CHANGELOG.md`**. Details: **`backend-observability-security.md`**.

## Adding a new API endpoint (checklist)

1. Extend **`shared/`** if the wire shape is shared.
2. Add service functions with **ownership checks** (`security-and-authz.md`).
3. Add controller + Zod schemas (reuse **`domain-zod`** where it fits).
4. Wire **`server/routes/api.ts`** with **`authMiddleware`** when appropriate; wrap async handlers with **`asyncHandler`**.
5. Add **`server/routes/*.test.ts`** coverage (401, validation, and **cross-user** access where relevant).
6. Update MSW **`client/src/test/handlers.ts`** if needed.
7. Update **`CHANGELOG.md`** and styleguide rows in **`database-constraints.md`** when invariants change.

## Post-merge optimization (backend-heavy PRs)

Triggers: multiple controller/service files, schema/migrations, or auth changes.

- Grep for duplicate Zod fragments; confirm transactions where needed; run **`pnpm run lint`**, **`pnpm run test:server`**.
