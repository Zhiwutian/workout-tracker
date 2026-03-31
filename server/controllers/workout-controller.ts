/**
 * Workouts and logged sets: list/create/patch/delete workouts; list detail; add/patch/delete sets.
 * Shares **`workoutTypeSchema`** and id param schemas from **`domain-zod`** with **`exercise-controller`**.
 */
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ClientError } from '@server/lib/client-error.js';
import {
  setIdParams,
  workoutIdParams,
  workoutTypeSchema,
} from '@server/lib/domain-zod.js';
import { sendSuccess } from '@server/lib/http-response.js';
import { requireUserId } from '@server/lib/request-user.js';
import { assertExerciseUsableForWorkout } from '@server/services/exercise-service.js';
import {
  addSetToWorkout,
  createWorkout,
  deleteSetForUser,
  deleteWorkoutForUser,
  getWorkoutSessionForSetWrite,
  getWorkoutForUser,
  listWorkouts,
  type ListWorkoutsFilters,
  updateSetForUser,
  updateWorkoutForUser,
} from '@server/services/workout-service.js';

const createWorkoutBody = z.object({
  title: z.string().trim().max(200).nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  workoutType: workoutTypeSchema.optional(),
});

const patchWorkoutBody = z.object({
  title: z.string().trim().max(200).nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  endedAt: z.string().trim().nullable().optional(),
  workoutType: workoutTypeSchema.optional(),
});

const postSetBody = z
  .object({
    exerciseTypeId: z.coerce.number().int().positive(),
    reps: z.coerce.number().int().min(1).max(9999),
    weight: z.coerce.number().min(0).max(99999),
    notes: z.string().trim().max(2000).nullable().optional(),
    isWarmup: z.boolean().optional(),
    restSeconds: z.coerce
      .number()
      .int()
      .min(0)
      .max(86400)
      .nullable()
      .optional(),
    setIndex: z.coerce.number().int().min(0).max(9999).optional(),
    groupId: z.coerce.number().int().positive().nullable().optional(),
    createGroup: z.boolean().optional(),
  })
  .refine(
    (o) => !(o.createGroup && o.groupId !== undefined && o.groupId !== null),
    {
      message: 'groupId cannot be sent when createGroup is true',
      path: ['groupId'],
    },
  );

const listWorkoutsQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: z.enum(['all', 'active', 'completed']).default('all'),
  sort: z.enum(['startedAt_desc', 'startedAt_asc']).default('startedAt_desc'),
});

const patchSetBody = z
  .object({
    reps: z.coerce.number().int().min(1).max(9999).optional(),
    weight: z.coerce.number().min(0).max(99999).optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    setIndex: z.coerce.number().int().min(0).max(9999).optional(),
    isWarmup: z.boolean().optional(),
    restSeconds: z.coerce
      .number()
      .int()
      .min(0)
      .max(86400)
      .nullable()
      .optional(),
    groupId: z.coerce.number().int().positive().nullable().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: 'at least one field required',
  });

function serializeWorkout(w: {
  workoutId: number;
  userId: number;
  title: string | null;
  notes: string | null;
  workoutType: string;
  startedAt: Date;
  endedAt: Date | null;
}): {
  workoutId: number;
  userId: number;
  title: string | null;
  notes: string | null;
  workoutType: string;
  startedAt: string;
  endedAt: string | null;
} {
  return {
    workoutId: w.workoutId,
    userId: w.userId,
    title: w.title,
    notes: w.notes,
    workoutType: w.workoutType,
    startedAt: w.startedAt.toISOString(),
    endedAt: w.endedAt ? w.endedAt.toISOString() : null,
  };
}

function serializeSet(s: {
  setId: number;
  workoutId: number;
  exerciseTypeId: number;
  groupId: number | null;
  setIndex: number;
  reps: number;
  weight: number;
  notes: string | null;
  isWarmup: boolean;
  restSeconds: number | null;
  createdAt: Date;
}): {
  setId: number;
  workoutId: number;
  exerciseTypeId: number;
  groupId: number | null;
  setIndex: number;
  reps: number;
  weight: number;
  volume: number;
  notes: string | null;
  isWarmup: boolean;
  restSeconds: number | null;
  createdAt: string;
} {
  return {
    setId: s.setId,
    workoutId: s.workoutId,
    exerciseTypeId: s.exerciseTypeId,
    groupId: s.groupId,
    setIndex: s.setIndex,
    reps: s.reps,
    weight: s.weight,
    volume: s.reps * s.weight,
    notes: s.notes,
    isWarmup: s.isWarmup,
    restSeconds: s.restSeconds,
    createdAt: s.createdAt.toISOString(),
  };
}

/** GET /api/workouts — optional query: `from`, `to` (ISO), `status`, `sort` */
export async function getWorkouts(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const q = listWorkoutsQuery.parse(req.query);
  const filters: ListWorkoutsFilters = {
    status: q.status,
    sort: q.sort,
  };
  if (q.from) filters.from = new Date(q.from);
  if (q.to) filters.to = new Date(q.to);
  const rows = await listWorkouts(userId, filters);
  sendSuccess(res, rows.map(serializeWorkout));
}

/** POST /api/workouts */
export async function postWorkout(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const body = createWorkoutBody.parse(req.body);
  const row = await createWorkout(userId, body);
  sendSuccess(res, serializeWorkout(row), 201);
}

/** GET /api/workouts/:workoutId */
export async function getWorkout(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const { workoutId } = workoutIdParams.parse(req.params);
  const data = await getWorkoutForUser(userId, workoutId);
  if (!data) throw new ClientError(404, 'workout not found');
  sendSuccess(res, {
    workout: serializeWorkout(data.workout),
    sets: data.sets.map(serializeSet),
  });
}

/** PATCH /api/workouts/:workoutId */
export async function patchWorkout(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const { workoutId } = workoutIdParams.parse(req.params);
  const body = patchWorkoutBody.parse(req.body);
  const row = await updateWorkoutForUser(userId, workoutId, body);
  sendSuccess(res, serializeWorkout(row));
}

/** DELETE /api/workouts/:workoutId */
export async function removeWorkout(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const { workoutId } = workoutIdParams.parse(req.params);
  await deleteWorkoutForUser(userId, workoutId);
  res.sendStatus(204);
}

/** POST /api/workouts/:workoutId/sets */
export async function postSet(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const { workoutId } = workoutIdParams.parse(req.params);
  const body = postSetBody.parse(req.body);
  const session = await getWorkoutSessionForSetWrite(userId, workoutId);
  await assertExerciseUsableForWorkout(
    userId,
    body.exerciseTypeId,
    session.workoutType,
  );
  const row = await addSetToWorkout(userId, workoutId, body);
  sendSuccess(res, serializeSet(row), 201);
}

/** PATCH /api/sets/:setId */
export async function patchSet(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const { setId } = setIdParams.parse(req.params);
  const body = patchSetBody.parse(req.body);
  const row = await updateSetForUser(userId, setId, body);
  sendSuccess(res, serializeSet(row));
}

/** DELETE /api/sets/:setId */
export async function removeSet(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const userId = requireUserId(req);
  const { setId } = setIdParams.parse(req.params);
  await deleteSetForUser(userId, setId);
  res.sendStatus(204);
}
