import { describe, expect, it } from 'vitest';
import {
  appStateReducer,
  initialDisplayState,
  type AppState,
} from './app-state-store';

describe('appStateReducer', () => {
  it('sets text scale', () => {
    const next = appStateReducer(initialDisplayState, {
      type: 'textScale/set',
      payload: 'lg',
    });
    expect(next.textScale).toBe('lg');
  });

  it('allows dark mode and high contrast together (shell picks HC first)', () => {
    let state: AppState = initialDisplayState;
    state = appStateReducer(state, { type: 'darkMode/set', payload: true });
    state = appStateReducer(state, { type: 'highContrast/set', payload: true });
    expect(state.darkMode).toBe(true);
    expect(state.highContrast).toBe(true);
  });

  it('resets to defaults', () => {
    let state = appStateReducer(initialDisplayState, {
      type: 'textScale/set',
      payload: 'xl',
    });
    state = appStateReducer(state, { type: 'darkMode/set', payload: true });
    state = appStateReducer(state, { type: 'display/reset' });
    expect(state).toEqual(initialDisplayState);
  });
});
