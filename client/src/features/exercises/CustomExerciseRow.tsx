/** Inline editor for a user-owned exercise (name, muscle group, type, archive). */
import { useToast } from '@/components/app/toast-context';
import { Button, Card, FieldLabel, Input, Select } from '@/components/ui';
import {
  patchExercise,
  type Exercise,
  type WorkoutType,
} from '@/lib/workout-api';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPES } from '@shared/workout-types';
import { useEffect, useState } from 'react';

export function CustomExerciseRow({
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
          <FieldLabel
            className="text-sm font-medium text-slate-700"
            htmlFor={`ex-${ex.exerciseTypeId}-name`}>
            Name
          </FieldLabel>
          <Input
            id={`ex-${ex.exerciseTypeId}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label={`Name for ${ex.name}`}
          />
        </div>
        <div>
          <FieldLabel
            className="text-sm font-medium text-slate-700"
            htmlFor={`ex-${ex.exerciseTypeId}-muscle`}>
            Muscle group
          </FieldLabel>
          <Input
            id={`ex-${ex.exerciseTypeId}-muscle`}
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            aria-label={`Muscle group for ${ex.name}`}
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel
            className="text-sm font-medium text-slate-700"
            htmlFor={`ex-${ex.exerciseTypeId}-type`}>
            Type
          </FieldLabel>
          <Select
            id={`ex-${ex.exerciseTypeId}-type`}
            className="w-full"
            value={category}
            onChange={(e) => setCategory(e.target.value as WorkoutType)}
            aria-label="Exercise type">
            {WORKOUT_TYPES.map((t) => (
              <option key={t} value={t}>
                {WORKOUT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
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
