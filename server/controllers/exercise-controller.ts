import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { sendSuccess } from '@server/lib/http-response.js';
import {
  createCustomExercise,
  listExercisesForUser,
} from '@server/services/exercise-service.js';

const createBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  muscleGroup: z.string().trim().max(80).nullable().optional(),
});

/** GET /api/exercises */
export async function getExercises(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error('auth middleware required');
    const rows = await listExercisesForUser(userId);
    sendSuccess(
      res,
      rows.map((r) => ({
        exerciseTypeId: r.exerciseTypeId,
        userId: r.userId,
        name: r.name,
        muscleGroup: r.muscleGroup,
      })),
    );
  } catch (err) {
    next(err);
  }
}

/** POST /api/exercises */
export async function postExercise(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error('auth middleware required');
    const body = createBodySchema.parse(req.body);
    const row = await createCustomExercise(userId, body.name, body.muscleGroup);
    sendSuccess(
      res,
      {
        exerciseTypeId: row.exerciseTypeId,
        userId: row.userId,
        name: row.name,
        muscleGroup: row.muscleGroup,
      },
      201,
    );
  } catch (err) {
    next(err);
  }
}
