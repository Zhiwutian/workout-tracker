import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@/components/app/ToastProvider';
import { describe, expect, it } from 'vitest';
import App from './App';
import { AppStateProvider } from '@/state';
import { MemoryRouter } from 'react-router-dom';

function renderApp(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ToastProvider>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('App', () => {
  it('redirects to sign-in when visiting home unauthenticated', async () => {
    renderApp(['/']);

    expect(
      await screen.findByRole('heading', { name: 'Workout Tracker' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('signs in and shows workouts list (MSW)', async () => {
    const user = userEvent.setup();
    renderApp(['/sign-in']);

    await user.type(screen.getByLabelText('Display name'), 'Test Lifter');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByRole('heading', { name: 'Workouts' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Test Lifter')).toBeInTheDocument();
  });

  it('continues as guest and shows workouts (MSW)', async () => {
    const user = userEvent.setup();
    renderApp(['/sign-in']);

    await user.click(screen.getByRole('button', { name: 'Continue as guest' }));

    expect(
      await screen.findByRole('heading', { name: 'Workouts' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Guest session — workouts save on this device/),
    ).toBeInTheDocument();
  });

  it('renders about page route', async () => {
    renderApp(['/about']);

    expect(
      await screen.findByRole('heading', { name: 'Workout Tracker' }),
    ).toBeInTheDocument();
  });
});
