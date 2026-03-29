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

  it('sets theme mode', () => {
    const next = appStateReducer(initialDisplayState, {
      type: 'themeMode/set',
      payload: 'dark',
    });
    expect(next.themeMode).toBe('dark');
  });

  it('allows high contrast with theme mode', () => {
    let state: AppState = initialDisplayState;
    state = appStateReducer(state, { type: 'themeMode/set', payload: 'dark' });
    state = appStateReducer(state, {
      type: 'highContrast/set',
      payload: true,
    });
    expect(state.themeMode).toBe('dark');
    expect(state.highContrast).toBe(true);
  });

  it('resets to defaults', () => {
    let state = appStateReducer(initialDisplayState, {
      type: 'textScale/set',
      payload: 'xl',
    });
    state = appStateReducer(state, { type: 'themeMode/set', payload: 'dark' });
    state = appStateReducer(state, { type: 'display/reset' });
    expect(state).toEqual(initialDisplayState);
  });
});
