import { desc, eq } from 'drizzle-orm';
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

export async function listWorkouts(userId: number): Promise<WorkoutRecord[]> {
  const db = requireDb();
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.startedAt));
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
