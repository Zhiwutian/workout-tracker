import type { UiPreferences } from '@shared/ui-preferences.js';
import { z } from 'zod';

const textScaleEnum = z.enum(['sm', 'md', 'lg', 'xl']);

/** PATCH body: partial display prefs; unknown keys rejected. */
export const uiPreferencesPatchSchema = z
  .object({
    textScale: textScaleEnum.optional(),
    highContrast: z.boolean().optional(),
    darkMode: z.boolean().optional(),
  })
  .strict();

/** Normalize JSON from DB (tolerate legacy/invalid by stripping bad keys). */
export function parseStoredUiPreferences(value: unknown): UiPreferences | null {
  if (value == null) return null;
  const parsed = uiPreferencesPatchSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function mergeUiPreferences(
  existing: UiPreferences | null,
  patch: UiPreferences,
): UiPreferences {
  return { ...(existing ?? {}), ...patch };
}
