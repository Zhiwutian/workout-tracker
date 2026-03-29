import { ReactNode, useEffect, useMemo, useReducer } from 'react';
import {
  AppDispatchContext,
  AppStateContext,
  appStateReducer,
  initialDisplayState,
  type AppState,
  type TextScale,
  type ThemeMode,
} from './app-state-store';
import { DISPLAY_STORAGE_KEYS } from './display-storage';

type Props = {
  children: ReactNode;
};

function readPersistedDisplayState(): AppState {
  if (typeof window === 'undefined') return initialDisplayState;
  const persistedTextScale = window.localStorage.getItem(
    DISPLAY_STORAGE_KEYS.textScale,
  );
  const persistedHighContrast = window.localStorage.getItem(
    DISPLAY_STORAGE_KEYS.highContrast,
  );
  const persistedThemeMode = window.localStorage.getItem(
    DISPLAY_STORAGE_KEYS.themeMode,
  );
  const persistedLegacyDark = window.localStorage.getItem(
    DISPLAY_STORAGE_KEYS.darkModeLegacy,
  );

  const textScale: TextScale =
    persistedTextScale === 'sm' ||
    persistedTextScale === 'md' ||
    persistedTextScale === 'lg' ||
    persistedTextScale === 'xl'
      ? persistedTextScale
      : initialDisplayState.textScale;

  let themeMode: ThemeMode = initialDisplayState.themeMode;
  if (
    persistedThemeMode === 'system' ||
    persistedThemeMode === 'light' ||
    persistedThemeMode === 'dark'
  ) {
    themeMode = persistedThemeMode;
  } else if (persistedLegacyDark === 'true') {
    themeMode = 'dark';
  } else if (persistedLegacyDark === 'false') {
    themeMode = 'light';
  }

  return {
    ...initialDisplayState,
    textScale,
    highContrast: persistedHighContrast === 'true',
    themeMode,
  };
}

/**
 * Provide app-level UI state via Context + reducer; persists display prefs to localStorage.
 */
export function AppStateProvider({ children }: Props) {
  const hydratedInitialState = useMemo(() => readPersistedDisplayState(), []);
  const [state, dispatch] = useReducer(appStateReducer, hydratedInitialState);

  useEffect(() => {
    window.localStorage.setItem(
      DISPLAY_STORAGE_KEYS.textScale,
      state.textScale,
    );
    window.localStorage.setItem(
      DISPLAY_STORAGE_KEYS.highContrast,
      String(state.highContrast),
    );
    window.localStorage.setItem(
      DISPLAY_STORAGE_KEYS.themeMode,
      state.themeMode,
    );
    window.localStorage.removeItem(DISPLAY_STORAGE_KEYS.darkModeLegacy);
  }, [state.textScale, state.highContrast, state.themeMode]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}
