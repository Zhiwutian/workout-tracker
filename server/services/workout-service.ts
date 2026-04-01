import {
  and,
  asc,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  lte,
  max,
  sql,
} from 'drizzle-orm';
import { DbClient, getDrizzleDb } from '@server/db/drizzle.js';
import { workoutSetGroups, workoutSets, workouts } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import { isPgUniqueViolation } from '@server/lib/pg-errors.js';
import { assertWorkoutAcceptsNewSets } from '@server/lib/workout-logging-guards.js';
import { isWorkoutType, type WorkoutType } from '@shared/workout-types';

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
  workoutType: string;
  startedAt: Date;
  endedAt: Date | null;
};

export type SetRecord = {
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
};

export type WorkoutSetWriteSession = {
  workoutId: number;
  userId: number;
  workoutType: string;
  endedAt: Date | null;
  nextSetIndex: number;
};

const WORKOUT_SET_INDEX_UNIQUE = 'workout_sets_workout_set_index_unique';
const SET_INDEX_SHIFT_OFFSET = 100_000;
type DbReadExecutor = Pick<DbClient, 'select'>;
type DbWriteExecutor = Pick<DbClient, 'select' | 'insert'>;
type DbReorderExecutor = Pick<DbClient, 'select' | 'update'>;

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
  input: {
    title?: string | null;
    notes?: string | null;
    workoutType?: WorkoutType;
  },
): Promise<WorkoutRecord> {
  const db = requireDb();
  const wt: WorkoutType = input.workoutType ?? 'resistance';
  if (!isWorkoutType(wt)) {
    throw new ClientError(400, 'invalid workout type');
  }
  const [row] = await db
    .insert(workouts)
    .values({
      userId,
      title: input.title?.trim() || null,
      notes: input.notes?.trim() || null,
      workoutType: wt,
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
    workoutType?: WorkoutType;
  },
): Promise<WorkoutRecord> {
  const db = requireDb();
  const existing = await getWorkoutForUser(userId, workoutId);
  if (!existing) throw new ClientError(404, 'workout not found');

  const updates: Partial<typeof workouts.$inferInsert> = {};
  if (patch.title !== undefined) updates.title = patch.title?.trim() || null;
  if (patch.notes !== undefined) updates.notes = patch.notes?.trim() || null;
  if (patch.workoutType !== undefined) {
    if (!isWorkoutType(patch.workoutType)) {
      throw new ClientError(400, 'invalid workout type');
    }
    updates.workoutType = patch.workoutType;
  }
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
    isWarmup?: boolean;
    restSeconds?: number | null;
    setIndex?: number;
    groupId?: number | null;
    createGroup?: boolean;
  },
): Promise<SetRecord> {
  const db = requireDb();
  return db.transaction(async (tx) => {
    const session = await getWorkoutSessionForSetWriteWithDb(
      tx,
      userId,
      workoutId,
    );
    assertWorkoutAcceptsNewSets(session.endedAt);
    const setIndex = input.setIndex ?? session.nextSetIndex;
    const resolvedGroupId = await resolveGroupForWorkout(tx, workoutId, {
      groupId: input.groupId ?? null,
      createGroup: input.createGroup ?? false,
    });

    try {
      const [row] = await tx
        .insert(workoutSets)
        .values({
          workoutId,
          exerciseTypeId: input.exerciseTypeId,
          groupId: resolvedGroupId,
          setIndex,
          reps: input.reps,
          weight: input.weight,
          notes: input.notes?.trim() || null,
          isWarmup: input.isWarmup ?? false,
          restSeconds:
            input.restSeconds === undefined || input.restSeconds === null
              ? null
              : input.restSeconds,
        })
        .returning();
      if (!row) throw new ClientError(500, 'failed to add set');
      return row;
    } catch (err) {
      if (isPgUniqueViolation(err, WORKOUT_SET_INDEX_UNIQUE)) {
        throw new ClientError(
          409,
          'set index already exists for this workout. refresh and retry.',
        );
      }
      throw err;
    }
  });
}

