# Proposal: Overlay navigation, workouts filters modal, URL sync, and reduced motion

**Status:** **Done** — see **`CHANGELOG.md`** [Unreleased], **`ui-styleguide.md`** (Navigation shell, Workouts list URL), **`client/src/App.tsx`**, **`Modal.tsx`**, **`WorkoutListFilters`**, **`lib/workout-list-url.ts`**.  
**Audience:** maintainers, Cursor agents  
**Related app:** [workout-tracker](../../README.md) (repo root)  
**Companion plan:** Cursor plan **Nav drawer + filters modal** (implementation checklist; keep in sync with this doc).

## 1. Goals

1. **Shell navigation** — Match the **parent monorepo Support app** pattern: **sticky header** with app title + **Menu** control; **left slide-out drawer** (scrim + `aside`) for primary nav and account actions — see parent [`client/src/App.tsx`](../../../client/src/App.tsx) (overlay menu section, not `BibleReaderPage`).
2. **Workouts filters UX** — Move **date range**, **status**, and **sort** into a **modal** opened from a single trigger (summary text on the button); keep **CSV export** + disclaimer **outside** the modal (export is an action, not a filter).
3. **Shareable / refresh-safe list state (optional → in scope)** — Sync filter choices to **`URLSearchParams`** on the workouts list so **reload**, **back/forward**, and **shared links** preserve filters without API changes.
4. **Motion accessibility (optional → in scope)** — Respect **`prefers-reduced-motion`** for drawer (and modal) open/close so users who opt out of animation do not get sliding transitions.

## 2. Non-goals

- **No API or server changes** for filters (still `readWorkouts` query params only).
- **No new UI framework** (Radix Dialog, etc.) unless we later choose to adopt one; prefer a small **`Modal`** / **`ModalShell`** in `client/src/components/ui/`.
- **Nav drawer focus trap** — Parent does not trap focus; acceptable for v1; trapping can be a follow-up if audits require it.

## 3. URL sync design (workouts list)

**Intent:** `WorkoutsPage` becomes the single source of truth; **`useSearchParams`** (react-router) reads on load and **writes** when the user changes filters (replace vs push documented below).

**Suggested query keys** (short, stable):

| Param    | Values                                      | Maps to               |
| -------- | ------------------------------------------- | --------------------- |
| `range`  | `all` \| `week` \| `month`                  | `RangePreset`         |
| `status` | `all` \| `active` \| `completed`            | `WorkoutStatusFilter` |
| `sort`   | `newest` \| `oldest` (or API-aligned names) | `WorkoutSortFilter`   |

**Recommendation:** Prefer **human-readable** sort tokens in the URL (`newest` / `oldest`) and map to `startedAt_desc` / `startedAt_asc` in one place (helper in `WorkoutListFilters` or `WorkoutsPage`). Alternatively use **`sort=startedAt_desc`** for direct alignment with the API — clearer for debugging, slightly longer URLs.

**Invalid or missing params:** Fall back to current defaults (`all` / `all` / `newest` or equivalent). Do not throw.

**Navigation behavior:**

- **`replace`** when filters change so every tweak does not pollute history (optional: **`push`** once per “session” — more complex; default to **replace**).
- **Back button:** Restores previous URL state if user used **push** elsewhere; with **replace-only**, back leaves the page — acceptable.

**Empty state “Clear filters”:** Must still reset **range + status + sort** and **clear the relevant query params** (or set them to defaults).

**Deep link example:** `/` or `/workouts` with `?range=month&status=completed&sort=newest` (exact path depends on whether list stays at `/` — today it is `/`).

## 4. Reduced motion

- **`prefers-reduced-motion: reduce`:** Drawer panel should **not** use transform-based slide animation; prefer **instant** open or **opacity-only** (if any transition exists).
- **Modal:** Same — avoid zoom/slide; optional subtle fade only if it respects reduced motion.
- Implementation: **`@media (prefers-reduced-motion: reduce)`** in `index.css` targeting optional classes on the drawer/modal root, or **matchMedia** in JS to toggle a `motion-reduce` class (CSS-first is simpler).

## 5. Completeness checklist (same PR)

- **Z-index:** Drawer and modal stack **above** main content; define relationship to **toasts** (toasts above overlay vs below — pick one and comment in code).
- **Safe areas:** Drawer scroll body uses **`padding-bottom: max(1rem, env(safe-area-inset-bottom))`** (and horizontal insets if needed) like the parent overlay scroll container.
- **Focus:** Filters **modal** — initial focus on open, **return focus** to trigger on close. Nav drawer — parent parity OK for v1.
- **Escape ordering:** If multiple overlays were ever open, **Escape** closes the **topmost** first; in practice only one overlay at a time.
- **Tests:** Vitest (App + filters), **`pnpm run ci:local`**, **`pnpm run test:e2e`** with updated selectors; add URL sync unit tests if helpers are extracted.
- **Docs:** [`docs/styleguide/ui-styleguide.md`](../styleguide/ui-styleguide.md) (nav + modal + URL), [`docs/testing.md`](../testing.md) if e2e flows change, [`CHANGELOG.md`](../../CHANGELOG.md) under **[Unreleased]**.

## 6. Implementation order (suggested)

1. **Modal primitive** + styles (including reduced motion).
2. **Nav drawer** in `App.tsx` + `AppMenuHeader` + drawer-safe **dark / high contrast** styles.
3. **WorkoutListFilters** refactor (trigger + summary + modal; CSV outside).
4. **URL sync** on `WorkoutsPage` (parse/serialize helpers + `useSearchParams`).
5. **Tests + e2e + docs + CHANGELOG**.

## 7. Related references

- Parent overlay menu: [`client/src/App.tsx`](../../../client/src/App.tsx) (`isMobileMenuOpen`, `overlay-main-menu`).
- Current workout-tracker nav: [`client/src/App.tsx`](../../client/src/App.tsx) (`AppNav`).
- Current filters: [`client/src/features/workouts/WorkoutListFilters.tsx`](../../client/src/features/workouts/WorkoutListFilters.tsx), [`client/src/pages/WorkoutsPage.tsx`](../../client/src/pages/WorkoutsPage.tsx).
