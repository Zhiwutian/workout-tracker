import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@/components/app/ToastProvider';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { WorkoutDetailPage } from './WorkoutDetailPage';

function renderWorkoutDetailPage() {
  localStorage.setItem('workout_tracker_token', 'msw-test-access-token');
  return render(
    <MemoryRouter initialEntries={['/workouts/1']}>
      <ToastProvider>
        <Routes>
          <Route path="/workouts/:workoutId" element={<WorkoutDetailPage />} />
        </Routes>
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
});
