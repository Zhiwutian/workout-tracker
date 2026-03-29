/**
 * Server-side Zod pieces that must stay aligned with `shared/workout-types` and the DB.
 * We keep `zod` out of `shared/` so the shared folder stays a lightweight contract layer.
 */
import { z } from 'zod';
import { WORKOUT_TYPES, type WorkoutType } from '@shared/workout-types';

/** Zod enum aligned with `shared/workout-types` `WORKOUT_TYPES`. */
export const workoutTypeSchema = z.enum(
  WORKOUT_TYPES as unknown as [WorkoutType, ...WorkoutType[]],
);

export const workoutIdParams = z.object({
  workoutId: z.coerce.number().int().positive(),
});

export const setIdParams = z.object({
  setId: z.coerce.number().int().positive(),
});

export const exerciseTypeIdParams = z.object({
  exerciseTypeId: z.coerce.number().int().positive(),
});
