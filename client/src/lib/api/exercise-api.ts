/** Exercise catalog and custom exercise CRUD under `/api/exercises`. */
import { fetchJson } from '@/lib/api-client';
import type { Exercise, WorkoutType } from '@/lib/api/types';

export async function readExercises(
  workoutType?: WorkoutType,
): Promise<Exercise[]> {
  const q = new URLSearchParams();
  if (workoutType) q.set('workoutType', workoutType);
  const suffix = q.toString() ? `?${q.toString()}` : '';
  return fetchJson<Exercise[]>(`/api/exercises${suffix}`);
}

export async function readExerciseRecents(
  limit = 8,
  workoutType?: WorkoutType,
): Promise<Exercise[]> {
  const q = new URLSearchParams({ limit: String(limit) });
  if (workoutType) q.set('workoutType', workoutType);
  return fetchJson<Exercise[]>(`/api/exercises/recents?${q}`);
}

export async function clearExerciseRecents(
  workoutType?: WorkoutType,
): Promise<void> {
  const q = new URLSearchParams();
  if (workoutType) q.set('workoutType', workoutType);
  const suffix = q.toString() ? `?${q}` : '';
  await fetchJson<{ cleared: boolean }>(`/api/exercises/recents${suffix}`, {
    method: 'DELETE',
  });
}

export async function readArchivedExercises(): Promise<Exercise[]> {
  return fetchJson<Exercise[]>('/api/exercises/archived');
}

export async function createExercise(
  name: string,
  muscleGroup: string,
  category?: WorkoutType,
): Promise<Exercise> {
  return fetchJson<Exercise>('/api/exercises', {
    method: 'POST',
    body: JSON.stringify({
      name,
      muscleGroup,
      ...(category ? { category } : {}),
    }),
  });
}

export async function patchExercise(
  exerciseTypeId: number,
  body: {
    name?: string;
    muscleGroup?: string | null;
    category?: WorkoutType;
    archived?: boolean;
  },
): Promise<Exercise> {
  return fetchJson<Exercise>(`/api/exercises/${exerciseTypeId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