export async function updateSetForUser(
  userId: number,
  setId: number,
  patch: Partial<{
    reps: number;
    weight: number;
    notes: string | null;
    setIndex: number;
    isWarmup: boolean;
    restSeconds: number | null;
    groupId: number | null;
  }>,
): Promise<SetRecord> {
  const db = requireDb();
  return db.transaction(async (tx) => {
    const [s] = await tx
      .select()
      .from(workoutSets)
      .where(eq(workoutSets.setId, setId))
      .limit(1);
    if (!s) throw new ClientError(404, 'set not found');
    const [ownedWorkout] = await tx
      .select({ workoutId: workouts.workoutId })
      .from(workouts)
      .where(
        and(eq(workouts.workoutId, s.workoutId), eq(workouts.userId, userId)),
      )
      .limit(1);
    if (!ownedWorkout) throw new ClientError(404, 'set not found');

    if (patch.setIndex !== undefined) {
      await moveSetWithinWorkout(tx, s.workoutId, s.setId, patch.setIndex);
    }

    const updates: Partial<typeof workoutSets.$inferInsert> = {};
    if (patch.reps !== undefined) updates.reps = patch.reps;
    if (patch.weight !== undefined) updates.weight = patch.weight;
    if (patch.notes !== undefined) updates.notes = patch.notes?.trim() || null;
    if (patch.isWarmup !== undefined) updates.isWarmup = patch.isWarmup;
    if (patch.restSeconds !== undefined)
      updates.restSeconds = patch.restSeconds;
    if (patch.groupId !== undefined) {
      updates.groupId = await resolveGroupForWorkout(tx, s.workoutId, {
        groupId: patch.groupId,
        createGroup: false,
      });
    }

    if (Object.keys(updates).length > 0) {
      const [row] = await tx
        .update(workoutSets)
        .set(updates)
        .where(eq(workoutSets.setId, setId))
        .returning();
      if (!row) throw new ClientError(404, 'set not found');
      return row;
    }

    const [row] = await tx
      .select()
      .from(workoutSets)
      .where(eq(workoutSets.setId, setId))
      .limit(1);
    if (!row) throw new ClientError(404, 'set not found');
    return row;
  });
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

export async function getWorkoutSessionForSetWrite(
  userId: number,
  workoutId: number,
): Promise<WorkoutSetWriteSession> {
  const db = requireDb();
  return getWorkoutSessionForSetWriteWithDb(db, userId, workoutId);
}

async function getWorkoutSessionForSetWriteWithDb(
  db: DbReadExecutor,
  userId: number,
  workoutId: number,
): Promise<WorkoutSetWriteSession> {
  const [workout] = await db
    .select({
      workoutId: workouts.workoutId,
      userId: workouts.userId,
      workoutType: workouts.workoutType,
      endedAt: workouts.endedAt,
    })
    .from(workouts)
    .where(and(eq(workouts.workoutId, workoutId), eq(workouts.userId, userId)))
    .limit(1);
  if (!workout) throw new ClientError(404, 'workout not found');

  const [maxRow] = await db
    .select({ maxSetIndex: max(workoutSets.setIndex) })
    .from(workoutSets)
    .where(eq(workoutSets.workoutId, workoutId));
  const maxSetIndex = maxRow?.maxSetIndex ?? null;

  return {
    workoutId: workout.workoutId,
    userId: workout.userId,
    workoutType: workout.workoutType,
    endedAt: workout.endedAt,
    nextSetIndex: maxSetIndex === null ? 0 : maxSetIndex + 1,
  };
}

async function resolveGroupForWorkout(
  db: DbWriteExecutor,
  workoutId: number,
  input: { groupId: number | null; createGroup: boolean },
): Promise<number | null> {
  if (input.createGroup) {
    if (input.groupId !== null) {
      throw new ClientError(
        400,
        'groupId cannot be sent when createGroup is true',
      );
    }
    const [group] = await db
      .insert(workoutSetGroups)
      .values({ workoutId })
      .returning();
    if (!group) throw new ClientError(500, 'failed to create superset group');
    return group.groupId;
  }

  if (input.groupId === null) return null;

  const [group] = await db
    .select()
    .from(workoutSetGroups)
    .where(
      and(
        eq(workoutSetGroups.groupId, input.groupId),
        eq(workoutSetGroups.workoutId, workoutId),
      ),
    )
    .limit(1);
  if (!group) throw new ClientError(400, 'invalid superset group');
  return input.groupId;
}

async function moveSetWithinWorkout(
  db: DbReorderExecutor,
  workoutId: number,
  setId: number,
  targetIndex: number,
): Promise<void> {
  const rows = await db
    .select({ setId: workoutSets.setId, setIndex: workoutSets.setIndex })
    .from(workoutSets)
    .where(eq(workoutSets.workoutId, workoutId))
    .orderBy(asc(workoutSets.setIndex));
  if (rows.length === 0) return;

  const currentPos = rows.findIndex((r) => r.setId === setId);
  if (currentPos < 0) {
    throw new ClientError(404, 'set not found');
  }

  const boundedPos = Math.max(0, Math.min(targetIndex, rows.length - 1));
  if (boundedPos === currentPos) return;

  const orderedIds = rows.map((r) => r.setId);
  orderedIds.splice(currentPos, 1);
  orderedIds.splice(boundedPos, 0, setId);

  // Step 1: shift away from the unique range, so final reindexing never collides.
  await db
    .update(workoutSets)
    .set({ setIndex: sql`${workoutSets.setIndex} + ${SET_INDEX_SHIFT_OFFSET}` })
    .where(eq(workoutSets.workoutId, workoutId));

  // Step 2: write contiguous final positions.
  for (const [idx, id] of orderedIds.entries()) {
    await db
      .update(workoutSets)
      .set({ setIndex: idx })
      .where(eq(workoutSets.setId, id));
  }
}
