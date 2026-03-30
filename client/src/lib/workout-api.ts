/**
 * Public entry for all workout-tracker API functions used by the UI and tests.
 * Implementations live in `./api/*` (grouped by area) so this file stays a stable import path:
 * `import { readWorkouts } from '@/lib/workout-api'`.
 */
export type {
  AchievementBadge,
  AuthOptionsResponse,
  DashboardSummaryPayload,
  Exercise,
  GoalTypeId,
  GoalWithProgress,
  GoalsListResponse,
  MeResponse,
  SetRow,
  StatsSummaryResponse,
  VolumeSeriesResponse,
  VolumeSeriesRow,
  WeeklyVolumeResponse,
  WorkoutSummary,
  WorkoutType,
} from '@/lib/api/types';

export {
  createGuestSession,
  patchProfile,
  postSessionLogout,
  readAuthOptions,
  readHelloMessage,
  readMe,
  signIn,
  signUp,
} from '@/lib/api/auth-api';

export {
  createExercise,
  patchExercise,
  readArchivedExercises,
  readExerciseRecents,
  readExercises,
} from '@/lib/api/exercise-api';

export type { ReadWorkoutsParams } from '@/lib/api/workouts-api';
export {
  addSet,
  createWorkout,
  deleteSet,
  downloadWorkoutSetsCsv,
  patchSet,
  patchWorkout,
  readWorkoutDetail,
  readWorkouts,
} from '@/lib/api/workouts-api';

export {
  readStatsSummary,
  readVolumeSeries,
  readWeeklyVolume,
} from '@/lib/api/stats-api';

export {
  createGoal,
  patchGoal,
  readGoals,
  removeGoal,
} from '@/lib/api/goals-api';
