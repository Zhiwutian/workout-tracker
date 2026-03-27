import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  max,
  or,
} from 'drizzle-orm';
import { DbClient, getDrizzleDb } from '@server/db/drizzle.js';
import { exerciseTypes, workoutSets, workouts } from '@server/db/schema.js';
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
  archivedAt: Date | null;
};

function toRecord(row: typeof exerciseTypes.$inferSelect): ExerciseTypeRecord {
  return {
    exerciseTypeId: row.exerciseTypeId,
    userId: row.userId,
    name: row.name,
    muscleGroup: row.muscleGroup,
    archivedAt: row.archivedAt,
  };
}

/** Global catalog plus this user's non-archived custom exercises. */
export async function listExercisesForUser(
  userId: number,
): Promise<ExerciseTypeRecord[]> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(exerciseTypes)
    .where(
      or(
        isNull(exerciseTypes.userId),
        and(eq(exerciseTypes.userId, userId), isNull(exerciseTypes.archivedAt)),
      ),
    )
    .orderBy(asc(exerciseTypes.name));
  return rows.map(toRecord);
}

/**
 * Exercises the user has logged recently (by latest set `createdAt`), excluding archived custom.
 */
export async function listRecentExercisesForUser(
  userId: number,
  limit: number,
): Promise<ExerciseTypeRecord[]> {
  const db = requireDb();
  const lim = Math.min(Math.max(1, limit), 50);
  const ranked = await db
    .select({
      exerciseTypeId: workoutSets.exerciseTypeId,
      lastUsed: max(workoutSets.createdAt),
    })
    .from(workoutSets)
    .innerJoin(workouts, eq(workoutSets.workoutId, workouts.workoutId))
    .innerJoin(
      exerciseTypes,
      eq(workoutSets.exerciseTypeId, exerciseTypes.exerciseTypeId),
    )
    .where(
      and(
        eq(workouts.userId, userId),
        or(
          isNull(exerciseTypes.userId),
          and(
            eq(exerciseTypes.userId, userId),
            isNull(exerciseTypes.archivedAt),
          ),
        ),
      ),
    )
    .groupBy(workoutSets.exerciseTypeId)
    .orderBy(desc(max(workoutSets.createdAt)))
    .limit(lim);

  if (ranked.length === 0) return [];

  const ids = ranked.map((r) => r.exerciseTypeId);
  const rows = await db
    .select()
    .from(exerciseTypes)
    .where(inArray(exerciseTypes.exerciseTypeId, ids));
  const byId = new Map(rows.map((r) => [r.exerciseTypeId, r]));
  return ids
    .map((id) => byId.get(id))
    .filter((r): r is (typeof rows)[0] => r !== undefined)
    .map(toRecord);
}

/** User's archived custom exercises (newest archive first). */
export async function listArchivedCustomExercisesForUser(
  userId: number,
): Promise<ExerciseTypeRecord[]> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(exerciseTypes)
    .where(
      and(
        eq(exerciseTypes.userId, userId),
        isNotNull(exerciseTypes.archivedAt),
      ),
    )
    .orderBy(desc(exerciseTypes.archivedAt));
  return rows.map(toRecord);
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
      and(
        eq(exerciseTypes.userId, userId),
        eq(exerciseTypes.name, trimmed),
        isNull(exerciseTypes.archivedAt),
      ),
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
  return toRecord(row);
}

export type PatchCustomExerciseInput = {
  name?: string;
  muscleGroup?: string | null;
  archived?: boolean;
};

export async function patchCustomExercise(
  userId: number,
  exerciseTypeId: number,
  patch: PatchCustomExerciseInput,
): Promise<ExerciseTypeRecord> {
  const db = requireDb();
  const [row] = await db
    .select()
    .from(exerciseTypes)
    .where(eq(exerciseTypes.exerciseTypeId, exerciseTypeId))
    .limit(1);
  if (!row) throw new ClientError(404, 'exercise not found');
  if (row.userId === null) {
    throw new ClientError(403, 'cannot edit global exercises');
  }
  if (row.userId !== userId) {
    throw new ClientError(403, 'cannot edit another user exercise');
  }

  let name = row.name;
  let muscleGroup = row.muscleGroup;
  let archivedAt = row.archivedAt;

  if (patch.name !== undefined) {
    const trimmed = patch.name.trim();
    if (!trimmed) throw new ClientError(400, 'name is required');
    const dup = await db
      .select({ exerciseTypeId: exerciseTypes.exerciseTypeId })
      .from(exerciseTypes)
      .where(
        and(
          eq(exerciseTypes.userId, userId),
          eq(exerciseTypes.name, trimmed),
          isNull(exerciseTypes.archivedAt),
        ),
      )
      .limit(2);
    const other = dup.find((d) => d.exerciseTypeId !== exerciseTypeId);
    if (other) {
      throw new ClientError(409, 'you already have an exercise with that name');
    }
    name = trimmed;
  }

  if (patch.muscleGroup !== undefined) {
    muscleGroup = patch.muscleGroup?.trim() || null;
  }

  if (patch.archived === true) {
    archivedAt = new Date();
  } else if (patch.archived === false) {
    archivedAt = null;
    if (patch.name === undefined && patch.muscleGroup === undefined) {
      const clash = await db
        .select({ exerciseTypeId: exerciseTypes.exerciseTypeId })
        .from(exerciseTypes)
        .where(
          and(
            eq(exerciseTypes.userId, userId),
            eq(exerciseTypes.name, name),
            isNull(exerciseTypes.archivedAt),
          ),
        )
        .limit(2);
      const other = clash.find((d) => d.exerciseTypeId !== exerciseTypeId);
      if (other) {
        throw new ClientError(
          409,
          'unarchive failed: another active exercise already uses this name',
        );
      }
    }
  }

  const [updated] = await db
    .update(exerciseTypes)
    .set({
      name,
      muscleGroup,
      archivedAt,
    })
    .where(eq(exerciseTypes.exerciseTypeId, exerciseTypeId))
    .returning();

  if (!updated) throw new ClientError(500, 'failed to update exercise');
  return toRecord(updated);
}

/** Resolve exercise for use in a set: must be global or owned by user, not archived. */
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
  if (row.userId !== null && row.archivedAt !== null) {
    throw new ClientError(400, 'exercise is archived');
  }
  return toRecord(row);
}
