# Frontend patterns

## Structure

- App shell + routes: `client/src/App.tsx`
- Pages: `client/src/pages/*`
- Features: `client/src/features/*` (e.g. `features/auth/`)
- UI primitives: `client/src/components/ui/*`
- Shared utils: `client/src/lib/*`

## State management

- Use local `useState` / `useReducer` for page- or feature-owned UI state.
- Use Context for auth (`client/src/features/auth/AuthContext.tsx`) and other cross-cutting providers.
- Keep server-backed data loaded in pages/features via feature API modules; avoid duplicating server state in global stores unless necessary.

## Forms

- Use **react-hook-form** + **Zod** for forms (sign-in, profile, log sets, etc.).
- Keep schemas next to the feature when they are feature-specific.

## API pattern

- Use `fetchJson` / shared client helpers from `client/src/lib/api-client.ts` (or feature wrappers such as `client/src/lib/workout-api.ts`).
- Send `Authorization: Bearer <token>` for protected routes (centralize in one API layer).
- Align TypeScript types with `shared/` contracts.

## Routing and auth

- Wrap private routes with a guard component (`client/src/features/auth/ProtectedRoute.tsx`).
- Keep public routes (sign-in, about) outside the guard.

## Decomposition

- For large pages, extract presentation components first; keep data loading in the page or a dedicated hook.
- Prefer hooks + small components over monolithic page files.

## Tests

- Use Vitest + Testing Library for components.
- Keep MSW handlers in `client/src/test/handlers.ts` aligned with real API behavior.

## Post-merge optimization (frontend-heavy PRs)

After large UI PRs: grep for duplicated Zod fragments; confirm loading/error states; run `pnpm run lint`, `pnpm run test:client`, and `pnpm run build`.
