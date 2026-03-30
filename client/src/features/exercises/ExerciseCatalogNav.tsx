import { Button, FieldLabel, Input } from '@/components/ui';
import type { Exercise } from '@/lib/api/types';
import {
  catalogExercisesAtLeaf,
  catalogSubgroupKeys,
  formatCatalogSubgroupLabel,
} from '@/lib/exercise-catalog';
import { cn } from '@/lib';
import {
  WORKOUT_TYPE_LABELS,
  WORKOUT_TYPES,
  type WorkoutType,
} from '@shared/workout-types';
import { useId, useMemo, useState } from 'react';

type CatalogStep =
  | { step: 'category' }
  | { step: 'subgroup'; category: WorkoutType }
  | { step: 'list'; category: WorkoutType; subgroupKey: string };

const categoryCardClass = cn(
  'min-h-[3rem] rounded-lg border border-slate-300 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-50',
);

/**
 * Catalog-only drill-down: category → muscle (resistance/flexibility) or type (cardio) → exercises.
 */
export function ExerciseCatalogNav({ globals }: { globals: Exercise[] }) {
  const [nav, setNav] = useState<CatalogStep>({ step: 'category' });
  const [nameFilter, setNameFilter] = useState('');
  const statusId = useId();

  const subgroupKeys = useMemo(() => {
    if (nav.step !== 'subgroup') return [];
    return catalogSubgroupKeys(globals, nav.category);
  }, [globals, nav]);

  const listExercises = useMemo(() => {
    if (nav.step !== 'list') return [];
    return catalogExercisesAtLeaf(
      globals,
      nav.category,
      nav.subgroupKey,
      nameFilter,
    );
  }, [globals, nav, nameFilter]);

  const subgroupStepTitle =
    nav.step === 'subgroup' || nav.step === 'list'
      ? nav.category === 'cardio'
        ? 'Cardio type'
        : 'Muscle group'
      : '';

  const liveStatus =
    nav.step === 'category'
      ? 'Step 1 of 3: choose Resistance, Cardio, or Flexibility.'
      : nav.step === 'subgroup'
        ? `Step 2 of 3: choose a ${subgroupStepTitle.toLowerCase()} for ${WORKOUT_TYPE_LABELS[nav.category]}.`
        : `Step 3 of 3: ${listExercises.length} exercise${listExercises.length === 1 ? '' : 's'} in this group. Filter by name with the search field.`;

  return (
    <section aria-label="Exercise catalog" className="space-y-4">
      <p
        id={statusId}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true">
        {liveStatus}
      </p>

      {nav.step === 'category' ? (
        <>
          <h2 className="text-lg font-medium text-slate-900">Catalog</h2>
          <p className="text-sm text-slate-600">
            Choose a category, then a group or type, then browse exercises.
          </p>
          <div
            className="grid gap-3 sm:grid-cols-3"
            role="group"
            aria-label="Workout category">
            {WORKOUT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={categoryCardClass}
                aria-describedby={statusId}
                aria-label={`${WORKOUT_TYPE_LABELS[t]}: open muscle groups or types for this category`}
                onClick={() => setNav({ step: 'subgroup', category: t })}>
                {WORKOUT_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {nav.step === 'subgroup' ? (
        <>
          <nav
            aria-label="Catalog drill-down"
            className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-sm"
              onClick={() => {
                setNav({ step: 'category' });
                setNameFilter('');
              }}>
              ← All categories
            </Button>
            <span className="text-sm text-slate-500" aria-current="step">
              {WORKOUT_TYPE_LABELS[nav.category]}
            </span>
          </nav>
          <h2 className="text-lg font-medium text-slate-900">
            {subgroupStepTitle}
          </h2>
          <p className="text-sm text-slate-600">
            {nav.category === 'cardio'
              ? 'Pick a style (e.g. steady-state vs HIIT).'
              : 'Pick a muscle group.'}
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={subgroupStepTitle}>
            {subgroupKeys.map((key) => (
              <button
                key={key || '__other__'}
                type="button"
                className="min-h-11 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                aria-label={`Show ${formatCatalogSubgroupLabel(nav.category, key)} exercises`}
                onClick={() =>
                  setNav({
                    step: 'list',
                    category: nav.category,
                    subgroupKey: key,
                  })
                }>
                {formatCatalogSubgroupLabel(nav.category, key)}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {nav.step === 'list' ? (
        <>
          <nav
            aria-label="Catalog drill-down"
            className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-sm"
              onClick={() => {
                setNav({ step: 'subgroup', category: nav.category });
                setNameFilter('');
              }}>
              ← {subgroupStepTitle}
            </Button>
            <span className="text-sm text-slate-500" aria-current="step">
              {WORKOUT_TYPE_LABELS[nav.category]} ·{' '}
              {formatCatalogSubgroupLabel(nav.category, nav.subgroupKey)}
            </span>
          </nav>
          <h2 className="text-lg font-medium text-slate-900">Exercises</h2>
          <p className="mt-1 text-sm text-slate-600">
            Seeded catalog (read-only). Filter by name below.
          </p>
          <div className="max-w-md min-w-0">
            <FieldLabel htmlFor="catalog-ex-search">Search name</FieldLabel>
            <Input
              id="catalog-ex-search"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="e.g. squat"
              autoComplete="off"
              aria-describedby={statusId}
            />
          </div>
          {listExercises.length === 0 ? (
            <p className="text-sm text-slate-600">No exercises match.</p>
          ) : (
            <ul
              className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white"
              data-testid="exercise-catalog-list"
              aria-label={`${listExercises.length} catalog exercises`}>
              {listExercises.map((exercise) => (
                <li key={exercise.exerciseTypeId} className="px-3 py-2 text-sm">
                  <span className="font-medium text-slate-900">
                    {exercise.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </section>
  );
}
