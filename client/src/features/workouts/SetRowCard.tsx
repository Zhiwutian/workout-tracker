/**
 * One logged set in a workout: view / edit / delete. Keeps `WorkoutDetailPage` focused on layout and “add set”.
 */
import { useToast } from '@/components/app/toast-context';
import {
  Badge,
  Button,
  Card,
  FieldLabel,
  Input,
  Textarea,
} from '@/components/ui';
import { parseRestSecondsInput } from '@/lib/parse-rest-seconds';
import { deleteSet, patchSet, type SetRow } from '@/lib/workout-api';
import { useEffect, useState } from 'react';

export function SetRowCard({
  s,
  exerciseLabel,
  onPatched,
  onRemoved,
  onAddInSuperset,
}: {
  s: SetRow;
  exerciseLabel: string;
  onPatched: (row: SetRow) => void;
  onRemoved: () => void;
  onAddInSuperset?: (groupId: number) => void;
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
      showToast({ title: 'Check reps and weight', variant: 'error' });
      return;
    }
    const rest = parseRestSecondsInput(restSeconds);
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
      showToast({ title: 'Set saved', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Set not saved',
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
      showToast({ title: 'Set removed', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Set not removed',
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
          {s.groupId !== null ? (
            <Badge className="ml-2 bg-indigo-100 text-indigo-800">
              Superset #{s.groupId}
            </Badge>
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
              {s.groupId !== null && onAddInSuperset ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={saving}
                  onClick={() => onAddInSuperset(s.groupId!)}>
                  Add in superset
                </Button>
              ) : null}
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
            <FieldLabel htmlFor={`set-${s.setId}-reps`}>Reps</FieldLabel>
            <Input
              id={`set-${s.setId}-reps`}
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              aria-label="Edit reps"
            />
          </div>
          <div>
            <FieldLabel htmlFor={`set-${s.setId}-weight`}>Weight</FieldLabel>
            <Input
              id={`set-${s.setId}-weight`}
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              aria-label="Edit weight"
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor={`set-${s.setId}-notes`}>Notes</FieldLabel>
            <Textarea
              id={`set-${s.setId}-notes`}
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
            <FieldLabel htmlFor={`set-${s.setId}-rest`}>
              Rest after (seconds, optional)
            </FieldLabel>
            <Input
              id={`set-${s.setId}-rest`}
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
