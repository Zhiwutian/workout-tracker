import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import App from './App';
import { AppStateProvider, DISPLAY_STORAGE_KEYS } from '@/state';
import { ToastProvider } from '@/components/app/ToastProvider';
import { MemoryRouter } from 'react-router-dom';

function renderApp(path = '/about') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('App display shell', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    document.documentElement.style.colorScheme = '';
    localStorage.removeItem(DISPLAY_STORAGE_KEYS.textScale);
    localStorage.removeItem(DISPLAY_STORAGE_KEYS.highContrast);
    localStorage.removeItem(DISPLAY_STORAGE_KEYS.themeMode);
    localStorage.removeItem(DISPLAY_STORAGE_KEYS.darkModeLegacy);
  });

  it('applies dark mode on documentElement when theme persisted', async () => {
    localStorage.setItem(DISPLAY_STORAGE_KEYS.themeMode, 'dark');
    renderApp('/about');

    await screen.findByRole('main');
    expect(document.documentElement.classList.contains('app-dark-mode')).toBe(
      true,
    );
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('migrates legacy wt-dark-mode to dark shell', async () => {
    localStorage.setItem(DISPLAY_STORAGE_KEYS.darkModeLegacy, 'true');
    renderApp('/about');

    await screen.findByRole('main');
    expect(document.documentElement.classList.contains('app-dark-mode')).toBe(
      true,
    );
  });

  it('applies high contrast on documentElement when persisted', async () => {
    localStorage.setItem(DISPLAY_STORAGE_KEYS.highContrast, 'true');
    renderApp('/about');

    await screen.findByRole('main');
    expect(
      document.documentElement.classList.contains('app-high-contrast'),
    ).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('applies text scale class on documentElement when persisted', async () => {
    localStorage.setItem(DISPLAY_STORAGE_KEYS.textScale, 'xl');
    renderApp('/about');

    await screen.findByRole('main');
    expect(
      document.documentElement.classList.contains('app-text-scale-xl'),
    ).toBe(true);
  });
});
