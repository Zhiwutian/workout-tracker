import { escapeCsvField } from '@server/lib/csv.js';
import type { WorkoutSetExportRow } from '@server/services/export-service.js';

export function buildWorkoutSetsCsv(rows: WorkoutSetExportRow[]): string {
  const header = [
    'workout_id',
    'workout_title',
    'workout_started_at',
    'workout_ended_at',
    'exercise',
    'reps',
    'weight',
    'volume',
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
        escapeCsvField(r.workoutStartedAt.toISOString()),
        escapeCsvField(r.workoutEndedAt?.toISOString() ?? ''),
        escapeCsvField(r.exerciseName),
        escapeCsvField(r.reps),
        escapeCsvField(r.weight),
        escapeCsvField(r.volume),
        escapeCsvField(r.setIndex),
        escapeCsvField(r.setNotes),
        escapeCsvField(r.setCreatedAt.toISOString()),
      ].join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}
