import { describe, expect, it } from 'vitest';
import {
  mergeUiPreferences,
  parseStoredUiPreferences,
  uiPreferencesPatchSchema,
} from './ui-preferences.js';

describe('uiPreferencesPatchSchema', () => {
  it('accepts partial objects', () => {
    expect(uiPreferencesPatchSchema.parse({ darkMode: true })).toEqual({
      darkMode: true,
    });
  });

  it('rejects unknown keys', () => {
    expect(() =>
      uiPreferencesPatchSchema.parse({ darkMode: true, extra: 1 }),
    ).toThrow();
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
});

describe('mergeUiPreferences', () => {
  it('merges over existing', () => {
    expect(
      mergeUiPreferences(
        { textScale: 'sm', darkMode: true },
        { darkMode: false },
      ),
    ).toEqual({ textScale: 'sm', darkMode: false });
  });
});
