import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { sendSuccess } from '@server/lib/http-response.js';
import {
  signInByDisplayName,
  signUpDemo,
} from '@server/services/auth-service.js';
import { readProfileForUser } from '@server/services/profile-service.js';

const displayNameSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
});

/** POST /api/auth/sign-up */
export async function postAuthSignUp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = displayNameSchema.parse(req.body);
    const result = await signUpDemo(body.displayName);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/sign-in */
export async function postAuthSignIn(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = displayNameSchema.parse(req.body);
    const result = await signInByDisplayName(body.displayName);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

/** GET /api/me — requires auth middleware */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (userId === undefined) {
      throw new Error('auth middleware required');
    }
    const profile = await readProfileForUser(userId);
    if (!profile) {
      sendSuccess(res, { userId, profile: null });
      return;
    }
    sendSuccess(res, {
      userId,
      displayName: profile.displayName,
      weightUnit: profile.weightUnit,
      timezone: profile.timezone,
      updatedAt: profile.updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
