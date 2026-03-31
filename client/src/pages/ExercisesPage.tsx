import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import { Button, FieldLabel, Input, Select } from '@/components/ui';
import { ArchivedExerciseRow } from '@/features/exercises/ArchivedExerciseRow';
import { CustomExerciseRow } from '@/features/exercises/CustomExerciseRow';
import { cn } from '@/lib';
import {
  createExercise,
  readArchivedExercises,
  readExercises,
  type Exercise,
  type WorkoutType,
} from '@/lib/workout-api';
import { useAbortableAsyncEffect } from '@/lib/use-abortable-async-effect';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPES } from '@shared/workout-types';
import { type FormEvent, useMemo, useState } from 'react';

type ExercisesTab = 'catalog' | 'yours' | 'archived';

function exerciseMatchesFilters(
  ex: Exercise,
  search: string,
  typeFilter: WorkoutType | '',
  muscleFilter: string,
): boolean {
  const q = search.trim().toLowerCase();
  if (q && !ex.name.toLowerCase().includes(q)) {
    return false;
  }
  if (typeFilter && ex.category !== typeFilter) {
    return false;
  }
  const m = muscleFilter.trim().toLowerCase();
  if (m) {
    if (!ex.muscleGroup || !ex.muscleGroup.toLowerCase().includes(m)) {
      return false;
    }
  }
  return true;
}

/**
 * Catalog-first exercises browser: filters, tabs, collapsible add-custom.
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

  const [tab, setTab] = useState<ExercisesTab>('catalog');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<WorkoutType | ''>('');
  const [muscleFilter, setMuscleFilter] = useState('');

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

  const globalsFiltered = useMemo(
    () =>
      globals.filter((e) =>
        exerciseMatchesFilters(e, search, typeFilter, muscleFilter),
      ),
    [globals, search, typeFilter, muscleFilter],
  );

  const customFiltered = useMemo(
    () =>
      custom.filter((e) =>
        exerciseMatchesFilters(e, search, typeFilter, muscleFilter),
      ),
    [custom, search, typeFilter, muscleFilter],
  );

  const archivedFiltered = useMemo(
    () =>
      archived.filter((e) =>
        exerciseMatchesFilters(e, search, typeFilter, muscleFilter),
      ),
    [archived, search, typeFilter, muscleFilter],
  );

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

  const tabBtn = (id: ExercisesTab, label: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={tab === id}
      className={cn(
        'min-h-11 rounded-md border px-4 py-2 text-sm font-semibold transition-colors',
        tab === id
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
      )}
      onClick={() => setTab(id)}>
      {label}
    </button>
  );

  return (
    <div className="space-y-8">
      <NavLinkButton to="/">← Workouts</NavLinkButton>
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Exercises</h1>
      </header>

      {loading ? (
        <p className="text-sm text-slate-600">Loading…</p>
      ) : (
        <>
          <section aria-label="Exercise filters" className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <FieldLabel htmlFor="ex-filter-search">Search name</FieldLabel>
                <Input
                  id="ex-filter-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. squat"
                  autoComplete="off"
                />
              </div>
              <div>
                <FieldLabel htmlFor="ex-filter-type">Type</FieldLabel>
                <Select
                  id="ex-filter-type"
                  className="w-full"
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value as WorkoutType | '')
                  }
                  aria-label="Filter by workout type">
                  <option value="">All types</option>
                  {WORKOUT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {WORKOUT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <FieldLabel htmlFor="ex-filter-muscle">
                  Muscle contains
                </FieldLabel>
                <Input
                  id="ex-filter-muscle"
                  value={muscleFilter}
                  onChange={(e) => setMuscleFilter(e.target.value)}
                  placeholder="Optional"
                  autoComplete="off"
                />
              </div>
            </div>
          </section>

          <details className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">
              Add custom exercise
            </summary>
            <form
              className="mt-4 max-w-xl space-y-3"
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
          </details>

          <div
            role="tablist"
            aria-label="Exercise views"
            className="flex flex-wrap gap-2">
            {tabBtn('catalog', 'Catalog')}
            {tabBtn('yours', 'Yours')}
            {tabBtn('archived', 'Archived')}
          </div>

          {tab === 'catalog' ? (
            <section role="tabpanel" aria-label="Catalog">
              <h2 className="text-lg font-medium text-slate-900">Catalog</h2>
              {globalsFiltered.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">
                  No exercises match these filters.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
                  {globalsFiltered.map((ex) => (
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
          ) : null}

          {tab === 'yours' ? (
            <section role="tabpanel" aria-label="Your exercises">
              <h2 className="text-lg font-medium text-slate-900">
                Your exercises
              </h2>
              {customFiltered.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">
                  No custom exercises match these filters yet. Expand{' '}
                  <strong>Add custom exercise</strong> above to create one.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {customFiltered.map((ex) => (
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
          ) : null}

          {tab === 'archived' ? (
            <section role="tabpanel" aria-label="Archived exercises">
              <h2 className="text-lg font-medium text-slate-900">Archived</h2>
              {archivedFiltered.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">
                  None match these filters.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {archivedFiltered.map((ex) => (
                    <li key={ex.exerciseTypeId}>
                      <ArchivedExerciseRow
                        ex={ex}
                        onChanged={() => setLoadKey((k) => k + 1)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
