/** PostgreSQL error shape from `pg` (and Drizzle). */
export function isPgUniqueViolation(
  err: unknown,
  constraintName?: string,
): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; constraint?: string };
  if (e.code !== '23505') return false;
  if (constraintName !== undefined && e.constraint !== constraintName) {
    return false;
  }
  return true;
}
