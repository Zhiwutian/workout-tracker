type PgErr = { code?: string; constraint?: string; cause?: unknown };

/** Walk `Error` / `Error.cause` (Drizzle wraps `pg` errors in `DrizzleQueryError`). */
function walkErrorChain(err: unknown, visit: (obj: object) => void): void {
  let current: unknown = err;
  const seen = new Set<unknown>();
  for (let i = 0; i < 15 && current && typeof current === 'object'; i++) {
    if (seen.has(current)) break;
    seen.add(current);
    visit(current as object);
    const e = current as { cause?: unknown };
    if (e.cause !== undefined && e.cause !== null) {
      current = e.cause;
      continue;
    }
    break;
  }
}

/**
 * Map common PostgreSQL / connection failures to a short hint for API responses.
 * Returns `undefined` when the error should fall through as an unexpected 500.
 */
export function getDbFailureHint(err: unknown): string | undefined {
  const codes = new Set<string>();
  walkErrorChain(err, (obj) => {
    const c = (obj as { code?: unknown }).code;
    if (typeof c === 'string') codes.add(c);
  });
  if (codes.has('42P01')) {
    return 'database schema is missing or out of date. run `pnpm run db:migrate` against DATABASE_URL (see server/.env).';
  }
  if (codes.has('ECONNREFUSED') || codes.has('ETIMEDOUT')) {
    return 'cannot connect to PostgreSQL. ensure the database is running and DATABASE_URL in server/.env is correct.';
  }
  if (codes.has('ENOTFOUND')) {
    return 'database host could not be resolved. check DATABASE_URL in server/.env.';
  }
  if (codes.has('28P01')) {
    return 'PostgreSQL rejected the credentials in DATABASE_URL.';
  }
  if (codes.has('3D000')) {
    return 'the database name in DATABASE_URL does not exist on the server.';
  }
  return undefined;
}

/** Walk `Error.cause` (Drizzle wraps `pg` errors in `DrizzleQueryError`). */
function eachPgErrorInChain(err: unknown): PgErr[] {
  const out: PgErr[] = [];
  let current: unknown = err;
  const seen = new Set<unknown>();
  for (let i = 0; i < 15 && current && typeof current === 'object'; i++) {
    if (seen.has(current)) break;
    seen.add(current);
    const e = current as PgErr;
    out.push(e);
    if (e.cause !== undefined && e.cause !== null) {
      current = e.cause;
      continue;
    }
    break;
  }
  return out;
}

/** PostgreSQL error shape from `pg` (and Drizzle). */
export function isPgUniqueViolation(
  err: unknown,
  constraintName?: string,
): boolean {
  const chain = eachPgErrorInChain(err);
  const uniqueHits = chain.filter((e) => e.code === '23505');
  if (uniqueHits.length === 0) return false;
  if (constraintName === undefined) return true;
  return uniqueHits.some((h) => h.constraint === constraintName);
}
