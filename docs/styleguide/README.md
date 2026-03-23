# Styleguide

Implementation-focused guides for UI conventions, architecture patterns, and extension workflows for **workout-tracker**.

## Documents

- `ui-styleguide.md` — UI tokens (as they evolve), accessibility, and component styling conventions
- `code-patterns.md` — Cross-stack layering, contracts, and extension checklists
- `frontend-patterns.md` — Frontend structure, state, API, and composition patterns
- `backend-patterns.md` — Routes, controllers, services, **auth context**, rate limits
- `security-and-authz.md` — **Data ownership, IDOR prevention, and auth boundaries** (read before new mutations)
- `database-patterns.md` — Drizzle schema, SQL parity, migrations
- `database-constraints.md` — Check/index ↔ Zod ↔ contract parity for this app’s tables
- `backend-observability-security.md` — Logging, rate limits, health routes, security checklist

## How to use

- Before a new feature, read `code-patterns.md`, `security-and-authz.md`, and the stack-specific pattern file(s).
- Prefer extending existing patterns over new architectural styles.
- When architecture or behavior changes, update the relevant styleguide (and `CHANGELOG.md`) in the same PR.
