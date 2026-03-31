# Proposal: Phased UX cleanup, exercises upgrades, and superset workflow

**Status:** Proposed  
**Audience:** maintainers, Cursor agents  
**Related app:** [workout-tracker](../../README.md)  
**Companion:** approved phased execution plan with per-phase approval gates

**Owner:** Brett Albright  
**Decision date:** 2026-03-31

## 1. Goal

Ship a structured multi-phase upgrade that improves day-to-day usability first, then adds a durable superset data model.

Primary outcomes:

1. Cleaner UI copy and better mobile accessibility on core screens.
2. Stronger exercises UX (required muscle groups, integrated custom catalog, modal editing, recents clear action).
3. Better dashboard/tutorial clarity (tabbed trend/stats, robust tutorial + FAQ).
4. Supersets implemented with explicit relational structure and safe rollout.

## 2. Non-goals

- No redesign of authentication, deployment topology, or account model.
- No broad analytics rewrite beyond requested dashboard container changes.
- No forced migration of all historical set semantics beyond required superset linkage.

## 3. Scope summary

### Phase 0: Decisions and gates

- Lock decisions before implementation:
  - recents clear scope: all recents or workout-type scoped
  - catalog composition and ordering for global + custom rows
  - superset UX: add-another flow, reorder, delete semantics
- Lock acceptance criteria for each phase before coding.
- Commit policy:
  - implement one phase at a time
  - pause for user approval after each phase
  - create one phase-scoped commit only after approval

### Phase 1: UX and copy cleanup

- Remove requested subheading text in targeted areas:
  - [client/src/App.tsx](../../client/src/App.tsx)
  - [client/src/components/app/AppMenuHeader.tsx](../../client/src/components/app/AppMenuHeader.tsx)
  - [client/src/pages/ExercisesPage.tsx](../../client/src/pages/ExercisesPage.tsx)
  - [client/src/pages/DashboardPage.tsx](../../client/src/pages/DashboardPage.tsx)
- Set form wording updates in [client/src/pages/WorkoutDetailPage.tsx](../../client/src/pages/WorkoutDetailPage.tsx):
  - warm-up label with no trailing helper text
  - rest input placeholder includes seconds
- Remove workouts footer links to dashboard/tutorial in [client/src/pages/WorkoutsPage.tsx](../../client/src/pages/WorkoutsPage.tsx).
- Ensure key controls are full-width on mobile and large-font contexts:
  - [client/src/pages/WorkoutsPage.tsx](../../client/src/pages/WorkoutsPage.tsx)
  - [client/src/features/workouts/WorkoutListFilters.tsx](../../client/src/features/workouts/WorkoutListFilters.tsx)
  - [client/src/components/ui/Input.tsx](../../client/src/components/ui/Input.tsx)
  - [client/src/components/ui/Select.tsx](../../client/src/components/ui/Select.tsx)
  - [client/src/components/ui/Button.tsx](../../client/src/components/ui/Button.tsx)
- Keep filters and download guidance modal-first:
  - [client/src/features/workouts/WorkoutListFilters.tsx](../../client/src/features/workouts/WorkoutListFilters.tsx)
  - [client/src/components/ui/Modal.tsx](../../client/src/components/ui/Modal.tsx)

### Phase 2: Exercises UX and validation

- Require muscle group for custom exercise create/edit:
  - [server/controllers/exercise-controller.ts](../../server/controllers/exercise-controller.ts)
  - [server/services/exercise-service.ts](../../server/services/exercise-service.ts)
  - [client/src/pages/ExercisesPage.tsx](../../client/src/pages/ExercisesPage.tsx)
  - [client/src/features/exercises/CustomExerciseRow.tsx](../../client/src/features/exercises/CustomExerciseRow.tsx)
- Include custom exercises in the main catalog experience and remove seeded-only wording:
  - [client/src/pages/ExercisesPage.tsx](../../client/src/pages/ExercisesPage.tsx)
- Upgrade custom exercise edit flow to modal:
  - [client/src/pages/ExercisesPage.tsx](../../client/src/pages/ExercisesPage.tsx)
  - [client/src/components/ui/Modal.tsx](../../client/src/components/ui/Modal.tsx)
- Add clear recents action in workout flow:
  - [server/routes/api.ts](../../server/routes/api.ts)
  - [server/controllers/exercise-controller.ts](../../server/controllers/exercise-controller.ts)
  - [server/services/exercise-service.ts](../../server/services/exercise-service.ts)
  - [client/src/pages/WorkoutDetailPage.tsx](../../client/src/pages/WorkoutDetailPage.tsx)

