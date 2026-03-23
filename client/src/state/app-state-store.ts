import { createContext, Dispatch } from 'react';

/** Reserved for future global UI state (themes, layout). */
export type AppState = Record<string, never>;

export type AppAction = { type: 'noop' };

export const initialState: AppState = {};

export function appStateReducer(state: AppState, action: AppAction): AppState {
  void action;
  return state;
}

export const AppStateContext = createContext<AppState | null>(null);
export const AppDispatchContext = createContext<Dispatch<AppAction> | null>(
  null,
);
