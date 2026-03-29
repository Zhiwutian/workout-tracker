import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import { Button, FieldLabel, Input, Select } from '@/components/ui';
import { ArchivedExerciseRow } from '@/features/exercises/ArchivedExerciseRow';
import { CustomExerciseRow } from '@/features/exercises/CustomExerciseRow';
import {
  createExercise,
  readArchivedExercises,
  readExercises,
  type Exercise,
  type WorkoutType,
} from '@/lib/workout-api';
import { useAbortableAsyncEffect } from '@/lib/use-abortable-async-effect';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPES } from '@shared/workout-types';
import { FormEvent, useState } from 'react';

/**
 * Manage custom exercises (rename, archive) and browse globals.
 */
export function ExercisesPage() {
  const { showToast } = useToast();
  const [active, setActive] = useState<Exercise[]>([]);
  const [archived, setArchived] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState('');
  const [newCategory, setNewCategory] = useState<WorkoutType>('resistance');
  const [creating, setCreating] = useState(false);
  const [loadKey, setLoadKey] = useState(0);

  useAbortableAsyncEffect(
    async (signal) => {
      setLoading(true);
      try {
        const [a, ar] = await Promise.all([
          readExercises(),
          readArchivedExercises(),
        ]);
        if (signal.aborted) return;
        setActive(a);
        setArchived(ar);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [loadKey],
    'Could not load exercises',
  );

  const globals = active.filter((e) => e.userId === null);
  const custom = active.filter((e) => e.userId !== null);

  async function handleCreate(e: FormEvent): Promise<void> {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      showToast({ title: 'Name is required', variant: 'error' });
      return;
    }
    setCreating(true);
    try {
      await createExercise(name, newMuscle.trim() || null, newCategory);
      setNewName('');
      setNewMuscle('');
      setNewCategory('resistance');
      showToast({ title: 'Exercise created', variant: 'success' });
      setLoadKey((k) => k + 1);
    } catch (err) {
      showToast({
        title: 'Could not create',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <NavLinkButton to="/">← Workouts</NavLinkButton>
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Exercises</h1>
        <p className="text-sm text-slate-600">
          Global exercises are shared. Each exercise has a type (Resistance,
          Cardio, Flexibility) so the log-a-set picker matches the workout you
          started. Yours can be renamed or archived; archiving hides them until
          you restore them here.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-600">Loading…</p>
      ) : (
        <>
          <section>
            <h2 className="text-lg font-medium text-slate-900">Add custom</h2>
            <form
              className="mt-3 max-w-xl space-y-3"
              onSubmit={(e) => void handleCreate(e)}>
              <div>
                <FieldLabel
                  className="text-sm font-medium text-slate-700"
                  htmlFor="new-exercise-name">
                  Name
                </FieldLabel>
                <Input
                  id="new-exercise-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  aria-label="New exercise name"
                />
              </div>
              <div>
                <FieldLabel
                  className="text-sm font-medium text-slate-700"
                  htmlFor="new-exercise-muscle">
                  Muscle group (optional)
                </FieldLabel>
                <Input
                  id="new-exercise-muscle"
                  value={newMuscle}
                  onChange={(e) => setNewMuscle(e.target.value)}
                  aria-label="New exercise muscle group"
                />
              </div>
              <div>
                <FieldLabel
                  className="text-sm font-medium text-slate-700"
                  htmlFor="new-exercise-type">
                  Type
                </FieldLabel>
                <Select
                  id="new-exercise-type"
                  className="w-full"
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(e.target.value as WorkoutType)
                  }
                  aria-label="New exercise type">
                  {WORKOUT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {WORKOUT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="submit" disabled={creating}>
                Create
              </Button>
            </form>
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900">
              Your exercises
            </h2>
            {custom.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">
                No custom exercises yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {custom.map((ex) => (
                  <li key={ex.exerciseTypeId}>
                    <CustomExerciseRow
                      ex={ex}
                      onChanged={() => setLoadKey((k) => k + 1)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900">Archived</h2>
            {archived.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">None.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {archived.map((ex) => (
                  <ArchivedExerciseRow
                    key={ex.exerciseTypeId}
                    ex={ex}
                    onChanged={() => setLoadKey((k) => k + 1)}
                  />
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900">Catalog</h2>
            <p className="mt-1 text-sm text-slate-600">
              Seeded exercises (read-only).
            </p>
            {globals.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">None loaded.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
                {globals.map((ex) => (
                  <li key={ex.exerciseTypeId} className="px-3 py-2 text-sm">
                    <span className="font-medium text-slate-900">
                      {ex.name}
                    </span>
                    <span className="text-slate-500">
                      {' '}
                      · {WORKOUT_TYPE_LABELS[ex.category ?? 'resistance']}
                    </span>
                    {ex.muscleGroup ? (
                      <span className="text-slate-600">
                        {' '}
                        · {ex.muscleGroup}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
