import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import { Badge, Button, Card, Input } from '@/components/ui';
import {
  addSet,
  readExercises,
  readExerciseRecents,
  readWorkoutDetail,
  type Exercise,
  type SetRow,
  type WorkoutSummary,
} from '@/lib/workout-api';
import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

/**
 * Log sets for one workout (three-tap target: pick exercise, enter reps/weight, save).
 */
export function WorkoutDetailPage() {
  const { workoutId: workoutIdParam } = useParams();
  const workoutId = Number(workoutIdParam);
  const { showToast } = useToast();
  const [workout, setWorkout] = useState<WorkoutSummary | null>(null);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [recents, setRecents] = useState<Exercise[]>([]);
  const [exerciseTypeId, setExerciseTypeId] = useState('');
  const [reps, setReps] = useState('8');
  const [weight, setWeight] = useState('0');
  const [loading, setLoading] = useState(true);

  async function load(): Promise<void> {
    if (!Number.isFinite(workoutId) || workoutId < 1) return;
    setLoading(true);
    try {
      const [detail, ex, recent] = await Promise.all([
        readWorkoutDetail(workoutId),
        readExercises(),
        readExerciseRecents(8),
      ]);
      setWorkout(detail.workout);
      setSets(detail.sets);
      setExercises(ex);
      setRecents(recent);
      if (ex.length > 0 && !exerciseTypeId) {
        setExerciseTypeId(String(ex[0].exerciseTypeId));
      }
    } catch (err) {
      showToast({
        title: 'Could not load workout',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when id changes
  }, [workoutId]);

  async function handleAddSet(e: FormEvent): Promise<void> {
    e.preventDefault();
    const et = Number(exerciseTypeId);
    const r = Number(reps);
    const w = Number(weight);
    if (!Number.isFinite(et) || !Number.isFinite(r) || !Number.isFinite(w)) {
      showToast({ title: 'Invalid numbers', variant: 'error' });
      return;
    }
    try {
      const row = await addSet(workoutId, {
        exerciseTypeId: et,
        reps: r,
        weight: w,
      });
      setSets((prev) => [...prev, row].sort((a, b) => a.setIndex - b.setIndex));
      try {
        setRecents(await readExerciseRecents(8));
      } catch {
        /* ignore recents refresh failure */
      }
      showToast({ title: 'Set logged', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not log set',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    }
  }

  if (!Number.isFinite(workoutId) || workoutId < 1) {
    return <p className="text-red-600">Invalid workout.</p>;
  }

  if (loading || !workout) {
    return <p className="text-sm text-slate-600">Loading workout…</p>;
  }

  const exerciseName = (id: number) =>
    exercises.find((x) => x.exerciseTypeId === id)?.name ?? `Exercise ${id}`;

  return (
    <div className="space-y-6">
      <NavLinkButton to="/" className="mb-2">
        ← Workouts
      </NavLinkButton>
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          {workout.title ?? `Workout #${workout.workoutId}`}
        </h1>
        <p className="text-sm text-slate-600">
          Started {new Date(workout.startedAt).toLocaleString()}
        </p>
        {!workout.endedAt && (
          <Badge className="mt-2 bg-amber-100 text-amber-900">Active</Badge>
        )}
      </header>

      <Card className="p-4">
        <h2 className="text-lg font-medium text-slate-900">Log a set</h2>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => void handleAddSet(e)}>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Exercise
            </label>
            {recents.length > 0 ? (
              <div className="mb-2">
                <p className="mb-1 text-xs text-slate-500">Recent</p>
                <div className="flex flex-wrap gap-2">
                  {recents.map((ex) => (
                    <button
                      key={ex.exerciseTypeId}
                      type="button"
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-800 shadow-sm hover:bg-slate-50"
                      onClick={() =>
                        setExerciseTypeId(String(ex.exerciseTypeId))
                      }>
                      {ex.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={exerciseTypeId}
              onChange={(e) => setExerciseTypeId(e.target.value)}
              aria-label="Exercise">
              {exercises.map((ex) => (
                <option key={ex.exerciseTypeId} value={ex.exerciseTypeId}>
                  {ex.name}
                  {ex.userId ? ' (yours)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Reps
            </label>
            <Input
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              aria-label="Reps"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Weight
            </label>
            <Input
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              aria-label="Weight"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Save set</Button>
          </div>
        </form>
      </Card>

      <section>
        <h2 className="text-lg font-medium text-slate-900">Sets</h2>
        {sets.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No sets yet.</p>
        ) : (
          <ul className="mt-2 space-y-2" aria-label="Logged sets">
            {sets.map((s) => (
              <li key={s.setId}>
                <Card className="px-4 py-3 text-sm">
                  <span className="font-medium">
                    {exerciseName(s.exerciseTypeId)}
                  </span>
                  <span className="text-slate-600">
                    {' '}
                    — {s.reps} × {s.weight} ={' '}
                    <span className="font-semibold text-slate-900">
                      {s.volume}
                    </span>{' '}
                    volume
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
