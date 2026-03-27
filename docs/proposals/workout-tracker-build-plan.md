# Proposal: Workout Tracker — full-stack build plan

**Status:** proposal (living document) — **MVP, Path A (OIDC), and Report Phase 4 QA evidence are complete in-repo**; remaining items are optional polish or new product scope.  
**Audience:** course team, future maintainers, Cursor agents  
**Related app:** this repository (`workout-tracker`)  
**Template seed:** LFZ full-stack template (aligned with **bible-support** patterns where noted)

---

## 1. Goal

Ship an educational **workout tracker** web app: users log **workouts** and **sets** (reps × weight), browse **exercises** (global catalog + custom), view **weekly volume** on a dashboard, and manage **profile** preferences. The codebase should demonstrate professional structure (layered API, Drizzle + migrations, tests, CI, docs, security-aware auth boundaries).

### Course research report alignment (CSCI 441 — Report 2, Part 3)

**Path A (chosen):** Implement **OIDC / OAuth**-backed sign-in so the running app matches the report’s **UC-1 OAuth**, security narrative (§5.5), and test plan (§3.1 — auth/session tests). **Demo JWT** may remain temporarily for local dev or behind a narrow escape hatch until cutover; document removal or demotion in `CHANGELOG` and `docs/assumptions.md`.

**Volume wording:** The report defines **Volume = Sets × Reps × Weight**. The implementation uses **Σ (reps × weight)** per logged set over the dashboard window — numerically the same when each set is stored as its own row (see **`docs/assumptions.md`**). Use that sentence in course documentation if graders want formula traceability.

**Report Phase 4 (QA, ~Mar 30–Apr 10):** **Completed** — outcomes recorded in **`docs/course-qa-evidence.md`** (automated **axe** + Playwright **chromium** / **mobile-chrome**, UAT notes, hosted OIDC/security rows) with pointers in **`docs/testing.md`**.

## 2. Non-goals (for initial milestones)

- Native mobile apps (responsive PWA is enough unless scope expands).
- Social feeds, coaching marketplace, or program templates (unless explicitly added later).
- Medical claims or compliance beyond “student project” hygiene.

## 3. Current state (snapshot)

Use this table to reconcile the plan with the repo; update the **Status** column as work lands.

| Area                                                        | Status      | Notes                                                                                                                                                    |
| ----------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain schema (users, profiles, exercises, workouts, sets)  | **Done**    | `server/db/schema.ts`; migrations through **`0004`** (see `database/migrations/`)                                                                        |
| Demo JWT auth (display name)                                | **Done**    | Gated by **`AUTH_DEMO_ENABLED`**; OIDC is primary for production narrative                                                                               |
| REST APIs + ownership checks                                | **Done**    | IDOR tests with `TEST_DATABASE_URL`                                                                                                                      |
| React UI (sign-in, workouts, detail, dashboard, profile)    | **Done**    |                                                                                                                                                          |
| Seed global exercises                                       | **Done**    | `db:seed`                                                                                                                                                |
| Styleguide + Cursor rules + `AGENTS.md`                     | **Done**    | Ported/adapted from bible-support template                                                                                                               |
| `docs/data-flow.md`                                         | **Done**    |                                                                                                                                                          |
| Light PWA (manifest, icons, minimal SW)                     | **Done**    |                                                                                                                                                          |
| Drizzle migration snapshots                                 | **Done**    | Under `database/migrations/meta/` (journal tracks applied migrations)                                                                                    |
| Playwright E2E                                              | **Done**    | `e2e/smoke.spec.ts` + `e2e/a11y.spec.ts` (axe + keyboard sample); **chromium** + **mobile-chrome**; optional **`PW_FULL_BROWSERS=1`** for Firefox/WebKit |
| Agent / workspace workflow (`AGENTS.md`, `CONTRIBUTING.md`) | **Done**    | Optional parent workspace (e.g. bible-support at `/workspace`); app docs/rules/changelog stay under this repo only                                       |
| OIDC / OAuth (Auth0-class IdP)                              | **Done**    | `AUTH_OIDC_*`, PKCE + callback, session + split-host handoff; `GET /api/auth/options`; see §11 + ADR 0001                                                |
| Full deployment runbooks (Auth0, split host)                | **Done**    | **`docs/deployment/README.md`**, **`auth0-setup.md`**, **`vercel-render.md`**; production verified on Vercel+Render                                      |
| Optional docs from original vision                          | **Partial** | See §7 — remaining: **`docs/pwa.md`**, **`docs/build/*`**, **`docs/learning-path.md`** (optional)                                                        |

