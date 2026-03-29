/**
 * Shell classes and `color-scheme` for `<html>` (FOUC script + `App` stay in sync — see `index.html` + `display-storage.ts`).
 */
import type { ThemeMode } from '@shared/ui-preferences';
import { DISPLAY_STORAGE_KEYS } from '@/state/display-storage';
import type { TextScale } from '@/state/app-state-store';

const TEXT_SCALE_CLASSES = [
  'app-text-scale-sm',
  'app-text-scale-md',
  'app-text-scale-lg',
  'app-text-scale-xl',
] as const;

export type DisplayShellPrefs = {
  textScale: TextScale;
  highContrast: boolean;
  themeMode: ThemeMode;
};

export function readDisplayPrefsFromLocalStorage(): DisplayShellPrefs {
  if (typeof window === 'undefined') {
    return {
      textScale: 'sm',
      highContrast: false,
      themeMode: 'system',
    };
  }
  const ts = window.localStorage.getItem(DISPLAY_STORAGE_KEYS.textScale);
  const textScale: TextScale =
    ts === 'sm' || ts === 'md' || ts === 'lg' || ts === 'xl' ? ts : 'sm';

  const highContrast =
    window.localStorage.getItem(DISPLAY_STORAGE_KEYS.highContrast) === 'true';

  let themeMode: ThemeMode = 'system';
  const storedMode = window.localStorage.getItem(
    DISPLAY_STORAGE_KEYS.themeMode,
  );
  if (
    storedMode === 'system' ||
    storedMode === 'light' ||
    storedMode === 'dark'
  ) {
    themeMode = storedMode;
  } else {
    const legacy = window.localStorage.getItem(
      DISPLAY_STORAGE_KEYS.darkModeLegacy,
    );
    if (legacy === 'true') themeMode = 'dark';
    else if (legacy === 'false') themeMode = 'light';
  }

  return { textScale, highContrast, themeMode };
}

export function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function effectiveDarkShell(
  highContrast: boolean,
  themeMode: ThemeMode,
  systemDark: boolean,
): boolean {
  if (highContrast) return false;
  if (themeMode === 'dark') return true;
  if (themeMode === 'light') return false;
  return systemDark;
}

export function textScaleToClass(scale: TextScale): string {
  return scale === 'xl'
    ? 'app-text-scale-xl'
    : scale === 'lg'
      ? 'app-text-scale-lg'
      : scale === 'md'
        ? 'app-text-scale-md'
        : 'app-text-scale-sm';
}

/**
 * Apply display shell classes to `document.documentElement` (and `color-scheme`).
 */
export function syncDocumentElementDisplayShell(
  root: HTMLElement,
  prefs: DisplayShellPrefs,
  systemDark: boolean,
): void {
  for (const c of TEXT_SCALE_CLASSES) {
    root.classList.remove(c);
  }
  root.classList.remove('app-high-contrast', 'app-dark-mode');

  root.classList.add(textScaleToClass(prefs.textScale));

  if (prefs.highContrast) {
    root.classList.add('app-high-contrast');
    root.style.colorScheme = 'light';
    return;
  }

  if (effectiveDarkShell(prefs.highContrast, prefs.themeMode, systemDark)) {
    root.classList.add('app-dark-mode');
    root.style.colorScheme = 'dark';
    return;
  }

  root.style.colorScheme = 'light';
}
