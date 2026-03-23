# Proposal: Workout Tracker — full-stack build plan

**Status:** proposal (living document)  
**Audience:** course team, future maintainers, Cursor agents  
**Related app:** this repository (`workout-tracker`)  
**Template seed:** LFZ full-stack template (aligned with **bible-support** patterns where noted)

---

## 1. Goal

Ship an educational **workout tracker** web app: users log **workouts** and **sets** (reps × weight), browse **exercises** (global catalog + custom), view **weekly volume** on a dashboard, and manage **profile** preferences. The codebase should demonstrate professional structure (layered API, Drizzle + migrations, tests, CI, docs, security-aware auth boundaries).

### Course research report alignment (CSCI 441 — Report 2, Part 3)

**Path A (chosen):** Implement **OIDC / OAuth**-backed sign-in so the running app matches the report’s **UC-1 OAuth**, security narrative (§5.5), and test plan (§3.1 — auth/session tests). **Demo JWT** may remain temporarily for local dev or behind a narrow escape hatch until cutover; document removal or demotion in `CHANGELOG` and `docs/assumptions.md`.

**Volume wording:** The report defines **Volume = Sets × Reps × Weight**. The implementation uses **Σ (reps × weight)** per logged set over the dashboard window — numerically the same when each set is stored as its own row (see **`docs/assumptions.md`**). Use that sentence in course documentation if graders want formula traceability.

**Report Phase 4 (QA, ~Mar 30–Apr 10):** Plan time for **WCAG 2.1** sampling (keyboard + screen reader), **UAT** on **three-tap logging**, cross-browser/device checks, and final **security** review on the real host (e.g. Render). Capture outcomes in-repo (see §7 — `docs/testing.md` and/or a short QA evidence note) so Part 3 §§3–5 claims stay verifiable.

## 2. Non-goals (for initial milestones)

- Native mobile apps (responsive PWA is enough unless scope expands).
- Social feeds, coaching marketplace, or program templates (unless explicitly added later).
- Medical claims or compliance beyond “student project” hygiene.

## 3. Current state (snapshot)

Use this table to reconcile the plan with the repo; update the **Status** column as work lands.

| Area                                                        | Status            | Notes                                                                                                              |
| ----------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| Domain schema (users, profiles, exercises, workouts, sets)  | **Done**          | `server/db/schema.ts`, migrations through `0002`                                                                   |
| Demo JWT auth (display name)                                | **Done**          | Replace with OIDC for production narrative                                                                         |
| REST APIs + ownership checks                                | **Done**          | IDOR tests with `TEST_DATABASE_URL`                                                                                |
| React UI (sign-in, workouts, detail, dashboard, profile)    | **Done**          |                                                                                                                    |
| Seed global exercises                                       | **Done**          | `db:seed`                                                                                                          |
| Styleguide + Cursor rules + `AGENTS.md`                     | **Done**          | Ported/adapted from bible-support template                                                                         |
| `docs/data-flow.md`                                         | **Done**          |                                                                                                                    |
| Light PWA (manifest, icons, minimal SW)                     | **Done**          |                                                                                                                    |
| Drizzle `0002` snapshot                                     | **Done**          | `database/migrations/meta/0002_snapshot.json`                                                                      |
| Playwright smoke E2E                                        | **Done**          | `e2e/smoke.spec.ts`, CI                                                                                            |
| Agent / workspace workflow (`AGENTS.md`, `CONTRIBUTING.md`) | **Done**          | Optional parent workspace (e.g. bible-support at `/workspace`); app docs/rules/changelog stay under this repo only |
| OIDC / OAuth (Auth0-class IdP)                              | **Next (Path A)** | **Current priority** — aligns Report 2 UC-1, §3.1 tests, §5.5; see §11                                             |
| Full deployment runbooks (Auth0, split host)                | **Partial**       | Stubs in `docs/deployment/`                                                                                        |
| Optional docs from original vision                          | **Partial**       | See §7 documentation map                                                                                           |

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

Functional MVP is **Done** with **demo JWT**. **Path A:** replace the primary login path with **OIDC/OAuth** for course/report alignment; until then, treat the checkbox below as **partial** for grading narrative.

