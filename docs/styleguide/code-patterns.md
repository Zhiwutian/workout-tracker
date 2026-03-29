# Code patterns

Architecture and conventions for **workout-tracker**.

## Cross-stack conventions

- Shared API contracts live in `shared/` (for example `shared/api-contracts.ts`). Add focused files as the surface grows.
- API responses use envelope semantics:
  - success: `{ data, meta }`
  - failure: `{ error, meta }`
- Keep behavior test-backed when API or schema changes.
- Import aliases:
  - client: `@/`
  - server: `@server/`
  - shared: `@shared/`
- When auth payloads or bootstrap change, update client handling (`client/src/features/auth/`, `client/src/App.tsx`) and server verification together.

## Layering rules

- Routes: registration and middleware only (`server/routes/api.ts`).
- Controllers: parse/validate input, map responses.
- Services: business rules and DB access.
- Schema/migrations: `server/db/schema.ts`, `database/migrations/*`, `database/schema.sql`.

## Extension checklist

**New HTTP endpoint**

1. Add or extend types in `shared/` if the shape crosses the wire.
2. Implement service logic in `server/services/`.
3. Add controller in `server/controllers/`.
4. Wire route in `server/routes/api.ts` with **`authMiddleware`** where the resource is user-scoped.
5. Add/adjust tests in `server/routes/*.test.ts` (include auth and validation failures).
6. Update MSW handlers in `client/src/test/handlers.ts` if client tests depend on the path.
7. Update docs + `CHANGELOG.md`.

**Database change**

1. Update `server/db/schema.ts`.
2. Add migration SQL + journal/snapshots as required.
3. Update `database/schema.sql`.
4. Update services, contracts, and tests.
5. Document operational impact if needed.

## Anti-patterns

- Business logic in route files.
- Bypassing `sendSuccess` / `sendError` envelope helpers.
- Ad-hoc response shapes that bypass shared contracts.
- Schema changes without migration + SQL mirror parity.
- **Using client-supplied `userId` for authorization.**
- Putting server secrets in `VITE_*` or any client bundle.

## Feature placement

- Screens: `client/src/pages/`
- Domain UI (components that belong to a feature): `client/src/features/<domain>/`
- **HTTP API wrappers:** `client/src/lib/api/*` (grouped by area), re-exported from **`client/src/lib/workout-api.ts`** for stable imports
- Reusable primitives: `client/src/components/ui/`
- App shell: `client/src/components/app/` (toasts, nav, error boundary)
- Global UI state: `client/src/state/` (optional; keep server data request-driven when possible)
- Utilities + hooks: `client/src/lib/` (e.g. `api-client.ts`, `use-abortable-async-effect.ts`, `week.ts`)
- Backend services: `server/services/`
