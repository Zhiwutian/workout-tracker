import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import { Badge, Button, Card } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import {
  createWorkout,
  readWorkouts,
  type WorkoutSummary,
} from '@/lib/workout-api';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * List workouts and start a new session (creates a workout row).
 */
export function WorkoutsPage() {
  const { me } = useAuth();
  const { showToast } = useToast();
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setWorkouts(await readWorkouts());
    } catch (err) {
      showToast({
        title: 'Could not load workouts',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleNewWorkout(): Promise<void> {
    setCreating(true);
    try {
      const w = await createWorkout({});
      setWorkouts((prev) => [w, ...prev]);
      showToast({ title: 'Workout started', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not start workout',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Workouts</h1>
          <p className="text-sm text-slate-600">
            Signed in as <strong>{me?.displayName}</strong>
          </p>
        </div>
        <Button
          type="button"
          disabled={creating}
          onClick={() => void handleNewWorkout()}>
          Start workout
        </Button>
      </header>

      {loading && <p className="text-sm text-slate-600">Loading…</p>}
      {!loading && workouts.length === 0 && (
        <Card className="p-6 text-center text-slate-600">
          No workouts yet. Start one to log sets.
        </Card>
      )}
      <ul className="space-y-3" aria-label="Workout list">
        {workouts.map((w) => (
          <li key={w.workoutId}>
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">
                    {w.title ?? `Workout #${w.workoutId}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(w.startedAt).toLocaleString()}
                    {w.endedAt
                      ? ` → ${new Date(w.endedAt).toLocaleString()}`
                      : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!w.endedAt && (
                    <Badge className="bg-amber-100 text-amber-900">
                      Active
                    </Badge>
                  )}
                  <NavLinkButton
                    to={`/workouts/${w.workoutId}`}
                    className="bg-indigo-600 text-white hover:bg-indigo-500 hover:text-white">
                    Open
                  </NavLinkButton>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <p className="text-sm text-slate-500">
        <Link className="text-indigo-600 underline" to="/dashboard">
          Weekly volume dashboard
        </Link>
      </p>
    </div>
  );
}