- [ ] Sign up / sign in via **OAuth/OIDC** (IdP-backed) with unique identity per user. _(Demo JWT satisfies interim MVP only.)_
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
| **Phase 2** — Auth (UC-1), profile (UC-2), security audit                      | **Path A:** finish **R4** with real **OIDC**; expand tests for session/callback behavior.                   |
| **Phase 3** — Workout/set CRUD (UC-3/4), dashboard volume                      | Largely **Done** (**R5–R7**).                                                                               |
| **Phase 4** — QA: WCAG, UAT (three-tap), cross-browser/device, security/stress | **Process + evidence** — not a single PR; schedule and log outcomes (§7, §8 item 12).                       |

---

## 7. Documentation map (first-class artifacts)

Mark **Done** / **Todo** in your tracker; paths are relative to `workout-tracker/`.

| Document                                   | Purpose                                                                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `README.md`                                | Onboarding, scripts, link to proposals + contributing                                                                  |
| `AGENTS.md`                                | Commands, doc entry points, optional parent-workspace layout, copy-paste agent prompt                                  |
| `CONTRIBUTING.md`                          | PR checks, changelog/rules discipline, parent-workspace scope                                                          |
| `docs/architecture.md`                     | Runtime diagram + boundaries                                                                                           |
| `docs/data-flow.md`                        | Mermaid flows: auth, workouts, sets, stats, PWA                                                                        |
| `docs/assumptions.md`                      | UTC week, demo auth, volume definition                                                                                 |
| `docs/configuration.md`                    | Env boundaries + future OIDC vars                                                                                      |
| `docs/development-workflow.md`             | Local loop, CI, DB, E2E, PWA icons                                                                                     |
| `docs/deployment/README.md`                | Hosted bootstrap; OIDC subsection when live                                                                            |
| `docs/styleguide/*`                        | Implementation standards + **security-and-authz.md**                                                                   |
| `docs/rules-registry.md`                   | Cursor rules index                                                                                                     |
| `docs/troubleshooting.md`                  | **Todo** if course requires explicit stub (link from README)                                                           |
| `docs/testing.md`                          | **Todo** recommended for Report 2: map requirements → Vitest / Playwright / IDOR / **OIDC** tests; local + CI commands |
| `docs/pwa.md`                              | **Todo** optional: extract from `data-flow` + `development-workflow`                                                   |
| `docs/security-notes.md`                   | **Todo** recommended with OIDC: CORS, cookies, CSP vs SW, split-host auth, callback URLs                               |
| `docs/course-qa-evidence.md`               | **Todo** optional: Phase 4 checklist (WCAG sampling, UAT / three-tap, browsers/devices) for Part 3 defense             |
| `docs/decisions/0001-oidc-oauth-path-a.md` | **In progress** — Path A OIDC checklist (mirror of §11); **`docs/decisions/README.md`** indexes ADRs                   |
| `docs/build/*`                             | **Todo** optional: reproducible build / deploy steps                                                                   |
| `docs/learning-path.md`                    | **Todo** optional: student onboarding                                                                                  |
| `CHANGELOG.md`                             | **Unreleased** discipline per PR                                                                                       |

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

| Layer              | Command / trigger                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Unit / integration | `pnpm run test`                                                                                                                         |
| IDOR integration   | `TEST_DATABASE_URL=… pnpm run test:server`                                                                                              |
| E2E                | `DATABASE_URL=… pnpm run test:e2e` (browser deps per `development-workflow.md`)                                                         |
| OIDC / session     | Add after Path A: integration or E2E flows covering login callback, **me**, and protected API (document commands in `docs/testing.md`). |
| Pre-merge          | `pnpm run lint`, `pnpm run tsc`, `pnpm run build`                                                                                       |

---

## 10. Security and privacy (student-project bar)

- No secrets in client bundle (`VITE_*` non-secret only).
- No logging of tokens, `Authorization`, or raw auth bodies.
- Multi-tenant data: every mutation checks ownership (`docs/styleguide/security-and-authz.md`).
- OIDC: document callback URLs, cookie flags, and CSRF/session strategy when implemented.

---

## 11. OIDC / OAuth (Path A — **current priority**)

**Goal:** Satisfy Report 2 **UC-1**, **§5.5**, and **§3.1** (OAuth/session testing) with a real IdP (e.g. **Auth0**).