### Agent and workspace workflow (Cursor)

Some contributors open a **parent** folder (for example the bible-support devcontainer with **`/workspace`** as the parent and **`workout-tracker/`** nested) so agents can read both trees. **Workout-tracker artifacts** — `docs/**`, `CHANGELOG.md`, `.cursor/rules/**`, and application code — must remain in **this** repository; use the parent only for shared devcontainer/infra or explicit cross-repo tasks.

- **Canonical instructions:** [`AGENTS.md`](../../AGENTS.md) (commands, copy-paste agent prompt, exceptions) and [`CONTRIBUTING.md`](../../CONTRIBUTING.md) (PR checks, scope, security).
- **Rule registry:** [`docs/rules-registry.md`](../rules-registry.md) — register new `.cursor/rules/*.mdc` files when added.

---

## 4. Stack and constraints

- **Client:** React 19, Vite 7, Tailwind 4, React Router, RHF + Zod.
- **Server:** Express 5, Drizzle ORM, PostgreSQL, Pino, Helmet, CORS, rate limits.
- **Contracts:** `shared/` for cross-boundary types; API envelope `{ data, meta }` / `{ error, meta }`.
- **Auth (Path A target):** OAuth/OIDC session or token flow with IdP `sub` → `users.authSubject`; interim **demo JWT** until cutover (see §11).
- **Security:** All user-owned rows scoped by server-derived `userId` — see `docs/styleguide/security-and-authz.md`.

---

## 5. Product scope (MVP acceptance)

Functional MVP is **Done**. **Path A:** **OIDC/OAuth** is the production login path when configured; **demo JWT** remains for local/dev when **`AUTH_DEMO_ENABLED=true`**.

- [x] Sign up / sign in via **OAuth/OIDC** (IdP-backed) with unique identity per user when **`AUTH_OIDC_ENABLED=true`** and IdP is configured. _(Demo JWT remains for local / gated use.)_
- [x] List and create **workouts**; open detail; end session optional.
- [x] Log **sets** (exercise, reps, weight); edit/delete sets.
- [x] List exercises (global + user custom); create custom exercise with service-level de-dupe rules.
- [x] **Weekly volume** chart/table: sum `reps × weight` over UTC week window documented in `docs/assumptions.md`.
- [x] **Profile:** display name, weight unit (lb/kg), optional timezone (stored for future stats localization).

---

## 6. Release phases (R0–R9) — merge-sized slices

Phases are **ordering guidance**, not rigid sprints. Several may already be satisfied in the current tree.

| Phase  | Theme                  | Typical contents                                                                      |
| ------ | ---------------------- | ------------------------------------------------------------------------------------- |
| **R0** | Skeleton + CI          | Repo from template, lint/tsc/test/build in CI, env examples                           |
| **R1** | Docs & governance      | `AGENTS.md`, styleguide/rules index, PR template, troubleshooting stub                |
| **R2** | Database + seed        | Schema, migrations, SQL mirror, global exercise seed                                  |
| **R3** | API shell              | Health/ready, envelope, request IDs, route tests                                      |
| **R4** | Auth                   | Demo JWT or OIDC: login/me/profile; **no** client-trusted `userId`                    |
| **R5** | Core domain            | Workouts, sets, exercises, stats service + controllers                                |
| **R6** | Client UX              | Pages, protected routes, API client, error/toast handling                             |
| **R7** | Semantics & edge cases | UTC week assumptions, 409 conflicts, validation parity with `database-constraints.md` |
| **R8** | PWA + hardening        | Manifest, icons, SW policy, CSP/Helmet notes in `docs/security-notes.md` if required  |
| **R9** | Demo & E2E             | Demo script, Playwright smoke, release tag / `v0.x` checklist                         |

