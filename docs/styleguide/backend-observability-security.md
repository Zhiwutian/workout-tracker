# Backend observability and security

Standards for logs, rate limits, health checks, and safe dependency practices. Pairs with **`backend-patterns.md`** and **`security-and-authz.md`**.

## Logging (privacy-safe)

**Do not log**

- **JWTs**, **Authorization** headers, raw **sign-up** bodies beyond coarse metrics, or secrets.
- Entire **`req.body`** on auth routes.

**Preferred structured fields**

- Counts, durations (`durationMs`), and coarse flags.
- Internal ids only when needed for debugging (**`userId`** sparingly; follow retention policy).
- Error classes without echoing raw user input in bulk.

Use the existing **Pino** logger patterns in the server; avoid `console.log` for production code paths.

## Rate limiting

Configured in **`server/app.ts`** using **`RATE_LIMIT_WINDOW_MS`**, **`RATE_LIMIT_MAX`** (reads), and **`RATE_LIMIT_WRITE_MAX`** (writes).

**When raising limits**

- Confirm the need with realistic UI usage; prefer **debouncing** and **idempotent** handlers first.
- Document changes in **`CHANGELOG.md`** and deployment env notes.

## Health and readiness

| Route                 | Use                                           |
| --------------------- | --------------------------------------------- |
| **`GET /api/health`** | Liveness; cheap checks.                       |
| **`GET /api/ready`**  | Readiness; DB when **`DATABASE_URL`** is set. |

## Security checklist (recurring)

- **Helmet**, **CORS**, and **`trust proxy`** remain correct after hosting changes (`server/app.ts`).
- **JWT**: **`TOKEN_SECRET`** is strong in production; tokens are not logged.
- **Multi-tenant data**: every mutation verifies **resource ownership** (`security-and-authz.md`).
- **SQL**: Drizzle query builder only; no string-concat SQL with user input.
- **OIDC (future)**: callback URLs, cookie flags, and CSRF/session policy documented in **`docs/configuration.md`** when wired.

## Supply chain

- Run **`pnpm audit --audit-level high`** before large dependency or auth changes.
- Align with any scheduled audit workflow in **`.github/workflows/`** if present.

## Seeds

- **`pnpm run db:seed`** (`server/scripts/seed.ts`) seeds **global** `exercise_types`. Update the script when seed data or required columns change.
