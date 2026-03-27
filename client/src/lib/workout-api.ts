import {
  type ApiErrorEnvelope,
  type ApiSuccessEnvelope,
} from '@shared/api-contracts';
import { getApiErrorMessage } from '@/lib';
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
};

export type WorkoutSummary = {
  workoutId: number;
  userId: number;
  title: string | null;
  notes: string | null;
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
  createdAt: string;
};

export type WeeklyVolumeResponse = {
  weekStart: string;
  weekStartUtc: string;
  weekEndUtc: string;
  totalVolume: number;
  setCount: number;
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

export async function readExercises(): Promise<Exercise[]> {
  return fetchJson<Exercise[]>('/api/exercises');
}

export async function createExercise(
  name: string,
  muscleGroup?: string | null,
): Promise<Exercise> {
  return fetchJson<Exercise>('/api/exercises', {
    method: 'POST',
    body: JSON.stringify({ name, muscleGroup: muscleGroup ?? null }),
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

export async function createWorkout(input?: {
  title?: string | null;
  notes?: string | null;
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
  },
): Promise<SetRow> {
  return fetchJson<SetRow>(`/api/workouts/${workoutId}/sets`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function readWeeklyVolume(
  weekStart: string,
): Promise<WeeklyVolumeResponse> {
  const q = new URLSearchParams({ weekStart });
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
