import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { DateTime, Info } from 'luxon';
import { DbClient, getDrizzleDb } from '@server/db/drizzle.js';
import { workoutSets, workouts } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import {
  lastNMondayWeekStarts,
  mondayWeekStartYmdInZone,
} from '@server/lib/week-helpers.js';

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

/**
 * Resolve [startUtc, endUtc) for weekly volume.
 * - **No timezone / UTC / Etc/UTC:** `weekStart` is **UTC** midnight (legacy behavior).
 * - **IANA timezone:** `weekStart` is **YYYY-MM-DD** at **00:00 local** in that zone; window is **7 days**
 *   (same as Monday→next Monday when the client sends the Monday date).
 */
export function resolveWeeklyVolumeWindow(
  weekStartYmd: string,
  timeZone: string | undefined,
): { startUtc: Date; endUtc: Date; zoneUsed: 'utc' | string } {
  const trimmed = timeZone?.trim();
  if (!trimmed || trimmed === 'UTC' || trimmed === 'Etc/UTC') {
    const start = parseUtcWeekStart(weekStartYmd);
    return {
      startUtc: start,
      endUtc: addUtcDays(start, 7),
      zoneUsed: 'utc',
    };
  }

  if (!Info.isValidIANAZone(trimmed)) {
    throw new ClientError(400, 'invalid timezone');
  }

  const start = DateTime.fromFormat(weekStartYmd.trim(), 'yyyy-MM-dd', {
    zone: trimmed,
  }).startOf('day');
  if (!start.isValid) {
    throw new ClientError(400, 'invalid weekStart for timezone');
  }
  const end = start.plus({ weeks: 1 });
  return {
    startUtc: start.toUTC().toJSDate(),
    endUtc: end.toUTC().toJSDate(),
    zoneUsed: trimmed,
  };
}

export type WeeklyVolumeFilter = {
  /** When set, only sets on workouts of this type (e.g. `resistance`). */
  workoutType?: string;
};

/** Sum of (reps × weight) for non-warmup sets; distinct workout count among those rows. */
export async function weeklyVolumeForUser(
  userId: number,
  weekStart: Date,
  weekEnd: Date,
  filter?: WeeklyVolumeFilter,
): Promise<{
  totalVolume: number;
  setCount: number;
  workoutCount: number;
}> {
  const db = requireDb();
  const typeCond = filter?.workoutType
    ? eq(workouts.workoutType, filter.workoutType)
    : undefined;
  const [row] = await db
    .select({
      totalVolume: sql<number>`coalesce(sum(${workoutSets.reps} * ${workoutSets.weight}), 0)::float`,
      setCount: sql<number>`count(${workoutSets.setId})::int`,
      workoutCount: sql<number>`count(distinct ${workouts.workoutId})::int`,
    })
    .from(workoutSets)
    .innerJoin(workouts, eq(workoutSets.workoutId, workouts.workoutId))
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, weekStart),
        lt(workouts.startedAt, weekEnd),
        eq(workoutSets.isWarmup, false),
        typeCond,
      ),
    );

  return {
    totalVolume: Number(row?.totalVolume ?? 0),
    setCount: Number(row?.setCount ?? 0),
    workoutCount: Number(row?.workoutCount ?? 0),
  };
}

/** Workouts with `startedAt` in [start, end), optional type filter. */
export async function workoutsStartedCount(
  userId: number,
  startUtc: Date,
  endUtc: Date,
  filter?: WeeklyVolumeFilter,
): Promise<number> {
  const db = requireDb();
  const typeCond = filter?.workoutType
    ? eq(workouts.workoutType, filter.workoutType)
    : undefined;
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, startUtc),
        lt(workouts.startedAt, endUtc),
        typeCond,
      ),
    );
  return Number(row?.c ?? 0);
}

/** Distinct local calendar days (in `timeZone`) with at least one workout start in the window. */
export async function activeLocalDaysCount(
  userId: number,
  startUtc: Date,
  endUtc: Date,
  timeZone: string,
): Promise<number> {
  const db = requireDb();
  const tz =
    timeZone.trim() && Info.isValidIANAZone(timeZone.trim())
      ? timeZone.trim()
      : 'UTC';
  const rows = await db
    .select({ startedAt: workouts.startedAt })
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, startUtc),
        lt(workouts.startedAt, endUtc),
      ),
    );
  const days = new Set<string>();
  for (const r of rows) {
    const ymd = DateTime.fromJSDate(r.startedAt, { zone: 'utc' })
      .setZone(tz)
      .toFormat('yyyy-MM-dd');
    days.add(ymd);
  }
  return days.size;
}

