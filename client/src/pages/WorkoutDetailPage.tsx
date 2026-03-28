import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import { Badge, Button, Card, Input } from '@/components/ui';
import { cn } from '@/lib';
import {
  addSet,
  deleteSet,
  patchSet,
  readExercises,
  readExerciseRecents,
  readWorkoutDetail,
  type Exercise,
  type SetRow,
  type WorkoutSummary,
} from '@/lib/workout-api';
import { WORKOUT_TYPE_LABELS } from '@shared/workout-types';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

function SetRowCard({
  s,
  exerciseLabel,
  onPatched,
  onRemoved,
}: {
  s: SetRow;
  exerciseLabel: string;
  onPatched: (row: SetRow) => void;
  onRemoved: () => void;
}) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [reps, setReps] = useState(String(s.reps));
  const [weight, setWeight] = useState(String(s.weight));
  const [notes, setNotes] = useState(s.notes ?? '');
  const [isWarmup, setIsWarmup] = useState(s.isWarmup ?? false);
  const [restSeconds, setRestSeconds] = useState(
    s.restSeconds != null ? String(s.restSeconds) : '',
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReps(String(s.reps));
    setWeight(String(s.weight));
    setNotes(s.notes ?? '');
    setIsWarmup(s.isWarmup ?? false);
    setRestSeconds(s.restSeconds != null ? String(s.restSeconds) : '');
  }, [s]);

  async function save(): Promise<void> {
    const r = Number(reps);
    const w = Number(weight);
    if (!Number.isFinite(r) || !Number.isFinite(w)) {
      showToast({ title: 'Invalid numbers', variant: 'error' });
      return;
    }
    const rest =
      restSeconds.trim() === ''
        ? null
        : Math.min(86400, Math.max(0, parseInt(restSeconds, 10) || 0));
    setSaving(true);
    try {
      const row = await patchSet(s.setId, {
        reps: r,
        weight: w,
        notes: notes.trim() || null,
        isWarmup,
        restSeconds: rest,
      });
      onPatched(row);
      setEditing(false);
      showToast({ title: 'Set updated', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not update set',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove(): Promise<void> {
    if (!window.confirm('Delete this set?')) return;
    setSaving(true);
    try {
      await deleteSet(s.setId);
      onRemoved();
      showToast({ title: 'Set deleted', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not delete set',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="px-4 py-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="font-medium text-slate-900">{exerciseLabel}</span>
          {(s.isWarmup ?? false) ? (
            <Badge className="ml-2 bg-slate-200 text-slate-800">Warm-up</Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={saving}
                onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={saving}
                onClick={() => void remove()}>
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={() => void save()}>
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={saving}
                onClick={() => {
                  setEditing(false);
                  setReps(String(s.reps));
                  setWeight(String(s.weight));
                  setNotes(s.notes ?? '');
                  setIsWarmup(s.isWarmup ?? false);
                  setRestSeconds(
                    s.restSeconds != null ? String(s.restSeconds) : '',
                  );
                }}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {!editing ? (
        <p className="mt-2 text-slate-600">
          {s.reps} × {s.weight} ={' '}
          <span className="font-semibold text-slate-900">{s.volume}</span>{' '}
          volume
          {s.notes ? (
            <span className="mt-1 block text-slate-700">“{s.notes}”</span>
          ) : null}
          {s.restSeconds != null ? (
            <span className="mt-1 block text-xs text-slate-500">
              Rest after: {s.restSeconds}s
            </span>
          ) : null}
        </p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Reps
            </label>
            <Input
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              aria-label="Edit reps"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Weight
            </label>
            <Input
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              aria-label="Edit weight"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Notes
            </label>
            <textarea
              className={cn(
                'min-h-[4rem] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-indigo-500 focus:ring-2',
              )}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              aria-label="Edit set notes"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={isWarmup}
              onChange={(e) => setIsWarmup(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Warm-up set</span>
          </label>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Rest after (seconds, optional)
            </label>
            <Input
              inputMode="numeric"
              value={restSeconds}
              onChange={(e) => setRestSeconds(e.target.value)}
              aria-label="Edit rest seconds"
            />
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Log sets for one workout (pick exercise, reps/weight, optional notes, warm-up, rest).
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
  const [notes, setNotes] = useState('');
  const [isWarmup, setIsWarmup] = useState(false);
  const [restSeconds, setRestSeconds] = useState('');
  const [loading, setLoading] = useState(true);

  const prevExerciseTypeId = useRef<string>('');

  const applyDefaultsForExercise = useCallback(
    (etId: string, setList: SetRow[]) => {
      const et = Number(etId);
      if (!Number.isFinite(et)) return;
      const forEx = setList
        .filter((x) => x.exerciseTypeId === et)
        .sort((a, b) => b.setIndex - a.setIndex);
      const last = forEx[0];
      if (last) {
        setReps(String(last.reps));
        setWeight(String(last.weight));
        setNotes(last.notes ?? '');
        setIsWarmup(last.isWarmup ?? false);
        setRestSeconds(
          last.restSeconds != null ? String(last.restSeconds) : '',
        );
      }
    },
    [],
  );

  async function load(): Promise<void> {
    if (!Number.isFinite(workoutId) || workoutId < 1) return;
    setLoading(true);
    try {
      const detail = await readWorkoutDetail(workoutId);
      const wt = detail.workout.workoutType ?? 'resistance';
      const [ex, recent] = await Promise.all([
        readExercises(wt),
        readExerciseRecents(8, wt),
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

  useEffect(() => {
    if (!exerciseTypeId) return;
    if (prevExerciseTypeId.current === exerciseTypeId) return;
    prevExerciseTypeId.current = exerciseTypeId;
    applyDefaultsForExercise(exerciseTypeId, sets);
  }, [exerciseTypeId, sets, applyDefaultsForExercise]);

  function sameAsLast(): void {
    applyDefaultsForExercise(exerciseTypeId, sets);
  }

  async function handleAddSet(e: FormEvent): Promise<void> {
    e.preventDefault();
    const et = Number(exerciseTypeId);
    const r = Number(reps);
    const w = Number(weight);
    if (!Number.isFinite(et) || !Number.isFinite(r) || !Number.isFinite(w)) {
      showToast({ title: 'Invalid numbers', variant: 'error' });
      return;
    }
    const rest =
      restSeconds.trim() === ''
        ? null
        : Math.min(86400, Math.max(0, parseInt(restSeconds, 10) || 0));
    try {
      const row = await addSet(workoutId, {
        exerciseTypeId: et,
        reps: r,
        weight: w,
        notes: notes.trim() || null,
        isWarmup,
        restSeconds: rest,
      });
      setSets((prev) => [...prev, row].sort((a, b) => a.setIndex - b.setIndex));
      try {
        const wt = workout?.workoutType ?? 'resistance';
        setRecents(await readExerciseRecents(8, wt));
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
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge className="bg-slate-200 text-slate-800">
            {WORKOUT_TYPE_LABELS[workout.workoutType ?? 'resistance']}
          </Badge>
          {!workout.endedAt && (
            <Badge className="bg-amber-100 text-amber-900">Active</Badge>
          )}
        </div>
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
            <div className="mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => sameAsLast()}>
                Same as last (this exercise)
              </Button>
            </div>
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
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Notes (optional)
            </label>
            <textarea
              className="min-h-[4rem] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-indigo-500 focus:ring-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              aria-label="Set notes"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={isWarmup}
              onChange={(e) => setIsWarmup(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">
              Warm-up set (excluded from weekly volume)
            </span>
          </label>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Rest after set (seconds, optional)
            </label>
            <Input
              inputMode="numeric"
              placeholder="e.g. 90"
              value={restSeconds}
              onChange={(e) => setRestSeconds(e.target.value)}
              aria-label="Rest seconds after set"
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
                <SetRowCard
                  s={s}
                  exerciseLabel={exerciseName(s.exerciseTypeId)}
                  onPatched={(row) => {
                    setSets((prev) =>
                      prev
                        .map((x) => (x.setId === row.setId ? row : x))
                        .sort((a, b) => a.setIndex - b.setIndex),
                    );
                  }}
                  onRemoved={() => {
                    setSets((prev) => prev.filter((x) => x.setId !== s.setId));
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
