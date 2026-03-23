# Rules usage guide

How **Cursor** rules work in this repo and how they combine with CI.

## How rules are applied

Rules in **`.cursor/rules/*.mdc`** use frontmatter:

- `alwaysApply: true` — considered for every task.
- `globs: ...` — considered when matching files are in scope.
- `alwaysApply: false` + `globs` — focused, context-specific guidance.

Rules guide agents; **hard enforcement** comes from tooling:

1. `pnpm run lint`, `pnpm run tsc`, `pnpm run test`, `pnpm run build`
2. CI workflows under `.github/workflows/`
3. Pre-commit / team discipline

## Planning mode

- Do not run validation commands in planning mode unless the user approves execution.
- Label any cited check status as stale if not freshly run.

## Writing effective rules

- One main concern per file.
- State what to do and what to avoid.
- Point to source-of-truth docs (e.g. `docs/styleguide/security-and-authz.md`).

## Adding a new rule

1. Create **`.cursor/rules/<name>.mdc`** with `description` and optional `globs`.
2. Add a row to **`docs/rules-registry.md`**.
3. Update **`docs/development-workflow.md`** if team workflow changes.

## Project standard

- Keep only pre-commit/release rules always-on; keep domain rules glob-scoped.
- Update **`CHANGELOG.md`** when behavior or workflow changes.
