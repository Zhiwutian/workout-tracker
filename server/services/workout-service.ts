import { and, asc, desc, eq, gte, isNotNull, isNull, lte } from 'drizzle-orm';
import { DbClient, getDrizzleDb } from '@server/db/drizzle.js';
import { workoutSets, workouts } from '@server/db/schema.js';
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

export type WorkoutRecord = {
  workoutId: number;
  userId: number;
  title: string | null;
  notes: string | null;
  startedAt: Date;
  endedAt: Date | null;
};

export type SetRecord = {
  setId: number;
  workoutId: number;
  exerciseTypeId: number;
  setIndex: number;
  reps: number;
  weight: number;
  notes: string | null;
  createdAt: Date;
};

/** Optional filters for GET /api/workouts (date range uses `startedAt`). */
export type ListWorkoutsFilters = {
  from?: Date;
  to?: Date;
  status?: 'all' | 'active' | 'completed';
  sort?: 'startedAt_desc' | 'startedAt_asc';
};

export async function listWorkouts(
  userId: number,
  filters: ListWorkoutsFilters = {},
): Promise<WorkoutRecord[]> {
  const db = requireDb();
  const status = filters.status ?? 'all';
  const sort = filters.sort ?? 'startedAt_desc';

  const conditions = [eq(workouts.userId, userId)];
  if (filters.from) {
    conditions.push(gte(workouts.startedAt, filters.from));
  }
  if (filters.to) {
    conditions.push(lte(workouts.startedAt, filters.to));
  }
  if (status === 'active') {
    conditions.push(isNull(workouts.endedAt));
  } else if (status === 'completed') {
    conditions.push(isNotNull(workouts.endedAt));
  }

  const order =
    sort === 'startedAt_asc'
      ? asc(workouts.startedAt)
      : desc(workouts.startedAt);

  return db
    .select()
    .from(workouts)
    .where(and(...conditions))
    .orderBy(order);
}

export async function createWorkout(
  userId: number,
  input: { title?: string | null; notes?: string | null },
): Promise<WorkoutRecord> {
  const db = requireDb();
  const [row] = await db
    .insert(workouts)
    .values({
      userId,
      title: input.title?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .returning();
  if (!row) throw new ClientError(500, 'failed to create workout');
  return row;
}

export async function getWorkoutForUser(
  userId: number,
  workoutId: number,
): Promise<{ workout: WorkoutRecord; sets: SetRecord[] } | null> {
  const db = requireDb();
  const [w] = await db
    .select()
    .from(workouts)
    .where(eq(workouts.workoutId, workoutId))
    .limit(1);
  if (!w || w.userId !== userId) return null;

  const sets = await db
    .select()
    .from(workoutSets)
    .where(eq(workoutSets.workoutId, workoutId))
    .orderBy(workoutSets.setIndex);

  return { workout: w, sets };
}

export async function updateWorkoutForUser(
  userId: number,
  workoutId: number,
  patch: {
    title?: string | null;
    notes?: string | null;
    endedAt?: string | null;
  },
): Promise<WorkoutRecord> {
  const db = requireDb();
  const existing = await getWorkoutForUser(userId, workoutId);
  if (!existing) throw new ClientError(404, 'workout not found');

  const updates: Partial<typeof workouts.$inferInsert> = {};
  if (patch.title !== undefined) updates.title = patch.title?.trim() || null;
  if (patch.notes !== undefined) updates.notes = patch.notes?.trim() || null;
  if (patch.endedAt !== undefined) {
    updates.endedAt =
      patch.endedAt && patch.endedAt.trim() !== ''
        ? new Date(patch.endedAt)
        : null;
  }

  const [row] = await db
    .update(workouts)
    .set(updates)
    .where(eq(workouts.workoutId, workoutId))
    .returning();
  if (!row) throw new ClientError(404, 'workout not found');
  return row;
}

export async function deleteWorkoutForUser(
  userId: number,
  workoutId: number,
): Promise<void> {
  const db = requireDb();
  const existing = await getWorkoutForUser(userId, workoutId);
  if (!existing) throw new ClientError(404, 'workout not found');
  await db.delete(workouts).where(eq(workouts.workoutId, workoutId));
}

export async function addSetToWorkout(
  userId: number,
  workoutId: number,
  input: {
    exerciseTypeId: number;
    reps: number;
    weight: number;
    notes?: string | null;
    setIndex?: number;
  },
): Promise<SetRecord> {
  const db = requireDb();
  const existing = await getWorkoutForUser(userId, workoutId);
  if (!existing) throw new ClientError(404, 'workout not found');

  let setIndex = input.setIndex;
  if (setIndex === undefined) {
    const last = existing.sets.at(-1);
    setIndex = last ? last.setIndex + 1 : 0;
  }

  const [row] = await db
    .insert(workoutSets)
    .values({
      workoutId,
      exerciseTypeId: input.exerciseTypeId,
      setIndex,
      reps: input.reps,
      weight: input.weight,
      notes: input.notes?.trim() || null,
    })
    .returning();
  if (!row) throw new ClientError(500, 'failed to add set');
  return row;
}

export async function updateSetForUser(
  userId: number,
  setId: number,
  patch: Partial<{
    reps: number;
    weight: number;
    notes: string | null;
    setIndex: number;
  }>,
): Promise<SetRecord> {
  const db = requireDb();
  const [s] = await db
    .select()
    .from(workoutSets)
    .where(eq(workoutSets.setId, setId))
    .limit(1);
  if (!s) throw new ClientError(404, 'set not found');
  const parent = await getWorkoutForUser(userId, s.workoutId);
  if (!parent) throw new ClientError(404, 'set not found');

  const [row] = await db
    .update(workoutSets)
    .set(patch)
    .where(eq(workoutSets.setId, setId))
    .returning();
  if (!row) throw new ClientError(404, 'set not found');
  return row;
}

export async function deleteSetForUser(
  userId: number,
  setId: number,
): Promise<void> {
  const db = requireDb();
  const [s] = await db
    .select()
    .from(workoutSets)
    .where(eq(workoutSets.setId, setId))
    .limit(1);
  if (!s) throw new ClientError(404, 'set not found');
  const parent = await getWorkoutForUser(userId, s.workoutId);
  if (!parent) throw new ClientError(404, 'set not found');
  await db.delete(workoutSets).where(eq(workoutSets.setId, setId));
}
