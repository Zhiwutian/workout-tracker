# How to use this project’s documentation

This page **introduces the documentation set**. The **complete file listing** lives in **[`README.md`](./README.md)** (same folder)—treat that as the canonical **documentation index**.

## What you have

| Artifact                                       | Role                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **[`docs/README.md`](./README.md)**            | **Master index** — every doc file, grouped by topic (core, styleguide, deployment, proposals, …). |
| **This file**                                  | **Orientation** — how to choose a path through the docs; not a duplicate index.                   |
| **[`../README.md`](../README.md)** (repo root) | Product overview, install, quick commands.                                                        |
| **[`../AGENTS.md`](../AGENTS.md)**             | Commands and agent workflow; links to docs.                                                       |
| **[`../CHANGELOG.md`](../CHANGELOG.md)**       | What changed in each release; scan when upgrading or debugging regressions.                       |

## Suggested paths

**New to full-stack or this repo**

1. [`app-startup-walkthrough.md`](./app-startup-walkthrough.md) — dev servers and first requests.
2. [`data-flow.md`](./data-flow.md) — browser ↔ API ↔ DB.
3. [`styleguide/README.md`](./styleguide/README.md) — how we structure code.
4. [`security-and-authz.md`](./styleguide/security-and-authz.md) before any feature that touches user data.

**Shipping or hosting**

- [`deployment/README.md`](./deployment/README.md) — hub.
- [`configuration.md`](./configuration.md) — env vars and secrets boundaries.

**Implementing a feature**

- [`styleguide/code-patterns.md`](./styleguide/code-patterns.md) — checklist.
- [`project-structure.md`](./project-structure.md) — where files go.
- Update [`CHANGELOG.md`](../CHANGELOG.md) when behavior or workflow changes.

**Debugging tests or CI**

- [`testing.md`](./testing.md).
- Run **`pnpm run ci:local`** from the repo root (mirrors core CI gates).

## Conventions

- **Styleguides** under [`styleguide/`](./styleguide/) are normative for implementation; proposals under [`proposals/`](./proposals/) are plans or history.
- **ADRs** under [`decisions/`](./decisions/) record big architectural choices.
- **Code comments** in shared modules (`api-client`, `routes/api.ts`, `AuthContext`, …) complement these docs—read both when tracing a flow.

When in doubt, open **[`docs/README.md`](./README.md)** and search the list for your topic.
