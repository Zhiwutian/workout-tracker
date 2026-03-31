# Proposals

Forward-looking plans for **workout-tracker** before or alongside implementation.

## Index

| Proposal                                                                           | Summary                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`workout-tracker-build-plan.md`](./workout-tracker-build-plan.md)                 | Full-stack build plan: **Report 2 alignment**, Path A (**OIDC §11** + [**ADR 0001**](../decisions/0001-oidc-oauth-path-a.md)), R0–R9, report phase mapping, **Phase 4 QA** → [`course-qa-evidence.md`](../course-qa-evidence.md), docs map, tests |
| [`optimization-and-abstraction.md`](./optimization-and-abstraction.md)             | **Done** — styleguide parity, `asyncHandler`, `api-client` + `lib/api/*`, domain Zod, UI primitives, `features/*`, `useAbortableAsyncEffect`; see styleguide + CHANGELOG                                                                          |
| [`display-and-accessibility-settings.md`](./display-and-accessibility-settings.md) | **Done** — display shell + `profiles.uiPreferences` + `PATCH`/`me` for cross-device sync                                                                                                                                                          |
| [`nav-drawer-filters-modal-url-sync.md`](./nav-drawer-filters-modal-url-sync.md)   | **Done** — overlay nav (Support-style), workouts filters modal, URL query sync for list filters; `prefers-reduced-motion` on modal (see **`ui-styleguide.md`**)                                                                                   |
| [`dashboard-goals-tutorial-exercises.md`](./dashboard-goals-tutorial-exercises.md) | **Proposed** — dashboard charts + stats API, richer goals (no email), achievements, chart **accessibility** (table fallback, ARIA, contrast, reduced motion), `/tutorial`, exercises catalog UX                                                   |
| [`phased-ux-and-supersets.md`](./phased-ux-and-supersets.md)                       | **Proposed** — phased UX cleanup, exercises/catalog and validation upgrades, dashboard/tutorial refinements, and superset workflow with per-phase approval and commit gates                                                                       |

## When to add a proposal

Use a new file here when the change is large, has real trade-offs, or should be reviewed before code lands. Link it from `CHANGELOG.md` under `[Unreleased]` when execution starts.
