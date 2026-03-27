import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { buildWorkoutSetsCsv } from '@server/lib/csv-build.js';
import { listWorkoutSetsForExport } from '@server/services/export-service.js';

const exportSetsQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

/** GET /api/export/workout-sets.csv */
export async function getExportWorkoutSetsCsv(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error('auth middleware required');
    const q = exportSetsQuery.parse(req.query);
    const filters: { from?: Date; to?: Date } = {};
    if (q.from) filters.from = new Date(q.from);
    if (q.to) filters.to = new Date(q.to);

    const rows = await listWorkoutSetsForExport(userId, filters);
    const csv = buildWorkoutSetsCsv(rows);

    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `workout-sets-${stamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}
