import { Router } from 'express';
import {
  getMe,
  postAuthGuest,
  postAuthSignIn,
  postAuthSignUp,
} from '@server/controllers/auth-controller.js';
import {
  getExercises,
  postExercise,
} from '@server/controllers/exercise-controller.js';
import {
  readHealth,
  readReady,
} from '@server/controllers/health-controller.js';
import { readHello } from '@server/controllers/hello-controller.js';
import { patchProfile } from '@server/controllers/profile-controller.js';
import { getWeeklyVolume } from '@server/controllers/stats-controller.js';
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

const apiRouter = Router();

apiRouter.get('/hello', readHello);
apiRouter.get('/health', readHealth);
apiRouter.get('/ready', readReady);

apiRouter.post('/auth/sign-up', postAuthSignUp);
apiRouter.post('/auth/sign-in', postAuthSignIn);
apiRouter.post('/auth/guest', postAuthGuest);

apiRouter.get('/me', authMiddleware, getMe);
apiRouter.patch('/profile', authMiddleware, patchProfile);

apiRouter.get('/exercises', authMiddleware, getExercises);
apiRouter.post('/exercises', authMiddleware, postExercise);

apiRouter.get('/workouts', authMiddleware, getWorkouts);
apiRouter.post('/workouts', authMiddleware, postWorkout);
apiRouter.get('/workouts/:workoutId', authMiddleware, getWorkout);
apiRouter.patch('/workouts/:workoutId', authMiddleware, patchWorkout);
apiRouter.delete('/workouts/:workoutId', authMiddleware, removeWorkout);
apiRouter.post('/workouts/:workoutId/sets', authMiddleware, postSet);

apiRouter.patch('/sets/:setId', authMiddleware, patchSet);
apiRouter.delete('/sets/:setId', authMiddleware, removeSet);

apiRouter.get('/stats/weekly-volume', authMiddleware, getWeeklyVolume);

export default apiRouter;
