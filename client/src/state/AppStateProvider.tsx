import { ReactNode, useEffect, useMemo, useReducer } from 'react';
import {
  AppDispatchContext,
  AppStateContext,
  appStateReducer,
  initialDisplayState,
  type AppState,
  type TextScale,
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
  const persistedDarkMode = window.localStorage.getItem(
    DISPLAY_STORAGE_KEYS.darkMode,
  );
  const textScale: TextScale =
    persistedTextScale === 'sm' ||
    persistedTextScale === 'md' ||
    persistedTextScale === 'lg' ||
    persistedTextScale === 'xl'
      ? persistedTextScale
      : initialDisplayState.textScale;
  return {
    ...initialDisplayState,
    textScale,
    highContrast: persistedHighContrast === 'true',
    darkMode: persistedDarkMode === 'true',
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
      DISPLAY_STORAGE_KEYS.darkMode,
      String(state.darkMode),
    );
  }, [state.textScale, state.highContrast, state.darkMode]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}
