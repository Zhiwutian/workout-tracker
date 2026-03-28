import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import { Button, Card, Input } from '@/components/ui';
import {
  createExercise,
  patchExercise,
  readArchivedExercises,
  readExercises,
  type Exercise,
  type WorkoutType,
} from '@/lib/workout-api';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPES } from '@shared/workout-types';
import { FormEvent, useCallback, useEffect, useState } from 'react';

function CustomExerciseRow({
  ex,
  onChanged,
}: {
  ex: Exercise;
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState(ex.name);
  const [muscleGroup, setMuscleGroup] = useState(ex.muscleGroup ?? '');
  const [category, setCategory] = useState<WorkoutType>(
    ex.category ?? 'resistance',
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(ex.name);
    setMuscleGroup(ex.muscleGroup ?? '');
    setCategory(ex.category ?? 'resistance');
  }, [ex.exerciseTypeId, ex.name, ex.muscleGroup, ex.category]);

  async function save(): Promise<void> {
    setBusy(true);
    try {
      await patchExercise(ex.exerciseTypeId, {
        name,
        muscleGroup: muscleGroup.trim() || null,
        category,
      });
      showToast({ title: 'Exercise updated', variant: 'success' });
      onChanged();
    } catch (err) {
      showToast({
        title: 'Could not update',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  async function archive(): Promise<void> {
    setBusy(true);
    try {
      await patchExercise(ex.exerciseTypeId, { archived: true });
      showToast({ title: 'Exercise archived', variant: 'success' });
      onChanged();
    } catch (err) {
      showToast({
        title: 'Could not archive',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label={`Name for ${ex.name}`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Muscle group
          </label>
          <Input
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            aria-label={`Muscle group for ${ex.name}`}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Type
          </label>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as WorkoutType)}
            aria-label="Exercise type">
            {WORKOUT_TYPES.map((t) => (
              <option key={t} value={t}>
                {WORKOUT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void save()}>
          Save
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => void archive()}>
          Archive
        </Button>
      </div>
    </Card>
  );
}

function ArchivedRow({
  ex,
  onChanged,
}: {
  ex: Exercise;
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function restore(): Promise<void> {
    setBusy(true);
    try {
      await patchExercise(ex.exerciseTypeId, { archived: false });
      showToast({ title: 'Exercise restored', variant: 'success' });
      onChanged();
    } catch (err) {
      showToast({
        title: 'Could not restore',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
      <span>
        <span className="font-medium text-slate-900">{ex.name}</span>
        <span className="text-slate-500">
          {' '}
          · {WORKOUT_TYPE_LABELS[ex.category ?? 'resistance']}
        </span>
        {ex.muscleGroup ? (
          <span className="text-slate-600"> · {ex.muscleGroup}</span>
        ) : null}
      </span>
      <Button
        type="button"
        size="sm"
        disabled={busy}
        onClick={() => void restore()}>
        Restore
      </Button>
    </li>
  );
}

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, ar] = await Promise.all([
        readExercises(),
        readArchivedExercises(),
      ]);
      setActive(a);
      setArchived(ar);
    } catch (err) {
      showToast({
        title: 'Could not load exercises',
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
      await load();
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
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Name
                </label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  aria-label="New exercise name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Muscle group (optional)
                </label>
                <Input
                  value={newMuscle}
                  onChange={(e) => setNewMuscle(e.target.value)}
                  aria-label="New exercise muscle group"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Type
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
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
                </select>
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
                    <CustomExerciseRow ex={ex} onChanged={() => void load()} />
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
                  <ArchivedRow
                    key={ex.exerciseTypeId}
                    ex={ex}
                    onChanged={() => void load()}
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
