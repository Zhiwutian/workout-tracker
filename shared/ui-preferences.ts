/**
 * Display preferences stored in `profiles.uiPreferences` (JSON) and mirrored in client app state.
 * All fields optional so the object can be partial after merge.
 */
export type UiPreferences = {
  textScale?: 'sm' | 'md' | 'lg' | 'xl';
  highContrast?: boolean;
  darkMode?: boolean;
};

export const UI_TEXT_SCALES = ['sm', 'md', 'lg', 'xl'] as const;
