/** Catalog-style row for a user-owned exercise with modal edit and archive actions. */
import { useToast } from '@/components/app/toast-context';
import { Button, FieldLabel, Input, Modal, Select } from '@/components/ui';
import {
  patchExercise,
  type Exercise,
  type WorkoutType,
} from '@/lib/workout-api';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPES } from '@shared/workout-types';
import { useEffect, useRef, useState } from 'react';

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
  const [editOpen, setEditOpen] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setName(ex.name);
    setMuscleGroup(ex.muscleGroup ?? '');
    setCategory(ex.category ?? 'resistance');
  }, [ex.exerciseTypeId, ex.name, ex.muscleGroup, ex.category]);

  async function save(): Promise<void> {
    if (!name.trim()) {
      showToast({ title: 'Name is required', variant: 'error' });
      return;
    }
    if (!muscleGroup.trim()) {
      showToast({ title: 'Muscle group is required', variant: 'error' });
      return;
    }
    setBusy(true);
    try {
      await patchExercise(ex.exerciseTypeId, {
        name,
        muscleGroup: muscleGroup.trim(),
        category,
      });
      showToast({ title: 'Exercise updated', variant: 'success' });
      setEditOpen(false);
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
    <>
      <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
        <div className="min-w-0">
          <span className="font-medium text-slate-900">{ex.name}</span>
          <span className="text-slate-500">
            {' '}
            · {WORKOUT_TYPE_LABELS[ex.category ?? 'resistance']}
          </span>
          {ex.muscleGroup ? (
            <span className="text-slate-600"> · {ex.muscleGroup}</span>
          ) : null}
          <span className="text-slate-600"> · Yours</span>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            ref={editButtonRef}
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => void archive()}>
            Archive
          </Button>
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit exercise"
        initialFocusRef={editButtonRef}>
        <div className="grid gap-3">
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
          <Button type="button" disabled={busy} onClick={() => void save()}>
            Save
          </Button>
        </div>
      </Modal>
    </>
  );
}
