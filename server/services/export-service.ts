import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
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

export type ExportSetsFilters = {
  from?: Date;
  to?: Date;
};

export type WorkoutSetExportRow = {
  workoutId: number;
  workoutTitle: string | null;
  workoutStartedAt: Date;
  workoutEndedAt: Date | null;
  exerciseName: string;
  setIndex: number;
  reps: number;
  weight: number;
  volume: number;
  setNotes: string | null;
  setCreatedAt: Date;
};

/**
 * Rows for CSV export: sets joined with workout + exercise, scoped by user,
 * optional filter on **workout.startedAt** (same semantics as workout list).
 */
export async function listWorkoutSetsForExport(
  userId: number,
  filters: ExportSetsFilters = {},
): Promise<WorkoutSetExportRow[]> {
  const db = requireDb();
  const conditions = [eq(workouts.userId, userId)];
  if (filters.from) {
    conditions.push(gte(workouts.startedAt, filters.from));
  }
  if (filters.to) {
    conditions.push(lte(workouts.startedAt, filters.to));
  }

  const rows = await db
    .select({
      workoutId: workouts.workoutId,
      workoutTitle: workouts.title,
      workoutStartedAt: workouts.startedAt,
      workoutEndedAt: workouts.endedAt,
      exerciseName: exerciseTypes.name,
      setIndex: workoutSets.setIndex,
      reps: workoutSets.reps,
      weight: workoutSets.weight,
      setNotes: workoutSets.notes,
      setCreatedAt: workoutSets.createdAt,
    })
    .from(workoutSets)
    .innerJoin(workouts, eq(workoutSets.workoutId, workouts.workoutId))
    .innerJoin(
      exerciseTypes,
      eq(workoutSets.exerciseTypeId, exerciseTypes.exerciseTypeId),
    )
    .where(and(...conditions))
    .orderBy(
      desc(workouts.startedAt),
      asc(workouts.workoutId),
      asc(workoutSets.setIndex),
    );

  return rows.map((r) => ({
    ...r,
    volume: r.reps * r.weight,
  }));
}