### Mapping: Report 2 §4 phases ↔ this plan

| Report phase (Part 3)                                                          | Status / focus                                                                                              |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Phase 1** — Environment & foundation (DB, accessibility baseline, CI)        | Largely **Done** in repo; ensure **hosted Postgres** (e.g. Render) steps match `docs/deployment/README.md`. |
| **Phase 2** — Auth (UC-1), profile (UC-2), security audit                      | **Done** for **Path A** (OIDC + profile); optional: more automated callback tests (§11.F).                  |
| **Phase 3** — Workout/set CRUD (UC-3/4), dashboard volume                      | Largely **Done** (**R5–R7**).                                                                               |
| **Phase 4** — QA: WCAG, UAT (three-tap), cross-browser/device, security/stress | **Done** — logged in **`docs/course-qa-evidence.md`** (§8 item 12).                                         |

---

## 7. Documentation map (first-class artifacts)

Mark **Done** / **Todo** in your tracker; paths are relative to `workout-tracker/`.

| Document                                   | Purpose                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `README.md`                                | Onboarding, scripts, link to proposals + contributing                                             |
| `AGENTS.md`                                | Commands, doc entry points, optional parent-workspace layout, copy-paste agent prompt             |
| `CONTRIBUTING.md`                          | PR checks, changelog/rules discipline, parent-workspace scope                                     |
| `docs/architecture.md`                     | Runtime diagram + boundaries                                                                      |
| `docs/data-flow.md`                        | Mermaid flows: auth, workouts, sets, stats, PWA                                                   |
| `docs/assumptions.md`                      | UTC week, demo auth, volume definition                                                            |
| `docs/configuration.md`                    | Env boundaries + OIDC/session vars                                                                |
| `docs/development-workflow.md`             | Local loop, CI, DB, E2E, PWA icons                                                                |
| `docs/deployment/README.md`                | Hosted bootstrap + OIDC checklist; **`docs/deployment/auth0-setup.md`** for Auth0 dashboard steps |
| `docs/styleguide/*`                        | Implementation standards + **security-and-authz.md**                                              |
| `docs/rules-registry.md`                   | Cursor rules index                                                                                |
| `docs/troubleshooting.md`                  | **Done** — common DB, API, OIDC, client issues; linked from README                                |
| `docs/demo-script.md`                      | **Done** — presentation happy path (sign-in → workout → set → dashboard)                          |
| `docs/testing.md`                          | **Done** — commands, IDOR env, OIDC manual staging, optional §11.F/G notes, CI notes              |
| `docs/pwa.md`                              | **Todo** optional: extract from `data-flow` + `development-workflow`                              |
| `docs/security-notes.md`                   | **Done** — cookies, CORS, callback URLs, CSP/SW pointers                                          |
| `docs/course-qa-evidence.md`               | **Done** — Phase 4 checklist filled (§0 **ci:local** + **test:e2e**, §§1–5, production OIDC row)  |
| `docs/decisions/0001-oidc-oauth-path-a.md` | **Implemented** (code); ADR indexes **`docs/decisions/README.md`**                                |
| `docs/build/*`                             | **Todo** optional: reproducible build / deploy steps                                              |
| `docs/learning-path.md`                    | **Todo** optional: student onboarding                                                             |
| `CHANGELOG.md`                             | **Unreleased** discipline per PR                                                                  |

---

## 8. Committed deliverables (course / rubric alignment)

Numbered items are **in scope** for “done enough to defend in report.” Adjust wording to match your instructor’s rubric.

1. **Troubleshooting entrypoint** — `docs/troubleshooting.md` (or README section) + README link.
2. **Week semantics** — documented in `docs/assumptions.md` + tests for stats boundary where practical.
3. **Auth bypass resistance** — server derives identity from token/session only; IDOR tests for workouts/sets.
4. **User-facing errors** — envelope + stable codes; forms show actionable messages.
5. **CSP / PWA / Helmet** — document tradeoffs in `docs/security-notes.md` when SW/CSP interact.
6. **Demo script** — short checklist (sign-in → workout → set → dashboard) for presentation.
7. _(Reserved / team-specific — add if your report lists more.)_
8. **Request IDs** — `meta.requestId` on API responses (template baseline).
9. _(Reserved.)_
10. **Playwright smoke** — at least one happy path in CI.
11. **OIDC/OAuth** — production-style login path, documented env and callbacks; automated coverage for critical auth/session paths where practical (extends §3.1 of the report).
12. **Report Phase 4 QA evidence** — short in-repo record of accessibility sampling, UAT / three-tap logging, and cross-browser checks (can be `docs/course-qa-evidence.md` or a section in `docs/testing.md`).

