/**
 * **`GET /api/stats/weekly-volume`** — aggregate volume and set count for a calendar week (optional IANA timezone).
 */
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { sendSuccess } from '@server/lib/http-response.js';
import { requireUserId } from '@server/lib/request-user.js';
import {
  resolveWeeklyVolumeWindow,
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
    ...(zoneUsed !== 'utc' ? { timezone: zoneUsed } : {}),
  });
}
