# Proposal: Workout Tracker — full-stack build plan

**Status:** proposal (living document)  
**Audience:** course team, future maintainers, Cursor agents  
**Related app:** this repository (`workout-tracker`)  
**Template seed:** LFZ full-stack template (aligned with **bible-support** patterns where noted)

---

## 1. Goal

Ship an educational **workout tracker** web app: users log **workouts** and **sets** (reps × weight), browse **exercises** (global catalog + custom), view **weekly volume** on a dashboard, and manage **profile** preferences. The codebase should demonstrate professional structure (layered API, Drizzle + migrations, tests, CI, docs, security-aware auth boundaries).

## 2. Non-goals (for initial milestones)

- Native mobile apps (responsive PWA is enough unless scope expands).
- Social feeds, coaching marketplace, or program templates (unless explicitly added later).
- Medical claims or compliance beyond “student project” hygiene.

## 3. Current state (snapshot)

Use this table to reconcile the plan with the repo; update the **Status** column as work lands.

| Area                                                        | Status       | Notes                                                                                                              |
| ----------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------ |
| Domain schema (users, profiles, exercises, workouts, sets)  | **Done**     | `server/db/schema.ts`, migrations through `0002`                                                                   |
| Demo JWT auth (display name)                                | **Done**     | Replace with OIDC for production narrative                                                                         |
| REST APIs + ownership checks                                | **Done**     | IDOR tests with `TEST_DATABASE_URL`                                                                                |
| React UI (sign-in, workouts, detail, dashboard, profile)    | **Done**     |                                                                                                                    |
| Seed global exercises                                       | **Done**     | `db:seed`                                                                                                          |
| Styleguide + Cursor rules + `AGENTS.md`                     | **Done**     | Ported/adapted from bible-support template                                                                         |
| `docs/data-flow.md`                                         | **Done**     |                                                                                                                    |
| Light PWA (manifest, icons, minimal SW)                     | **Done**     |                                                                                                                    |
| Drizzle `0002` snapshot                                     | **Done**     | `database/migrations/meta/0002_snapshot.json`                                                                      |
| Playwright smoke E2E                                        | **Done**     | `e2e/smoke.spec.ts`, CI                                                                                            |
| Agent / workspace workflow (`AGENTS.md`, `CONTRIBUTING.md`) | **Done**     | Optional parent workspace (e.g. bible-support at `/workspace`); app docs/rules/changelog stay under this repo only |
| OIDC / Auth0                                                | **Not done** | Planned final major slice                                                                                          |
| Full deployment runbooks (Auth0, split host)                | **Partial**  | Stubs in `docs/deployment/`                                                                                        |
| Optional docs from original vision                          | **Partial**  | See §7 documentation map                                                                                           |

### Agent and workspace workflow (Cursor)

Some contributors open a **parent** folder (for example the bible-support devcontainer with **`/workspace`** as the parent and **`workout-tracker/`** nested) so agents can read both trees. **Workout-tracker artifacts** — `docs/**`, `CHANGELOG.md`, `.cursor/rules/**`, and application code — must remain in **this** repository; use the parent only for shared devcontainer/infra or explicit cross-repo tasks.

- **Canonical instructions:** [`AGENTS.md`](../../AGENTS.md) (commands, copy-paste agent prompt, exceptions) and [`CONTRIBUTING.md`](../../CONTRIBUTING.md) (PR checks, scope, security).
- **Rule registry:** [`docs/rules-registry.md`](../rules-registry.md) — register new `.cursor/rules/*.mdc` files when added.

---

## 4. Stack and constraints

- **Client:** React 19, Vite 7, Tailwind 4, React Router, RHF + Zod.
- **Server:** Express 5, Drizzle ORM, PostgreSQL, Pino, Helmet, CORS, rate limits.
- **Contracts:** `shared/` for cross-boundary types; API envelope `{ data, meta }` / `{ error, meta }`.
- **Auth (current):** Bearer JWT with `userId` payload; **auth subject** on `users.authSubject` reserved for OIDC `sub`.
- **Security:** All user-owned rows scoped by server-derived `userId` — see `docs/styleguide/security-and-authz.md`.

---

## 5. Product scope (MVP acceptance)

Current tree satisfies the MVP below with **demo JWT** auth; OIDC remains the planned production slice (§11).

- [x] Sign up / sign in (demo or OIDC) with unique identity per user.
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

---

## 7. Documentation map (first-class artifacts)

Mark **Done** / **Todo** in your tracker; paths are relative to `workout-tracker/`.

