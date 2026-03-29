import type { ThemeMode, UiPreferences } from '@shared/ui-preferences.js';
import { z } from 'zod';

const textScaleEnum = z.enum(['sm', 'md', 'lg', 'xl']);
const themeModeEnum = z.enum(['system', 'light', 'dark']);

const rawStoredSchema = z
  .object({
    textScale: textScaleEnum.optional(),
    highContrast: z.boolean().optional(),
    darkMode: z.boolean().optional(),
    themeMode: themeModeEnum.optional(),
  })
  .strict();

/** PATCH body: partial display prefs; unknown keys rejected. */
export const uiPreferencesPatchSchema = rawStoredSchema;

/** Map legacy `darkMode` to `themeMode` and drop `darkMode` for API/storage clarity. */
export function normalizeUiPreferences(
  value: UiPreferences | null | undefined,
): UiPreferences | null {
  if (value == null || typeof value !== 'object') return null;
  if (Object.keys(value).length === 0) return {};
  const { darkMode, themeMode, ...rest } = value;
  let nextMode: ThemeMode | undefined = themeMode;
  if (nextMode === undefined && typeof darkMode === 'boolean') {
    nextMode = darkMode ? 'dark' : 'light';
  }
  const out: UiPreferences = { ...rest };
  if (nextMode !== undefined) out.themeMode = nextMode;
  return out;
}

/** Normalize JSON from DB (invalid shapes → null). */
export function parseStoredUiPreferences(value: unknown): UiPreferences | null {
  if (value == null) return null;
  const parsed = rawStoredSchema.safeParse(value);
  if (!parsed.success) return null;
  return normalizeUiPreferences(parsed.data);
}

export function mergeUiPreferences(
  existing: UiPreferences | null,
  patch: UiPreferences,
): UiPreferences {
  const merged = normalizeUiPreferences({
    ...(existing ?? {}),
    ...patch,
  });
  return merged ?? {};
}
