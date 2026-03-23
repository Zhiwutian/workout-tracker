import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { DbClient, getDrizzleDb } from '@server/db/drizzle.js';
import { workoutSets, workouts } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';

function requireDb(): DbClient {
  const db = getDrizzleDb();
  if (!db) {
    throw new ClientError(
      503,
      'database is not configured. set DATABASE_URL and run migrations.',
    );
  }
  return db;
}

/**
 * Parse `YYYY-MM-DD` as UTC midnight start-of-day.
 * Weekly window: [weekStartUtc, weekStartUtc + 7 days) — document in docs/assumptions.md.
 */
export function parseUtcWeekStart(isoDate: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) {
    throw new ClientError(400, 'weekStart must be YYYY-MM-DD');
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo, d, 0, 0, 0, 0));
  if (Number.isNaN(dt.getTime())) {
    throw new ClientError(400, 'invalid weekStart date');
  }
  return dt;
}

export function addUtcDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Sum of (reps × weight) for all sets on workouts started in [weekStart, weekEnd). */
export async function weeklyVolumeForUser(
  userId: number,
  weekStart: Date,
  weekEnd: Date,
): Promise<{ totalVolume: number; setCount: number }> {
  const db = requireDb();
  const [row] = await db
    .select({
      totalVolume: sql<number>`coalesce(sum(${workoutSets.reps} * ${workoutSets.weight}), 0)::float`,
      setCount: sql<number>`count(${workoutSets.setId})::int`,
    })
    .from(workoutSets)
    .innerJoin(workouts, eq(workoutSets.workoutId, workouts.workoutId))
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, weekStart),
        lt(workouts.startedAt, weekEnd),
      ),
    );

  return {
    totalVolume: Number(row?.totalVolume ?? 0),
    setCount: Number(row?.setCount ?? 0),
  };
}
