/**
 * localStorage keys for display preferences (`wt-` prefix).
 * The inline boot script in `client/index.html` must use the same string values (see comment there).
 */
export const DISPLAY_STORAGE_KEYS = {
  textScale: 'wt-text-scale',
  highContrast: 'wt-high-contrast',
  themeMode: 'wt-theme-mode',
  /** Legacy boolean; read once when `themeMode` is absent, then prefer `themeMode`. */
  darkModeLegacy: 'wt-dark-mode',
} as const;
