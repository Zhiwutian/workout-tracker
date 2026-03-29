/**
 * Demo authentication: sign-up, sign-in, guest session, and **`GET /api/me`** (current user + guest flag).
 * Wired in **`routes/api.ts`** with **`asyncHandler`** for async handlers. OIDC routes live in **`oidc-auth-controller.ts`**.
 */
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '@server/config/env.js';
import { ClientError } from '@server/lib/client-error.js';
import { sendSuccess } from '@server/lib/http-response.js';
import { requireUserId } from '@server/lib/request-user.js';
import {
  createGuestUser,
  getAuthSubjectForUser,
  isGuestAuthSubject,
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
  _next: NextFunction,
): Promise<void> {
  if (!env.AUTH_DEMO_ENABLED) {
    throw new ClientError(403, 'demo sign-up is disabled; use OpenID Connect');
  }
  const body = displayNameSchema.parse(req.body);
  const result = await signUpDemo(body.displayName);
  sendSuccess(res, result, 201);
}

/** POST /api/auth/sign-in */
export async function postAuthSignIn(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  if (!env.AUTH_DEMO_ENABLED) {
    throw new ClientError(403, 'demo sign-in is disabled; use OpenID Connect');
  }
  const body = displayNameSchema.parse(req.body);
  const result = await signInByDisplayName(body.displayName);
  sendSuccess(res, result);
}

/** POST /api/auth/guest — no body; creates ephemeral server user + JWT */
export async function postAuthGuest(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const result = await createGuestUser();
  sendSuccess(res, result, 201);
}

/** GET /api/me — requires auth middleware */
export async function getMe(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const authSubject = await getAuthSubjectForUser(userId);
  const isGuest = isGuestAuthSubject(authSubject);
  const profile = await readProfileForUser(userId);
  if (!profile) {
    sendSuccess(res, { userId, profile: null, isGuest });
    return;
  }
  sendSuccess(res, {
    userId,
    displayName: profile.displayName,
    weightUnit: profile.weightUnit,
    timezone: profile.timezone,
    uiPreferences: profile.uiPreferences,
    updatedAt: profile.updatedAt.toISOString(),
    isGuest,
  });
}
