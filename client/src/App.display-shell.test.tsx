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
    document.documentElement.style.colorScheme = '';
    localStorage.removeItem(DISPLAY_STORAGE_KEYS.textScale);
    localStorage.removeItem(DISPLAY_STORAGE_KEYS.highContrast);
    localStorage.removeItem(DISPLAY_STORAGE_KEYS.darkMode);
  });

  it('applies dark mode class when persisted', async () => {
    localStorage.setItem(DISPLAY_STORAGE_KEYS.darkMode, 'true');
    renderApp('/about');

    const main = await screen.findByRole('main');
    expect(main.className).toContain('app-dark-mode');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('applies high contrast and color-scheme light when persisted', async () => {
    localStorage.setItem(DISPLAY_STORAGE_KEYS.highContrast, 'true');
    renderApp('/about');

    const main = await screen.findByRole('main');
    expect(main.className).toContain('app-high-contrast');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('applies text scale class when persisted', async () => {
    localStorage.setItem(DISPLAY_STORAGE_KEYS.textScale, 'xl');
    renderApp('/about');

    const main = await screen.findByRole('main');
    expect(main.className).toContain('app-text-scale-xl');
  });
});
