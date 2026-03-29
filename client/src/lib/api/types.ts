/** Wire shapes shared by `api/*` modules; keep in sync with `shared/` and server responses. */
import type { UiPreferences } from '@shared/ui-preferences';
import type { WorkoutType } from '@shared/workout-types';

export type { WorkoutType };
export type { UiPreferences };

export type MeResponse = {
  userId: number;
  displayName: string;
  weightUnit: string;
  timezone: string | null;
  /** Merged display shell prefs from `profiles.uiPreferences`; omit or null if unset. */
  uiPreferences?: UiPreferences | null;
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
