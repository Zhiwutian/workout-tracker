# Database patterns

For a **constraint ↔ Zod ↔ API parity** matrix, see **`database-constraints.md`**.

## Sources of truth

- Drizzle schema: `server/db/schema.ts`
- SQL mirror: `database/schema.sql`
- Incremental migrations: `database/migrations/*.sql`

Keep these in parity for every schema change.

## Migration strategy

- Prefer **additive**, non-destructive migrations for hosted databases.
- Use data backfills only when needed, with explicit predicates.
- Keep the migration journal aligned (`database/migrations/meta/_journal.json`).
- Commit **`database/migrations/meta/*_snapshot.json`** when you add migrations (for example **`0002_snapshot.json`** after the workout schema) so **`drizzle-kit check`** / **`db:generate`** stay aligned.

## Constraint and index discipline

- Add checks for domain invariants (positive ids, reasonable numeric ranges).
- Index query patterns used in list/detail routes (`userId`, foreign keys, time filters).
- Use **unique** constraints where the product requires it (e.g. global **`displayName`** for demo auth on `profiles`).
- For **`exercise_types`**, custom exercise names for a user are enforced in the **service** (no composite unique with `NULL userId` for globals—see schema comment).

## Change workflow

1. Update `server/db/schema.ts`.
2. Add migration SQL (+ meta/snapshots if required).
3. Update `database/schema.sql`.
4. Update services, Zod, and shared types.
5. Add tests for conflicts, ownership, and validation.
6. Note operational impact in PR / changelog.

## Operational safety

- Hosted bootstrap: **`pnpm run db:migrate`** then **`pnpm run db:seed`**.
- **Local / intentional wipe:** **`pnpm run db:reset`** (`database/reset.sh`) drops **`drizzle`** (journal) + **`public`**, migrates, seeds — see **`docs/deployment/README.md`** before using on hosted DBs.
- Avoid destructive import/reset commands against production-like databases unless that is the explicit goal.
- Environment SSL: follow `server/config/env.ts` / deployment docs for `DATABASE_URL` and TLS.