- Map IdP **`sub`** → `users.authSubject`; keep stable internal **`userId`** for foreign keys.
- Prefer **Authorization Code + PKCE** (SPA or BFF); avoid long-lived opaque tokens in `localStorage` where a **httpOnly session cookie** or server-side session is feasible for the chosen topology.
- Document **callback URLs**, **logout**, **CORS**, and **cookie** flags in `docs/configuration.md` and `docs/deployment/*` (split client/server hosts if applicable).
- **Tests:** add coverage for login/callback, session expiry edge cases, and **no client-trusted identity** (existing ownership rules stay).
- **Cutover:** remove or restrict **demo JWT** sign-up paths when OIDC is default; migration strategy for existing `demo:*` users (reset dev DB or one-off link) documented in `CHANGELOG`.
- **E2E:** extend Playwright to run a **happy-path OIDC** flow in CI only if secrets/tenant allow; otherwise document manual staging checklist in `docs/testing.md`.

**Canonical checklist:** [`docs/decisions/0001-oidc-oauth-path-a.md`](../decisions/0001-oidc-oauth-path-a.md) (keep that ADR checkboxes updated as PRs land). The same tasks are copied below for proposal readers.

### Implementation checklist (Path A)

#### A. Identity provider (Auth0-class)

- [ ] Tenant / application registered; callback, logout, and web origins match deployment topology.
- [ ] Issuer, client id, and (if used) client secret captured only in env — never committed.

#### B. Configuration and secrets

- [ ] `server/.env.example` + `client/.env.example` (public vars only) updated.
- [ ] `docs/configuration.md` and `docs/deployment/README.md` updated for OIDC + session env.

#### C. Server: OAuth routes and session

- [ ] `GET /api/auth/login` (or equivalent) redirects to IdP with PKCE.
- [ ] `GET /api/auth/callback` exchanges code, validates ID token, upserts user by `sub` → `authSubject`.
- [ ] Session established (e.g. httpOnly cookie); `authMiddleware` uses session (Bearer demo JWT optional behind `AUTH_DEMO_ENABLED` during migration).
- [ ] Logout clears session (+ optional IdP logout redirect).

#### D. Client

- [ ] Sign-in uses redirect (or approved SDK flow); API calls use `credentials: 'include'` when using cookies.
- [ ] `GET /api/me` works from session; post-login routing handles errors from callback.

#### E. Demo JWT cutover

- [ ] Demo sign-up/sign-in gated by env; production docs default demo **off**.
- [ ] `CHANGELOG` documents `demo:*` migration / dev DB reset.

#### F. Tests

- [ ] Integration tests for callback (mocked IdP) + 401 without session.
- [ ] IDOR / API tests updated for session (or test helper).
- [ ] `docs/testing.md` documents commands and manual OIDC staging if CI has no IdP secrets.

#### G. E2E

- [ ] Playwright happy path with IdP **or** documented manual E2E checklist (no production test bypass).

#### H. Docs and architecture

- [ ] `docs/data-flow.md`, `docs/architecture.md`, `docs/security-notes.md` updated.
- [ ] This proposal §3 OIDC row + §5 OAuth checkbox flipped when OIDC is primary.

#### I. ADR hygiene

- [ ] Checkboxes in **ADR 0001** kept in sync; ADR status set to **Implemented** when done.

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

1. **Implement OIDC/OAuth (Path A)** — work through §11; flip §3 row and §5 checkbox when primary login is IdP-backed.
2. Schedule **Report Phase 4** QA and write evidence (`docs/testing.md` and/or `docs/course-qa-evidence.md`).
3. Keep §3 **Current state** and §7 rows accurate as work lands.
4. Add any **missing** §7 files the rubric requires (e.g. `docs/troubleshooting.md`, `docs/security-notes.md`).
5. On scope change: edit this file + `CHANGELOG.md` + optional ADR under `docs/decisions/`.

---

## Proposal maintenance

- **Location:** `docs/proposals/workout-tracker-build-plan.md` (this file).
- **When to update:** any change to phases, deliverables, or “current state” that teammates or graders rely on.
- **Amendments:** prefer dated notes at the bottom or Git history; use ADRs for architectural forks.
