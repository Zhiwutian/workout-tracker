import { escapeCsvField } from '@server/lib/csv.js';
import type { WorkoutSetExportRow } from '@server/services/export-service.js';

export function buildWorkoutSetsCsv(rows: WorkoutSetExportRow[]): string {
  const header = [
    'workout_id',
    'workout_title',
    'workout_type',
    'workout_started_at',
    'workout_ended_at',
    'exercise',
    'exercise_category',
    'superset_group_id',
    'reps',
    'weight',
    'volume',
    'is_warmup',
    'rest_seconds',
    'set_index',
    'set_notes',
    'set_created_at',
  ];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        escapeCsvField(r.workoutId),
        escapeCsvField(r.workoutTitle),
        escapeCsvField(r.workoutType),
        escapeCsvField(r.workoutStartedAt.toISOString()),
        escapeCsvField(r.workoutEndedAt?.toISOString() ?? ''),
        escapeCsvField(r.exerciseName),
        escapeCsvField(r.exerciseCategory),
        escapeCsvField(r.groupId ?? ''),
        escapeCsvField(r.reps),
        escapeCsvField(r.weight),
        escapeCsvField(r.volume),
        escapeCsvField(r.isWarmup),
        escapeCsvField(r.restSeconds ?? ''),
        escapeCsvField(r.setIndex),
        escapeCsvField(r.setNotes),
        escapeCsvField(r.setCreatedAt.toISOString()),
      ].join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}
