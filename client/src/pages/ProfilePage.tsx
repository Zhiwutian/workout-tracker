import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import { Button, ContextualHelp, FieldLabel, Select } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import type { UiPreferences } from '@/lib/api/types';
import { patchProfile } from '@/lib/workout-api';
import type { ThemeMode } from '@shared/ui-preferences';
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

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'Match system' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
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
          title: 'Display not saved',
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
      showToast({ title: 'Profile saved', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Profile not saved',
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
          Guest session — use <strong>Sign in</strong> from the menu for a named
          account on other devices.
        </p>
      ) : null}

      <section
        className="max-w-lg min-w-0 space-y-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm"
        aria-labelledby="profile-display-heading">
        <div className="flex flex-wrap items-start gap-2">
          <h2
            id="profile-display-heading"
            className="text-lg font-medium text-slate-900">
            Display and accessibility
          </h2>
          <ContextualHelp
            label="About display settings"
            title="Display and accessibility">
            <p>Choices save to your account and apply when you load the app.</p>
            <p className="mt-2">
              <strong>High contrast</strong> overrides light/dark for the page
              shell. <strong>Match system</strong> follows your OS or browser
              theme when high contrast is off.
            </p>
          </ContextualHelp>
        </div>
        <p className="text-sm text-slate-600">
          Theme, contrast, and text size — details in help (?).
        </p>
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Theme</legend>
          <div
            className="mt-2 flex flex-col gap-2"
            role="radiogroup"
            aria-label="Theme">
            {THEME_OPTIONS.map(({ value, label }) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name="wt-theme-mode"
                  value={value}
                  data-testid={`display-theme-${value}`}
                  className="size-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={display.themeMode === value}
                  onChange={() => {
                    dispatchDisplay({ type: 'themeMode/set', payload: value });
                    void persistUiPreferences({ themeMode: value });
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
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
              themeMode: initialDisplayState.themeMode,
            });
          }}>
          Reset display settings
        </Button>
      </section>

      <form
        className="max-w-sm min-w-0 space-y-4"
        onSubmit={(e) => void handleSubmit(e)}>
        <div className="min-w-0">
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
