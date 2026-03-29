/**
 * **`PATCH /api/profile`** — display name, weight unit, timezone for the authenticated user.
 */
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { sendSuccess } from '@server/lib/http-response.js';
import { requireUserId } from '@server/lib/request-user.js';
import {
  getAuthSubjectForUser,
  isGuestAuthSubject,
} from '@server/services/auth-service.js';
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
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const body = patchSchema.parse(req.body);
  const updated = await updateProfileForUser(userId, body);
  const authSubject = await getAuthSubjectForUser(userId);
  sendSuccess(res, {
    userId: updated.userId,
    displayName: updated.displayName,
    weightUnit: updated.weightUnit,
    timezone: updated.timezone,
    updatedAt: updated.updatedAt.toISOString(),
    isGuest: isGuestAuthSubject(authSubject),
  });
}
