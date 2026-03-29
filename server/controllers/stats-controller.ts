/**
 * **`GET /api/stats/weekly-volume`** — aggregate volume and set count for a calendar week (optional IANA timezone).
 */
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { sendSuccess } from '@server/lib/http-response.js';
import { requireUserId } from '@server/lib/request-user.js';
import { readProfileForUser } from '@server/services/profile-service.js';
import {
  tryUnlockAchievements,
  listAchievementsForUser,
} from '@server/services/achievement-service.js';
import {
  dashboardSummaryForUser,
  resolveWeeklyVolumeWindow,
  volumeSeriesForUser,
  weeklyVolumeForUser,
} from '@server/services/stats-service.js';

const querySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** IANA zone (e.g. `America/Los_Angeles`). Omit for legacy UTC `weekStart` interpretation. */
  timezone: z.string().min(1).max(120).optional(),
});

/** GET /api/stats/weekly-volume?weekStart=YYYY-MM-DD&timezone=IANA */
export async function getWeeklyVolume(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const q = querySchema.parse(req.query);
  const { startUtc, endUtc, zoneUsed } = resolveWeeklyVolumeWindow(
    q.weekStart,
    q.timezone,
  );
  const stats = await weeklyVolumeForUser(userId, startUtc, endUtc);
  sendSuccess(res, {
    weekStart: q.weekStart,
    weekStartUtc: startUtc.toISOString(),
    weekEndUtc: endUtc.toISOString(),
    totalVolume: stats.totalVolume,
    setCount: stats.setCount,
    workoutCount: stats.workoutCount,
    ...(zoneUsed !== 'utc' ? { timezone: zoneUsed } : {}),
  });
}

const volumeSeriesQuerySchema = z.object({
  weeks: z.coerce.number().int().min(1).max(52).optional(),
  timezone: z.string().min(1).max(120).optional(),
});

/** GET /api/stats/volume-series?weeks=8&timezone=IANA */
export async function getVolumeSeries(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const q = volumeSeriesQuerySchema.parse(req.query);
  const profile = await readProfileForUser(userId);
  const tz = q.timezone?.trim() || profile?.timezone?.trim() || 'UTC';
  const weeks = q.weeks ?? 8;
  const series = await volumeSeriesForUser(userId, weeks, tz);
  sendSuccess(res, { weeks, timezone: tz, series });
}

/** GET /api/stats/summary?timezone=IANA — dashboard aggregates + achievements (unlocks evaluated). */
export async function getStatsSummary(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const q = z
    .object({ timezone: z.string().min(1).max(120).optional() })
    .parse(req.query);
  const profile = await readProfileForUser(userId);
  const tz = q.timezone?.trim() || profile?.timezone?.trim() || 'UTC';
  const summary = await dashboardSummaryForUser(userId, tz);
  await tryUnlockAchievements(userId, summary);
  const achievements = await listAchievementsForUser(userId);
  sendSuccess(res, { summary, achievements });
}
