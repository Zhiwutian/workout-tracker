/**
 * **`/api/goals`** — weekly goals with server-side period tracking and live progress.
 */
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { Info } from 'luxon';
import { sendSuccess } from '@server/lib/http-response.js';
import { ClientError } from '@server/lib/client-error.js';
import { requireUserId } from '@server/lib/request-user.js';
import {
  GOAL_TYPES,
  createGoal,
  deleteGoal,
  listGoalsWithProgress,
  updateGoal,
} from '@server/services/goal-service.js';
import { readProfileForUser } from '@server/services/profile-service.js';

const goalTypeSchema = z.enum(GOAL_TYPES);

const goalIdParams = z.object({
  goalId: z.coerce.number().int().positive(),
});

const createBodySchema = z.object({
  goalType: goalTypeSchema,
  targetValue: z.number().positive(),
  workoutTypeFilter: z.string().trim().min(1).max(64).nullable().optional(),
  timezone: z.string().trim().min(1).max(120).nullable().optional(),
});

const patchBodySchema = z.object({
  targetValue: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  workoutTypeFilter: z.string().trim().min(1).max(64).nullable().optional(),
  timezone: z.string().trim().min(1).max(120).nullable().optional(),
});

async function profileTimezone(userId: number): Promise<string> {
  const p = await readProfileForUser(userId);
  return p?.timezone?.trim() || 'UTC';
}

function validateOptionalTimezone(tz: string | null | undefined): void {
  const z = tz?.trim();
  if (z && !Info.isValidIANAZone(z)) {
    throw new ClientError(400, 'invalid timezone');
  }
}

/** GET /api/goals */
export async function getGoals(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const tz = await profileTimezone(userId);
  const goals = await listGoalsWithProgress(userId, tz);
  sendSuccess(res, { goals });
}

/** POST /api/goals */
export async function postGoal(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const body = createBodySchema.parse(req.body);
  validateOptionalTimezone(body.timezone ?? null);
  const tz = await profileTimezone(userId);
  const goal = await createGoal(userId, body, tz);
  sendSuccess(res, goal, 201);
}

/** PATCH /api/goals/:goalId */
export async function patchGoal(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const { goalId } = goalIdParams.parse(req.params);
  const body = patchBodySchema.parse(req.body);
  if (body.timezone !== undefined) {
    validateOptionalTimezone(body.timezone);
  }
  const tz = await profileTimezone(userId);
  const updated = await updateGoal(userId, goalId, body, tz);
  if (!updated) throw new ClientError(404, 'goal not found');
  sendSuccess(res, updated);
}

/** DELETE /api/goals/:goalId */
export async function removeGoal(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const { goalId } = goalIdParams.parse(req.params);
  const tz = await profileTimezone(userId);
  const ok = await deleteGoal(userId, goalId, tz);
  if (!ok) throw new ClientError(404, 'goal not found');
  sendSuccess(res, { ok: true });
}
