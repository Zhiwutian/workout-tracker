import { describe, expect, it } from 'vitest';
import { effectiveDarkShell } from './display-shell';

describe('effectiveDarkShell', () => {
  it('is false when high contrast', () => {
    expect(effectiveDarkShell(true, 'dark', true)).toBe(false);
  });

  it('follows themeMode dark', () => {
    expect(effectiveDarkShell(false, 'dark', false)).toBe(true);
  });

  it('follows themeMode light', () => {
    expect(effectiveDarkShell(false, 'light', true)).toBe(false);
  });

  it('uses system preference when theme is system', () => {
    expect(effectiveDarkShell(false, 'system', true)).toBe(true);
    expect(effectiveDarkShell(false, 'system', false)).toBe(false);
  });
});
