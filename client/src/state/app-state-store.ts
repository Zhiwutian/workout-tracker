import type { ThemeMode } from '@shared/ui-preferences';
import { createContext, Dispatch } from 'react';

export type TextScale = 'sm' | 'md' | 'lg' | 'xl';

export type { ThemeMode };

export type AppState = {
  textScale: TextScale;
  highContrast: boolean;
  themeMode: ThemeMode;
};

export type AppAction =
  | { type: 'textScale/set'; payload: TextScale }
  | { type: 'highContrast/set'; payload: boolean }
  | { type: 'themeMode/set'; payload: ThemeMode }
  | { type: 'display/reset' };

export const initialDisplayState: AppState = {
  textScale: 'sm',
  highContrast: false,
  themeMode: 'system',
};

/**
 * Reducer for frontend app-level UI state (display / accessibility shell).
 */
export function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'textScale/set':
      return { ...state, textScale: action.payload };
    case 'highContrast/set':
      return { ...state, highContrast: action.payload };
    case 'themeMode/set':
      return { ...state, themeMode: action.payload };
    case 'display/reset':
      return { ...initialDisplayState };
    default:
      return state;
  }
}

export const AppStateContext = createContext<AppState | null>(null);
export const AppDispatchContext = createContext<Dispatch<AppAction> | null>(
  null,
);