/**
 * Consecutive calendar days (in `timeZone`) with at least one workout, counting backward from today
 * (or from yesterday when today has no workout).
 */
export async function computeWorkoutDayStreak(
  userId: number,
  timeZone: string,
): Promise<number> {
  const db = requireDb();
  const tz =
    timeZone.trim() && Info.isValidIANAZone(timeZone.trim())
      ? timeZone.trim()
      : 'UTC';
  const since = DateTime.now().minus({ days: 400 }).toUTC().toJSDate();
  const rows = await db
    .select({ startedAt: workouts.startedAt })
    .from(workouts)
    .where(and(eq(workouts.userId, userId), gte(workouts.startedAt, since)));
  const daySet = new Set<string>();
  for (const r of rows) {
    const ymd = DateTime.fromJSDate(r.startedAt, { zone: 'utc' })
      .setZone(tz)
      .toFormat('yyyy-MM-dd');
    daySet.add(ymd);
  }
  let cursor = DateTime.now().setZone(tz).startOf('day');
  const todayYmd = cursor.toFormat('yyyy-MM-dd');
  if (!daySet.has(todayYmd)) {
    cursor = cursor.minus({ days: 1 });
  }
  let streak = 0;
  while (daySet.has(cursor.toFormat('yyyy-MM-dd'))) {
    streak += 1;
    cursor = cursor.minus({ days: 1 });
  }
  return streak;
}

export type VolumeSeriesRow = {
  weekStart: string;
  totalVolume: number;
  setCount: number;
  workoutCount: number;
};

export async function volumeSeriesForUser(
  userId: number,
  weekCount: number,
  timeZone: string | null | undefined,
): Promise<VolumeSeriesRow[]> {
  const tz = timeZone?.trim() || 'UTC';
  const starts = lastNMondayWeekStarts(weekCount, tz);
  const out: VolumeSeriesRow[] = [];
  for (const ws of starts) {
    const { startUtc, endUtc } = resolveWeeklyVolumeWindow(
      ws,
      tz === 'UTC' || tz === 'Etc/UTC' ? undefined : tz,
    );
    const stats = await weeklyVolumeForUser(userId, startUtc, endUtc);
    const wc = await workoutsStartedCount(userId, startUtc, endUtc);
    out.push({
      weekStart: ws,
      totalVolume: stats.totalVolume,
      setCount: stats.setCount,
      workoutCount: wc,
    });
  }
  return out;
}

export type DashboardSummary = {
  timezone: string;
  currentWeekStart: string;
  previousWeekStart: string;
  currentWeek: {
    totalVolume: number;
    setCount: number;
    workoutCount: number;
  };
  previousWeek: {
    totalVolume: number;
    setCount: number;
    workoutCount: number;
  };
  streakDays: number;
  activeDaysThisWeek: number;
};

export async function dashboardSummaryForUser(
  userId: number,
  profileTimezone: string | null | undefined,
): Promise<DashboardSummary> {
  const tz = profileTimezone?.trim() || 'UTC';
  const currentWeekStart = mondayWeekStartYmdInZone(tz);
  const zoneArg = tz === 'UTC' || tz === 'Etc/UTC' ? undefined : tz;
  const curWin = resolveWeeklyVolumeWindow(currentWeekStart, zoneArg);
  const prevStart = DateTime.fromFormat(currentWeekStart, 'yyyy-MM-dd', {
    zone: tz === 'UTC' || tz === 'Etc/UTC' ? 'utc' : tz,
  })
    .minus({ weeks: 1 })
    .toFormat('yyyy-MM-dd');
  const prevWin = resolveWeeklyVolumeWindow(prevStart, zoneArg);
  const [cur, prev, streak, activeDays] = await Promise.all([
    weeklyVolumeForUser(userId, curWin.startUtc, curWin.endUtc),
    weeklyVolumeForUser(userId, prevWin.startUtc, prevWin.endUtc),
    computeWorkoutDayStreak(userId, tz),
    activeLocalDaysCount(userId, curWin.startUtc, curWin.endUtc, tz),
  ]);
  const [curWc, prevWc] = await Promise.all([
    workoutsStartedCount(userId, curWin.startUtc, curWin.endUtc),
    workoutsStartedCount(userId, prevWin.startUtc, prevWin.endUtc),
  ]);
  return {
    timezone: tz,
    currentWeekStart,
    previousWeekStart: prevStart,
    currentWeek: {
      totalVolume: cur.totalVolume,
      setCount: cur.setCount,
      workoutCount: curWc,
    },
    previousWeek: {
      totalVolume: prev.totalVolume,
      setCount: prev.setCount,
      workoutCount: prevWc,
    },
    streakDays: streak,
    activeDaysThisWeek: activeDays,
  };
}
