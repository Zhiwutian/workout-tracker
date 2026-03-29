import { and, desc, eq, gte, lt } from 'drizzle-orm';
import { DateTime, Info } from 'luxon';
import { DbClient, getDrizzleDb } from '@server/db/drizzle.js';
import { goalPeriods, goals, workouts } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import { mondayWeekStartYmdInZone } from '@server/lib/week-helpers.js';
import {
  activeLocalDaysCount,
  resolveWeeklyVolumeWindow,
  weeklyVolumeForUser,
  workoutsStartedCount,
  type WeeklyVolumeFilter,
} from '@server/services/stats-service.js';

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

export const GOAL_TYPES = [
  'weekly_volume',
  'workouts_per_week',
  'active_days_per_week',
] as const;
export type GoalType = (typeof GOAL_TYPES)[number];

export const PERIOD_STATUSES = [
  'pending',
  'met',
  'missed',
  'cancelled',
] as const;
export type PeriodStatus = (typeof PERIOD_STATUSES)[number];

function effectiveTimezone(
  goalTz: string | null | undefined,
  profileTz: string,
): string {
  const g = goalTz?.trim();
  if (g && Info.isValidIANAZone(g)) return g;
  return profileTz.trim() || 'UTC';
}

function typeFilter(
  workoutTypeFilter: string | null | undefined,
): WeeklyVolumeFilter | undefined {
  const w = workoutTypeFilter?.trim();
  if (!w) return undefined;
  return { workoutType: w };
}

async function measureProgress(
  db: DbClient,
  userId: number,
  goalType: string,
  targetValue: number,
  workoutTypeFilter: string | null | undefined,
  periodStartUtc: Date,
  periodEndUtc: Date,
  tz: string,
): Promise<number> {
  const f = typeFilter(workoutTypeFilter);
  switch (goalType as GoalType) {
    case 'weekly_volume': {
      const { totalVolume } = await weeklyVolumeForUser(
        userId,
        periodStartUtc,
        periodEndUtc,
        f,
      );
      return totalVolume;
    }
    case 'workouts_per_week': {
      return await workoutsStartedCount(
        userId,
        periodStartUtc,
        periodEndUtc,
        f,
      );
    }
    case 'active_days_per_week': {
      if (f?.workoutType) {
        return await activeLocalDaysWithWorkoutType(
          db,
          userId,
          periodStartUtc,
          periodEndUtc,
          tz,
          f.workoutType,
        );
      }
      return await activeLocalDaysCount(
        userId,
        periodStartUtc,
        periodEndUtc,
        tz,
      );
    }
    default:
      throw new ClientError(400, 'invalid goal type');
  }
}

async function activeLocalDaysWithWorkoutType(
  db: DbClient,
  userId: number,
  startUtc: Date,
  endUtc: Date,
  timeZone: string,
  workoutType: string,
): Promise<number> {
  const tz =
    timeZone.trim() && Info.isValidIANAZone(timeZone.trim())
      ? timeZone.trim()
      : 'UTC';
  const wrows = await db
    .select({ startedAt: workouts.startedAt })
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, startUtc),
        lt(workouts.startedAt, endUtc),
        eq(workouts.workoutType, workoutType),
      ),
    );
  const days = new Set<string>();
  for (const r of wrows) {
    const ymd = DateTime.fromJSDate(r.startedAt, { zone: 'utc' })
      .setZone(tz)
      .toFormat('yyyy-MM-dd');
    days.add(ymd);
  }
  return days.size;
}

async function finalizeEndedPeriods(
  db: DbClient,
  userId: number,
  profileTz: string,
): Promise<void> {
  const now = new Date();
  const goalRows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));

  for (const g of goalRows) {
    const tz = effectiveTimezone(g.timezone, profileTz);
    const pending = await db
      .select()
      .from(goalPeriods)
      .where(
        and(
          eq(goalPeriods.goalId, g.goalId),
          eq(goalPeriods.status, 'pending'),
          lt(goalPeriods.periodEndUtc, now),
        ),
      );

    for (const p of pending) {
      const progress = await measureProgress(
        db,
        userId,
        g.goalType,
        g.targetValue,
        g.workoutTypeFilter,
        p.periodStartUtc,
        p.periodEndUtc,
        tz,
      );
      const status: PeriodStatus = progress >= g.targetValue ? 'met' : 'missed';
      await db
        .update(goalPeriods)
        .set({ status, progressValue: progress })
        .where(eq(goalPeriods.periodId, p.periodId));
    }
  }
}

async function ensureCurrentPeriod(
  db: DbClient,
  goalRow: typeof goals.$inferSelect,
  profileTz: string,
): Promise<void> {
  const tz = effectiveTimezone(goalRow.timezone, profileTz);
  const weekStartYmd = mondayWeekStartYmdInZone(tz);
  const zoneArg = tz === 'UTC' || tz === 'Etc/UTC' ? undefined : tz;
  const { startUtc, endUtc } = resolveWeeklyVolumeWindow(weekStartYmd, zoneArg);

  const existing = await db
    .select()
    .from(goalPeriods)
    .where(
      and(
        eq(goalPeriods.goalId, goalRow.goalId),
        eq(goalPeriods.periodStartUtc, startUtc),
      ),
    )
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(goalPeriods).values({
    goalId: goalRow.goalId,
    periodStartUtc: startUtc,
    periodEndUtc: endUtc,
    weekStartYmd,
    status: 'pending',
    progressValue: null,
  });
}

