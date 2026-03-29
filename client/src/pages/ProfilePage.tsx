import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import { Button, FieldLabel, Select } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import type { UiPreferences } from '@/lib/api/types';
import { patchProfile } from '@/lib/workout-api';
import {
  initialDisplayState,
  type TextScale,
  useAppDispatch,
  useAppState,
} from '@/state';
import { FormEvent, useCallback, useEffect, useState } from 'react';

const TEXT_SCALE_OPTIONS: { value: TextScale; label: string }[] = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra large' },
];

export function ProfilePage() {
  const { me, refreshMe } = useAuth();
  const { showToast } = useToast();
  const display = useAppState();
  const dispatchDisplay = useAppDispatch();
  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb');

  useEffect(() => {
    if (me?.weightUnit === 'kg' || me?.weightUnit === 'lb') {
      setWeightUnit(me.weightUnit);
    }
  }, [me]);
  const [busy, setBusy] = useState(false);

  const persistUiPreferences = useCallback(
    async (partial: UiPreferences) => {
      try {
        await patchProfile({ uiPreferences: partial });
        await refreshMe();
      } catch (err) {
        showToast({
          title: 'Could not save display settings',
          description: err instanceof Error ? err.message : undefined,
          variant: 'error',
        });
      }
    },
    [refreshMe, showToast],
  );

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
      {me?.isGuest ? (
        <p className="text-sm text-amber-800">
          You are in a <strong>guest</strong> session. Sign out and create a
          named account on the sign-in page if you want to log in from another
          device.
        </p>
      ) : null}

      <section
        className="max-w-lg space-y-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm"
        aria-labelledby="profile-display-heading">
        <h2
          id="profile-display-heading"
          className="text-lg font-medium text-slate-900">
          Display and accessibility
        </h2>
        <p className="text-sm text-slate-600">
          Choices apply immediately and are saved to your account (same as
          weight unit). If both <strong>High contrast</strong> and{' '}
          <strong>Dark mode</strong> are on, high contrast takes precedence for
          the page shell.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={display.darkMode}
              onChange={(e) => {
                const checked = e.target.checked;
                dispatchDisplay({ type: 'darkMode/set', payload: checked });
                void persistUiPreferences({ darkMode: checked });
              }}
            />
            Dark mode
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={display.highContrast}
              onChange={(e) => {
                const checked = e.target.checked;
                dispatchDisplay({
                  type: 'highContrast/set',
                  payload: checked,
                });
                void persistUiPreferences({ highContrast: checked });
              }}
            />
            High contrast
          </label>
        </div>
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">
            Text size
          </legend>
          <div
            className="mt-2 flex flex-col gap-2"
            role="radiogroup"
            aria-label="Text size">
            {TEXT_SCALE_OPTIONS.map(({ value, label }) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name="wt-text-scale"
                  value={value}
                  className="size-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={display.textScale === value}
                  onChange={() => {
                    dispatchDisplay({ type: 'textScale/set', payload: value });
                    void persistUiPreferences({ textScale: value });
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <Button
          type="button"
          variant="ghost"
          className="text-slate-700"
          onClick={() => {
            dispatchDisplay({ type: 'display/reset' });
            void persistUiPreferences({
              textScale: initialDisplayState.textScale,
              highContrast: initialDisplayState.highContrast,
              darkMode: initialDisplayState.darkMode,
            });
          }}>
          Reset display settings
        </Button>
      </section>

      <form
        className="max-w-sm space-y-4"
        onSubmit={(e) => void handleSubmit(e)}>
        <div>
          <FieldLabel
            className="text-sm font-medium text-slate-700"
            htmlFor="profile-weight-unit">
            Weight unit
          </FieldLabel>
          <Select
            id="profile-weight-unit"
            className="w-full"
            value={weightUnit}
            onChange={(e) => setWeightUnit(e.target.value as 'lb' | 'kg')}
            aria-label="Weight unit">
            <option value="lb">Pounds (lb)</option>
            <option value="kg">Kilograms (kg)</option>
          </Select>
        </div>
        <Button type="submit" disabled={busy}>
          Save
        </Button>
      </form>
    </div>
  );
}