---

## 9. Test plan

| Layer              | Command / trigger                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Unit / integration | `pnpm run test`                                                                                  |
| IDOR integration   | `TEST_DATABASE_URL=… pnpm run test:server`                                                       |
| E2E                | `DATABASE_URL=… pnpm run test:e2e` (browser deps per `development-workflow.md`)                  |
| OIDC / session     | Manual staging + options route tests; callback integration/E2E optional (see `docs/testing.md`). |
| Pre-merge          | `pnpm run lint`, `pnpm run tsc`, `pnpm run build`                                                |

---

## 10. Security and privacy (student-project bar)

- No secrets in client bundle (`VITE_*` non-secret only).
- No logging of tokens, `Authorization`, or raw auth bodies.
- Multi-tenant data: every mutation checks ownership (`docs/styleguide/security-and-authz.md`).
- OIDC: document callback URLs, cookie flags, and CSRF/session strategy when implemented.

---

## 11. OIDC / OAuth (Path A — **implemented** on production; optional polish below)

**Goal:** Satisfy Report 2 **UC-1**, **§5.5**, and **§3.1** (OAuth/session testing) with a real IdP (e.g. **Auth0**).

- Map IdP **`sub`** → `users.authSubject`; keep stable internal **`userId`** for foreign keys.
- Prefer **Authorization Code + PKCE** (SPA or BFF); avoid long-lived opaque tokens in `localStorage` where a **httpOnly session cookie** or server-side session is feasible for the chosen topology.
- Document **callback URLs**, **logout**, **CORS**, and **cookie** flags in `docs/configuration.md` and `docs/deployment/*` (split client/server hosts if applicable).
- **Tests:** add coverage for login/callback, session expiry edge cases, and **no client-trusted identity** (existing ownership rules stay).
- **Cutover:** remove or restrict **demo JWT** sign-up paths when OIDC is default; migration strategy for existing `demo:*` users (reset dev DB or one-off link) documented in `CHANGELOG`.
- **E2E:** extend Playwright to run a **happy-path OIDC** flow in CI only if secrets/tenant allow; otherwise document manual staging checklist in `docs/testing.md`.

**Canonical checklist:** [`docs/decisions/0001-oidc-oauth-path-a.md`](../decisions/0001-oidc-oauth-path-a.md) (keep that ADR checkboxes updated as PRs land). The same tasks are copied below for proposal readers.

### Implementation checklist (Path A)

#### A. Identity provider (Auth0-class) — operator

- [ ] Tenant / application registered; callback, logout, and web origins match deployment topology.
- [ ] Issuer, client id, and (if used) client secret captured only in env — never committed.

#### B. Configuration and secrets

- [x] `server/.env.example` updated (no `client/.env.example` required for current redirect-only OIDC UI).
- [x] `docs/configuration.md` and `docs/deployment/README.md` updated for OIDC + session env.

#### C. Server: OAuth routes and session

- [x] `GET /api/auth/oidc/login` redirects to IdP with PKCE.
- [x] `GET /api/auth/oidc/callback` exchanges code, validates ID token, upserts user by `sub` → `authSubject`.
- [x] httpOnly **`wt_session`** cookie; `authMiddleware` accepts Bearer then session; demo JWT gated by `AUTH_DEMO_ENABLED`.
- [x] `POST /api/auth/logout` clears session (IdP logout redirect optional / future).

#### D. Client

- [x] Sign-in uses full redirect to `/api/auth/oidc/login`; API calls use `credentials: 'include'`.
- [x] `GET /api/me` works from session; callback errors surface as `auth_error` on sign-in.

