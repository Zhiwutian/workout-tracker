import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { sendSuccess } from '@server/lib/http-response.js';
import {
  createCustomExercise,
  listArchivedCustomExercisesForUser,
  listExercisesForUser,
  listRecentExercisesForUser,
  patchCustomExercise,
} from '@server/services/exercise-service.js';

const createBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  muscleGroup: z.string().trim().max(80).nullable().optional(),
});

function serializeExercise(r: {
  exerciseTypeId: number;
  userId: number | null;
  name: string;
  muscleGroup: string | null;
  archivedAt: Date | null;
}): {
  exerciseTypeId: number;
  userId: number | null;
  name: string;
  muscleGroup: string | null;
  archivedAt: string | null;
} {
  return {
    exerciseTypeId: r.exerciseTypeId,
    userId: r.userId,
    name: r.name,
    muscleGroup: r.muscleGroup,
    archivedAt: r.archivedAt ? r.archivedAt.toISOString() : null,
  };
}

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
    sendSuccess(res, rows.map(serializeExercise));
  } catch (err) {
    next(err);
  }
}

/** GET /api/exercises/recents?limit=8 */
export async function getExerciseRecents(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error('auth middleware required');
    const q = z
      .object({
        limit: z.coerce.number().int().min(1).max(50).optional(),
      })
      .parse(req.query);
    const rows = await listRecentExercisesForUser(userId, q.limit ?? 8);
    sendSuccess(res, rows.map(serializeExercise));
  } catch (err) {
    next(err);
  }
}

/** GET /api/exercises/archived */
export async function getArchivedExercises(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error('auth middleware required');
    const rows = await listArchivedCustomExercisesForUser(userId);
    sendSuccess(res, rows.map(serializeExercise));
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
    sendSuccess(res, serializeExercise(row), 201);
  } catch (err) {
    next(err);
  }
}

const patchBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    muscleGroup: z.string().trim().max(80).nullable().optional(),
    archived: z.boolean().optional(),
  })
  .refine(
    (b) =>
      b.name !== undefined ||
      b.muscleGroup !== undefined ||
      b.archived !== undefined,
    { message: 'at least one of name, muscleGroup, archived is required' },
  );

/** PATCH /api/exercises/:exerciseTypeId */
export async function patchExercise(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (userId === undefined) throw new Error('auth middleware required');
    const exerciseTypeId = z.coerce
      .number()
      .int()
      .positive()
      .parse(req.params.exerciseTypeId);
    const body = patchBodySchema.parse(req.body);
    const row = await patchCustomExercise(userId, exerciseTypeId, {
      name: body.name,
      muscleGroup: body.muscleGroup,
      archived: body.archived,
    });
    sendSuccess(res, serializeExercise(row));
  } catch (err) {
    next(err);
  }
}