### Phase 3: Dashboard, tutorial, and about page

- Put weekly trend and stats in one tabbed container with accessible tab semantics:
  - [client/src/pages/DashboardPage.tsx](../../client/src/pages/DashboardPage.tsx)
- Remove goals subheading text in dashboard.
- Expand tutorial with robust walkthrough and FAQ:
  - [client/src/pages/TutorialPage.tsx](../../client/src/pages/TutorialPage.tsx)
- Update About page content so it aligns with the expanded tutorial and current UX:
  - [client/src/pages/AboutPage.tsx](../../client/src/pages/AboutPage.tsx)

### Phase 4: Superset data model and workflow

- Add explicit superset groups:
  - `workout_set_groups` table + nullable `groupId` on `workout_sets`
  - [server/db/schema.ts](../../server/db/schema.ts)
  - [database/schema.sql](../../database/schema.sql)
  - migration in [database/migrations](../../database/migrations/)
- Migration/backfill guardrails:
  - preserve legacy sets with null `groupId`
  - add indexes/constraints for group lookup and referential integrity
  - document rollback notes
- Extend set APIs and serialization:
  - [server/controllers/workout-controller.ts](../../server/controllers/workout-controller.ts)
  - [server/services/workout-service.ts](../../server/services/workout-service.ts)
  - [server/routes/api.ts](../../server/routes/api.ts)
- Client grouped workflow:
  - add another exercise in same superset group
  - grouped rendering/editing in:
    - [client/src/pages/WorkoutDetailPage.tsx](../../client/src/pages/WorkoutDetailPage.tsx)
    - [client/src/features/workouts/SetRowCard.tsx](../../client/src/features/workouts/SetRowCard.tsx)
- Export alignment for grouped sets:
  - [server/services/export-service.ts](../../server/services/export-service.ts)
  - [server/lib/csv-build.ts](../../server/lib/csv-build.ts)
- Rollout guard:
  - temporary UI feature flag for superset entry points until staging validation passes

## 4. API contract additions for Phase 4

Define and document request and response examples before implementation:

- create superset group
- add set directly into group
- move existing set between groups
- grouped workout detail payload shape
- CSV/export behavior for grouped vs non-grouped sets

This contract should be settled before coding phase 4 to avoid UI and backend drift.

## 5. Acceptance criteria

- Phase 1:
  - requested subheading copy removed in target locations
  - key mobile controls full-width and usable in large-font modes
  - filters/download guidance remains modal-driven
- Phase 2:
  - muscle group required client + server side
  - main catalog includes global and custom exercises
  - custom edit modal works and persists
  - clear recents action is user-scoped and idempotent
- Phase 3:
  - trend/stats tabs pass keyboard navigation and screen reader checks
  - goals subheading removed
  - tutorial includes robust FAQ and complete task walkthrough
  - about page copy reflects current app flow and points users to tutorial for task-based guidance
- Phase 4:
  - migration applies cleanly with legacy data intact
  - grouped set CRUD works end-to-end
  - non-superset set logging behavior remains stable

## 6. Validation and docs

- Tests to update:
  - [server/routes/api.test.ts](../../server/routes/api.test.ts)
  - [server/routes/api-idor.test.ts](../../server/routes/api-idor.test.ts)
  - [client/src/test/handlers.ts](../../client/src/test/handlers.ts)
  - [client/src/lib/workout-list-url.test.ts](../../client/src/lib/workout-list-url.test.ts)
  - [client/src/lib/parse-rest-seconds.test.ts](../../client/src/lib/parse-rest-seconds.test.ts)
  - [e2e/smoke.spec.ts](../../e2e/smoke.spec.ts)
- Required checks before merge:
  - `pnpm run lint`
  - `pnpm run tsc`
  - `pnpm run test`
  - `pnpm run build`
  - `pnpm run test:e2e`
- Docs to update per phase:
  - [README.md](../../README.md)
  - [docs/testing.md](../testing.md)
  - [docs/development-workflow.md](../development-workflow.md)
  - [CHANGELOG.md](../../CHANGELOG.md)

## 7. Sequencing and approval workflow

1. Complete phases 1 to 3 first.
2. Start phase 4 only after prior phases are approved.
3. After each phase:
   - run phase-relevant validation
   - present summary and results for approval
   - commit only after explicit user approval
4. Do not begin the next phase until approval and commit are complete for current phase.