| Document                       | Purpose                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `README.md`                    | Onboarding, scripts, link to proposals + contributing                                 |
| `AGENTS.md`                    | Commands, doc entry points, optional parent-workspace layout, copy-paste agent prompt |
| `CONTRIBUTING.md`              | PR checks, changelog/rules discipline, parent-workspace scope                         |
| `docs/architecture.md`         | Runtime diagram + boundaries                                                          |
| `docs/data-flow.md`            | Mermaid flows: auth, workouts, sets, stats, PWA                                       |
| `docs/assumptions.md`          | UTC week, demo auth, volume definition                                                |
| `docs/configuration.md`        | Env boundaries + future OIDC vars                                                     |
| `docs/development-workflow.md` | Local loop, CI, DB, E2E, PWA icons                                                    |
| `docs/deployment/README.md`    | Hosted bootstrap; OIDC subsection when live                                           |
| `docs/styleguide/*`            | Implementation standards + **security-and-authz.md**                                  |
| `docs/rules-registry.md`       | Cursor rules index                                                                    |
| `docs/troubleshooting.md`      | **Todo** if course requires explicit stub (link from README)                          |
| `docs/testing.md`              | **Todo** optional: Vitest + Playwright + `TEST_DATABASE_URL`                          |
| `docs/pwa.md`                  | **Todo** optional: extract from `data-flow` + `development-workflow`                  |
| `docs/security-notes.md`       | **Todo** optional: CORS, cookies, CSP vs SW, split-host auth                          |
| `docs/build/*`                 | **Todo** optional: reproducible build / deploy steps                                  |
| `docs/learning-path.md`        | **Todo** optional: student onboarding                                                 |
| `CHANGELOG.md`                 | **Unreleased** discipline per PR                                                      |

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

---

## 9. Test plan

| Layer              | Command / trigger                                                               |
| ------------------ | ------------------------------------------------------------------------------- |
| Unit / integration | `pnpm run test`                                                                 |
| IDOR integration   | `TEST_DATABASE_URL=… pnpm run test:server`                                      |
| E2E                | `DATABASE_URL=… pnpm run test:e2e` (browser deps per `development-workflow.md`) |
| Pre-merge          | `pnpm run lint`, `pnpm run tsc`, `pnpm run build`                               |

---

## 10. Security and privacy (student-project bar)

- No secrets in client bundle (`VITE_*` non-secret only).
- No logging of tokens, `Authorization`, or raw auth bodies.
- Multi-tenant data: every mutation checks ownership (`docs/styleguide/security-and-authz.md`).
- OIDC: document callback URLs, cookie flags, and CSRF/session strategy when implemented.

---

## 11. OIDC / Auth0 (planned final slice)

- Map IdP `sub` → `users.authSubject`; stable internal `userId`.
- Prefer **Authorization Code + PKCE**; session cookie or BFF pattern consistent with deployment host.
- Update `docs/configuration.md`, `docs/deployment/*`, and remove or narrow demo-only flows.
- Migration: dev DB reset or one-off linking for `demo:*` subjects if needed.

---

## 12. Risks and mitigations

| Risk                    | Mitigation                                                  |
| ----------------------- | ----------------------------------------------------------- |
| Drizzle migration drift | `drizzle-kit check`; commit snapshots with migrations       |
| IDOR regressions        | Keep `api-idor.test.ts` in CI with Postgres service         |
| PWA cache stale API     | Current SW is activation-only; document before adding cache |
| Course doc drift        | Update this proposal + `CHANGELOG` when scope changes       |

---

## 13. Open questions

- **Exercise model:** strict uniqueness per user vs catalog-only globals (current: service-enforced custom names).
- **Timezone for stats:** profile `timezone` stored; dashboard UTC-only until product says otherwise.
- **Single repo vs sibling:** keep proposal copy in sync if `workout-tracker` is cloned standalone.

---

## 14. Next actions

1. Keep §3 **Current state** and §7 rows accurate as work lands.
2. Close **OIDC** slice when ready (§11).
3. Add any **missing** §7 files your rubric explicitly requires (e.g. `docs/troubleshooting.md`, `docs/security-notes.md`).
4. On scope change: edit this file + `CHANGELOG.md` + optional ADR under `docs/decisions/`.

---

## Proposal maintenance

- **Location:** `docs/proposals/workout-tracker-build-plan.md` (this file).
- **When to update:** any change to phases, deliverables, or “current state” that teammates or graders rely on.
- **Amendments:** prefer dated notes at the bottom or Git history; use ADRs for architectural forks.
