/** One archived custom exercise with a restore action. */
import { useToast } from '@/components/app/toast-context';
import { Button } from '@/components/ui';
import { patchExercise, type Exercise } from '@/lib/workout-api';
import { WORKOUT_TYPE_LABELS } from '@shared/workout-types';
import { useState } from 'react';

export function ArchivedExerciseRow({
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
      showToast({ title: 'Restored', variant: 'success' });
      onChanged();
    } catch (err) {
      showToast({
        title: 'Restore failed',
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
