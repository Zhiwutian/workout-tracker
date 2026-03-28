import {
  type ApiErrorEnvelope,
  type ApiSuccessEnvelope,
} from '@shared/api-contracts';
import type { WorkoutType } from '@shared/workout-types';
import { getApiErrorMessage } from '@/lib';

export type { WorkoutType };
import { resolveApiInput } from './api-base-url';
import { getStoredToken } from './auth-storage';

export type MeResponse = {
  userId: number;
  displayName: string;
  weightUnit: string;
  timezone: string | null;
  updatedAt: string;
  /** Server user created via Continue as guest (`POST /api/auth/guest`). */
  isGuest?: boolean;
};

export type Exercise = {
  exerciseTypeId: number;
  userId: number | null;
  name: string;
  muscleGroup: string | null;
  category: WorkoutType;
  /** ISO timestamp when archived; null if active. */
  archivedAt?: string | null;
};

export type WorkoutSummary = {
  workoutId: number;
  userId: number;
  title: string | null;
  notes: string | null;
  workoutType: WorkoutType;
  startedAt: string;
  endedAt: string | null;
};

export type SetRow = {
  setId: number;
  workoutId: number;
  exerciseTypeId: number;
  setIndex: number;
  reps: number;
  weight: number;
  volume: number;
  notes: string | null;
  isWarmup: boolean;
  restSeconds: number | null;
  createdAt: string;
};

export type WeeklyVolumeResponse = {
  weekStart: string;
  weekStartUtc: string;
  weekEndUtc: string;
  totalVolume: number;
  setCount: number;
  /** Present when `timezone` was sent (non-UTC IANA interpretation). */
  timezone?: string;
};

export type AuthOptionsResponse = {
  oidc: boolean;
  demo: boolean;
};

async function fetchJson<T>(
  input: RequestInfo,
  init: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(resolveApiInput(input), {
    ...init,
    headers,
    credentials: 'include',
  });
  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => null)) as ApiErrorEnvelope | null;
    const message = getApiErrorMessage(response.status, errorBody);
    throw new Error(message);
  }
  const responseBody = (await response.json()) as ApiSuccessEnvelope<T>;
  return responseBody.data;
}

export async function readHelloMessage(): Promise<string> {
  const helloData = await fetchJson<{ message: string }>('/api/hello');
  return helloData.message;
}

export async function readAuthOptions(): Promise<AuthOptionsResponse> {
  return fetchJson<AuthOptionsResponse>('/api/auth/options');
}

export async function postSessionLogout(): Promise<void> {
  const res = await fetch(resolveApiInput('/api/auth/logout'), {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const body = (await res
      .json()
      .catch(() => null)) as ApiErrorEnvelope | null;
    throw new Error(getApiErrorMessage(res.status, body));
  }
}

export async function signUp(displayName: string): Promise<{ token: string }> {
  return fetchJson<{ token: string }>('/api/auth/sign-up', {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  });
}

export async function signIn(displayName: string): Promise<{ token: string }> {
  return fetchJson<{ token: string }>('/api/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  });
}

export async function createGuestSession(): Promise<{ token: string }> {
  return fetchJson<{ token: string }>('/api/auth/guest', {
    method: 'POST',
  });
}

export async function readMe(): Promise<MeResponse> {
  return fetchJson<MeResponse>('/api/me');
}

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

export async function readArchivedExercises(): Promise<Exercise[]> {
  return fetchJson<Exercise[]>('/api/exercises/archived');
}

export async function createExercise(
  name: string,
  muscleGroup?: string | null,
  category?: WorkoutType,
): Promise<Exercise> {
  return fetchJson<Exercise>('/api/exercises', {
    method: 'POST',
    body: JSON.stringify({
      name,
      muscleGroup: muscleGroup ?? null,
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

  const token = getStoredToken();
  const headers = new Headers();
  headers.set('Accept', 'text/csv, application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(
    resolveApiInput(`/api/export/workout-sets.csv${suffix}`),
    {
      credentials: 'include',
      headers,
    },
  );

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
    isWarmup?: boolean;
    restSeconds?: number | null;
  },
): Promise<SetRow> {
  return fetchJson<SetRow>(`/api/sets/${setId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteSet(setId: number): Promise<void> {
  const token = getStoredToken();
  const headers = new Headers();
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(resolveApiInput(`/api/sets/${setId}`), {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => null)) as ApiErrorEnvelope | null;
    throw new Error(getApiErrorMessage(response.status, errorBody));
  }
}

export async function readWeeklyVolume(
  weekStart: string,
  timezone?: string | null,
): Promise<WeeklyVolumeResponse> {
  const q = new URLSearchParams({ weekStart });
  const tz = timezone?.trim();
  if (tz && tz !== 'UTC' && tz !== 'Etc/UTC') {
    q.set('timezone', tz);
  }
  return fetchJson<WeeklyVolumeResponse>(
    `/api/stats/weekly-volume?${q.toString()}`,
  );
}

export async function patchProfile(body: {
  displayName?: string;
  weightUnit?: 'lb' | 'kg';
  timezone?: string | null;
}): Promise<MeResponse> {
  return fetchJson<MeResponse>('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
