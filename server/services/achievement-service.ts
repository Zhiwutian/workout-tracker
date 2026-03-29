import { eq, sql } from 'drizzle-orm';
import { DbClient, getDrizzleDb } from '@server/db/drizzle.js';
import { userAchievements, workoutSets, workouts } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import type { DashboardSummary } from '@server/services/stats-service.js';

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

export const BADGE_IDS = [
  'first_log',
  'streak_3',
  'streak_7',
  'volume_week_10k',
] as const;
export type BadgeId = (typeof BADGE_IDS)[number];

export type AchievementRow = {
  badgeId: string;
  unlockedAt: string;
};

async function userHasAnyLoggedSet(userId: number): Promise<boolean> {
  const db = requireDb();
  const [row] = await db
    .select({ c: sql<number>`count(${workoutSets.setId})::int` })
    .from(workoutSets)
    .innerJoin(workouts, eq(workoutSets.workoutId, workouts.workoutId))
    .where(eq(workouts.userId, userId));
  return Number(row?.c ?? 0) > 0;
}

export async function listAchievementsForUser(
  userId: number,
): Promise<AchievementRow[]> {
  const db = requireDb();
  const rows = await db
    .select({
      badgeId: userAchievements.badgeId,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
  return rows.map((r) => ({
    badgeId: r.badgeId,
    unlockedAt: r.unlockedAt.toISOString(),
  }));
}

/**
 * Idempotent unlock checks driven from dashboard summary + a light DB probe.
 */
export async function tryUnlockAchievements(
  userId: number,
  summary: DashboardSummary,
): Promise<void> {
  const db = requireDb();
  const candidates: string[] = [];

  if (await userHasAnyLoggedSet(userId)) {
    candidates.push('first_log');
  }
  if (summary.streakDays >= 3) {
    candidates.push('streak_3');
  }
  if (summary.streakDays >= 7) {
    candidates.push('streak_7');
  }
  if (summary.currentWeek.totalVolume >= 10_000) {
    candidates.push('volume_week_10k');
  }

  for (const badgeId of candidates) {
    await db
      .insert(userAchievements)
      .values({ userId, badgeId })
      .onConflictDoNothing();
  }
}
