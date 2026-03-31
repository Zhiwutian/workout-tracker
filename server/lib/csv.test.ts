import { describe, expect, it } from 'vitest';
import { escapeCsvField } from './csv.js';
import { buildWorkoutSetsCsv } from './csv-build.js';
import type { WorkoutSetExportRow } from '@server/services/export-service.js';

describe('escapeCsvField', () => {
  it('escapes commas and quotes', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it('allows plain tokens', () => {
    expect(escapeCsvField(42)).toBe('42');
    expect(escapeCsvField('bench')).toBe('bench');
  });
});

describe('buildWorkoutSetsCsv', () => {
  it('builds header and one row', () => {
    const row: WorkoutSetExportRow = {
      workoutId: 1,
      workoutTitle: 'Leg day',
      workoutType: 'resistance',
      workoutStartedAt: new Date('2026-01-15T10:00:00.000Z'),
      workoutEndedAt: null,
      exerciseName: 'Squat',
      exerciseCategory: 'resistance',
      groupId: 4,
      setIndex: 0,
      reps: 8,
      weight: 135,
      volume: 1080,
      isWarmup: false,
      restSeconds: 120,
      setNotes: null,
      setCreatedAt: new Date('2026-01-15T10:05:00.000Z'),
    };
    const csv = buildWorkoutSetsCsv([row]);
    expect(csv).toContain('workout_id,');
    expect(csv).toContain('Leg day');
    expect(csv).toContain('Squat');
    expect(csv).toContain('1080');
  });
});
