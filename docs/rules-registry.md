# Rules registry

Index of **Cursor** rule files under **`.cursor/rules/`** for **workout-tracker**.

## Purpose

- Single map of rule intent and scope.
- Auditable rule changes in PRs.
- Less duplication or conflict between rules.

## How rules fit together

| Situation               | Primary rules                                                         |
| ----------------------- | --------------------------------------------------------------------- |
| Idea / “should we…”     | `honest-feedback-on-ideas`                                            |
| Before commit           | `pre-commit-quality-gate` + `secret-commit-approval-gate`             |
| Before release / deploy | `release-readiness-checks`                                            |
| Auth, env, logging      | `auth-secrets-safety` + `backend-observability-security` (styleguide) |
| **Ownership / IDOR**    | **`authz-data-ownership`** + **`security-and-authz.md`**              |
| API / shared types      | `api-contract-discipline` + `backend-api-boundaries`                  |
| Schema / migrations     | `db-migration-safety`                                                 |
| UI / a11y               | `style-enforcement-frontend` + `frontend-accessibility-guard`         |
| MSW                     | `api-contract-discipline` (`client/src/test/handlers.ts`)             |

## Active rules

| Rule file                                    | Intent                                     | Activation         | Stage            |
| -------------------------------------------- | ------------------------------------------ | ------------------ | ---------------- |
| `pre-commit-quality-gate.mdc`                | Lint/tsc/test/build + docs/DB gates        | Always-on          | PR readiness     |
| `release-readiness-checks.mdc`               | Pre-release verification + deploy/DB notes | Always-on          | Release          |
| `secret-commit-approval-gate.mdc`            | Block secret-like commits without approval | Always-on          | Commit           |
| `honest-feedback-on-ideas.mdc`               | Direct feedback on plans/tradeoffs         | Always-on          | Planning         |
| `collaborative-flexibility-and-checkins.mdc` | Flexibility vs scope triggers              | Always-on          | Execution        |
| `auth-secrets-safety.mdc`                    | No secret leaks; safe auth logging         | Scoped globs       | Auth/env         |
| **`authz-data-ownership.mdc`**               | **Enforce `req.user` + row ownership**     | Scoped `server/**` | Backend features |
| `api-contract-discipline.mdc`                | Contracts, tests, MSW, docs stay aligned   | Scoped globs       | API changes      |
| `db-migration-safety.mdc`                    | Schema/migration parity                    | Scoped globs       | DB changes       |
| `frontend-accessibility-guard.mdc`           | A11y and UI consistency                    | Scoped globs       | Client UI        |
| `style-enforcement-frontend.mdc`             | Read styleguide before UI generation       | Scoped globs       | Client UI        |
| `backend-api-boundaries.mdc`                 | Layering + boundaries in `server/`         | Scoped globs       | Server           |

## Update workflow

1. Add or edit **`.cursor/rules/*.mdc`**.
2. Update this registry in the same PR.
3. If workflow changes, update **`docs/development-workflow.md`**.

## Planning mode

- Pre-commit/release commands are deferred in planning mode unless the user approves execution.
- Always-on rules are **gates** in execution mode, not automatic command runs in planning mode.
