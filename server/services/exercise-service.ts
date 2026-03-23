import { and, asc, eq, isNull, or } from 'drizzle-orm';
import { DbClient, getDrizzleDb } from '@server/db/drizzle.js';
import { exerciseTypes } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';

function requireDb(): DbClient {
  const db = getDrizzleDb();
  if (!db) {
    throw new ClientError(
      503,
      'database is not configured. set DATABASE_URL and run migrations.',
    );
  }
  return db;
}

export type ExerciseTypeRecord = {
  exerciseTypeId: number;
  userId: number | null;
  name: string;
  muscleGroup: string | null;
};

/** Global catalog (userId null) plus this user's custom exercises. */
export async function listExercisesForUser(
  userId: number,
): Promise<ExerciseTypeRecord[]> {
  const db = requireDb();
  return db
    .select()
    .from(exerciseTypes)
    .where(or(isNull(exerciseTypes.userId), eq(exerciseTypes.userId, userId)))
    .orderBy(asc(exerciseTypes.name));
}

export async function createCustomExercise(
  userId: number,
  name: string,
  muscleGroup?: string | null,
): Promise<ExerciseTypeRecord> {
  const db = requireDb();
  const trimmed = name.trim();
  if (!trimmed) throw new ClientError(400, 'name is required');

  const existing = await db
    .select({ exerciseTypeId: exerciseTypes.exerciseTypeId })
    .from(exerciseTypes)
    .where(
      and(eq(exerciseTypes.userId, userId), eq(exerciseTypes.name, trimmed)),
    )
    .limit(1);
  if (existing.length > 0) {
    throw new ClientError(409, 'you already have an exercise with that name');
  }

  const [row] = await db
    .insert(exerciseTypes)
    .values({
      userId,
      name: trimmed,
      muscleGroup: muscleGroup?.trim() || null,
    })
    .returning();

  if (!row) throw new ClientError(500, 'failed to create exercise');
  return row;
}

/** Resolve exercise for use in a set: must be global or owned by user. */
export async function assertExerciseUsable(
  userId: number,
  exerciseTypeId: number,
): Promise<ExerciseTypeRecord> {
  const db = requireDb();
  const [row] = await db
    .select()
    .from(exerciseTypes)
    .where(eq(exerciseTypes.exerciseTypeId, exerciseTypeId))
    .limit(1);
  if (!row) throw new ClientError(404, 'exercise not found');
  if (row.userId !== null && row.userId !== userId) {
    throw new ClientError(403, 'cannot use another user custom exercise');
  }
  return row;
}