export type GoalWithProgress = {
  id: number;
  goalType: string;
  targetValue: number;
  workoutTypeFilter: string | null;
  timezone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  currentPeriod: {
    periodStartUtc: string;
    periodEndUtc: string;
    status: string;
    progressValue: number | null;
    progress: number;
  } | null;
};

export async function listGoalsWithProgress(
  userId: number,
  profileTz: string,
): Promise<GoalWithProgress[]> {
  const db = requireDb();
  await finalizeEndedPeriods(db, userId, profileTz);

  const goalRows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(desc(goals.createdAt));

  const out: GoalWithProgress[] = [];

  for (const g of goalRows) {
    if (g.isActive) {
      await ensureCurrentPeriod(db, g, profileTz);
    }
    const tz = effectiveTimezone(g.timezone, profileTz);
    const weekStartYmd = mondayWeekStartYmdInZone(tz);
    const zoneArg = tz === 'UTC' || tz === 'Etc/UTC' ? undefined : tz;
    const { startUtc } = resolveWeeklyVolumeWindow(weekStartYmd, zoneArg);

    const periods = await db
      .select()
      .from(goalPeriods)
      .where(
        and(
          eq(goalPeriods.goalId, g.goalId),
          eq(goalPeriods.periodStartUtc, startUtc),
        ),
      )
      .limit(1);

    let currentPeriod: GoalWithProgress['currentPeriod'] = null;
    if (periods[0]) {
      const p = periods[0];
      const progress = await measureProgress(
        db,
        userId,
        g.goalType,
        g.targetValue,
        g.workoutTypeFilter,
        p.periodStartUtc,
        p.periodEndUtc,
        tz,
      );
      currentPeriod = {
        periodStartUtc: p.periodStartUtc.toISOString(),
        periodEndUtc: p.periodEndUtc.toISOString(),
        status: p.status,
        progressValue: p.progressValue,
        progress,
      };
    }

    out.push({
      id: g.goalId,
      goalType: g.goalType,
      targetValue: g.targetValue,
      workoutTypeFilter: g.workoutTypeFilter,
      timezone: g.timezone,
      isActive: g.isActive,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
      currentPeriod,
    });
  }

  return out;
}

export async function createGoal(
  userId: number,
  input: {
    goalType: GoalType;
    targetValue: number;
    workoutTypeFilter?: string | null;
    timezone?: string | null;
  },
  profileTz: string,
): Promise<GoalWithProgress> {
  const db = requireDb();
  if (!GOAL_TYPES.includes(input.goalType)) {
    throw new ClientError(400, 'invalid goal type');
  }
  if (!Number.isFinite(input.targetValue) || input.targetValue <= 0) {
    throw new ClientError(400, 'targetValue must be a positive number');
  }

  const targetValue =
    input.goalType === 'weekly_volume'
      ? input.targetValue
      : Math.round(input.targetValue);

  const [inserted] = await db
    .insert(goals)
    .values({
      userId,
      goalType: input.goalType,
      targetValue,
      workoutTypeFilter: input.workoutTypeFilter?.trim() || null,
      timezone: input.timezone?.trim() || null,
      isActive: true,
    })
    .returning();

  if (!inserted) {
    throw new ClientError(500, 'failed to create goal');
  }

  await ensureCurrentPeriod(db, inserted, profileTz);
  const list = await listGoalsWithProgress(userId, profileTz);
  const found = list.find((x) => x.id === inserted.goalId);
  if (!found) {
    throw new ClientError(500, 'goal not found after create');
  }
  return found;
}

export async function updateGoal(
  userId: number,
  goalId: number,
  patch: {
    targetValue?: number;
    isActive?: boolean;
    workoutTypeFilter?: string | null;
    timezone?: string | null;
  },
  profileTz: string,
): Promise<GoalWithProgress | null> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(goals)
    .where(and(eq(goals.goalId, goalId), eq(goals.userId, userId)))
    .limit(1);
  if (!rows[0]) return null;

  const updates: Partial<typeof goals.$inferInsert> = {};
  if (patch.targetValue !== undefined) {
    if (!Number.isFinite(patch.targetValue) || patch.targetValue <= 0) {
      throw new ClientError(400, 'targetValue must be a positive number');
    }
    const gt = rows[0].goalType as GoalType;
    updates.targetValue =
      gt === 'weekly_volume'
        ? patch.targetValue
        : Math.round(patch.targetValue);
  }
  if (patch.isActive !== undefined) {
    updates.isActive = patch.isActive;
  }
  if (patch.workoutTypeFilter !== undefined) {
    const w = patch.workoutTypeFilter?.trim();
    updates.workoutTypeFilter = w || null;
  }
  if (patch.timezone !== undefined) {
    const z = patch.timezone?.trim();
    if (z && !Info.isValidIANAZone(z)) {
      throw new ClientError(400, 'invalid timezone');
    }
    updates.timezone = z || null;
  }

  if (Object.keys(updates).length > 0) {
    await db.update(goals).set(updates).where(eq(goals.goalId, goalId));
  }

  const list = await listGoalsWithProgress(userId, profileTz);
  return list.find((x) => x.id === goalId) ?? null;
}

export async function deleteGoal(
  userId: number,
  goalId: number,
  _profileTz: string,
): Promise<boolean> {
  const db = requireDb();
  const rows = await db
    .select({ goalId: goals.goalId })
    .from(goals)
    .where(and(eq(goals.goalId, goalId), eq(goals.userId, userId)))
    .limit(1);
  if (!rows[0]) return false;
  await db.delete(goals).where(eq(goals.goalId, goalId));
  return true;
}
