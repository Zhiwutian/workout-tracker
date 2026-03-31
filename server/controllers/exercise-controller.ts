/**
 * Exercise catalog and user-owned custom exercises: list, recents, archived, create, patch (incl. archive).
 * Query/body validation uses **`domain-zod`** for workout type; **`requireUserId`** for authenticated routes.
 */
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import {
  exerciseTypeIdParams,
  workoutTypeSchema,
} from '@server/lib/domain-zod.js';
import { sendSuccess } from '@server/lib/http-response.js';
import { requireUserId } from '@server/lib/request-user.js';
import {
  clearRecentExercisesForUser,
  createCustomExercise,
  listArchivedCustomExercisesForUser,
  listExercisesForUser,
  listRecentExercisesForUser,
  patchCustomExercise,
} from '@server/services/exercise-service.js';

const createBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  muscleGroup: z.string().trim().min(1).max(80),
  category: workoutTypeSchema.optional(),
});

const exercisesQuerySchema = z.object({
  workoutType: workoutTypeSchema.optional(),
});

function serializeExercise(r: {
  exerciseTypeId: number;
  userId: number | null;
  name: string;
  muscleGroup: string | null;
  category: string;
  archivedAt: Date | null;
}): {
  exerciseTypeId: number;
  userId: number | null;
  name: string;
  muscleGroup: string | null;
  category: string;
  archivedAt: string | null;
} {
  return {
    exerciseTypeId: r.exerciseTypeId,
    userId: r.userId,
    name: r.name,
    muscleGroup: r.muscleGroup,
    category: r.category,
    archivedAt: r.archivedAt ? r.archivedAt.toISOString() : null,
  };
}

/** GET /api/exercises */
export async function getExercises(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const q = exercisesQuerySchema.parse(req.query);
  const rows = await listExercisesForUser(userId, {
    workoutType: q.workoutType,
  });
  sendSuccess(res, rows.map(serializeExercise));
}

/** GET /api/exercises/recents?limit=8 */
export async function getExerciseRecents(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const q = z
    .object({
      limit: z.coerce.number().int().min(1).max(50).optional(),
      workoutType: workoutTypeSchema.optional(),
    })
    .parse(req.query);
  const rows = await listRecentExercisesForUser(userId, q.limit ?? 8, {
    workoutType: q.workoutType,
  });
  sendSuccess(res, rows.map(serializeExercise));
}

/** DELETE /api/exercises/recents?workoutType=resistance|cardio|flexibility */
export async function deleteExerciseRecents(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const q = z
    .object({
      workoutType: workoutTypeSchema.optional(),
    })
    .parse(req.query);
  await clearRecentExercisesForUser(userId, {
    workoutType: q.workoutType,
  });
  sendSuccess(res, { cleared: true });
}

/** GET /api/exercises/archived */
export async function getArchivedExercises(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const rows = await listArchivedCustomExercisesForUser(userId);
  sendSuccess(res, rows.map(serializeExercise));
}

/** POST /api/exercises */
export async function postExercise(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const body = createBodySchema.parse(req.body);
  const row = await createCustomExercise(
    userId,
    body.name,
    body.muscleGroup,
    body.category ?? 'resistance',
  );
  sendSuccess(res, serializeExercise(row), 201);
}

const patchBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    muscleGroup: z.string().trim().min(1).max(80).optional(),
    category: workoutTypeSchema.optional(),
    archived: z.boolean().optional(),
  })
  .refine(
    (b) =>
      b.name !== undefined ||
      b.muscleGroup !== undefined ||
      b.category !== undefined ||
      b.archived !== undefined,
    {
      message:
        'at least one of name, muscleGroup, category, archived is required',
    },
  );

/** PATCH /api/exercises/:exerciseTypeId */
export async function patchExercise(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const { exerciseTypeId } = exerciseTypeIdParams.parse(req.params);
  const body = patchBodySchema.parse(req.body);
  const row = await patchCustomExercise(userId, exerciseTypeId, {
    name: body.name,
    muscleGroup: body.muscleGroup,
    category: body.category,
    archived: body.archived,
  });
  sendSuccess(res, serializeExercise(row));
}
