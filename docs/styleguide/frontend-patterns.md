# Frontend patterns

This app is written so newer full-stack developers can follow **one request path**: page → API helpers → server → DB. When in doubt, start at **`docs/data-flow.md`** and **`docs/app-startup-walkthrough.md`**.

## Structure

- App shell + routes: `client/src/App.tsx` (lazy-loaded pages keep initial JS smaller).
- Pages: `client/src/pages/*` — route screens; own data loading and compose features.
- Features: `client/src/features/*` — domain UI (e.g. `features/auth/`, `features/workouts/SetRowCard.tsx`).
- UI primitives: `client/src/components/ui/*` — `Button`, `Input`, `Select`, `FieldLabel`, `Textarea`, etc.
- Shared utils: `client/src/lib/*` — API client, date helpers, hooks.

## State management

- Use local `useState` / `useReducer` for page- or feature-owned UI state.
- Use **Context** for auth (`client/src/features/auth/AuthContext.tsx`) and other cross-cutting providers.
- Keep **server-backed data** loaded in pages/features; avoid duplicating server truth in global stores unless necessary.

## Forms

- **Current code:** most forms use **controlled components** (`useState` + inputs) for clarity while learning.
- **react-hook-form** + **Zod** are available in `package.json`; the styleguides previously assumed RHF everywhere. Treat **RHF as optional**: adopt it when a form grows (many fields, validation reuse), not as a blanket rule.
- When you add RHF, keep Zod schemas next to the feature and align with API contracts in `shared/`.

## API pattern

**Layers (read bottom-up when tracing a call):**

1. **`client/src/lib/api-client.ts`** — `mergeApiRequestInit`, `fetchJson`, `fetchNoContent`, `apiFetch`.
   - Adds `credentials: 'include'` (session cookies for OIDC).
   - Adds `Authorization: Bearer <token>` when a JWT is in storage (demo / guest).
   - Unwraps the JSON envelope `{ data: T }` on success.
2. **`client/src/lib/api/*`** — Grouped call sites: `auth-api.ts`, `exercise-api.ts`, `workouts-api.ts`, `stats-api.ts`; shared types in `api/types.ts`.
3. **`client/src/lib/workout-api.ts`** — **Barrel** that re-exports everything above so imports stay `@/lib/workout-api` across pages and tests.

**Rules:**

- Do not call `fetch` directly for JSON API routes; go through **`api-client`** (or functions built on it) so headers stay consistent.
- Align TypeScript types with `shared/` contracts (`api-contracts`, `workout-types`, etc.).

## Async data loading in pages

- **`useAbortableAsyncEffect`** (`client/src/lib/use-abortable-async-effect.ts`) runs an async function when dependencies change, **aborts** the previous run on re-run/unmount, and shows a **toast** on failure (unless aborted).
- After each `await`, check `signal.aborted` before `setState` to avoid React warnings.
- **Exercises** uses a **`loadKey`** counter to refetch after creates/edits without duplicating fetch logic.

## Routing and auth

- Wrap private routes with **`ProtectedRoute`** (`client/src/features/auth/ProtectedRoute.tsx`).
- Keep public routes (sign-in, about) outside the guard.

## Decomposition

- For large pages, extract presentation into **`features/<domain>/`**; keep routing and orchestration in **`pages/`**.
- Prefer small hooks + components over monolithic page files.

## Tests

- **Vitest** + **Testing Library** for components.
- **MSW** handlers in `client/src/test/handlers.ts` should match real API behavior (paths, envelopes, auth headers).

## Post-merge optimization (frontend-heavy PRs)

After large UI PRs: grep for duplicated validation; confirm loading/error states; run `pnpm run lint`, `pnpm run test:client`, and `pnpm run build`.
