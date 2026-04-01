# Proposal: UI cleanup — forms, contextual help, finish workout

**Status:** **Done** — see **`CHANGELOG.md`** [Unreleased], **`ContextualHelp`**, **`patchWorkout`**, **`WorkoutDetailPage`** finish/resume, **`workout-logging-guards`**, **`docs/assumptions.md`** (workout lifecycle), **`docs/styleguide/ui-styleguide.md`**.  
**Audience:** maintainers, Cursor agents  
**Related app:** [workout-tracker](../../README.md)

## 1. Goals

1. **Mobile form layout** — `Input` / `Select` (and flex/grid parents where needed) use **`w-full max-w-full min-w-0`** so controls do not overflow narrow viewports.
2. **Contextual help** — Reusable **`ContextualHelp`** (compact **?** trigger, ~44×44px tap target, opens existing **`Modal`**) moves explanatory copy off primary surfaces; **Tutorial** stays the long-form teaching path.
3. **Concise copy** — Shorter headers and helper text across Dashboard, Workouts, Exercises, Profile, Sign-in; **About** may stay slightly richer by choice.
4. **Finish / resume workout** — **`PATCH /api/workouts/:id`** with **`endedAt`** is wired in the client: **Finish workout** (confirm) and **Resume editing** (clear end); **Log a set** disabled while finished. Server returns **400** on **POST …/sets** when the workout is already finished (editing existing sets remains allowed).

## 2. Non-goals

- Full i18n, shell redesign, or auto-complete without an explicit product decision.
- New icon libraries (inline SVG or text **?** on the trigger).

## 3. Implementation notes

- **Discoverability:** Optional follow-up — clearer **Active** rows or **Finish** affordance from the workouts list / resume banner.
- **Optional E2E** — Smoke extension: finish workout → list shows completed.
- **Docs:** [`docs/assumptions.md`](../assumptions.md), [`docs/styleguide/ui-styleguide.md`](../styleguide/ui-styleguide.md) (help + form primitives), [`docs/testing.md`](../testing.md) if new tests land.

## 4. Completeness checklist

- `pnpm run lint`, `pnpm run tsc`, `pnpm run test`, `pnpm run build` from repo root.
- [`CHANGELOG.md`](../../CHANGELOG.md) **[Unreleased]**.
- Proposal row in [`docs/proposals/README.md`](./README.md).

## 5. Related references

- Plan: Cursor plan **UI cleanup and finish workout** (checklist; keep in sync).
- Server: [`workout-service.ts`](../../server/services/workout-service.ts), [`workout-controller.ts`](../../server/controllers/workout-controller.ts).
- Client: [`Input.tsx`](../../client/src/components/ui/Input.tsx), [`Modal.tsx`](../../client/src/components/ui/Modal.tsx), [`WorkoutDetailPage.tsx`](../../client/src/pages/WorkoutDetailPage.tsx), [`DashboardPage.tsx`](../../client/src/pages/DashboardPage.tsx).
