import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@/components/app/ToastProvider';
import { AppStateProvider } from '@/state';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { server } from '@/test/server';
import { WorkoutDetailPage } from './WorkoutDetailPage';

function renderWorkoutDetailPage() {
  localStorage.setItem('workout_tracker_token', 'msw-test-access-token');
  return render(
    <MemoryRouter initialEntries={['/workouts/1']}>
      <ToastProvider>
        <AppStateProvider>
          <Routes>
            <Route
              path="/workouts/:workoutId"
              element={<WorkoutDetailPage />}
            />
          </Routes>
        </AppStateProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('WorkoutDetailPage supersets', () => {
  it('creates and continues a superset group from set cards', async () => {
    const user = userEvent.setup();
    renderWorkoutDetailPage();

    await screen.findByRole('heading', { name: 'Workout #1' });

    await user.click(
      screen.getByLabelText('Start new superset group with this set'),
    );
    await user.click(screen.getByRole('button', { name: 'Save set' }));

    expect(
      (await screen.findAllByText(/Superset #\d+/)).length,
    ).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Stop grouping' }));

    await user.click(screen.getByRole('button', { name: 'Add in superset' }));
    expect(
      await screen.findByText(/Adding to superset #\d+/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save set' }));

    const setList = screen.getByRole('list', { name: 'Logged sets' });
    expect(
      within(setList).getAllByRole('button', { name: 'Add in superset' }),
    ).toHaveLength(2);
  });

  it('renders one superset container when grouped sets are non-contiguous', async () => {
    server.use(
      http.get('/api/workouts/:workoutId', () =>
        HttpResponse.json({
          data: {
            workout: {
              workoutId: 1,
              userId: 1,
              title: null,
              notes: null,
              workoutType: 'resistance',
              startedAt: new Date().toISOString(),
              endedAt: null,
            },
            sets: [
              {
                setId: 1,
                workoutId: 1,
                exerciseTypeId: 1,
                groupId: 10,
                setIndex: 0,
                reps: 8,
                weight: 100,
                volume: 800,
                notes: null,
                isWarmup: false,
                restSeconds: null,
                createdAt: new Date().toISOString(),
              },
              {
                setId: 2,
                workoutId: 1,
                exerciseTypeId: 1,
                groupId: null,
                setIndex: 1,
                reps: 5,
                weight: 80,
                volume: 400,
                notes: null,
                isWarmup: false,
                restSeconds: null,
                createdAt: new Date().toISOString(),
              },
              {
                setId: 3,
                workoutId: 1,
                exerciseTypeId: 1,
                groupId: 10,
                setIndex: 2,
                reps: 6,
                weight: 90,
                volume: 540,
                notes: null,
                isWarmup: false,
                restSeconds: null,
                createdAt: new Date().toISOString(),
              },
            ],
          },
        }),
      ),
    );

    renderWorkoutDetailPage();
    await screen.findByRole('heading', { name: 'Workout #1' });

    // Header appears once, even though group members are not adjacent in setIndex.
    expect(screen.getAllByText('Superset #10')).toHaveLength(3);
    expect(
      screen.getAllByRole('button', { name: 'Add in superset' }),
    ).toHaveLength(2);
  });
});
