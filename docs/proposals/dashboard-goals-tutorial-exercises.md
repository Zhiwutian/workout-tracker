# Proposal: Dashboard analytics, richer goals, tutorial, and exercises UX

**Status:** **Done** (dashboard stats APIs + charts, goals/achievements, `/tutorial`, exercises UX refresh shipped in-repo).  
**Audience:** maintainers, Cursor agents  
**Related app:** [workout-tracker](../../README.md) (repo root)  
**Companion:** Cursor plan **Dashboard goals tutorial exercises** (checklist; milestones align with shipped work).

## 1. Goals

1. **Dashboard** — Trends and insights: **multi-week volume (or set/session counts)**, **week-over-week summary**, **streaks / active days**, and **charts** that respect the existing **display shell** (light, dark, high contrast).
2. **Richer goals (no email)** — Multiple concurrent **goals** with **typed targets**, **time windows**, and **`goal_periods`** (met / missed / pending). All feedback stays **in-app** (dashboard, optional toasts after logging); **no email**, push, or cron jobs in this pass.
3. **Gamification** — **Derived badges** and/or **persisted achievements** tied to stats and goal completion; **idempotent** unlock if stored in DB.
4. **Tutorial** — New **`/tutorial`** route: task-oriented walkthrough (sign-in / guest → workouts → sets → exercises → dashboard / goals → CSV / profile).
5. **Exercises UX** — **Catalog-first** layout: search, filters (type, optional muscle), collapsible **add custom**, tabs for **yours / archived**.

## 2. Non-goals (this proposal)

- **Email**, **push notifications**, **wearable sync**, **social / leaderboards**, **AI coaching**.
- **Personal records (PRs)** per exercise — optional **follow-up** after v1.
- **Background cron** for goal closure; **period status** is computed **on read** (or on mutation) with explicit timezone rules.

## 3. Product decisions (locked)

- **Ship order:** **Milestone 1** (dashboard + stats API + goals + charts + a11y) **first**; **Milestone 2** (tutorial); **Milestone 3** (exercises UX).
- **Goals model:** **Rich** — `goals` + `goal_periods` (+ optional `user_achievements`); not a single JSON blob only.

## 4. Milestone 1 — Stats, dashboard charts, goals

### 4.1 API and services

- Prefer **bounded** endpoints over many client calls, e.g.:
  - **`GET /api/stats/volume-series`** — last _N_ weekly buckets (reuse [`resolveWeeklyVolumeWindow`](../../server/services/stats-service.ts) / Luxon; same timezone semantics as weekly volume).
  - **`GET /api/stats/summary`** (or separate streak endpoint) — current **streak**, **active days**, and headline numbers for the dashboard.
- **Client:** extend [`lib/workout-api`](../../client/src/lib/workout-api.ts) / `lib/api/*`; types in [`client/src/lib/api/types.ts`](../../client/src/lib/api/types.ts).

### 4.2 Charts

- Add **one** chart library (e.g. **Chart.js** or **Recharts**); document bundle size in [`docs/styleguide/ui-styleguide.md`](../styleguide/ui-styleguide.md).
- **Layout:** This week vs last week, primary chart (volume or set count), second chart only if mobile remains usable.

### 4.3 Chart and dashboard accessibility (required)

- **Name the graphic:** `aria-label` or **`aria-labelledby`** pointing at a visible heading; if the library renders **canvas/SVG**, use supported **ARIA** patterns or a wrapping **`figure`** + **`<figcaption>`** / programatic name.
- **Non-visual access:** Provide a **visually hidden or expandable HTML table** (or definition list) with the **same numeric series** as the chart so screen-reader users get exact values without relying on the graphic alone.
- **Color:** Do not rely on **color alone** for series or state — use **labels**, **patterns**, or **text values**; verify **contrast** in **`.app-dark-mode`** and **`.app-high-contrast`** (goal bars and chart lines/bars).
- **Motion:** Respect **`prefers-reduced-motion`** for chart **animations** (disable or minimize).
- **Goals UI:** **`role="progressbar"`** (or native **`<progress>`**) with **`aria-valuenow` / `aria-valuemin` / `aria-valuemax`** where applicable; clear **heading structure** on the dashboard.
- **Verification:** Extend **axe** coverage (**[`e2e/a11y.spec.ts`](../../e2e/a11y.spec.ts)**) for authenticated **dashboard** load (with seed/MSW as appropriate); document in [`docs/testing.md`](../testing.md).

### 4.4 Richer goals (schema + API + evaluation)

- **Tables:** Drizzle migration + [`database/schema.sql`](../../database/schema.sql) parity:
  - **`goals`** — `userId`, `type` (e.g. `weekly_volume`, `workouts_per_week`, `active_days_per_week`), `targetValue`, optional workout-type filter, timezone inherit/override, `isActive`, timestamps.
  - **`goal_periods`** — `goalId`, period bounds, `status` (`pending` | `met` | `missed` | `cancelled`), optional `progressValue` snapshot.
- **API:** CRUD + summary for dashboard; evaluation aligned with **`weeklyVolumeForUser`** (warmup exclusion, etc.).
- **Lifecycle:** Create opens **current** period; **no** silent backfill of past periods unless explicitly specified; **met/missed** after week end on **next read** using **profile timezone**.

### 4.5 Achievements

- Prefer **persisted** `user_achievements` with **idempotent** unlock; optional **GET** for a small trophy list on dashboard or profile.
- **Derived rules** (streak, volume milestones) share stats queries with charts.

### 4.6 Quality

- Server + client tests (timezone edges, guest user, empty data).
- **MSW** ([`client/src/test/handlers.ts`](../../client/src/test/handlers.ts)) for new endpoints.
- **CHANGELOG**, proposal status flip to **Done** when shipped, [`docs/assumptions.md`](../assumptions.md) or stats doc if week boundaries need a sentence.

## 5. Milestone 2 — Tutorial

- Route **`/tutorial`**, lazy-loaded; sections with anchors; link from **app menu** ([`App.tsx`](../../client/src/App.tsx)).
- Distinguish **About** (product/course) vs **Tutorial** (tasks).
- Link from **empty states** where helpful.

## 6. Milestone 3 — Exercises page

- **Catalog:** search, filter by **type** and optional **muscle**; grouped or virtualized list if large.
- **Add custom:** collapsible panel or prominent **secondary** action.
- **Tabs:** Yours / Archived; improved **empty states** and spacing.
- **a11y:** labeled filters, keyboard **Tab** order, axe/e2e if selectors change.

## 7. Functionality gaps (cross-cutting)

- **Zero-data dashboard:** CTAs to **Start workout** and **Tutorial**.
- **Cardio / low volume:** parallel **session** or **set count** metrics and/or non-volume **goal types**; document in tutorial.
- **CSV alignment:** dashboard week / warmup rules **consistent** with export copy; one-line explanation in tutorial.
- **Optional in-app cue** after log/set when a goal **crosses** a threshold (no email).
- **Performance:** avoid N+1; **indexes** on `workouts (userId, startedAt)` if aggregates warrant it (`EXPLAIN` on realistic data).
- **Guest copy:** goals/achievements expectations match guest lifecycle.

## 8. Optional later

- PRs, email/push, wearables, social — roadmap only.

## 9. Related files (starting points)

- [`client/src/pages/DashboardPage.tsx`](../../client/src/pages/DashboardPage.tsx)
- [`server/controllers/stats-controller.ts`](../../server/controllers/stats-controller.ts)
- [`server/services/stats-service.ts`](../../server/services/stats-service.ts)
- [`client/src/pages/ExercisesPage.tsx`](../../client/src/pages/ExercisesPage.tsx)
