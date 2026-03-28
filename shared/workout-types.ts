/** Aligns workout sessions and exercise catalog filtering. */
export const WORKOUT_TYPES = ['resistance', 'cardio', 'flexibility'] as const;

export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export function isWorkoutType(value: string): value is WorkoutType {
  return (WORKOUT_TYPES as readonly string[]).includes(value);
}

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  resistance: 'Resistance',
  cardio: 'Cardio',
  flexibility: 'Flexibility',
};
