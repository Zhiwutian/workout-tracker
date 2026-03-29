import { describe, expect, it } from 'vitest';
import {
  mergeUiPreferences,
  normalizeUiPreferences,
  parseStoredUiPreferences,
  uiPreferencesPatchSchema,
} from './ui-preferences.js';

describe('uiPreferencesPatchSchema', () => {
  it('accepts partial objects', () => {
    expect(uiPreferencesPatchSchema.parse({ themeMode: 'dark' })).toEqual({
      themeMode: 'dark',
    });
  });

  it('accepts legacy darkMode', () => {
    expect(uiPreferencesPatchSchema.parse({ darkMode: true })).toEqual({
      darkMode: true,
    });
  });

  it('rejects unknown keys', () => {
    expect(() =>
      uiPreferencesPatchSchema.parse({ themeMode: 'dark', extra: 1 }),
    ).toThrow();
  });
});

describe('normalizeUiPreferences', () => {
  it('maps legacy darkMode to themeMode', () => {
    expect(normalizeUiPreferences({ darkMode: true })).toEqual({
      themeMode: 'dark',
    });
  });

  it('prefers themeMode over darkMode', () => {
    expect(
      normalizeUiPreferences({ darkMode: true, themeMode: 'light' }),
    ).toEqual({ themeMode: 'light' });
  });
});

describe('parseStoredUiPreferences', () => {
  it('returns null for null', () => {
    expect(parseStoredUiPreferences(null)).toBeNull();
  });

  it('returns null for invalid shapes', () => {
    expect(parseStoredUiPreferences({ textScale: 'huge' })).toBeNull();
  });

  it('returns valid partial', () => {
    expect(parseStoredUiPreferences({ textScale: 'lg' })).toEqual({
      textScale: 'lg',
    });
  });

  it('normalizes darkMode from storage', () => {
    expect(parseStoredUiPreferences({ darkMode: false })).toEqual({
      themeMode: 'light',
    });
  });
});

describe('mergeUiPreferences', () => {
  it('merges and normalizes', () => {
    expect(
      mergeUiPreferences(
        { textScale: 'sm', themeMode: 'dark' },
        { themeMode: 'light' },
      ),
    ).toEqual({ textScale: 'sm', themeMode: 'light' });
  });
});
