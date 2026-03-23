import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { sendSuccess } from '@server/lib/http-response.js';
import { updateProfileForUser } from '@server/services/profile-service.js';

const patchSchema = z
  .object({
    displayName: z.string().trim().min(1).max(120).optional(),
    weightUnit: z.enum(['lb', 'kg']).optional(),
    timezone: z.string().trim().max(64).nullable().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: 'at least one field required',
  });

/** PATCH /api/profile */
export async function patchProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error('auth middleware required');
    const body = patchSchema.parse(req.body);
    const updated = await updateProfileForUser(userId, body);
    sendSuccess(res, {
      userId: updated.userId,
      displayName: updated.displayName,
      weightUnit: updated.weightUnit,
      timezone: updated.timezone,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
