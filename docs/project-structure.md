# Project Structure

## Root

- `package.json`
  - Orchestrates cross-project scripts (`dev`, `lint`, `tsc`, `build`).
- `pnpm-workspace.yaml`
  - Declares workspace packages (`client`, `server`).
- `pnpm-lock.yaml`
  - Locks all workspace dependency versions for reproducible installs.
- `.devcontainer/`
  - Defines reproducible development container setup.
- `.github/workflows/`
  - CI and deployment automation.
- `shared/`
  - Shared frontend/backend TypeScript contracts (for example, API envelope and error code types).
- `database/`
  - SQL schema, seed data, and import script.
- `docs/`
  - Project documentation and architecture notes.
- `.cursor/rules/`
  - Cursor agent rules (indexed in `docs/rules-registry.md`).
- `AGENTS.md`
  - Command summary for contributors and agents.

## Frontend (`client`)

- `src/`
  - React application source.
  - `App.tsx` provides app shell layout and route definitions.
  - `pages/` contains route-level screens (`WorkoutsPage`, `WorkoutDetailPage`, `DashboardPage`, `ProfilePage`, `SignInPage`, `AboutPage`).
  - `components/app/` contains app-level cross-cutting UI (error boundary, toasts, nav link button wrapper).
  - `components/ui/` contains reusable Tailwind-based UI primitives and a barrel export at `components/ui/index.ts`.
  - `features/auth/` contains `AuthProvider`, `ProtectedRoute`, and auth context.
  - `lib/api-client.ts` builds `fetch` options (cookies, Bearer, JSON envelope).
  - `lib/api/*` holds grouped API functions (`auth-api`, `exercise-api`, `workouts-api`, `stats-api`, `types.ts`).
  - `lib/workout-api.ts` re-exports those modules so the rest of the app can `import … from '@/lib/workout-api'`.
  - `lib/use-abortable-async-effect.ts` helps pages load data with abort + error toasts.
  - `state/` contains optional global UI state (`AppStateProvider`); keep workout data request-driven from pages/features.
  - `lib/index.ts` exposes shared frontend utilities through a barrel export.
  - Recommended growth pattern:
    - `components/` for reusable UI pieces
    - `pages/` for route-level screens
    - `features/` for domain-driven UI + state + API hooks
    - `lib/` for utilities and shared client services
- `vite.config.ts`
  - Vite config, Tailwind CSS plugin registration, `@` alias resolution, and API proxy for local development.
- `tsconfig.json`
  - TypeScript config for client code, including `@/*` path alias mapping to `src/*`.
- `src/index.css`
  - Tailwind CSS entrypoint (`@import 'tailwindcss'`) and shared global styles.
- `package.json`
  - Frontend runtime and build-time dependencies.

## Backend (`server`)

- `server.ts`
  - Process bootstrap and HTTP server startup.
- `app.ts`
  - Express app composition (middleware, route registration, static hosting, error handling).
- `routes/`
  - Express route modules grouped by API surface.
- `controllers/`
  - Route handlers that format request/response behavior.
- `services/`
  - Business logic independent of Express request/response types.
- `db/`
  - Database access setup, Drizzle schema, and query helpers.
- `scripts/`
  - Server-side utility scripts (for example, idempotent seed scripts).
- `drizzle.config.ts`
  - Drizzle Kit migration config for schema generation and migration output.
- `tsconfig.json`
  - Server TypeScript config, including `@server/*` alias mapping to simplify imports.
- `lib/`
  - Shared backend utilities and middleware (errors, auth, **`async-handler`**, **`domain-zod`**, **`request-user`**, response envelopes).
- `public/`
  - Server-hosted static files (uploads or other direct-served assets).
- Example paths:
  - `GET /api/health` → route → controller → service → Drizzle
  - `GET /api/workouts` → `authMiddleware` → `workout-controller` → `workout-service` → Drizzle (`userId` scoped)

## Data Layer (`database`)

- `schema.sql` - canonical schema definition
- `data.sql` - optional seed content
- `import.sh` - deterministic database rebuild/import script
- `migrations/` - Drizzle-generated migration SQL files

## Ownership Guidance

- UI changes: start in `client/src`.
- API changes: add route + service in `server`.
- DB changes: update `database/schema.sql` and corresponding server queries.
- Cross-cutting behavior changes: update docs in this folder in the same PR.
- Pattern or security convention changes: update **`docs/styleguide/`** (see **`docs/styleguide/security-and-authz.md`** for ownership rules).