#### E. Demo JWT cutover

- [x] Demo sign-up/sign-in gated by `AUTH_DEMO_ENABLED`; production guidance in deployment docs.
- [x] `CHANGELOG` / `docs/assumptions.md` document `demo:*` / dev DB reset.

#### F. Tests

- [ ] Integration tests for callback with mocked IdP (optional follow-up).
- [x] `GET /api/auth/options` covered; IDOR suite unchanged (Bearer still used in tests).
- [x] `docs/testing.md` documents commands and manual OIDC staging.

#### G. E2E

- [ ] Playwright happy path with real IdP when CI secrets allow **or** rely on manual checklist in `docs/testing.md`.

#### H. Docs and architecture

- [x] `docs/data-flow.md`, `docs/architecture.md`, `docs/security-notes.md`, `docs/testing.md` updated.
- [x] §3 OIDC row and §5 OAuth checkbox updated for IdP-backed login path.

#### I. ADR hygiene

- [x] **ADR 0001** synced; status **Implemented** for application code.

---

## 12. Risks and mitigations

| Risk                      | Mitigation                                                                       |
| ------------------------- | -------------------------------------------------------------------------------- |
| Drizzle migration drift   | `drizzle-kit check`; commit snapshots with migrations                            |
| IDOR regressions          | Keep `api-idor.test.ts` in CI with Postgres service                              |
| PWA cache stale API       | Current SW is activation-only; document before adding cache                      |
| Course doc drift          | Update this proposal + `CHANGELOG` when scope changes                            |
| OIDC split-host / cookies | Misconfigured callback or `SameSite` breaks login; rehearse on staging URL early |

---

## 13. Open questions

- **Exercise model:** strict uniqueness per user vs catalog-only globals (current: service-enforced custom names).
- **Timezone for stats:** profile `timezone` stored; dashboard UTC-only until product says otherwise.
- **Single repo vs sibling:** keep proposal copy in sync if `workout-tracker` is cloned standalone.

---

## 14. Next actions

1. ~~**Implement OIDC/OAuth (Path A)**~~ — **Done** for hosted split deploy.
2. ~~**Report Phase 4 QA evidence**~~ — **Done** in **`docs/course-qa-evidence.md`**; **`docs/testing.md`** indexes verification.
3. **Optional (rubric / polish):** §11.F (mocked callback integration tests) and §11.G (Playwright + real IdP in CI) if you want extra automation beyond the manual checklist.
4. **Optional docs:** `docs/pwa.md`, `docs/build/*`, `docs/learning-path.md` (§7) if you want a dedicated PWA or onboarding doc.
5. **Product / next version:** new features (e.g. programs, history, notifications, export) are **out of current MVP** — add a short **§15 backlog** or a separate proposal when you pick a theme; otherwise keep shipping small PRs and update §3 + `CHANGELOG`.
6. Keep §3 **Current state** and §7 rows accurate as work lands; on scope change: edit this file + **`CHANGELOG.md`** + optional ADR under **`docs/decisions/`**.

---

## 15. Post-MVP feature backlog (slice order A)

Ship **one vertical slice per branch/PR**. Order agreed for **A**:

| #   | Slice                                                                                                                                                             | Status                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | **Workout history UX** — list filters (week/month/all, local calendar), status (all/active/completed), sort, empty states, resume when active workout is off-list | **Done** — `GET /api/workouts` query params; `WorkoutsPage` UI |
| 2   | **Export** — CSV of workouts/sets for a date range                                                                                                                | Todo                                                           |
| 3   | **Timezone-aware** dashboard week (profile timezone)                                                                                                              | Todo                                                           |
| 4   | **Exercise library** — edit/rename/archive custom, recents                                                                                                        | Todo                                                           |
| 5   | **Richer set logging** — notes, RPE, copy last set                                                                                                                | Todo                                                           |

---

## Proposal maintenance

- **Location:** `docs/proposals/workout-tracker-build-plan.md` (this file).
- **When to update:** any change to phases, deliverables, or “current state” that teammates or graders rely on.
- **Amendments:** prefer dated notes at the bottom or Git history; use ADRs for architectural forks.
