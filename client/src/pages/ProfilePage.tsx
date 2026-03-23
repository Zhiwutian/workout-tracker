import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import { Button } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { patchProfile } from '@/lib/workout-api';
import { FormEvent, useEffect, useState } from 'react';

export function ProfilePage() {
  const { me, refreshMe } = useAuth();
  const { showToast } = useToast();
  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb');

  useEffect(() => {
    if (me?.weightUnit === 'kg' || me?.weightUnit === 'lb') {
      setWeightUnit(me.weightUnit);
    }
  }, [me]);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    try {
      await patchProfile({ weightUnit });
      await refreshMe();
      showToast({ title: 'Profile updated', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <NavLinkButton to="/">← Workouts</NavLinkButton>
      <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
      <p className="text-sm text-slate-600">
        <strong>{me?.displayName}</strong>
      </p>
      <form
        className="max-w-sm space-y-4"
        onSubmit={(e) => void handleSubmit(e)}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Weight unit
          </label>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={weightUnit}
            onChange={(e) => setWeightUnit(e.target.value as 'lb' | 'kg')}
            aria-label="Weight unit">
            <option value="lb">Pounds (lb)</option>
            <option value="kg">Kilograms (kg)</option>
          </select>
        </div>
        <Button type="submit" disabled={busy}>
          Save
        </Button>
      </form>
    </div>
  );
}
