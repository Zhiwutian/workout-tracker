# Contributing

## Pull requests

- Run **`pnpm run lint`**, **`pnpm run tsc`**, **`pnpm run test`**, and **`pnpm run build`** before opening a PR when behavior or build output changed.
- Update **`CHANGELOG.md`** under **`[Unreleased]`** for user-visible or workflow changes.
- If you add or change **`.cursor/rules/*.mdc`**, update **`docs/rules-registry.md`** in the same PR.

## Scope when `workout-tracker` is a standalone clone

All application changes, **docs**, **rules**, and **changelog** entries for this app belong in **this repository**. No dependency on a parent template repo for CI or review.

## Working from a parent workspace (optional)

Some teams open a **parent** folder (e.g. **bible-support** devcontainer at `/workspace`) so **bible-support** and **`workout-tracker/`** are visible together for reference.

- **Artifacts for this app** still live here: `docs/**`, `CHANGELOG.md`, `.cursor/rules/**`, and code under `client/`, `server/`, `shared/`, `database/`.
- **Do not** put workout-only docs or new Cursor rules at the parent repo root unless the task is explicitly shared infrastructure (see **[`AGENTS.md`](AGENTS.md)** for exceptions and a copy-paste agent prompt).

## Security

- Do not commit **`.env`** or real secrets. Follow **`docs/configuration.md`** and **`.cursor/rules/auth-secrets-safety.mdc`**.
