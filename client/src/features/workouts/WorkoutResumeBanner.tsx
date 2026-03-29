import { NavLinkButton } from '@/components/app/NavLinkButton';
import { Card } from '@/components/ui';
import type { WorkoutSummary } from '@/lib/workout-api';

/** Shown when the user has an active workout that is hidden by list filters. */
export function WorkoutResumeBanner({ workout }: { workout: WorkoutSummary }) {
  return (
    <Card className="border-indigo-200 bg-indigo-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-indigo-900">
            Workout in progress
          </p>
          <p className="text-xs text-indigo-800/90">
            {workout.title ?? `Workout #${workout.workoutId}`} ·{' '}
            {new Date(workout.startedAt).toLocaleString()}
          </p>
        </div>
        <NavLinkButton
          to={`/workouts/${workout.workoutId}`}
          className="bg-indigo-600 text-white hover:bg-indigo-500 hover:text-white">
          Resume
        </NavLinkButton>
      </div>
    </Card>
  );
}
