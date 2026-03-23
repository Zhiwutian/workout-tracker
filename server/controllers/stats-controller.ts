import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { sendSuccess } from '@server/lib/http-response.js';
import {
  addUtcDays,
  parseUtcWeekStart,
  weeklyVolumeForUser,
} from '@server/services/stats-service.js';

const querySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** GET /api/stats/weekly-volume?weekStart=YYYY-MM-DD (UTC week window). */
export async function getWeeklyVolume(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error('auth middleware required');
    const q = querySchema.parse(req.query);
    const start = parseUtcWeekStart(q.weekStart);
    const end = addUtcDays(start, 7);
    const stats = await weeklyVolumeForUser(userId, start, end);
    sendSuccess(res, {
      weekStart: q.weekStart,
      weekStartUtc: start.toISOString(),
      weekEndUtc: end.toISOString(),
      totalVolume: stats.totalVolume,
      setCount: stats.setCount,
    });
  } catch (err) {
    next(err);
  }
}
