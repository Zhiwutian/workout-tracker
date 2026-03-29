/**
 * Single registry for JSON API routes under `/api`.
 * Pattern: import a controller function, wrap with `asyncHandler` if it returns a Promise,
 * and add `authMiddleware` for routes that require a logged-in user.
 */
import { Router } from 'express';
import {
  getMe,
  postAuthGuest,
  postAuthSignIn,
  postAuthSignUp,
} from '@server/controllers/auth-controller.js';
import {
  getAuthOptions,
  getOidcCallback,
  getOidcLogin,
  postAuthLogout,
} from '@server/controllers/oidc-auth-controller.js';
import {
  getArchivedExercises,
  getExerciseRecents,
  getExercises,
  patchExercise,
  postExercise,
} from '@server/controllers/exercise-controller.js';
import {
  readHealth,
  readReady,
} from '@server/controllers/health-controller.js';
import { readHello } from '@server/controllers/hello-controller.js';
import { patchProfile } from '@server/controllers/profile-controller.js';
import {
  getGoals,
  patchGoal,
  postGoal,
  removeGoal,
} from '@server/controllers/goal-controller.js';
import {
  getStatsSummary,
  getVolumeSeries,
  getWeeklyVolume,
} from '@server/controllers/stats-controller.js';
import { getExportWorkoutSetsCsv } from '@server/controllers/export-controller.js';
import {
  getWorkout,
  getWorkouts,
  patchSet,
  patchWorkout,
  postSet,
  postWorkout,
  removeSet,
  removeWorkout,
} from '@server/controllers/workout-controller.js';
import { authMiddleware } from '@server/lib/authorization-middleware.js';
import { asyncHandler } from '@server/lib/async-handler.js';

const apiRouter = Router();

apiRouter.get('/hello', readHello);
apiRouter.get('/health', asyncHandler(readHealth));
apiRouter.get('/ready', asyncHandler(readReady));

apiRouter.get('/auth/options', getAuthOptions);
apiRouter.get('/auth/oidc/login', asyncHandler(getOidcLogin));
apiRouter.get('/auth/oidc/callback', getOidcCallback);
apiRouter.post('/auth/logout', postAuthLogout);

apiRouter.post('/auth/sign-up', asyncHandler(postAuthSignUp));
apiRouter.post('/auth/sign-in', asyncHandler(postAuthSignIn));
apiRouter.post('/auth/guest', asyncHandler(postAuthGuest));

apiRouter.get('/me', authMiddleware, asyncHandler(getMe));
apiRouter.patch('/profile', authMiddleware, asyncHandler(patchProfile));

apiRouter.get(
  '/exercises/recents',
  authMiddleware,
  asyncHandler(getExerciseRecents),
);
apiRouter.get(
  '/exercises/archived',
  authMiddleware,
  asyncHandler(getArchivedExercises),
);
apiRouter.get('/exercises', authMiddleware, asyncHandler(getExercises));
apiRouter.post('/exercises', authMiddleware, asyncHandler(postExercise));
apiRouter.patch(
  '/exercises/:exerciseTypeId',
  authMiddleware,
  asyncHandler(patchExercise),
);

apiRouter.get(
  '/export/workout-sets.csv',
  authMiddleware,
  asyncHandler(getExportWorkoutSetsCsv),
);

apiRouter.get('/workouts', authMiddleware, asyncHandler(getWorkouts));
apiRouter.post('/workouts', authMiddleware, asyncHandler(postWorkout));
apiRouter.get('/workouts/:workoutId', authMiddleware, asyncHandler(getWorkout));
apiRouter.patch(
  '/workouts/:workoutId',
  authMiddleware,
  asyncHandler(patchWorkout),
);
apiRouter.delete(
  '/workouts/:workoutId',
  authMiddleware,
  asyncHandler(removeWorkout),
);
apiRouter.post(
  '/workouts/:workoutId/sets',
  authMiddleware,
  asyncHandler(postSet),
);

apiRouter.patch('/sets/:setId', authMiddleware, asyncHandler(patchSet));
apiRouter.delete('/sets/:setId', authMiddleware, asyncHandler(removeSet));

apiRouter.get(
  '/stats/weekly-volume',
  authMiddleware,
  asyncHandler(getWeeklyVolume),
);
apiRouter.get(
  '/stats/volume-series',
  authMiddleware,
  asyncHandler(getVolumeSeries),
);
apiRouter.get('/stats/summary', authMiddleware, asyncHandler(getStatsSummary));

apiRouter.get('/goals', authMiddleware, asyncHandler(getGoals));
apiRouter.post('/goals', authMiddleware, asyncHandler(postGoal));
apiRouter.patch('/goals/:goalId', authMiddleware, asyncHandler(patchGoal));
apiRouter.delete('/goals/:goalId', authMiddleware, asyncHandler(removeGoal));

export default apiRouter;
