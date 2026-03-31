import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import {
  Badge,
  Button,
  Card,
  FieldLabel,
  Input,
  Select,
  Textarea,
} from '@/components/ui';
import { SetRowCard } from '@/features/workouts/SetRowCard';
import { parseRestSecondsInput } from '@/lib/parse-rest-seconds';
import { useAbortableAsyncEffect } from '@/lib/use-abortable-async-effect';
import {
  addSet,
  clearExerciseRecents,
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
  const [pendingSupersetGroupId, setPendingSupersetGroupId] = useState<
    number | null
  >(null);
  const [startNewSuperset, setStartNewSuperset] = useState(false);
  const [loading, setLoading] = useState(true);

  const prevExerciseTypeId = useRef<string>('');
  const exerciseTypeIdRef = useRef(exerciseTypeId);
  exerciseTypeIdRef.current = exerciseTypeId;

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

  useAbortableAsyncEffect(
    async (signal) => {
      if (!Number.isFinite(workoutId) || workoutId < 1) return;
      setLoading(true);
      try {
        const detail = await readWorkoutDetail(workoutId);
        if (signal.aborted) return;
        const wt = detail.workout.workoutType ?? 'resistance';
        const [ex, recent] = await Promise.all([
          readExercises(wt),
          readExerciseRecents(8, wt),
        ]);
        if (signal.aborted) return;
        setWorkout(detail.workout);
        setSets(detail.sets);
        setExercises(ex);
        setRecents(recent);
        if (ex.length > 0 && !exerciseTypeIdRef.current) {
          setExerciseTypeId(String(ex[0].exerciseTypeId));
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [workoutId],
    'Could not load workout',
  );

  useEffect(() => {
    if (!exerciseTypeId) return;
    if (prevExerciseTypeId.current === exerciseTypeId) return;
    prevExerciseTypeId.current = exerciseTypeId;
    applyDefaultsForExercise(exerciseTypeId, sets);
  }, [exerciseTypeId, sets, applyDefaultsForExercise]);

  function sameAsLast(): void {
    applyDefaultsForExercise(exerciseTypeId, sets);
  }

  async function clearRecents(): Promise<void> {
    if (!workout?.workoutType) return;
    try {
      await clearExerciseRecents(workout.workoutType);
      setRecents([]);
      showToast({ title: 'Recent exercises cleared', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not clear recents',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    }
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
    const rest = parseRestSecondsInput(restSeconds);
    try {
      const row = await addSet(workoutId, {
        exerciseTypeId: et,
        reps: r,
        weight: w,
        notes: notes.trim() || null,
        isWarmup,
        restSeconds: rest,
        groupId: pendingSupersetGroupId,
        createGroup: startNewSuperset,
      });
      setSets((prev) => [...prev, row].sort((a, b) => a.setIndex - b.setIndex));
      if (startNewSuperset) {
        setPendingSupersetGroupId(row.groupId);
        setStartNewSuperset(false);
      }
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
  const groupedSetEntries = sets.reduce<
    Array<{ key: string; groupId: number | null; rows: SetRow[] }>
  >((acc, s) => {
    if (s.groupId === null) {
      acc.push({ key: `set-${s.setId}`, groupId: null, rows: [s] });
      return acc;
    }
    const last = acc[acc.length - 1];
    if (last && last.groupId === s.groupId) {
      last.rows.push(s);
      return acc;
    }
    acc.push({
      key: `group-${s.groupId}-${s.setId}`,
      groupId: s.groupId,
      rows: [s],
    });
    return acc;
  }, []);

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
            <FieldLabel
              className="text-sm font-medium text-slate-700"
              htmlFor="log-set-exercise">
              Exercise
            </FieldLabel>
            {recents.length > 0 ? (
              <div className="mb-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">Recent</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void clearRecents()}>
                    Clear recents
                  </Button>
                </div>
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
            <Select
              id="log-set-exercise"
              className="w-full"
              value={exerciseTypeId}
              onChange={(e) => setExerciseTypeId(e.target.value)}
              aria-label="Exercise">
              {exercises.map((ex) => (
                <option key={ex.exerciseTypeId} value={ex.exerciseTypeId}>
                  {ex.name}
                  {ex.userId ? ' (yours)' : ''}
                </option>
              ))}
            </Select>
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
            <FieldLabel
              className="text-sm font-medium text-slate-700"
              htmlFor="log-set-reps">
              Reps
            </FieldLabel>
            <Input
              id="log-set-reps"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              aria-label="Reps"
            />
          </div>
          <div>
            <FieldLabel
              className="text-sm font-medium text-slate-700"
              htmlFor="log-set-weight">
              Weight
            </FieldLabel>
            <Input
              id="log-set-weight"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              aria-label="Weight"
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel
              className="text-sm font-medium text-slate-700"
              htmlFor="log-set-notes">
              Notes (optional)
            </FieldLabel>
            <Textarea
              id="log-set-notes"
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
            <span className="text-sm text-slate-700">Warm-up</span>
          </label>
          <div>
            <FieldLabel
              className="text-sm font-medium text-slate-700"
              htmlFor="log-set-rest">
              Rest after set
            </FieldLabel>
            <Input
              id="log-set-rest"
              inputMode="numeric"
              placeholder="e.g. 90 seconds"
              value={restSeconds}
              onChange={(e) => setRestSeconds(e.target.value)}
              aria-label="Rest seconds after set"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Save set</Button>
          </div>
          <div className="sm:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={startNewSuperset}
                  onChange={(e) => {
                    setStartNewSuperset(e.target.checked);
                    if (e.target.checked) {
                      setPendingSupersetGroupId(null);
                    }
                  }}
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">
                  Start new superset group with this set
                </span>
              </label>
              {pendingSupersetGroupId !== null ? (
                <>
                  <Badge className="bg-indigo-100 text-indigo-800">
                    Adding to superset #{pendingSupersetGroupId}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingSupersetGroupId(null)}>
                    Stop grouping
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </form>
      </Card>

      <section>
        <h2 className="text-lg font-medium text-slate-900">Sets</h2>
        {sets.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No sets yet.</p>
        ) : (
          <ul className="mt-2 space-y-2" aria-label="Logged sets">
            {groupedSetEntries.map((entry) => (
              <li key={entry.key}>
                {entry.groupId !== null ? (
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-2">
                    <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-indigo-800">
                      Superset #{entry.groupId}
                    </p>
                    <ul className="space-y-2">
                      {entry.rows.map((s) => (
                        <li key={s.setId}>
                          <SetRowCard
                            s={s}
                            exerciseLabel={exerciseName(s.exerciseTypeId)}
                            onAddInSuperset={(groupId) => {
                              setPendingSupersetGroupId(groupId);
                              setStartNewSuperset(false);
                            }}
                            onPatched={(row) => {
                              setSets((prev) =>
                                prev
                                  .map((x) => (x.setId === row.setId ? row : x))
                                  .sort((a, b) => a.setIndex - b.setIndex),
                              );
                            }}
                            onRemoved={() => {
                              setSets((prev) =>
                                prev.filter((x) => x.setId !== s.setId),
                              );
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  entry.rows.map((s) => (
                    <SetRowCard
                      key={s.setId}
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
                        setSets((prev) =>
                          prev.filter((x) => x.setId !== s.setId),
                        );
                      }}
                    />
                  ))
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
