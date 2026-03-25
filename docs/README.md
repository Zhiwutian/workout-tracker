# Documentation index

Project documentation for **workout-tracker**: structure, runtime behavior, workflow, and implementation standards.

## Core docs

- **`architecture.md`** — Architecture, request lifecycle, boundaries
- **`project-structure.md`** — Directories and where to add code
- **`development-workflow.md`** — Local setup, DB, CI, branching, **styleguide + Cursor rules** pointers
- **`app-startup-walkthrough.md`** — From `pnpm run dev` to first UI/API calls
- **`assumptions.md`** — UTC stats window, OIDC + demo + guest auth, volume definition
- **`configuration.md`** — Env files, secrets boundaries, OIDC/session variables
- **`deployment/README.md`** — Main hub: Vercel + Render + Neon (bible-support split), OIDC env
- **`deployment/vercel-render.md`** — Split-host checklist (`VITE_API_BASE_URL`, cookies, CORS)
- **`deployment/render-neon.md`** — Optional Render-only monolith
- **`deployment/neon-account-setup.md`**, **`deployment/render-account-setup.md`**, **`deployment/vercel-account-setup.md`**
- **`deployment/auth0-setup.md`** — Auth0 dashboard walkthrough (callbacks, secrets, local vs prod)
- **`data-flow.md`** — Auth (OIDC, demo, guest), API, DB, and PWA notes (sequence diagrams)
- **`testing.md`** — Test commands, IDOR env, OIDC manual staging, E2E notes
- **`security-notes.md`** — Cookies, CORS, callbacks, CSP/SW pointers

## Styleguide (`docs/styleguide/`)

Implementation standards aligned with the parent **bible-support** template, adapted for this app:

- **`styleguide/README.md`** — Index of all styleguide files
- **`styleguide/code-patterns.md`** — Cross-stack layering and checklists
- **`styleguide/frontend-patterns.md`** — Client structure, state, API
- **`styleguide/backend-patterns.md`** — Routes, controllers, services, JWT context
- **`styleguide/security-and-authz.md`** — **Identity, ownership, IDOR prevention** (required reading for mutations)
- **`styleguide/database-patterns.md`** — Migrations and schema workflow
- **`styleguide/database-constraints.md`** — Zod ↔ DB parity for workout tables
- **`styleguide/ui-styleguide.md`** — UI tokens and conventions
- **`styleguide/backend-observability-security.md`** — Logging, rate limits, security checklist

## Rules and agents

- **`rules-registry.md`** — Index of **`.cursor/rules/*.mdc`**
- **`rules-usage-guide.md`** — How rules interact with CI and planning mode
- **`AGENTS.md`** (repository root) — Contributor command summary for agents and humans

## Architecture decisions (`docs/decisions/`)

- **`decisions/README.md`** — ADR index
- **`decisions/0001-oidc-oauth-path-a.md`** — OIDC/OAuth (Path A): context, decision, and **implementation checklist**

## Proposals (`docs/proposals/`)

- **`proposals/README.md`** — Index of forward-looking plans
- **`proposals/workout-tracker-build-plan.md`** — Master build plan (phases, agent/workspace workflow, OIDC §11 checklist + ADR link, deliverables)

Contributor expectations and parent-workspace rules: **[`../CONTRIBUTING.md`](../CONTRIBUTING.md)** and **[`../AGENTS.md`](../AGENTS.md)**.

## Templates

- **`templates/feature-doc-template.md`** — Feature documentation scaffold

## Maintenance

- Update **`docs/`** and **`CHANGELOG.md`** in the same PR as behavior or workflow changes.
- When adding APIs, update **`docs/styleguide/database-constraints.md`** if validation or DB rules change.

## Changelog

See root **`CHANGELOG.md`**. Add entries under **`## [Unreleased]`** (`Added` / `Changed` / `Fixed` / `Removed`).

## Test changed script

```sh
pnpm run test:changed
TEST_CHANGED_BASE=origin/main pnpm run test:changed
```

## Comment standards

Use comments for maintainability, not to restate obvious code. JSDoc on exported functions and non-trivial helpers; inline comments for non-obvious control flow or safety. Update comments when behavior changes.

## Tailwind and imports

- Prefer Tailwind utilities in `client/src`; keep `index.css` minimal until shared tokens grow.
- Prefer `@/` (client), `@server/` (server), `@shared/` (shared).

## Frontend state and forms

- **react-hook-form** + **zod** for forms.
- Keep feature schemas near features (e.g. `client/src/features/auth/`).
- Context for auth; local state for page-owned UI; avoid unnecessary global stores.
