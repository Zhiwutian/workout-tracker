/** Workouts, logged sets, and CSV export (`/api/workouts`, `/api/sets`, `/api/export/...`). */
import type { ApiErrorEnvelope } from '@shared/api-contracts';
import { apiFetch, fetchJson, fetchNoContent } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib';
import type { SetRow, WorkoutSummary, WorkoutType } from '@/lib/api/types';

/** Query params for GET /api/workouts (optional). */
export type ReadWorkoutsParams = {
  from?: string;
  to?: string;
  status?: 'all' | 'active' | 'completed';
  sort?: 'startedAt_desc' | 'startedAt_asc';
};

export async function readWorkouts(
  params?: ReadWorkoutsParams,
): Promise<WorkoutSummary[]> {
  const qs = new URLSearchParams();
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  if (params?.status && params.status !== 'all') {
    qs.set('status', params.status);
  }
  if (params?.sort && params.sort !== 'startedAt_desc') {
    qs.set('sort', params.sort);
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return fetchJson<WorkoutSummary[]>(`/api/workouts${suffix}`);
}

/** Download CSV of sets (workout `startedAt` in optional date range). */
export async function downloadWorkoutSetsCsv(params?: {
  from?: string;
  to?: string;
}): Promise<void> {
  const qs = new URLSearchParams();
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  const response = await apiFetch(`/api/export/workout-sets.csv${suffix}`, {
    headers: { Accept: 'text/csv, application/json' },
  });

  if (!response.ok) {
    const contentType = response.headers.get('Content-Type') ?? '';
    if (contentType.includes('application/json')) {
      const errorBody = (await response
        .json()
        .catch(() => null)) as ApiErrorEnvelope | null;
      throw new Error(getApiErrorMessage(response.status, errorBody));
    }
    throw new Error(`Export failed (${response.status})`);
  }

  const blob = await response.blob();
  const cd = response.headers.get('Content-Disposition');
  let filename = `workout-sets-${new Date().toISOString().slice(0, 10)}.csv`;
  const m =
    /filename\*=UTF-8''([^;\s]+)|filename="([^"]+)"/i.exec(cd ?? '') ?? [];
  const raw = m[1] ?? m[2];
  if (raw) {
    try {
      filename = decodeURIComponent(raw);
    } catch {
      filename = raw;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function createWorkout(input?: {
  title?: string | null;
  notes?: string | null;
  workoutType?: WorkoutType;
}): Promise<WorkoutSummary> {
  return fetchJson<WorkoutSummary>('/api/workouts', {
    method: 'POST',
    body: JSON.stringify(input ?? {}),
  });
}

export async function readWorkoutDetail(workoutId: number): Promise<{
  workout: WorkoutSummary;
  sets: SetRow[];
}> {
  return fetchJson(`/api/workouts/${workoutId}`);
}

export async function addSet(
  workoutId: number,
  body: {
    exerciseTypeId: number;
    reps: number;
    weight: number;
    notes?: string | null;
    isWarmup?: boolean;
    restSeconds?: number | null;
    groupId?: number | null;
    createGroup?: boolean;
  },
): Promise<SetRow> {
  return fetchJson<SetRow>(`/api/workouts/${workoutId}/sets`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function patchSet(
  setId: number,
  body: {
    reps?: number;
    weight?: number;
    notes?: string | null;
    setIndex?: number;
    isWarmup?: boolean;
    restSeconds?: number | null;
    groupId?: number | null;
  },
): Promise<SetRow> {
  return fetchJson<SetRow>(`/api/sets/${setId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteSet(setId: number): Promise<void> {
  await fetchNoContent(`/api/sets/${setId}`, { method: 'DELETE' });
}
